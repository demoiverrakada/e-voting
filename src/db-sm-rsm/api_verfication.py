from globals import  group, pai_group, beta, q, kappa_e
from optthpaillier import pai_th_keygen
from optpaillier import pai_keygen as pai_keygen_single
from elgamal import elgamal_th_keygen
from secretsharing import gen_beaver_triples,reconstruct
from shuffle import commkey, commkey_fo, commit_perm, perm_nizkproof, perm_nizkverif
import random
from globals import group,kappa_e
from charm.toolbox.pairinggroup import ZR
from db_sm_rsm import check_encs, mix, check_verfsigs, get_blsigs, dpk_bbsig_nizkproofs,check_verfsigs_rev,get_blsigs_rev,genperms,get_verfsigs,get_verfsigs_rev
from pok import dpk_bbsig_nizkverifs,dpk_bbsplussig_nizkverifs,pkcommverifs
import sys
import json
from db import store,load,init
from bulletin_to_votes import process_bulletins
from ballot_draft import ballot_draft
from misc import timer,serialize_wrapper,deserialize_wrapper
from elgamal import elgamal_th_keygen,elgamal_encrypt
from optpaillier import pai_decrypt as pai_decrypt_single
import ast
import io
import contextlib

def verifier_signature_zksm():
    """Generate verifier signatures for all elections"""
    db=init()
    election_ids = db.keys.distinct("election_id")
    
    all_results = {}

    for election_id in election_ids:
        try:
            f = io.StringIO()
            with contextlib.redirect_stdout(f):
            # Load election-specific parameters
                setup_data = load("setup", ["elg_pk", "alpha"], election_id)
                mix_data = load("mix", ["msgs_out"], election_id)
                
                # Get verification signatures
                verfpk, sigs, enc_sigs, enc_sigs_rands = get_verfsigs(
                    mix_data["msgs_out"], 
                    setup_data["elg_pk"],
                    election_id
                )

                # Convert all serialized objects to strings to ensure JSON compatibility
                all_results[election_id] = {
                    "verfpk": str(serialize_wrapper(verfpk)),
                    "sigs": str(serialize_wrapper(sigs)),
                    "enc_sigs": str(serialize_wrapper(enc_sigs)),
                    "enc_sigs_rands": str(serialize_wrapper(enc_sigs_rands))
                }

        except Exception as e:
            print(f"Error processing election {election_id}: {str(e)}")
            continue

    # Maintain original output structure with election context
    print(json.dumps(all_results, indent=2))



def verifier_signature_zkrsm():
    """Generate verifier signatures for all elections (reverse version)"""
    db=init()
    election_ids = db.keys.distinct("election_id")
    
    all_results = {}

    for election_id in election_ids:
        try:
            f = io.StringIO()
            with contextlib.redirect_stdout(f):
                setup_data = load("setup", ["elg_pk", "pai_pk"], election_id)
                enc_data = load("enc", ["comm"], election_id)
                
                # Get commitments for this election
                comms = enc_data["comm"]
                print(comms, "comms")

                # Generate reverse signatures for this election
                verfpk, sigs_rev, enc_sigs_rev, enc_sigs_rev_rands = get_verfsigs_rev(
                    comms,
                    setup_data["elg_pk"],
                    setup_data["pai_pk"],election_id
                )

                # Store results per election
                all_results[election_id] = {
                    "verfpk": str(serialize_wrapper(verfpk)),
                    "sigs_rev": str(serialize_wrapper(sigs_rev)),
                    "enc_sigs_rev": str(serialize_wrapper(enc_sigs_rev)),
                    "enc_sigs_rev_rands": str(serialize_wrapper(enc_sigs_rev_rands))
                }

        except Exception as e:
            print(f"Error processing election {election_id}: {str(e)}")
            continue

    # Maintain original output structure with election context
    print(json.dumps(all_results, indent=2))



