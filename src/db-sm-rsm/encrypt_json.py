import os
import json
import base64
import secrets
import glob
from cryptography.hazmat.primitives.ciphers.aead import AESGCM
from pymongo import MongoClient


def connect_db():
    client = MongoClient("mongodb://root:pass@eadb:27017")
    return client["test"]


# ================================================================
# ENCRYPT — Server encrypts ballots, saves in BMD expected structure
# ================================================================

def encrypt_ballot(json_file_path, booth_id, bmd_output_dir):
    """
    Encrypts a single ballot JSON file.

    Input  (server side): output/election_id_1/ballot_1.json
    Output (BMD side)   : bmd_output/1/ballot/1.json.enc

    Stores AES keys in MongoDB.
    """
    db = connect_db()

    with open(json_file_path, "rb") as f:
        plaintext = f.read()

    ballot_data = json.loads(plaintext)
    election_id = int(ballot_data.get("election_id"))

    # ballot_1.json → ballot_number = 1
    ballot_number = int(
        os.path.splitext(os.path.basename(json_file_path))[0].split("_")[1]
    )

    # AES-256-GCM encrypt
    aes_key = secrets.token_bytes(32)
    nonce = secrets.token_bytes(12)
    aesgcm = AESGCM(aes_key)
    encrypted_data_with_tag = aesgcm.encrypt(nonce, plaintext, None)
    encrypted_data = encrypted_data_with_tag[:-16]
    auth_tag = encrypted_data_with_tag[-16:]

    # Save in BMD expected structure: bmd_output/e_id/ballot/id.json.enc
    enc_output_dir = os.path.join(bmd_output_dir, str(election_id), "ballot")
    os.makedirs(enc_output_dir, exist_ok=True)
    enc_filename = f"{ballot_number}.json.enc"
    enc_file_path = os.path.join(enc_output_dir, enc_filename)

    with open(enc_file_path, "wb") as f:
        f.write(encrypted_data + auth_tag)

    print(f"✓ Encrypted : {json_file_path} → {enc_file_path}")

    # Store ONLY keys in MongoDB
    db["ballot_keys"].update_one(
        {
            "election_id": election_id,
            "booth_id": booth_id,
            "ballot_number": ballot_number
        },
        {"$set": {
            "election_id": election_id,
            "booth_id": booth_id,
            "ballot_number": ballot_number,
            "file_name": enc_filename,
            "aes_key": base64.b64encode(aes_key).decode("utf-8"),
            "nonce": base64.b64encode(nonce).decode("utf-8"),
            "auth_tag": base64.b64encode(auth_tag).decode("utf-8")
        }},
        upsert=True
    )

    print(f"  Keys stored : election={election_id}, booth={booth_id}, ballot={ballot_number}")


