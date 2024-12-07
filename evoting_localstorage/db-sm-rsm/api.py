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
from pok import dpk_bbsplussig_nizkproofs
import sys
import json
from db import store,load
from bulletin_to_votes import process_bulletins
from ballot_draft import ballot_draft
from misc import timer
from elgamal import elgamal_th_keygen,elgamal_encrypt
from optpaillier import pai_decrypt as pai_decrypt_single
import ast
from misc import serialize_wrapper, deserialize_wrapper



g = group.init(ZR, 5564993445756101503206304700110936918638328897597942591925129910965597995003)
h = group.init(ZR, 12653160894039224234691306368807880269056474991426613178779481321437840969124)

import io
import contextlib

def setup(n,alpha):
    """ Setup keys and other performance-enhancing artefacts. Accessible only to an administrator. 
    
    Stores a public key, a set of secret keys, and other globals in the database.

    Parameters:
    - alpha: number of mix-servers
    """
    
    # Generate Paillier and ElGamal public/private keys
    _pai_sklist, pai_pk = pai_th_keygen(alpha)
    _pai_sklist_single, pai_pklist_single = [], []
    for a in range(alpha):
        _pai_sk_a, pai_pk_a = pai_keygen_single()
        _pai_sklist_single.append(_pai_sk_a)
        pai_pklist_single.append(pai_pk_a)

    _elg_sklist, elg_pk = elgamal_th_keygen(alpha)

    # Generate beaver triples (offline preprocessing step for multiplicative 
    # secret sharing used in DPK2)
    gen_beaver_triples(n, alpha)

    # Generate a commitment to the permutation and prove knowledge of its opening
    ck = commkey(n)
    ck_fo = commkey_fo(n, N=pai_pk[0])
    _pi, _re_pi = genperms(n, alpha)
    _svecperm = [[group.random(ZR) for i in range(n)] for a in range(alpha)]
    permcomm = [commit_perm(ck, _re_pi[a], _svecperm[a]) for a in range(alpha)]
    evec = [[group.init(ZR, random.getrandbits(kappa_e)) for i in range(n)] for a in range(alpha)]
    pf_permcomm = [perm_nizkproof(ck, permcomm, evec[a], _pi[a], _svecperm[a]) for a in range(alpha)]
    status_permcomm = True
    for a in range(alpha):
        status_permcomm = status_permcomm and perm_nizkverif(ck, permcomm[a], evec[a], pf_permcomm[a])
    assert status_permcomm
     
    store("setup",[alpha, pai_pk, _pai_sklist, pai_pklist_single, _pai_sklist_single, elg_pk, _elg_sklist,
         # ...beaver triples (to add) ...
         ck, ck_fo, _pi, _re_pi, _svecperm, permcomm])

def generate_ballots(num):
    ballot_draft(num)

def upload():
    process_bulletins()


def mixer():
    """ Begin the process of mixing the encrypted votes and decrypting them. Accessible only to an administrator.  
    
    Produces a permuted list of decrypted votes in the database.
    """
    alpha,pai_pk,pai_pklist_single,ck,ck_fo,permcomm,_pai_sklist,_pai_sklist_single,_pi,_svecperm=load("setup",["alpha","pai_pk","pai_pklist_single","ck","ck_fo","permcomm","_pai_sklist","_pai_sklist_single","_pi","_svecperm"]).values()

    enc_msgs, enc_msg_shares, enc_rand_shares=load("enc",["enc_msg", "enc_msg_share", "enc_rand_share"]).values()

    # Check validity of stored encryptions
    #status_encs = check_encs(pai_pk, pai_pklist_single, enc_msgs, enc_rands, enc_msg_shares, enc_rand_shares, pf_encmsgs, pf_encrands, pfs_enc_msg_shares, pfs_enc_rand_shares)
    #assert status_encs
    res=load("load",[])
    # Mix
    msgs_out, _msg_shares, _rand_shares = mix(ck, ck_fo, permcomm, enc_msgs, enc_msg_shares, enc_rand_shares, alpha, pai_pk, pai_pklist_single, _pai_sklist, _pai_sklist_single, _pi, _svecperm)
    msgs_out_dec=[]
    for j in range(len(msgs_out)):
        i=int(str(msgs_out[j]))
        i=i%(len(res))
        msgs_out_dec.append(i)
    # Store the results
    store("mix",[msgs_out_dec,msgs_out, _msg_shares, _rand_shares])

