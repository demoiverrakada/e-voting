from __future__ import annotations
import os
import sys
import json
import base64
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


def decode_key(raw_key_bytes: bytes) -> bytes:
    """Mirror the working script: try hex first, then base64, then raw bytes."""
    try:
        return bytes.fromhex(raw_key_bytes.decode("utf-8").strip())
    except (ValueError, UnicodeDecodeError):
        pass
    try:
        return base64.b64decode(raw_key_bytes.decode("utf-8").strip())
    except Exception:
        pass
    return raw_key_bytes


def decode_cipher_value(val_str: str) -> bytes:
    """Try base64 first, then hex."""
    try:
        return base64.b64decode(val_str)
    except Exception:
        pass
    try:
        return bytes.fromhex(val_str)
    except Exception:
        raise ValueError(f"Could not decode value as base64 or hex: {val_str[:15]}...")


def get_aes_key() -> bytes:
    server_private_key = fetch_server_private_key()
    aes_key_doc        = fetch_aes_key_doc()
    raw_key = rsa_decrypt_aes_key(aes_key_doc["encrypted_aes_key"], server_private_key)

    aes_key = decode_key(raw_key)

    print(json.dumps({
        "raw_rsa_decrypted_b64":        base64.b64encode(raw_key).decode(),
        "raw_rsa_decrypted_hex":        raw_key.hex(),
        "interpreted_aes_key_b64":      base64.b64encode(aes_key).decode(),
        "interpreted_aes_key_hex":      aes_key.hex(),
        "interpreted_key_length_bytes": len(aes_key)
    }), file=sys.stderr)

    return aes_key


def decrypt_ballot(envelope: dict, aes_key: bytes) -> list:
    nonce      = decode_cipher_value(envelope["nonce"])
    ciphertext = decode_cipher_value(envelope["ciphertext"])

    aesgcm    = AESGCM(aes_key)
    plaintext = aesgcm.decrypt(nonce, ciphertext, None)
    decoded   = plaintext.decode("utf-8").strip()

    # Try standard JSON first (single object or array)
    try:
        result = json.loads(decoded)
        return result if isinstance(result, list) else [result]
    except json.JSONDecodeError:
        pass

    # Fall back to NDJSON (multiple JSON objects, one per line)
    results = []
    for line in decoded.splitlines():
        line = line.strip()
        if line:
            results.append(json.loads(line))
    return results


def main():
    if len(sys.argv) < 2:
        print(json.dumps({"error": "No file path provided"}))
        sys.exit(1)

    file_path = sys.argv[1]

    with open(file_path, "r") as f:
        content = f.read().strip()

    # Try standard JSON first (array or single object)
    try:
        data = json.loads(content)
        envelopes = data if isinstance(data, list) else [data]
    except json.JSONDecodeError:
        # Fall back to NDJSON (one JSON object per line)
        envelopes = []
        for line in content.splitlines():
            line = line.strip()
            if line:
                envelopes.append(json.loads(line))

    aes_key = get_aes_key()

    decrypted_votes = []
    for envelope in envelopes:
        ballots = decrypt_ballot(envelope, aes_key)
        decrypted_votes.extend(ballots)

    print(json.dumps(decrypted_votes))


if __name__ == "__main__":
    main()