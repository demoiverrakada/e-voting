from optthpaillier import pai_th_keygen
from optpaillier import pai_keygen as pai_keygen_single
from elgamal import elgamal_th_keygen
from secretsharing import gen_beaver_triples,reconstruct
from shuffle import commkey, commkey_fo, commit_perm, perm_nizkproof, perm_nizkverif
import random
from globals import g1, group, pai_group, beta, q, kappa_e,f2, eg1f2,f1,ef1f2,h1,eh1f2,idenT,inveh1f2,inveg1f2,fT
from charm.toolbox.pairinggroup import ZR
from db_sm_rsm import check_encs, mix, check_verfsigs, get_blsigs, dpk_bbsig_nizkproofs,check_verfsigs_rev,get_blsigs_rev,genperms,get_verfsigs,get_verfsigs_rev
from pok import dpk_bbsplussig_nizkproofs,dpk_bbsig_nizkverifs,dpk_bbsplussig_nizkverifs
import sys
import json
from db import store,load,init
from bulletin_to_votes import process_bulletins
from ballot_draft import ballot_draft
from misc import timer
from elgamal import elgamal_th_keygen,elgamal_encrypt
from optpaillier import pai_decrypt as pai_decrypt_single
import ast
from misc import serialize_wrapper, deserialize_wrapper
from bbsig import bbbatchverify
import pymongo


#g = group.init(ZR, 5564993445756101503206304700110936918638328897597942591925129910965597995003)
#h = group.init(ZR, 12653160894039224234691306368807880269056474991426613178779481321437840969124)

import io
import contextlib

def update_keys_with_n(ck, ck_fo, _pi, _re_pi, _svecperm, permcomm,beaver_a_shares,beaver_b_shares,beaver_c_shares,election_id):
    db=init()
    collection=db['keys']
    document=collection.find_one({"election_id":election_id})
    if not document:
        raise ValueError(f"No existing setup found for election_id {election_id}. Please run setup first.")
    collection.update_one(
        {"_id": document["_id"]},
        {"$set": {
            "ck": serialize_wrapper(ck),
            "ck_fo": serialize_wrapper(ck_fo),
            "_pi": serialize_wrapper(_pi),
            "_re_pi": serialize_wrapper(_re_pi),
            "_svecperm": serialize_wrapper(_svecperm),
            "permcomm": serialize_wrapper(permcomm),
            "beaver_a_shares": serialize_wrapper(beaver_a_shares),
            "beaver_b_shares": serialize_wrapper(beaver_b_shares),
            "beaver_c_shares": serialize_wrapper(beaver_c_shares)
        }})

def setup(alpha,election_id):
    """ Setup keys and other performance-enhancing artefacts. Accessible only to an administrator. 
    
    Stores a public key, a set of secret keys, and other globals in the database.

    Parameters:
    - alpha: number of mix-servers
    """
    
    # Generate Paillier and ElGamal public/private keys
    f = io.StringIO()
    #if(True):
    with contextlib.redirect_stdout(f):
        store("generators",[g1,f2,eg1f2,ef1f2,f1,h1,eh1f2,idenT,inveh1f2,inveg1f2,fT,election_id])
        _pai_sklist, pai_pk = pai_th_keygen(alpha)
        _pai_sklist_single, pai_pklist_single = [], []
        for a in range(alpha):
            _pai_sk_a, pai_pk_a = pai_keygen_single()
            _pai_sklist_single.append(_pai_sk_a)
            pai_pklist_single.append(pai_pk_a)

        _elg_sklist, elg_pk = elgamal_th_keygen(alpha)
        
        store("setup",[alpha, pai_pk, _pai_sklist, pai_pklist_single, _pai_sklist_single, elg_pk, _elg_sklist,election_id])
    print("Setup was done successful")

def generate_ballots(num,election_id):
    ballot_draft(num,election_id)



