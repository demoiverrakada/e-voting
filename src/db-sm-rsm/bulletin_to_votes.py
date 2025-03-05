from pymongo import MongoClient
import json

def process_bulletins():
    client = MongoClient('mongodb://root:pass@eadb:27017')
    db = client['test']

    bulletins_collection = db['bulletins']
    receipts_collection = db['receipts']
    votes_collection = db['votes']

    for bulletin in bulletins_collection.find():
        try:
            # Find receipt with election_id match
            receipt = receipts_collection.find_one({
                'enc_hash': bulletin['commitment'],
                'election_id': bulletin['election_id']
            })

            if not receipt:
                print(f"No receipt found for commitment {bulletin['commitment']} in election {bulletin['election_id']}")
                continue

            # Convert string fields to arrays using JSON parsing
            vote_doc = {
                "election_id": bulletin['election_id'],
                "voter_id": bulletin['voter_id'],
                "ov_hash": receipt['ov_hash'],
                "enc_hash": receipt['enc_hash'],
                "enc_msg": (receipt['enc_msg']),
                "comm": (receipt['comm']),
                "enc_msg_share": (receipt['enc_msg_shares']),
                "enc_rand_share": (receipt['enc_rand_shares']),
                "pfcomm": receipt['pfcomm'],
                "enc_rand": (receipt['enc_rand']),
                "pf_encmsg": receipt['pf_encmsg'],
                "pf_encrand": receipt['pf_encrand'],
                "pfs_enc_msg_share": receipt['pf_enc_msg_shares'],
                "pfs_enc_rand_share": receipt['pf_enc_rand_shares']
            }

            # Insert into votes collection
            votes_collection.insert_one(vote_doc)
            #print(f"Processed voter {bulletin['voter_id']} in election {bulletin['election_id']}")

        except KeyError as e:
            print(f"Missing field {str(e)} in bulletin {bulletin.get('_id')}")
        except json.JSONDecodeError as e:
            print(f"JSON parsing error in bulletin {bulletin.get('_id')}: {str(e)}")
        except Exception as e:
            print(f"Error processing bulletin {bulletin.get('_id')}: {str(e)}")

    print("Bulletin processing completed")
