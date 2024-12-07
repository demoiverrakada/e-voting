from globals import g1, group, pai_group, beta, q, kappa_e
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
from db import store,load
from bulletin_to_votes import process_bulletins
from ballot_draft import ballot_draft
from misc import timer,serialize_wrapper,deserialize_wrapper
from elgamal import elgamal_th_keygen,elgamal_encrypt
from optpaillier import pai_decrypt as pai_decrypt_single
import ast
import io
import contextlib

def pf_zksm_proof(verfpk, sigs, enc_sigs, enc_sigs_rands,dpk_bbsig_pfs,blsigs):
    """ Get the list of proofs (dummy or real) for encrypted votes identified by index set I, proving or 
    disproving (in zero-knowledge) whether they encrypt a plaintext identified by index set J. The additional 
    parameters verfpk and verfsigs are because of the way our scheme works - it requires the verifier to 
    compute BB signatures on plaintexts in set J. 
    
    The verifier code should take the output of this function --- the proofs --- and verify them.
    """
    f = io.StringIO()
    if(True):
    #with contextlib.redirect_stdout(f):
        verfpk = deserialize_wrapper(ast.literal_eval(verfpk))
        sigs= deserialize_wrapper(ast.literal_eval(sigs))
        enc_sigs= deserialize_wrapper(ast.literal_eval(enc_sigs))
        enc_sigs_rands= deserialize_wrapper(ast.literal_eval(enc_sigs_rands))
        dpk_bbsig_pfs = deserialize_wrapper(ast.literal_eval(dpk_bbsig_pfs))
        blsigs=deserialize_wrapper(ast.literal_eval(blsigs))
        dict=load("mix",["msgs_out"])
        alpha,ck,permcomm,elg_pk,=load("setup",["alpha","ck","permcomm","elg_pk"]).values()
        comms=list(load("enc",["comm"]).values())[0]
     
        status_verfsigs = check_verfsigs(dict['msgs_out'], sigs, verfpk, enc_sigs, enc_sigs_rands, elg_pk,alpha)

        status_dpk_bbsig = dpk_bbsig_nizkverifs(comms, blsigs, verfpk, dpk_bbsig_pfs)
    print("status_dpk_bbsig:", status_dpk_bbsig)
    print("status_verfsigs",status_verfsigs)
    status_fwd = status_verfsigs and status_dpk_bbsig
    print("status_forward_set_membership:", status_fwd)

def pf_zkrsm_proof(verfpk, sigs_rev, enc_sigs_rev, enc_sigs_rev_rands,dpk_bbsplussig_pfs,blsigs_rev,pfcomms):
    """ Get the list of proofs (dummy or real) for plaintext votes identified by index set J, proving or 
    disproving (in zero-knowledge) whether they are encrypted by some ciphertext identified by index set I.
    The additional parameters verfpk and verfsigs are because of the way our scheme works - it requires the 
    verifier to compute quasi-BBS+ signatures on ciphertexts (commitments) in set I (note that this requires 
    the provers to demonstrate proof of knowledge of all the commitment openings, which they do using the 
    pkcomms endpoint).
    
    The verifier code should take the output of this function --- the proofs --- and verify them.
    """
    pfcomms = deserialize_wrapper(ast.literal_eval(pfcomms))
    verfpk = deserialize_wrapper(ast.literal_eval(verfpk))
    sigs_rev= deserialize_wrapper(ast.literal_eval(sigs_rev))
    enc_sigs_rev= deserialize_wrapper(ast.literal_eval(enc_sigs_rev))
    enc_sigs_rev_rands= deserialize_wrapper(ast.literal_eval(enc_sigs_rev_rands))
    dpk_bbsplussig_pfs=deserialize_wrapper(ast.literal_eval(dpk_bbsplussig_pfs))
    blsigs_rev= deserialize_wrapper(ast.literal_eval(blsigs_rev))
    msgs_out,_rand_shares=load("mix",["msgs_out","_rand_shares"]).values()
    alpha, pai_pk, _pai_sklist,elg_pk, _elg_sklist,ck, ck_fo, _pi, _svecperm, permcomm=load("setup",['alpha','pai_pk','_pai_sklist','elg_pk','_elg_sklist','ck','ck_fo','_pi','_svecperm','permcomm']).values()
    comms=comms=list(load("enc",["comm"]).values())[0]
    enc_rands=list(load("enc",["enc_rand"]).values())[0]

    status_pkcomms = pkcommverifs(comms, pfcomms)
    #print("status_pkcomms", status_pkcomms)
    # Check verifier signatures
    status_verfsigs_rev = check_verfsigs_rev(sigs_rev, comms, verfpk, enc_sigs_rev, enc_sigs_rev_rands, elg_pk, pai_pk,alpha)

    # Proofs
    blsigs_S, blsigs_c, blsigs_r = blsigs_rev
    #_blshares_S, _blshares_c, _blshares_r = _blshares_rev
    status_dpk_bbsplussig = dpk_bbsplussig_nizkverifs(msgs_out, blsigs_S, blsigs_c, blsigs_r, verfpk, dpk_bbsplussig_pfs)
    #print("status_dpk_bbsplussig:", status_dpk_bbsplussig)
    status_rev = status_verfsigs_rev and status_dpk_bbsplussig
    print("status_reverse_set_membership:", status_rev)




if __name__ == "__main__":
    function_map = {
        "verfsmproof":pf_zksm_proof,
        "verfrsmproof":pf_zkrsm_proof
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
