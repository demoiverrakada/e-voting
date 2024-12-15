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
    f = io.StringIO()
    with contextlib.redirect_stdout(f):
        elg_pk = load("setup",["elg_pk","alpha"])
        msgs_out= load("mix",["msgs_out"])
        verfpk,sigs,enc_sigs,enc_sigs_rands = get_verfsigs(msgs_out['msgs_out'], elg_pk['elg_pk'])
    #print(type(sigs[0]),"type of sigs[0]")
    #print(type(verfpk),"type of verfpk")
    #print(msgs_out,"msgs_out")
    #print(sigs,"sigs")
    #print(verfpk,"verfpk")
    #status_verfsigs = check_verfsigs(msgs_out['msgs_out'], sigs, verfpk, enc_sigs, enc_sigs_rands, elg_pk['elg_pk'],elg_pk['alpha'])
    #assert status_verfsigs
    #print(bbbatchverify(sigs,msgs_out['msgs_out'],verfpk),"checking bbbatch")
    result = [str(serialize_wrapper(verfpk)),str(serialize_wrapper(sigs)),str(serialize_wrapper(enc_sigs)),str(serialize_wrapper(enc_sigs_rands))]
    print(json.dumps(result))
    #print(type(verfpk),type(sigs),type(enc_sigs),type(enc_sigs_rands))

def verifier_signature_zkrsm():
    f = io.StringIO()
    with contextlib.redirect_stdout(f):
        elg_pk,pai_pk = load("setup",["elg_pk","pai_pk"]).values()
        comms=list(load("enc",["comm"]).values())[0]
        """Important: pfcomms is a part of the function parameter of get_verfsigs_rev to be completed"""
        #pfcomms = deserialize_wrapper(ast.literal_eval(pfcomms))
        print(comms,"comms")
        verfpk, sigs_rev, enc_sigs_rev, enc_sigs_rev_rands = get_verfsigs_rev(comms,elg_pk,pai_pk)
    result = [str(serialize_wrapper(verfpk)),str(serialize_wrapper(sigs_rev)),str(serialize_wrapper(enc_sigs_rev)),str(serialize_wrapper(enc_sigs_rev_rands))]
    print(json.dumps(result))


def pf_zksm_verif(verfpk, sigs, enc_sigs, enc_sigs_rands,dpk_bbsig_pfs,blsigs):
    """ Get the list of proofs (dummy or real) for encrypted votes identified by index set I, proving or 
    disproving (in zero-knowledge) whether they encrypt a plaintext identified by index set J. The additional 
    parameters verfpk and verfsigs are because of the way our scheme works - it requires the verifier to 
    compute BB signatures on plaintexts in set J. 
    
    The verifier code should take the output of this function --- the proofs --- and verify them.
    """
    f = io.StringIO()
    #if(True):
    with contextlib.redirect_stdout(f):
        verfpk = deserialize_wrapper(ast.literal_eval(verfpk))
        sigs= deserialize_wrapper(ast.literal_eval(sigs))
        enc_sigs= deserialize_wrapper(ast.literal_eval(enc_sigs))
        enc_sigs_rands= deserialize_wrapper(ast.literal_eval(enc_sigs_rands))
        dpk_bbsig_pfs = deserialize_wrapper(ast.literal_eval(dpk_bbsig_pfs))
        blsigs=deserialize_wrapper(ast.literal_eval(blsigs))
        dict=load("mix",["msgs_out"])
        alpha,elg_pk,=load("setup",["alpha","elg_pk"]).values()
        comms=list(load("enc",["comm"]).values())[0]
        enc_hashes=list(load("enc",["enc_hash"]).values())[0]

        status_verfsigs = check_verfsigs(dict['msgs_out'], sigs, verfpk, enc_sigs, enc_sigs_rands, elg_pk,alpha)
        assert status_verfsigs
        status_dpk_bbsig,result_comms = dpk_bbsig_nizkverifs(comms, blsigs, verfpk, dpk_bbsig_pfs)
        #assert status_dpk_bbsig

    status_fwd = status_verfsigs and status_dpk_bbsig
    result=[enc_hashes,result_comms,status_fwd]
    print(json.dumps(result))

