import os
import json
import base64
import struct
from pathlib import Path
from datetime import datetime, timezone
from db import load, store, init

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from cryptography.hazmat.primitives.asymmetric import rsa

db= init()
INPUT_DIR  = Path("./output")
OUTPUT_DIR = Path("./encrypted_output")
CHUNK_SIZE = 64 * 1024 * 1024   # 64 MB per chunk

SERVER_KEY_PASSPHRASE = os.environ.get("SERVER_KEY_PASSPHRASE", "changeme").encode()

def fetch_bmd_keys() -> list[dict]:
    """Fetch all active BMDs from bmdpublickeys."""
    return list(db.bmdpublickeys.find({"is_active": True}, {"_id": 0}))

from cryptography.hazmat.primitives.asymmetric import rsa

def fetch_or_create_server_keys() -> str:
    """
    Fetch the server's RSA public key from serverkeys collection.
    If no server keypair exists yet, generate one, passphrase-protect
    the private key, store both in MongoDB, and return the public key PEM.
    """
    doc = db.serverkeys.find_one({"server_id": "main_server", "is_active": True}, {"_id": 0})

    if doc:
        print("Server keypair already exists in MongoDB")
        return doc["rsa_public_key_pem"]
    print("No server keypair found — generating RSA-2048 keypair...")
    private_key = rsa.generate_private_key(
        public_exponent=65537,
        key_size=2048,
    )
    public_key = private_key.public_key()
    # Serialize public key as PEM
    public_key_pem = public_key.public_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PublicFormat.SubjectPublicKeyInfo
    ).decode("utf-8")
    # Serialize private key as passphrase-protected PEM
    private_key_pem = private_key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.PKCS8,
        encryption_algorithm=serialization.BestAvailableEncryption(SERVER_KEY_PASSPHRASE)
        # ^ AES-256-CBC passphrase protection — private key is never stored in plaintext
    ).decode("utf-8")
    # Store both in MongoDB
    db.serverkeys.insert_one({
        "server_id":"main_server",
        "rsa_public_key_pem":public_key_pem,
        "rsa_private_key_pem":private_key_pem,   # passphrase-protected
        "key_version":1,
        "is_active":True,
        "created_at":datetime.now(timezone.utc)
    })
    print("Server keypair generated and stored in MongoDB (private key passphrase-protected)")
    return public_key_pem

def fetch_existing_aes_key() -> dict | None:
    """
    Check if an AES key already exists in aeskeys collection.
    Returns the document if found, None otherwise.
    """
    return db.aeskeys.find_one({}, {"_id": 0})

def store_encrypted_aes_key(encrypted_aes_key_b64: str, nonce_base: bytes):
    """
    Store the AES key encrypted with server public key — once, permanently.
    Uses $setOnInsert so re-running never overwrites the existing key.
    """
    db.aeskeys.update_one(
        {},
        {
            "$setOnInsert": {
                "encrypted_aes_key": encrypted_aes_key_b64,
                "nonce_base":base64.b64encode(nonce_base).decode(),
                "created_at":datetime.now(timezone.utc),
            }
        },
        upsert=True
    )
    print("AES key stored in MongoDB (aeskeys)")

def load_rsa_public_key(pem: str):
    return serialization.load_pem_public_key(pem.encode())

def rsa_encrypt_aes_key(aes_key: bytes, rsa_public_key) -> str:
    """Encrypt the AES key with an RSA public key (works for both BMD and server)."""
    encrypted_key = rsa_public_key.encrypt(
        aes_key,
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )
    return base64.b64encode(encrypted_key).decode()

def load_ballot(ballot_path: Path) -> bytes:
    """Plain ballot JSON — read and encode to bytes for encryption."""
    with open(ballot_path, "r") as f:
        raw = json.load(f)
    return json.dumps(raw, indent=2).encode("utf-8")

def encrypt_ballot_bytes(plaintext_bytes: bytes, output_path: Path,
                         aes_key: bytes, nonce_base: bytes, enc_aes_key_b64: str):
    """
    Encrypt ballot bytes with the shared AES-256-GCM key.
    enc_aes_key_b64 is the BMD-specific RSA-wrapped AES key embedded per file.

    Output .enc.json:
    {
        "algorithm":         "RSA-OAEP+AES-GCM-256",
        "encrypted_aes_key": "<base64>",   ← AES key wrapped with THIS BMD's RSA public key
        "nonce":             "<base64>",
        "num_chunks":        <int>,
        "chunks":            ["<base64>", ...]
    }
    """
    aesgcm = AESGCM(aes_key)
    chunks = []
    offset = 0
    chunk_index = 0

    while offset < len(plaintext_bytes):
        plaintext_chunk = plaintext_bytes[offset : offset + CHUNK_SIZE]
        offset += CHUNK_SIZE

        # Unique nonce per chunk: base_nonce XOR chunk_index
        chunk_nonce = bytearray(nonce_base)
        idx_bytes   = struct.pack(">I", chunk_index)
        for i in range(4):
            chunk_nonce[-(i + 1)] ^= idx_bytes[-(i + 1)]

        # Chunk index as AAD — prevents chunk reordering attacks
        aad              = struct.pack(">I", chunk_index)
        ciphertext_chunk = aesgcm.encrypt(bytes(chunk_nonce), plaintext_chunk, aad)
        chunks.append(base64.b64encode(ciphertext_chunk).decode())
        chunk_index += 1

    envelope = {
        "algorithm":         "RSA-OAEP+AES-GCM-256",
        "encrypted_aes_key": enc_aes_key_b64,
        "nonce":             base64.b64encode(nonce_base).decode(),
        "num_chunks":        len(chunks),
        "chunks":            chunks,
    }
    output_path.write_text(json.dumps(envelope, indent=2))

