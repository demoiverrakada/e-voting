from pymongo import MongoClient
import hashlib
import json
from collections import defaultdict

def compute_hash(input_string):
    return hashlib.sha256(input_string.encode('utf-8')).hexdigest()

def main():
    client = MongoClient('mongodb://root:pass@eadb:27017')
    db = client['test']
    
    # Get all election IDs with candidates
    election_ids = db['candidates'].distinct("election_id")
    
    final_data = {
        "PO": [],
        "voter": defaultdict(lambda: {"elections": []}),
        "receipt": [],
        "lastVerifiedVoter": {"voter_id": "", "voter_index": -1}
    }

    # Process PO data (assuming same PO for all elections)
    for po in db['pos'].find():
        final_data['PO'].append({
            "email": po.get('email', ''),
            "passwordHash": po.get('password', '')
        })

    # Process voters with election grouping
    for voter in db['voters'].find():
        voter_id = voter['voter_id']
        final_data['voter'][voter_id].update({
            "name": voter['name'],
            "voter_id": voter_id
        })
        final_data['voter'][voter_id]["elections"].append({
            "election_id": voter['election_id'],
            "vote": voter['vote'],
            "ballot_id": ""
        })

    # Convert voter defaultdict to list
    final_data['voter'] = list(final_data['voter'].values())

    # Process receipts per election
    for election_id in election_ids:
        # Get candidate count for this election
        num_candidates = db['candidates'].count_documents({"election_id": election_id})
        if num_candidates == 0:
            continue

        # Process election-specific receipts
        receipts = list(db['receipts'].find({
            "election_id": election_id,
            "accessed": False
        }).sort("_id", 1))

        group = []
        for receipt in receipts:
            group.append(receipt['enc_hash'].strip())
            if len(group) == num_candidates:
                concatenated = ''.join(group)
                overall_hash = compute_hash(concatenated)
                
                final_data['receipt'].append({
                    "election_id": election_id,
                    "commitment_identifier": "",
                    "ballot_id": overall_hash,
                    "voter_id": "",
                    "accessed": False
                })
                group = []

        # Handle remaining receipts
        if group:
            concatenated = ''.join(group)
            overall_hash = compute_hash(concatenated)
            final_data['receipt'].append({
                "election_id": election_id,
                "commitment_identifier": "",
                "ballot_id": overall_hash,
                "voter_id": "",
                "accessed": False
            })

    # Save output
    with open('/output/data.json', 'w') as f:
        json.dump(final_data, f, indent=4, default=lambda o: list(o.values()))

if __name__ == "__main__":
    main()

