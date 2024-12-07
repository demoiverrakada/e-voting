from pymongo import MongoClient

def process_bulletins():
    # Connect to MongoDB
    client = MongoClient('mongodb+srv://raagineedturki:pxfkFNcAnkinDFnk@cluster0.8i60tuh.mongodb.net/')
    db = client['test']

    # Collections
    bulletins_collection = db['bulletins']
    receipts_collection = db['receipts']
    votes_collection = db['votes']

    bulletins_cursor = bulletins_collection.find()

    # Process each bulletin
    for bulletin in bulletins_cursor:
        commitment = bulletin['commitment']

        receipt = receipts_collection.find_one({'enc_hash': commitment})

        if receipt:
            receipt['voter_id'] = bulletin['voter_id']
            votes_collection.insert_one(receipt)
            print(f"Processed commitment: {commitment}")
        else:
            print(f"No matching receipt found for commitment: {commitment}")
    
    print("Data transfer completed.")