def mixer():
    """Begin the process of mixing the encrypted votes and decrypting them for all elections"""
    db=init()
    # Get all distinct election IDs from keys collection
    election_ids = db.keys.distinct("election_id")
    
    for election_id in election_ids:
        dec_collection = db.decs
        if dec_collection.find_one({"election_id": election_id}):
            print(f"Decryption already done for election {election_id}")
            continue

        print(f"Processing election {election_id}")
        f = io.StringIO()
        with contextlib.redirect_stdout(f):
            try:
                # Process bulletins for this election
                process_bulletins()  # Ensure process_bulletins handles election_id

                # Load election-specific parameters
                keys_data = load("keys", ["alpha", "pai_pk", "pai_pklist_single", 
                                        "_pai_sklist", "_pai_sklist_single"], election_id)
                alpha = keys_data["alpha"]
                pai_pk = keys_data["pai_pk"]
                pai_pklist_single = keys_data["pai_pklist_single"]
                _pai_sklist = keys_data["_pai_sklist"]
                _pai_sklist_single = keys_data["_pai_sklist_single"]

                # Load encrypted data for this election
                votes_data = load("votes", ["enc_msg", "enc_msg_share", "enc_rand_share"], election_id)
                enc_msgs = votes_data["enc_msg"]
                enc_msg_shares = votes_data["enc_msg_share"]
                enc_rand_shares = votes_data["enc_rand_share"]
                
                n = len(enc_msgs)
                if n == 0:
                    print(f"No votes found for election {election_id}")
                    continue

                # Generate Beaver triples
                beaver_a_shares, beaver_b_shares, beaver_c_shares = gen_beaver_triples(n, alpha)

                # Generate permutation commitment
                ck = commkey(n)
                ck_fo = commkey_fo(n, N=pai_pk[0])
                _pi, _re_pi = genperms(n, alpha)
                _svecperm = [[group.random(ZR) for _ in range(n)] for _ in range(alpha)]
                permcomm = [commit_perm(ck, _re_pi[a], _svecperm[a]) for a in range(alpha)]

                # Generate permutation proofs
                evec = [[group.init(ZR, random.getrandbits(kappa_e)) for _ in range(n)] for _ in range(alpha)]
                pf_permcomm = [perm_nizkproof(ck, permcomm, evec[a], _pi[a], _svecperm[a]) for a in range(alpha)]
                
                # Verify permutation proofs
                status_permcomm = all(
                    perm_nizkverif(ck, permcomm[a], evec[a], pf_permcomm[a])
                    for a in range(alpha)
                )
                assert status_permcomm, f"Permutation proof verification failed for election {election_id}"

                # Update keys with new parameters
                update_keys_with_n(
                    ck, ck_fo, _pi, _re_pi, _svecperm, permcomm,
                    beaver_a_shares, beaver_b_shares, beaver_c_shares, election_id
                )

                msgs_out, _msg_shares, _rand_shares = mix(
                    ck, ck_fo, permcomm, enc_msgs, enc_msg_shares, enc_rand_shares,
                    alpha, pai_pk, pai_pklist_single, _pai_sklist, _pai_sklist_single,
                    _pi, _svecperm
                )

                # Decrypt messages
                res = load("load", [], election_id)  # Ensure proper election ID handling
                msgs_out_dec = []
                for j in range(len(msgs_out)):
                    i = int(str(msgs_out[j])) % len(res)
                    msgs_out_dec.append(i)

                # Store results with election ID
                store("decs", [election_id, msgs_out_dec, msgs_out, _msg_shares, _rand_shares])
                
            except Exception as e:
                print(f"Error processing election {election_id}: {str(e)}")
                continue
    print("Mixing and decryption was successful")


