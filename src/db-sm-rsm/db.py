from pymongo import MongoClient
from misc import serialize_wrapper, deserialize_wrapper
import ast
function_map = {
        "setup": 'keys',
        "mix": 'decs',
        "generators":"generators",
        "enc":'votes',
        "load":'candidates',
        "receipt":'receipts',
}


def init():
    client = MongoClient('mongodb://root:pass@eadb:27017')
    db = client['test']
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
    elif(function_map[funcs]=='decs'):
        collection.insert_one({
        "election_id": params[0],  # First parameter is election_id
        "msgs_out_dec": serialize_wrapper(params[1]),
        "msgs_out": serialize_wrapper(params[2]),
        "_msg_shares": serialize_wrapper(params[3]),
        "_rand_shares": serialize_wrapper(params[4])
        })


def load(funcs, params, election_id):
    db = init()
    collection_name = function_map[funcs]
    collection = db[collection_name]
    result = {}
    try:
        if collection_name == 'keys':
            document = collection.find_one({"election_id":election_id})
            if document:
                for param in params:
                    result[param] = deserialize_wrapper(document[param])
        
        elif collection_name == 'generators':
            document = collection.find_one({"election_id": election_id})
            if document:
                for param in params:
                    result[param] = deserialize_wrapper(document[param])
        
        elif collection_name == 'decs':
            document = collection.find_one({"election_id": election_id})
            if document:
                for param in params:
                    result[param] = deserialize_wrapper(document[param])
        
        elif collection_name == 'votes':
            documents = collection.find({"election_id": election_id})
            result[param] = []
            for doc in documents:
                for param in params:
                    deserialized = deserialize_wrapper(doc[param])
                    result[param].append(deserialized)
        
        elif collection_name == 'candidates':
            documents = collection.find({"election_id": election_id})
            result = [doc["name"] for doc in documents]
        
        elif collection_name == 'receipts':
            document = collection.find_one({
                "election_id": params[0],
                "enc_hash": params[1]
            })
            if document:
                result = {k: deserialize_wrapper(v) for k, v in document.items() 
                         if k not in ['_id', 'election_id', 'accessed']}
                result["enc_hash"] = params[1]

    except Exception as e:
        print(f"Error loading data: {str(e)}")
        return {}

    return result
