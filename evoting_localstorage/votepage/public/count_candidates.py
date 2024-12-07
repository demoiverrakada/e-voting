from pymongo import MongoClient
import json

# MongoDB connection string
connection_string = "mongodb+srv://demoiverrakada:H*jwNx399A*4898@cluster0.glm3g2c.mongodb.net/"

# Connect to MongoDB
client = MongoClient(connection_string)

# Access your database and collection
db = client.test  # Change 'test' to your actual database name if different
collection = db.candidates  # Change 'candidates' to your actual collection name if different

# Get the count of entries in the collection
count = collection.count_documents({})

# Create a dictionary with the count
data = {"count": count}

# Write the count to a JSON file
with open('count.json', 'w') as file:
    json.dump(data, file)

# Close the connection to MongoDB
client.close()