def pf_zksm_verif(verfpk, sigs, enc_sigs, enc_sigs_rands, dpk_bbsig_pfs, blsigs,election_id):
    """Verify ZK proofs for encrypted votes across all elections"""
    # Deserialize global parameters into election-specific dicts
    election_id=int(election_id)
    verfpk_dict = deserialize_wrapper(ast.literal_eval(verfpk))
    sigs_dict = deserialize_wrapper(ast.literal_eval(sigs))
    enc_sigs_dict = deserialize_wrapper(ast.literal_eval(enc_sigs))
    enc_sigs_rands_dict = deserialize_wrapper(ast.literal_eval(enc_sigs_rands))
    dpk_bbsig_pfs_dict = deserialize_wrapper(ast.literal_eval(dpk_bbsig_pfs))
    blsigs_dict = deserialize_wrapper(ast.literal_eval(blsigs))
    mix_data = load("mix", ["msgs_out"], election_id)
    setup_data = load("setup", ["alpha", "elg_pk"], election_id)
    enc_data = load("enc", ["comm", "enc_hash"], election_id)
    f = io.StringIO()
    with contextlib.redirect_stdout(f):
            status_verfsigs = check_verfsigs(mix_data['msgs_out'],sigs_dict,verfpk_dict,enc_sigs_dict,enc_sigs_rands_dict,setup_data["elg_pk"],setup_data["alpha"],election_id)
            status_dpk_bbsig, result_comms = dpk_bbsig_nizkverifs(enc_data["comm"],blsigs_dict,verfpk_dict,dpk_bbsig_pfs_dict,election_id)
            status_fwd= status_verfsigs and status_dpk_bbsig
            result=[enc_data["enc_hash"],result_comms,status_fwd]

    print(json.dumps(result))


def pf_zkrsm_verif(verfpk, sigs_rev, enc_sigs_rev, enc_sigs_rev_rands, dpk_bbsplussig_pfs, blsigs_rev,election_id):
    """Verify ZK proofs for plaintext votes across all elections"""
    election_id=int(election_id)
    verfpk_dict = deserialize_wrapper(ast.literal_eval(verfpk))
    sigs_rev_dict = deserialize_wrapper(ast.literal_eval(sigs_rev))
    enc_sigs_rev_dict = deserialize_wrapper(ast.literal_eval(enc_sigs_rev))
    enc_sigs_rands_dict = deserialize_wrapper(ast.literal_eval(enc_sigs_rev_rands))
    dpk_pfs_dict = deserialize_wrapper(ast.literal_eval(dpk_bbsplussig_pfs))
    blsigs_rev_dict = deserialize_wrapper(ast.literal_eval(blsigs_rev))
    mix_data = load("mix", ["msgs_out_dec", "msgs_out"], election_id)
    setup_data = load("setup", ['alpha', 'pai_pk', 'elg_pk', 'ck', 'ck_fo', 'permcomm'], election_id)
    enc_data = load("enc", ["comm", "enc_rand"], election_id)
    candidates = load("load", [], election_id)
    f = io.StringIO()
    with contextlib.redirect_stdout(f):
        status_verfsigs_rev = check_verfsigs_rev(sigs_rev_dict,enc_data["comm"],verfpk_dict,enc_sigs_rev_dict,enc_sigs_rands_dict,setup_data["elg_pk"],setup_data["pai_pk"],setup_data["alpha"],election_id)
        assert status_verfsigs_rev
        blsigs_S, blsigs_c, blsigs_r = blsigs_rev_dict
        status_dpk_bbsplussig, result_msgs = dpk_bbsplussig_nizkverifs(mix_data["msgs_out"],blsigs_S,blsigs_c,blsigs_r,verfpk_dict,dpk_pfs_dict,election_id)

        status_rev = status_verfsigs_rev and status_dpk_bbsplussig
        updated_msgs_out_dec = [candidates[msg] for msg in mix_data["msgs_out_dec"]]
        result=[updated_msgs_out_dec,result_msgs,status_rev]
    print(json.dumps(result))