#done
def pfcomms():
    """ Get proof of knowledge of all commitments in the uploaded encrypted votes. """
    proofs=load("pf_zksm",[])
    print(proofs)

def generate_proofs():
    f = io.StringIO()
    with contextlib.redirect_stdout(f):
        elg_pk = load("setup",["elg_pk"])
        msgs_out= load("mix",["msgs_out"])
        verfpk,sigs,enc_sigs,enc_sigs_rands = get_verfsigs(msgs_out['msgs_out'], elg_pk['elg_pk'])
    #print(type(sigs[0]),"type of sigs[0]")
    #print(type(verfpk),"type of verfpk")
    print(msgs_out,"msgs_out")
    print(sigs,"sigs")
    print(verfpk,"verfpk")
    from bbsig import bbbatchverify
    print(bbbatchverify(sigs,msgs_out['msgs_out'],verfpk),"checking bbbatch")
    print({"verfpk":serialize_wrapper(verfpk),"sigs":serialize_wrapper(sigs),"enc_sigs":serialize_wrapper(enc_sigs),"enc_sigs_rands":serialize_wrapper(enc_sigs_rands)})

def generate_reverse_proofs():
    f = io.StringIO()
    with contextlib.redirect_stdout(f):
        elg_pk,pai_pk = load("setup",["elg_pk","pai_pk"]).values()
        comms=load("enc",["comm"]).values()
        pfcomms= pfcomms()
        verfpk, sigs_rev, enc_sigs_rev, enc_sigs_rev_rands = get_verfsigs_rev(comms,pfcomms,elg_pk,pai_pk)
    print({"verfpk": serialize_wrapper(verfpk), "sigs_rev":serialize_wrapper(sigs_rev), "enc_sigs_rev":serialize_wrapper(enc_sigs_rev), "enc_sigs_rev_rands":serialize_wrapper(enc_sigs_rev_rands)})

def pf_zksm(verfpk, sigs, enc_sigs, enc_sigs_rands):
    """ Get the list of proofs (dummy or real) for encrypted votes identified by index set I, proving or 
    disproving (in zero-knowledge) whether they encrypt a plaintext identified by index set J. The additional 
    parameters verfpk and verfsigs are because of the way our scheme works - it requires the verifier to 
    compute BB signatures on plaintexts in set J. 
    
    The verifier code should take the output of this function --- the proofs --- and verify them.
    """
    #print(type(verfpk),"type of verfpk")
    #print(type(sigs),"type of sigs")
    verfpk = deserialize_wrapper(ast.literal_eval(verfpk))
    sigs= deserialize_wrapper(ast.literal_eval(sigs))
    enc_sigs= deserialize_wrapper(ast.literal_eval(enc_sigs))
    enc_sigs_rands= deserialize_wrapper(ast.literal_eval(enc_sigs_rands))
    print(type(verfpk),type(sigs),type(enc_sigs),type(enc_sigs_rands))
    msgs_out,_msg_shares,_rand_shares=load("mix",["msgs_out","_msg_shares","_rand_shares"]).values()
    print(msgs_out , "checking if messages remain the same")
    print(verfpk,"verfpk")
    print(sigs,"sigs")
    alpha,ck,permcomm,elg_pk,_svecperm,_pi,_re_pi,_elg_sklist=load("setup",["alpha","ck","permcomm","elg_pk","_svecperm","_pi","_re_pi","_elg_sklist"]).values()
    comms=load("enc",["comm"]).values()
    # Check verifier signatures
    status_verfsigs = check_verfsigs(msgs_out, sigs, verfpk, enc_sigs, enc_sigs_rands, elg_pk,alpha)
    assert status_verfsigs

    # Get blinded signatures against comms
    blsigs, _blshares = get_blsigs(enc_sigs, ck, permcomm, alpha, elg_pk, _svecperm, _pi, _re_pi, _elg_sklist)

    # Proofs
    dpk_bbsig_pfs = dpk_bbsig_nizkproofs(comms, blsigs, verfpk, alpha, _msg_shares, _rand_shares, _blshares)

    store("pf_zksm",[dpk_bbsig_pfs])

