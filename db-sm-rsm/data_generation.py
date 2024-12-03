from pymongo import MongoClient
import hashlib
import json

# Connect to MongoDB
client = MongoClient('mongodb+srv://raagineedturki:pxfkFNcAnkinDFnk@cluster0.8i60tuh.mongodb.net/')
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
group = []
for receipt in receipts_cursor:
    enc_hash = receipt['enc_hash'].strip()
    group.append(enc_hash)

    # Once we have a full group, process it
    if len(group) == num_candidates:
        concatenated_hashes = ''.join(group)
        concatenated_hashes = "'" + concatenated_hashes + "'"
        print(concatenated_hashes)
        overall_hash = compute_hash(concatenated_hashes)

        print(overall_hash)
        final_data['receipt'].append({
            "commitment_identifier": "",
            "ballot_id": overall_hash,
            "voter_id": "",
            "accessed": False
        })
        group = []  # Reset for the next group

# If there are leftover receipts that didn't fill a complete group
if group:
    concatenated_hashes = ''.join(group)
    overall_hash = compute_hash(concatenated_hashes)
    #print(overall_hash)
    final_data['receipt'].append({
        "commitment_identifier": "",
        "ballot_id": overall_hash,
        "voter_id": "",
        "accessed": False
    })

# Output the final JSON
with open('final_output.json', 'w') as outfile:
    json.dump(final_data, outfile, indent=4)

print("Final JSON data saved to 'final_output.json'.")