def pf_zksm(verfpk, sigs, enc_sigs, enc_sigs_rands,election_id):
    """ZK proofs for encrypted votes across all elections"""
    f = io.StringIO()
    with contextlib.redirect_stdout(f):
        mix_data = load("mix", ["msgs_out", "_msg_shares", "_rand_shares"], election_id)
        setup_data = load("setup", ["alpha", "ck", "permcomm", "elg_pk", "_svecperm", "_pi", "_re_pi", "_elg_sklist"], election_id)
        verfpk = deserialize_wrapper(ast.literal_eval(verfpk))
        sigs = deserialize_wrapper(ast.literal_eval(sigs))
        enc_sigs = deserialize_wrapper(ast.literal_eval(enc_sigs))
        enc_sigs_rands = deserialize_wrapper(ast.literal_eval(enc_sigs_rands))   
        # Get encryption commitments
        enc_data = load("enc", ["comm"], election_id)
        comms = enc_data.get("comm", [])
        status_verfsigs = check_verfsigs(mix_data['msgs_out'],sigs,verfpk,enc_sigs,enc_sigs_rands,setup_data["elg_pk"],setup_data["alpha"])
        assert status_verfsigs, f"Signature verification failed for election {election_id}"
        blsigs, _blshares = get_blsigs(enc_sigs,setup_data["ck"],setup_data["permcomm"],setup_data["alpha"],setup_data["elg_pk"],setup_data["_svecperm"],setup_data["_pi"], 
        setup_data["_re_pi"],setup_data["_elg_sklist"])
        dpk_bbsig_pfs = dpk_bbsig_nizkproofs(comms,blsigs,verfpk,setup_data["alpha"],mix_data["_msg_shares"],mix_data["_rand_shares"],_blshares)
    result= [str(serialize_wrapper(dpk_bbsig_pfs)),str(serialize_wrapper(blsigs))]
    print(json.dumps(result))



def pf_zkrsm(verfpk, sigs_rev, enc_sigs_rev, enc_sigs_rev_rands,election_id):
    """ZK proofs for plaintext votes across all elections"""
    mix_data = load("mix", ["msgs_out", "_rand_shares"], election_id)
    setup_data = load("setup", ['alpha', 'pai_pk', '_pai_sklist', 'elg_pk','_elg_sklist', 'ck', 'ck_fo', '_pi','_svecperm', 'permcomm'], election_id)
    enc_data = load("enc", ["comm", "enc_rand"], election_id)
    comms = enc_data.get("comm", [])
    enc_rands = enc_data.get("enc_rand", [])
    verfpk = deserialize_wrapper(ast.literal_eval(verfpk))
    sigs_rev = deserialize_wrapper(ast.literal_eval(sigs_rev))
    enc_sigs_rev = deserialize_wrapper(ast.literal_eval(enc_sigs_rev))
    enc_sigs_rev_rands = deserialize_wrapper(ast.literal_eval(enc_sigs_rev_rands))
    f = io.StringIO()
    with contextlib.redirect_stdout(f):
        status_verfsigs_rev = check_verfsigs_rev(sigs_rev,comms,verfpk,enc_sigs_rev,enc_sigs_rev_rands,setup_data["elg_pk"],setup_data["pai_pk"],setup_data["alpha"])
        assert status_verfsigs_rev, f"Signature verification failed for election {election_id}"
        blsigs_rev, _blshares_rev = get_blsigs_rev(enc_sigs_rev,enc_rands,setup_data["ck"],setup_data["ck_fo"],setup_data["permcomm"],setup_data["alpha"],setup_data["elg_pk"],setup_data["pai_pk"],setup_data["_svecperm"],mix_data["_rand_shares"],setup_data["_pi"],setup_data["_elg_sklist"],setup_data["_pai_sklist"])
        blsigs_S, blsigs_c, blsigs_r = blsigs_rev
        _blshares_S, _blshares_c, _blshares_r = _blshares_rev        
        dpk_bbsplussig_pfs = dpk_bbsplussig_nizkproofs(mix_data["msgs_out"],blsigs_S,blsigs_c,blsigs_r,verfpk,setup_data["alpha"],_blshares_S,_blshares_c,_blshares_r)
    result= [str(serialize_wrapper(dpk_bbsplussig_pfs)),str(serialize_wrapper(blsigs_rev))]  
    print(json.dumps(result))




if __name__ == "__main__":
    function_map = {
        "setup": setup,
        "mix": mixer,
        "pf_zksm": pf_zksm,
        "pf_zkrsm": pf_zkrsm,
        "generate":generate_ballots
    }

    func_name = sys.argv[1]
    if func_name not in function_map:
        print(f"Error: Function '{func_name}' not found.")
        sys.exit(1)
    if func_name == "mix" or func_name=="upload":
        function_map[func_name]()
    else:
        params = sys.argv[2]
        params=json.loads(params)
        function_map[func_name](*params)