def pf_zkrsm(verfpk, sigs_rev, enc_sigs_rev, enc_sigs_rev_rands):
    """ Get the list of proofs (dummy or real) for plaintext votes identified by index set J, proving or 
    disproving (in zero-knowledge) whether they are encrypted by some ciphertext identified by index set I.
    The additional parameters verfpk and verfsigs are because of the way our scheme works - it requires the 
    verifier to compute quasi-BBS+ signatures on ciphertexts (commitments) in set I (note that this requires 
    the provers to demonstrate proof of knowledge of all the commitment openings, which they do using the 
    pkcomms endpoint).
    
    The verifier code should take the output of this function --- the proofs --- and verify them.
    """
    msgs_out,_rand_shares=load("mix",["msgs_out","_rand_shares"]).values()
    alpha, pai_pk, _pai_sklist,elg_pk, _elg_sklist,ck, ck_fo, _pi, _svecperm, permcomm=load("setup",['alpha','pai_pk','_pai_sklist','elg_pk','_elg_sklist','ck','ck_fo','_pi','_svecperm','permcomm']).values()
    comms,enc_rands=load().values()

    # Check verifier signatures
    status_verfsigs_rev = check_verfsigs_rev(sigs_rev, comms, verfpk, enc_sigs_rev, enc_sigs_rev_rands, elg_pk, pai_pk,alpha)

    # Get blinded signatures against msg_outs
    blsigs_rev, _blshares_rev = get_blsigs_rev(enc_sigs_rev, enc_rands, ck, ck_fo, permcomm, alpha, elg_pk, pai_pk, _svecperm, _rand_shares, _pi, _elg_sklist, _pai_sklist)

    # Proofs
    blsigs_S, blsigs_c, blsigs_r = blsigs_rev
    _blshares_S, _blshares_c, _blshares_r = _blshares_rev
    dpk_bbsplussig_pfs = dpk_bbsplussig_nizkproofs(msgs_out, blsigs_S, blsigs_c, blsigs_r, verfpk, alpha, _blshares_S, _blshares_c, _blshares_r)
    
    store("pf_zkrsm",[dpk_bbsplussig_pfs])


def audit(commitment,booth_num,bid):
    f = io.StringIO()
    with contextlib.redirect_stdout(f):
        alpha,_pai_sklist_single,pai_pklist_single=load("setup",['alpha','_pai_sklist_single','pai_pklist_single']).values()
        mixers = lambda alpha: ["mixer %d" % a for a in range(alpha)]

        enc_msg,comm,enc_msg_share,enc_rand_share,enc_hash=load("receipt",[commitment,"enc_msg","comm","enc_msg_share","enc_rand_share"]).values()
        candidates=load("load",[])
        print(candidates,"candidates"]
        print(enc_msg_share,"enc_msg_share")
        print(enc_rand_share,"enc_rand_share")
        with timer("decryption of individual message/randomness shares", report_subtimers=mixers(alpha)):
            _msg_shares, _rand_shares = [], []
            for a in range(alpha):
                with timer("mixer %d: decryption of individual message/randomness shares" % a):
                    enc_msg_shares_a = list(zip(*enc_msg_share))[a]
                    enc_rand_shares_a = list(zip(*enc_rand_share))[a]
                    _msg_shares_a = [pai_decrypt_single(pai_pklist_single[a], _pai_sklist_single[a], enc_msg_share_a, embedded_q=q) for enc_msg_share_a in enc_msg_shares_a]
                    _rand_shares_a = [pai_decrypt_single(pai_pklist_single[a], _pai_sklist_single[a], enc_rand_share_a, embedded_q=q) for enc_rand_share_a in enc_rand_shares_a]
                    _msg_shares.append(_msg_shares_a)
                    _rand_shares.append(_rand_shares_a)
        v_w=reconstruct(_msg_shares)
        r_w=reconstruct(_rand_shares)
        v_w_nbar = v_w-bid
        name=candidates[v_w_nbar]
        gamma_w = (g**v_w)*(h**r_w)
    if(gamma_w==commitment):
        print([True, v_w_nbar,name,commitment,gamma_w])
    else:
        return print([False,None,None,None,None])

if __name__ == "__main__":
    function_map = {
        "setup": setup,
        "mix": mixer,
        "pf_zksm": pf_zksm,
        "pf_zkrsm": pf_zkrsm,
        "upload": upload,
        "generate":generate_ballots,
        "audit":audit,
        "genproof":generate_proofs,
        "genrevproofs": generate_reverse_proofs
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
    
