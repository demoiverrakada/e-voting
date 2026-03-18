import os
import sys
import json
import base64
import struct
from db import init

from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding
from cryptography.hazmat.primitives.ciphers.aead import AESGCM

db = init()
SERVER_KEY_PASSPHRASE = os.environ.get("SERVER_KEY_PASSPHRASE", "changeme").encode()

def fetch_server_private_key():
    doc = db.serverkeys.find_one({"server_id": "main_server", "is_active": True}, {"_id": 0})
    if not doc:
        raise RuntimeError("No active server key found in serverkeys collection.")
    return serialization.load_pem_private_key(
        doc["rsa_private_key_pem"].encode(),
        password=SERVER_KEY_PASSPHRASE
    )

def fetch_aes_key_doc() -> dict:
    doc = db.aeskeys.find_one({}, {"_id": 0})
    if not doc:
        raise RuntimeError("No AES key found in aeskeys collection.")
    return doc

def rsa_decrypt_aes_key(encrypted_aes_key_b64: str, server_private_key) -> bytes:
    return server_private_key.decrypt(
        base64.b64decode(encrypted_aes_key_b64),
        padding.OAEP(
            mgf=padding.MGF1(algorithm=hashes.SHA256()),
            algorithm=hashes.SHA256(),
            label=None
        )
    )

def decrypt_ballot(envelope: dict) -> dict:
    algorithm  = envelope["algorithm"]
    nonce_base = base64.b64decode(envelope["nonce"])
    num_chunks = envelope["num_chunks"]
    chunks     = envelope["chunks"]

    if algorithm != "RSA-OAEP+AES-GCM-256":
        raise ValueError(f"Unsupported algorithm: {algorithm}")

    if len(chunks) != num_chunks:
        raise ValueError(f"Chunk count mismatch: expected {num_chunks}, got {len(chunks)}")

    server_private_key = fetch_server_private_key()
    aes_key_doc        = fetch_aes_key_doc()
    aes_key            = rsa_decrypt_aes_key(aes_key_doc["encrypted_aes_key"], server_private_key)

    aesgcm         = AESGCM(aes_key)
    plaintext_data = b""

    for chunk_index, chunk_b64 in enumerate(chunks):
        ciphertext_chunk = base64.b64decode(chunk_b64)

        chunk_nonce = bytearray(nonce_base)
        idx_bytes   = struct.pack(">I", chunk_index)
        for i in range(4):
            chunk_nonce[-(i + 1)] ^= idx_bytes[-(i + 1)]

        aad             = struct.pack(">I", chunk_index)
        plaintext_chunk = aesgcm.decrypt(bytes(chunk_nonce), ciphertext_chunk, aad)
        plaintext_data += plaintext_chunk

    return json.loads(plaintext_data.decode("utf-8"))
def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path provided"}))
        sys.exit(1)

    file_path = sys.argv[1]

    with open(file_path, "r") as f:
        data = json.load(f)

    if isinstance(data, list):
        envelopes = data
    else:
        envelopes = [data]

    decrypted_votes = []
    for envelope in envelopes:
        ballot = decrypt_ballot(envelope)
        decrypted_votes.append(ballot)

    print(json.dumps(decrypted_votes))

if __name__ == "__main__":
    main()