def encrypt_all_ballots(server_output_dir="output", bmd_output_dir="bmd_output", num_booths=2):
    """
    Scans server output/election_id_*/ballot_*.json
    Distributes ballots evenly across booths
    Encrypts each and saves in BMD structure:
        bmd_output/
            1/
                ballot/
                    1.json.enc
                    2.json.enc
            2/
                ballot/
                    1.json.enc
    """
    election_dirs = sorted(glob.glob(os.path.join(server_output_dir, "election_id_*")))

    if not election_dirs:
        print(f"No election directories found in {server_output_dir}/")
        return

    for election_dir in election_dirs:
        ballot_files = sorted(
            glob.glob(os.path.join(election_dir, "ballot_*.json")),
            key=lambda x: int(
                os.path.splitext(os.path.basename(x))[0].split("_")[1]
            )
        )

        if not ballot_files:
            print(f"No ballots found in {election_dir}, skipping.")
            continue

        total = len(ballot_files)
        ballots_per_booth = total // num_booths
        print(f"\n{election_dir}: {total} ballots → {num_booths} booths ({ballots_per_booth} each)")

        for idx, ballot_file in enumerate(ballot_files):
            booth_id = (idx // ballots_per_booth) + 1
            if booth_id > num_booths:
                booth_id = num_booths
            encrypt_ballot(ballot_file, booth_id, bmd_output_dir)

    print(f"\n✓ All ballots encrypted → {bmd_output_dir}/")


# ================================================================
# DECRYPT — BMD decrypts its assigned ballots
# ================================================================

def decrypt_ballot(election_id, booth_id, ballot_number, bmd_dir="bmd_output"):
    """
    BMD SIDE:
    Fetches AES key from MongoDB.
    Decrypts .json.enc → .json in same directory.
    Deletes .enc file after decrypting.

    bmd_output/1/ballot/1.json.enc → bmd_output/1/ballot/1.json
    """
    db = connect_db()

    key_doc = db["ballot_keys"].find_one({
        "election_id": election_id,
        "booth_id": booth_id,
        "ballot_number": ballot_number
    })

    if not key_doc:
        print(f"No key found: election={election_id}, booth={booth_id}, ballot={ballot_number}")
        return None

    aes_key = base64.b64decode(key_doc["aes_key"])
    nonce = base64.b64decode(key_doc["nonce"])

    enc_file_path = os.path.join(
        bmd_dir,
        str(election_id),
        "ballot",
        f"{ballot_number}.json.enc"
    )

    if not os.path.exists(enc_file_path):
        print(f"Encrypted file not found: {enc_file_path}")
        return None

    with open(enc_file_path, "rb") as f:
        raw = f.read()

    encrypted_data = raw[:-16]
    auth_tag = raw[-16:]

    aesgcm = AESGCM(aes_key)
    plaintext = aesgcm.decrypt(nonce, encrypted_data + auth_tag, None)

    # Save decrypted .json in same directory
    dec_file_path = os.path.join(
        bmd_dir,
        str(election_id),
        "ballot",
        f"{ballot_number}.json"
    )

    with open(dec_file_path, "wb") as f:
        f.write(plaintext)

    # Delete .enc file
    os.remove(enc_file_path)

    print(f"✓ Decrypted : {enc_file_path} → {dec_file_path}")
    return dec_file_path


def decrypt_all_ballots_for_booth(booth_id, bmd_dir="bmd_output"):
    """
    BMD SIDE:
    Decrypts ALL ballots assigned to this booth across all elections.
    Final structure after decryption:
        bmd_output/
            1/
                ballot/
                    1.json
                    2.json
            2/
                ballot/
                    1.json
    """
    db = connect_db()

    key_docs = list(db["ballot_keys"].find({"booth_id": booth_id}))

    if not key_docs:
        print(f"No ballots found for booth {booth_id}")
        return

    print(f"\nDecrypting {len(key_docs)} ballots for booth {booth_id}...")

    success = 0
    for key_doc in key_docs:
        result = decrypt_ballot(
            key_doc["election_id"],
            booth_id,
            key_doc["ballot_number"],
            bmd_dir
        )
        if result:
            success += 1

    print(f"\n✓ Decrypted {success}/{len(key_docs)} ballots for booth {booth_id}")


# ================================================================
# ENCRYPT VOTES — BMD encrypts final votes to send to server
# ================================================================

def encrypt_votes_for_server(election_id, booth_id, votes_file_path, output_dir="incoming_votes"):
    """
    BMD SIDE:
    Encrypts final vote file using AES-256-GCM.
    Saves to incoming_votes/election_id_1/booth_1_votes.json.enc
    Stores AES keys in MongoDB vote_keys collection.
    """
    db = connect_db()

    with open(votes_file_path, "rb") as f:
        plaintext = f.read()

    aes_key = secrets.token_bytes(32)
    nonce = secrets.token_bytes(12)
    aesgcm = AESGCM(aes_key)
    encrypted_data_with_tag = aesgcm.encrypt(nonce, plaintext, None)
    encrypted_data = encrypted_data_with_tag[:-16]
    auth_tag = encrypted_data_with_tag[-16:]

    enc_output_dir = os.path.join(output_dir, f"election_id_{election_id}")
    os.makedirs(enc_output_dir, exist_ok=True)
    enc_filename = f"booth_{booth_id}_votes.json.enc"
    enc_file_path = os.path.join(enc_output_dir, enc_filename)

    with open(enc_file_path, "wb") as f:
        f.write(encrypted_data + auth_tag)

    print(f"✓ Votes encrypted : {votes_file_path} → {enc_file_path}")

    db["vote_keys"].update_one(
        {
            "election_id": election_id,
            "booth_id": booth_id
        },
        {"$set": {
            "election_id": election_id,
            "booth_id": booth_id,
            "file_name": enc_filename,
            "aes_key": base64.b64encode(aes_key).decode("utf-8"),
            "nonce": base64.b64encode(nonce).decode("utf-8"),
            "auth_tag": base64.b64encode(auth_tag).decode("utf-8"),
            "decrypted": False,
            "decrypted_file_path": None
        }},
        upsert=True
    )

    print(f"  Keys stored : election={election_id}, booth={booth_id}")


# ================================================================
# DECRYPT VOTES — Server decrypts incoming vote files from BMDs
# ================================================================

def decrypt_votes_from_booth(election_id, booth_id, incoming_dir="incoming_votes", output_dir="decrypted_votes"):
    """
    SERVER SIDE:
    Fetches AES key from MongoDB.
    Decrypts encrypted vote file received from BMD.
    Saves decrypted JSON to decrypted_votes/election_id_1/booth_1_votes.json
    """
    db = connect_db()

    key_doc = db["vote_keys"].find_one({
        "election_id": election_id,
        "booth_id": booth_id,
        "decrypted": False
    })

    if not key_doc:
        print(f"No pending vote key: election={election_id}, booth={booth_id}")
        return None

    aes_key = base64.b64decode(key_doc["aes_key"])
    nonce = base64.b64decode(key_doc["nonce"])

    enc_file_path = os.path.join(
        incoming_dir,
        f"election_id_{election_id}",
        f"booth_{booth_id}_votes.json.enc"
    )

    if not os.path.exists(enc_file_path):
        print(f"Encrypted votes file not found: {enc_file_path}")
        return None

    with open(enc_file_path, "rb") as f:
        raw = f.read()

    encrypted_data = raw[:-16]
    auth_tag = raw[-16:]

    aesgcm = AESGCM(aes_key)
    plaintext = aesgcm.decrypt(nonce, encrypted_data + auth_tag, None)

    dec_output_dir = os.path.join(output_dir, f"election_id_{election_id}")
    os.makedirs(dec_output_dir, exist_ok=True)
    dec_file_path = os.path.join(dec_output_dir, f"booth_{booth_id}_votes.json")

    with open(dec_file_path, "wb") as f:
        f.write(plaintext)

    db["vote_keys"].update_one(
        {"_id": key_doc["_id"]},
        {"$set": {
            "decrypted": True,
            "decrypted_file_path": dec_file_path
        }}
    )

    print(f"✓ Votes decrypted : {enc_file_path} → {dec_file_path}")
    return dec_file_path


def decrypt_all_votes_for_election(election_id, incoming_dir="incoming_votes", output_dir="decrypted_votes"):
    """
    SERVER SIDE:
    Decrypts ALL booth vote files for a given election.
    """
    db = connect_db()

    key_docs = list(db["vote_keys"].find({
        "election_id": election_id,
        "decrypted": False
    }))

    if not key_docs:
        print(f"No pending votes for election {election_id}")
        return

    print(f"\nDecrypting votes from {len(key_docs)} booths for election {election_id}...")

    success = 0
    for key_doc in key_docs:
        result = decrypt_votes_from_booth(
            election_id,
            key_doc["booth_id"],
            incoming_dir,
            output_dir
        )
        if result:
            success += 1

    print(f"\n✓ Decrypted votes from {success}/{len(key_docs)} booths for election {election_id}")


# ================================================================
# MAIN
# ================================================================

if __name__ == "__main__":
    # SERVER: Encrypt all ballots and prepare for BMD
    encrypt_all_ballots(
        server_output_dir="output",
        bmd_output_dir="bmd_output",
        num_booths=2
    )

    # BMD: Decrypt assigned ballots
    # decrypt_all_ballots_for_booth(booth_id=1, bmd_dir="bmd_output")

    # BMD: Encrypt final votes to send to server
    # encrypt_votes_for_server(
    #     election_id=1,
    #     booth_id=1,
    #     votes_file_path="votes/booth_1_votes.json"
    # )

    # SERVER: Decrypt all incoming votes for an election
    # decrypt_all_votes_for_election(election_id=1)