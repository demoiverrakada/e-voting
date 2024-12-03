from pymongo import MongoClient
from misc import serialize_wrapper, deserialize_wrapper
import ast
function_map = {
        "setup": 'keys',
        "mix": 'decs',
        "pf_zksm": 'verfps',
        "pf_zkrsm": 'verves',
        "enc":'votes',
        "load":'candidates',
        "receipt":'receipts',
}


def init():
    client = MongoClient('mongodb+srv://raagineedturki:pxfkFNcAnkinDFnk@cluster0.8i60tuh.mongodb.net/')
    db = client['test']
    return db

def store(funcs,params):
    db=init()
    collection=db[function_map[funcs]]
    if(function_map[funcs]=='keys'):
        collection.insert_one({
            "alpha":(serialize_wrapper(params[0])),
            "pai_pk":(serialize_wrapper(params[1])),
            "_pai_sklist":(serialize_wrapper(params[2])),
            "pai_pklist_single":(serialize_wrapper(params[3])),
            "_pai_sklist_single":(serialize_wrapper(params[4])),
            "elg_pk":(serialize_wrapper(params[5])),
            "_elg_sklist":(serialize_wrapper(params[6])),
            "ck":(serialize_wrapper(params[7])),
            "ck_fo":(serialize_wrapper(params[8])),
            "_pi":(serialize_wrapper(params[9])),
            "_re_pi":(serialize_wrapper(params[10])),
            "_svecperm":(serialize_wrapper(params[11])),
            "permcomm":(serialize_wrapper(params[12]))
        })
    elif(function_map[funcs]=='decs'):
        collection.insert_one({
            "msgs_out_dec":(serialize_wrapper(params[0])),
            "msgs_out":(serialize_wrapper(params[1])), 
            "_msg_shares":(serialize_wrapper(params[2])),
            "_rand_shares":(serialize_wrapper(params[3]))
        })
    elif(function_map[funcs]=='verfps'):
        collection.insert_one({
            "pf_zksm":(serialize_wrapper(params[0]))
        })
    elif(function_map[funcs]=='verves'):
        collection.insert_one({
            "pf_zkrsm":(serialize_wrapper(params[0]))
        })


def load(funcs,params):
    db=init()
    collection=db[function_map[funcs]]
    result={}
    if(function_map[funcs]=='keys'):
        document=collection.find_one()
        for param in params:
            result[param] = deserialize_wrapper(document[param])
        return result
    elif(function_map[funcs]=='decs'):
        document=collection.find_one()
        for param in params:
            result[param] = deserialize_wrapper(document[param])
        return result
    elif function_map[funcs] == 'votes':
        for param in params:
            result[param] = []
        documents = collection.find()
        for document in documents:
            for param in params:
                deserialized_item = deserialize_wrapper(document[param])
                result[param].append(deserialized_item)
                print(f"Document: {document[param]}, Deserialized: {deserialized_item}")
        
        return result
    elif function_map[funcs] == 'candidates':
        res=[]
        documents=collection.find()
        for document in documents:
            res.append(document["name"])
        return res
    elif function_map[funcs] == 'receipts':
        res = []
        param_value = params[0]
        document = collection.find_one({"enc_hash": param_value})
        del params[0]
        if document:
            for key in params:
                if(key!="enc_hash"):
                    deserialized_item = deserialize_wrapper(document[key])
                    result[key].append(deserialized_item)
            res.append({"enc_hash":param_value})
            return res
    elif function_map[funcs] =="verfps":
        res=[]
        documents=collection.find()
        for document in documents:
            res.append(document["pfzksm"])
        return res