def pf_zkrsm_verif(verfpk, sigs_rev, enc_sigs_rev, enc_sigs_rev_rands,dpk_bbsplussig_pfs,blsigs_rev):
    """ Get the list of proofs (dummy or real) for plaintext votes identified by index set J, proving or 
    disproving (in zero-knowledge) whether they are encrypted by some ciphertext identified by index set I.
    The additional parameters verfpk and verfsigs are because of the way our scheme works - it requires the 
    verifier to compute quasi-BBS+ signatures on ciphertexts (commitments) in set I (note that this requires 
    the provers to demonstrate proof of knowledge of all the commitment openings, which they do using the 
    pkcomms endpoint).
    
    The verifier code should take the output of this function --- the proofs --- and verify them.
    """
    f = io.StringIO()
    #if(True):
    with contextlib.redirect_stdout(f):
        verfpk = deserialize_wrapper(ast.literal_eval(verfpk))
        sigs_rev= deserialize_wrapper(ast.literal_eval(sigs_rev))
        enc_sigs_rev= deserialize_wrapper(ast.literal_eval(enc_sigs_rev))
        enc_sigs_rev_rands= deserialize_wrapper(ast.literal_eval(enc_sigs_rev_rands))
        dpk_bbsplussig_pfs=deserialize_wrapper(ast.literal_eval(dpk_bbsplussig_pfs))
        blsigs_rev= deserialize_wrapper(ast.literal_eval(blsigs_rev))
        msgs_out_dec,msgs_out,=load("mix",["msgs_out_dec","msgs_out"]).values()
        alpha, pai_pk,elg_pk,ck, ck_fo, permcomm=load("setup",['alpha','pai_pk','elg_pk','ck','ck_fo','permcomm']).values()
        comms=comms=list(load("enc",["comm"]).values())[0]
        enc_rands=list(load("enc",["enc_rand"]).values())[0]

        #status_pkcomms = pkcommverifs(comms, pfcomms)
        #print("status_pkcomms", status_pkcomms)
        # Check verifier signatures
        status_verfsigs_rev = check_verfsigs_rev(sigs_rev, comms, verfpk, enc_sigs_rev, enc_sigs_rev_rands, elg_pk, pai_pk,alpha)
        assert status_verfsigs_rev
        # Proofs
        blsigs_S, blsigs_c, blsigs_r = blsigs_rev
        #_blshares_S, _blshares_c, _blshares_r = _blshares_rev
        status_dpk_bbsplussig,result_msgs = dpk_bbsplussig_nizkverifs(msgs_out, blsigs_S, blsigs_c, blsigs_r, verfpk, dpk_bbsplussig_pfs)
        #assert status_dpk_bbsplussig
        #print("status_dpk_bbsplussig:", status_dpk_bbsplussig)
        status_rev = status_verfsigs_rev and status_dpk_bbsplussig
        candidates=load("load",[])
        updated_msgs_out_dec = [candidates[msg] for msg in msgs_out_dec]
    result=[updated_msgs_out_dec,result_msgs,status_rev]
    print(json.dumps(result))


def audit(commitment,booth_num,bid):
    f = io.StringIO()
    g12,h12=load("generators",["g1","h1"]).values()
    for i in range(len(commitment)):
        accessed,enc_hashes=load("receipt",[commitment[i],"accessed"]).values()
        if(accessed==True):
            print("The ballot has already been audited or the ballot has been used to cast a vote.")
            return 
    with contextlib.redirect_stdout(f):
        alpha,_pai_sklist_single,pai_pklist_single=load("setup",['alpha','_pai_sklist_single','pai_pklist_single']).values()
        mixers = lambda alpha: ["mixer %d" % a for a in range(alpha)]
        enc_msg=[]
        comm = []
        enc_msg_share= []
        enc_rand_share=[]
        candidates=load("load",[])
        for i in range(len(commitment)):
            enc_msgs,comms,enc_msg_shares,enc_rand_shares,enc_hashs=load("receipt",[commitment[i],"enc_msg","comm","enc_msg_share","enc_rand_share"]).values()
            enc_msg.append(enc_msgs)
            comm.append(comms)
            enc_msg_share.append(enc_msg_shares)
            enc_rand_share.append(enc_rand_shares)
        with timer("decryption of individual message/randomness shares", report_subtimers=mixers(alpha)):
            _msg_shares, _rand_shares = [], []
            for a in range(alpha):
                with timer("mixer %d: decryption of individual message/randomness shares" % a):
                    enc_msg_shares_a = list(zip(*enc_msg_share))[a]
                    enc_rand_shares_a = list(zip(*enc_rand_share))[a]
                    #print(enc_msg_shares_a,"enc_msg_shares_a",type(enc_msg_shares_a),"type of enc_msg_shares_a")
                    _msg_shares_a = [pai_decrypt_single(pai_pklist_single[a], _pai_sklist_single[a], enc_msg_share_a, embedded_q=q) for enc_msg_share_a in enc_msg_shares_a]
                    _rand_shares_a = [pai_decrypt_single(pai_pklist_single[a], _pai_sklist_single[a], enc_rand_share_a, embedded_q=q) for enc_rand_share_a in enc_rand_shares_a]
                    _msg_shares.append(_msg_shares_a)
                    _rand_shares.append(_rand_shares_a)
    result=[]
    for i in range(len(commitment)):
        msg_shares=[]
        rand_shares=[]
        for j in range(alpha):
            msg_shares.append(_msg_shares[j][i])
            rand_shares.append(_rand_shares[j][i])
        v_w=reconstruct(msg_shares)
        r_w=reconstruct(rand_shares)
        #print(v_w)
        #print(type(v_w))
        v_w_nbar =int(str(v_w))%len(candidates)
        name=candidates[v_w_nbar]
        gamma_w = (g12**v_w)*(h12**r_w)
        #print(name,"name")
        #print(commitment[i])
        #print(commitment)
        if(gamma_w==comm[i]):
            db=init()
            receipts_collection=db['receipts']
            votes_collection=db['votes']
            receipt = receipts_collection.find_one({'comm': serialize_wrapper(comm[i])})
            receipt['accessed']=True
            result.append([True, v_w_nbar, name, str(gamma_w), str(comm[i])])
            if(name=="NOTA"):
                random_voter_id = random.randint(1000000000, 9999999999)
                receipt['voter_id'] = random_voter_id
                votes_collection.insert_one(receipt)
        else:
            result.append([False,None,None,None,None])
    print(json.dumps(result))


if __name__ == "__main__":
    function_map = {
        "verfsmproof":pf_zksm_verif,
        "verfrsmproof":pf_zkrsm_verif,
        "verfsigsm":verifier_signature_zksm,
        "verfsigrsm":verifier_signature_zkrsm,
        "audit":audit
    }

    func_name = sys.argv[1]
    if func_name not in function_map:
        print(f"Error: Function '{func_name}' not found.")
        sys.exit(1)
    else:
        params = sys.argv[2]
        params=json.loads(params)
        function_map[func_name](*params)
    #print("result: done")
