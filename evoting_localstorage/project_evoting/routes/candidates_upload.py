import json
import sys
from pymongo import MongoClient

def main(input_file):
    # Step 1: Load data from the JSON file
    with open(input_file) as file:
        data = json.load(file)

    # Step 2: Connect to MongoDB
    client = MongoClient('mongodb+srv://demoiverrakada:H*jwNx399A*4898@cluster0.morsxl9.mongodb.net/')  # Replace with your MongoDB connection string
    db = client['test']  # Replace with your database name
    collection = db['candidates']  # Replace with your collection name

    # Step 3: Insert data into the collection
    result = collection.insert_many(data)

    # Step 4: Check result
    print(f"Candidates uploaded successfully! Inserted {len(result.inserted_ids)} records.")

if __name__ == "__main__":
    # Check if an argument was provided
    print("got a request")
    if len(sys.argv) != 2:
        print("Usage: python candidates_upload.py <input_file>")
        sys.exit(1)

    input_file = sys.argv[1]
    main(input_file)