def audit(commitment, booth_num, bid, election_id):
    f = io.StringIO()
    election_id=int(election_id)
    g12, h12 = load("generators", ["g1", "h1"], election_id).values()

    for i in range(len(commitment)):
        result = load("receipt", [commitment[i], "accessed"],election_id)
        accessed = result.get("accessed")
        if accessed is True:
            print(f"The ballot for election {election_id} has already been audited or used to cast a vote.")
            return

    with contextlib.redirect_stdout(f):
    #if True:
        setup_data = load("setup", ['alpha', '_pai_sklist_single', 'pai_pklist_single'], election_id)
        alpha = setup_data['alpha']
        _pai_sklist_single = setup_data['_pai_sklist_single']
        pai_pklist_single = setup_data['pai_pklist_single']
        
        mixers = lambda alpha: [f"mixer {a}" for a in range(alpha)]
        enc_msg, comm, enc_msg_share, enc_rand_share = [], [], [], []
        candidates = load("load", [], election_id)

        for i in range(len(commitment)):
            receipt_data = load("receipt", [commitment[i], "enc_msg", "comm", "enc_msg_share", "enc_rand_share"], election_id)
            enc_msg.append(receipt_data["enc_msg"])
            comm.append(receipt_data["comm"])
            enc_msg_share.append(receipt_data["enc_msg_share"])
            enc_rand_share.append(receipt_data["enc_rand_share"])

        with timer("decryption of individual message/randomness shares", report_subtimers=mixers(alpha)):
            _msg_shares, _rand_shares = [], []
            for a in range(alpha):
                with timer(f"mixer {a}: decryption of individual message/randomness shares"):
                    enc_msg_shares_a = list(zip(*enc_msg_share))[a]
                    enc_rand_shares_a = list(zip(*enc_rand_share))[a]
                    _msg_shares_a = [pai_decrypt_single(pai_pklist_single[a], _pai_sklist_single[a], enc_msg_share_a, embedded_q=q) for enc_msg_share_a in enc_msg_shares_a]
                    _rand_shares_a = [pai_decrypt_single(pai_pklist_single[a], _pai_sklist_single[a], enc_rand_share_a, embedded_q=q) for enc_rand_share_a in enc_rand_shares_a]
                    _msg_shares.append(_msg_shares_a)
                    _rand_shares.append(_rand_shares_a)

    result = []
    db = init()
    receipts_collection = db['receipts']
    for i in range(len(commitment)):
        msg_shares = [_msg_shares[j][i] for j in range(alpha)]
        rand_shares = [_rand_shares[j][i] for j in range(alpha)]
        v_w = reconstruct(msg_shares)
        r_w = reconstruct(rand_shares)
        v_w_nbar = int(str(v_w)) % len(candidates)
        name = candidates[v_w_nbar]
        gamma_w = (g12**v_w) * (h12**r_w)

        if gamma_w == comm[i] and int(v_w) == int(int(bid) + i):
            receipt = receipts_collection.find_one({'comm': serialize_wrapper(comm[i])})
            if receipt:
                receipts_collection.update_one(
                    {'_id': receipt['_id']},
                    {'$set': {'accessed': True}}
                )
            result.append([True, v_w_nbar, name, str(gamma_w), str(comm[i])])
        else:
            result.append([False, None, None, None, None])

    print(json.dumps(result))

def VVPATverif(bid,election_id):
    election_id=int(election_id)
    data=load("mix",["msgs_out"],election_id)
    candidates=load("load",[],election_id)
    length=len(data['msgs_out'])
    for ext_vote in range(length):
        if(abs(int(data['msgs_out'][ext_vote])-int(bid))<=len(candidates)):
            print(json.dumps({'cand_name':candidates[abs(int(data['msgs_out'][ext_vote])-int(bid))],'extended_vote':int(data['msgs_out'][ext_vote])}))
            return
    print("This VVPAT doesn't correspond to a decrypted vote.")


if __name__ == "__main__":
    function_map = {
        "verfsmproof":pf_zksm_verif,
        "verfrsmproof":pf_zkrsm_verif,
        "verfsigsm":verifier_signature_zksm,
        "verfsigrsm":verifier_signature_zkrsm,
        "audit":audit,
        "vvpat":VVPATverif
    }

    func_name = sys.argv[1]
    if func_name not in function_map:
        print(f"Error: Function '{func_name}' not found.")
        sys.exit(1)
    else:
        params = sys.argv[2]
        params=json.loads(params)
        function_map[func_name](*params)