def get_ballots_for_bmd(ballot_files: list[Path], start_idx: int, end_idx: int) -> list[Path]:
    """1-based inclusive slice."""
    return ballot_files[start_idx - 1 : end_idx]

def main():
    bmds = fetch_bmd_keys()
    if not bmds:
        raise RuntimeError("No active BMDs found in bmdpublickeys collection.")
    existing = fetch_existing_aes_key()
    if existing:
        # AES key already exists — decode and reuse, never regenerate
        print("Reusing existing AES key from MongoDB (aeskeys)")
        aes_key_enc_b64 = existing["encrypted_aes_key"]# still RSA-encrypted
        nonce_base      = base64.b64decode(existing["nonce_base"])
        # Decrypt AES key using server's private key to get raw bytes for encryption
        server_doc = db.serverkeys.find_one(
            {"server_id": "main_server", "is_active": True}, {"_id": 0}
        )
        if not server_doc:
            raise RuntimeError("No active server key found in serverkeys collection.")
        server_private_key = serialization.load_pem_private_key(
            server_doc["rsa_private_key_pem"].encode(),
            password=SERVER_KEY_PASSPHRASE
        )
        aes_key = server_private_key.decrypt(
            base64.b64decode(aes_key_enc_b64),
            padding.OAEP(
                mgf=padding.MGF1(algorithm=hashes.SHA256()),
                algorithm=hashes.SHA256(),
                label=None
            )
        )
    else:
        print("Generating new AES key...")
        aes_key    = os.urandom(32)
        nonce_base = os.urandom(12)
        server_pub_pem     = fetch_or_create_server_keys()
        server_rsa_key     = load_rsa_public_key(server_pub_pem)
        server_enc_aes_key = rsa_encrypt_aes_key(aes_key, server_rsa_key)
        store_encrypted_aes_key(server_enc_aes_key, nonce_base)
    for election_dir in sorted(INPUT_DIR.iterdir()):
        if not election_dir.is_dir():
            continue
        election_id  = election_dir.name
        ballot_files = sorted(election_dir.glob("ballot_*.json"))
        if not ballot_files:
            print(f"[skip] No ballots found in {election_dir}")
            continue
        print(f"\n Election: {election_id}  ({len(ballot_files)} ballots)")
        # Pre-load all ballots once — reused across all BMDs
        loaded_ballots: dict[Path, bytes] = {}
        for ballot_path in ballot_files:
            loaded_ballots[ballot_path] = load_ballot(ballot_path)
            print(f"Loaded: {ballot_path.name}")
        for bmd in bmds:
            bmd_id    = bmd["bmd_id"]
            start_idx = bmd["assigned_ballot_range"]["start_index"]
            end_idx   = bmd["assigned_ballot_range"]["end_index"]
            assigned  = get_ballots_for_bmd(ballot_files, start_idx, end_idx)

            if not assigned:
                print(f"[skip] No ballots assigned to {bmd_id}")
                continue

            bmd_rsa_key     = load_rsa_public_key(bmd["rsa_public_key_pem"])
            bmd_enc_aes_key = rsa_encrypt_aes_key(aes_key, bmd_rsa_key)

            out_dir = OUTPUT_DIR / bmd_id / election_id / "ballot"
            out_dir.mkdir(parents=True, exist_ok=True)
            aes_key_out_dir = OUTPUT_DIR / bmd_id / election_id
            aes_key_file    = aes_key_out_dir / "aes_key.enc"
            aes_key_file.write_text(json.dumps({
                "bmd_id":            bmd_id,
                "encrypted_aes_key": bmd_enc_aes_key,   # RSA-OAEP encrypted with THIS BMD's public key
                "algorithm":         "RSA-OAEP-SHA256"
            }, indent=2))
            print(f"AES key file written: {aes_key_file.relative_to(OUTPUT_DIR)}")
        for i, ballot_path in enumerate(assigned, start=1):
            out_file = out_dir / f"ballot_{i}.enc.json"
            encrypt_ballot_bytes(
                loaded_ballots[ballot_path],
                out_file,
                aes_key,
                nonce_base,
                bmd_enc_aes_key
            )
            print(f"{ballot_path.name} → {out_file.relative_to(OUTPUT_DIR)}")

    print(f"\n All ballots encrypted. Output: {OUTPUT_DIR}")

if __name__ == "__main__":
    main()
'''

---

The complete flow in one picture:
```
First run:                         Subsequent runs:
──────────────────────────────     ──────────────────────────────────────
Generate aes_key + nonce_base  →   Fetch encrypted_aes_key from MongoDB
RSA encrypt with server pubkey →   RSA decrypt with server private key
Store in db.aeskeys ($setOnInsert) Recover raw aes_key + nonce_base
         │                                      │
         └──────────────┬─────────────────────--┘
                        ▼
          For each BMD → RSA encrypt aes_key with BMD pubkey
          For each ballot → AES-256-GCM encrypt → .enc.json

'''