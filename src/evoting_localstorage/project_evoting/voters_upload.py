import json
from pymongo import MongoClient

# Step 1: Load data from the JSON file
with open('simulated_voters.json') as file:
    data = json.load(file)

# Step 2: Connect to MongoDB
client = MongoClient('mongodb+srv://demoiverrakada:H*jwNx399A*4898@cluster0.morsxl9.mongodb.net/')  # Replace with your MongoDB connection string
db = client['test']  # Replace with your database name
collection = db['voters']  # Replace with your collection name

# Step 3: Insert data into the collection
result = collection.insert_many(data)

# Step 4: Check result
print(f"Voters uploaded successfully!!")
