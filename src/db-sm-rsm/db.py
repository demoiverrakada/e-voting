from pymongo import MongoClient
from misc import serialize_wrapper, deserialize_wrapper
import os
import ast
import json
import base64
function_map = {
        "setup": 'keys',
        "mix": 'decs',
        "generators":"generators",
        "enc":'votes',
        "load":'candidates',
        "receipt":'receipts',
}

def init():
    username = os.environ.get("MONGO_USERNAME")
    password = os.environ.get("MONGO_PASSWORD")
    host     = os.environ.get("MONGO_HOST")
    port     = os.environ.get("MONGO_PORT", "27017")
    client   = MongoClient(f'mongodb://{username}:{password}@{host}:{port}/test?authSource=admin')
    db       = client['test']
    return db

def store(funcs,params):
    db=init()
    collection=db[function_map[funcs]]
    if(function_map[funcs]=='generators'):
        collection.insert_one({
            "g1":(serialize_wrapper(params[0])),
            "f2":(serialize_wrapper(params[1])),
            "eg1f2":(serialize_wrapper(params[2])),
            "ef1f2":(serialize_wrapper(params[3])),
            "f1":(serialize_wrapper(params[4])),
            "h1":(serialize_wrapper(params[5])),
            "eh1f2":(serialize_wrapper(params[6])),
            "idenT":(serialize_wrapper(params[7])),
            "inveh1f2":(serialize_wrapper(params[8])),
            "inveg1f2":(serialize_wrapper(params[9])),
            "fT":(serialize_wrapper(params[10])),
            "election_id":(params[11])
        })
    elif(function_map[funcs]=='keys'):
        collection.insert_one({
            "alpha":(serialize_wrapper(params[0])),
            "pai_pk":(serialize_wrapper(params[1])),
            "_pai_sklist":(serialize_wrapper(params[2])),
            "pai_pklist_single":(serialize_wrapper(params[3])),
            "_pai_sklist_single":(serialize_wrapper(params[4])),
            "elg_pk":(serialize_wrapper(params[5])),
            "_elg_sklist":(serialize_wrapper(params[6])),
            "election_id":(params[7])
        })
    elif function_map[funcs] == 'decs':
        collection.insert_one({
            "election_id":  params[0],
            "msgs_out_dec": (serialize_wrapper(params[1])),
            "msgs_out":     (serialize_wrapper(params[2])),
            "_msg_shares":  (serialize_wrapper(params[3])),
            "_rand_shares": (serialize_wrapper(params[4]))
        })


def load(funcs, params, election_id):
    db = init()
    collection_name = function_map[funcs]
    collection = db[collection_name]
    try:
        if collection_name =='keys':
            result = {}
            document = collection.find_one({"election_id":election_id})
            #print(document)
            if document:
                for param in params:
                    if param in document:
                        result[param] = deserialize_wrapper(document[param])
        
        elif collection_name == 'generators':
            result = {}
            document = collection.find_one({"election_id": election_id})
            if document:
                for param in params:
                    if param in document:
                        result[param] = deserialize_wrapper(document[param])
        
        elif collection_name == 'decs':
            result = {}
            document = collection.find_one({"election_id": election_id})
            #print(document)
            if document:
                for param in params:
                    if param in document:
                        result[param] = deserialize_wrapper(document[param])
        
        elif collection_name == 'votes':
            result = {}
            for param in params:
                result[param] = []
                parameter_documents = collection.find(
                    {"election_id": election_id}
                ).sort("enc_hash", 1)  # sort by enc_hash for consistent ordering
                for doc in parameter_documents:
                    deserialized = deserialize_wrapper(doc[param])
                    result[param].append(deserialized)
            return result
        elif collection_name == 'candidates':
            result=[]
            documents = collection.find({"election_id": election_id})
            result = [doc["name"] for doc in documents]
            return result
        
        elif collection_name == 'receipts':
            result={}
            param_value = params[0]
            document = collection.find_one({
                'enc_hash': param_value,
                'election_id': election_id
            })
            del params[0]  # Remove the first parameter (enc_hash)
            if document:
                for key in params:
                    if key != "accessed":
                        deserialized_item = deserialize_wrapper(document[key])
                        result[key] = deserialized_item
                    elif key == "accessed":
                        result[key] = document[key]
                result["enc_hash"] = param_value
            return result

    except Exception as e:
        print(f"Error loading data: {str(e)}")
        return {}
    return result


def process_bulletins(election_id):
    db = init()
    bulletins_collection = db['bulletins']
    receipts_collection  = db['receipts']
    votes_collection     = db['votes']

    count = bulletins_collection.count_documents({"election_id": election_id})
    print(f"Found {count} bulletins for election {election_id}")

    for bulletin in bulletins_collection.find({"election_id": election_id}):
        try:
            commitment = bulletin.get("commitment")
            if not commitment:
                print(f"No commitment in bulletin {bulletin.get('_id')}")
                continue

            pref_id = bulletin.get("pref_id")
            if not pref_id:
                print(f"No pref_id in bulletin {bulletin.get('_id')}")
                continue

            receipt = receipts_collection.find_one({
                "enc_hash":   commitment,
                "election_id": election_id
            })

            if not receipt:
                receipt = receipts_collection.find_one({"enc_hash": commitment})
                if not receipt:
                    print(f"Missing receipt for commitment {commitment[:16]}...")
                    continue

            print(f"Found receipt for voter {bulletin['voter_id']} pref {pref_id} election {election_id}")

            vote_doc = {
                "election_id":        bulletin["election_id"],
                "voter_id":           bulletin["voter_id"],
                "pref_id":            bulletin["pref_id"],       # ← added
                "ov_hash":            receipt["ov_hash"],
                "enc_hash":           receipt["enc_hash"],
                "enc_msg":            receipt["enc_msg"],
                "comm":               receipt["comm"],
                "enc_msg_share":      receipt["enc_msg_share"],
                "enc_rand_share":     receipt["enc_rand_share"],
                "pfcomm":             receipt["pfcomm"],
                "enc_rand":           receipt["enc_rand"],
                "pf_encmsg":          receipt["pf_encmsg"],
                "pf_encrand":         receipt["pf_encrand"],
                "pfs_enc_msg_share":  receipt["pfs_enc_msg_share"],
                "pfs_enc_rand_share": receipt["pfs_enc_rand_share"]
            }

            result = votes_collection.update_one(
                {
                    "voter_id":    bulletin["voter_id"],
                    "election_id": bulletin["election_id"],
                    "pref_id":     bulletin["pref_id"]           # ← added
                },
                {"$setOnInsert": vote_doc},
                upsert=True
            )
            print(f"Upsert result: matched={result.matched_count}, upserted={result.upserted_id}")

        except KeyError as e:
            print(f"Missing field {str(e)} in bulletin {bulletin.get('_id')}")
        except json.JSONDecodeError as e:
            print(f"JSON parsing error in bulletin {bulletin.get('_id')}: {str(e)}")
        except Exception as e:
            print(f"Error processing bulletin {bulletin.get('_id')}: {str(e)}")

    print("Bulletin processing completed")