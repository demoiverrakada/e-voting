from pymongo import MongoClient
import hashlib
import json

# Connect to MongoDB
client = MongoClient('mongodb://root:pass@eadb:27017')
db = client['test']  # Replace with your database name
candidates_collection = db['candidates']  # Replace with your candidates collection name
receipts_collection = db['receipts']  # Replace with your receipts collection name
voters_collection = db['voters']  # Replace with your voters collection name
pos_collection = db['pos']  # Replace with your pos collection name

# Fetch the number of candidates
num_candidates = candidates_collection.count_documents({})

# Fetch all receipts from the database
receipts_cursor = receipts_collection.find()
voters_cursor = voters_collection.find()
pos_cursor = pos_collection.find()

# Function to compute SHA-256 hash of a concatenated string
def compute_hash(input_string):
    return hashlib.sha256(input_string.encode('utf-8')).hexdigest()

# Initialize variables
group_hashes = []
final_data = {
    "PO": [],
    "voter": [],
    "receipt": []
}

# Process PO data
for po in pos_cursor:
    final_data['PO'].append({
        "email": po.get('email', ''),
        "passwordHash": po.get('password', '')
    })

# Process voter data
for voter in voters_cursor:
    final_data['voter'].append({
        "name": voter.get('name', ''),
        "voter_id": voter.get('voter_id', ''),
        "vote": voter.get('vote', False),
        "ballot_id": ""
    })

# Process receipts in groups of num_candidates
# group = []
i = 0
for receipt in receipts_cursor:
    if(receipt['accessed']==True):
        continue
    
    enc_hash = receipt['enc_hash'].strip()
    ov_hash = receipt['ov_hash'].strip()
    # group.append(enc_hash)
    i += 1
    if i % num_candidates == 0:
        final_data['receipt'].append({
            "commitment_identifier": "",
            "ballot_id": ov_hash,
            "voter_id": "",
            "accessed": False
        })
        i = 0

    # # Once we have a full group, process it
    # if len(group) == num_candidates:
    #     concatenated_hashes = ''.join(group)
    #     concatenated_hashes = "'" + concatenated_hashes + "'"
    #     print(concatenated_hashes)
    #     overall_hash = compute_hash(concatenated_hashes)

    #     print(overall_hash)
    #     final_data['receipt'].append({
    #         "commitment_identifier": "",
    #         "ballot_id": overall_hash,
    #         "voter_id": "",
    #         "accessed": False
    #     })
    #     group = []  # Reset for the next group

# If there are leftover receipts that didn't fill a complete group
# if group:
#     concatenated_hashes = ''.join(group)
#     overall_hash = compute_hash(concatenated_hashes)
#     #print(overall_hash)
#     final_data['receipt'].append({
#         "commitment_identifier": "",
#         "ballot_id": overall_hash,
#         "voter_id": "",
#         "accessed": False
#     })

# Output the final JSON
output_path = '/app/evoting_localstorage/evoting_fron/android/app/src/main/assets/data.json'

with open(output_path, 'w') as outfile:
    json.dump(final_data, outfile, indent=4)

print("Final JSON data saved to usable location as data.json'.")
