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


#g = group.init(ZR, 5564993445756101503206304700110936918638328897597942591925129910965597995003)
#h = group.init(ZR, 12653160894039224234691306368807880269056474991426613178779481321437840969124)

import io
import contextlib

def setup(n,alpha):
    """ Setup keys and other performance-enhancing artefacts. Accessible only to an administrator. 
    
    Stores a public key, a set of secret keys, and other globals in the database.

    Parameters:
    - alpha: number of mix-servers
    """
    
    # Generate Paillier and ElGamal public/private keys
    store("generators",[g1,f2,eg1f2,ef1f2,f1,h1,eh1f2,idenT,inveh1f2,inveg1f2,fT])
    _pai_sklist, pai_pk = pai_th_keygen(alpha)
    _pai_sklist_single, pai_pklist_single = [], []
    for a in range(alpha):
        _pai_sk_a, pai_pk_a = pai_keygen_single()
        _pai_sklist_single.append(_pai_sk_a)
        pai_pklist_single.append(pai_pk_a)

    _elg_sklist, elg_pk = elgamal_th_keygen(alpha)

    # Generate beaver triples (offline preprocessing step for multiplicative 
    # secret sharing used in DPK2)
    beaver_a_shares,beaver_b_shares,beaver_c_shares = gen_beaver_triples(n, alpha)
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
         ck, ck_fo, _pi, _re_pi, _svecperm, permcomm,beaver_a_shares,beaver_b_shares,beaver_c_shares])

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
#def pfcomms():
    """ Get proof of knowledge of all commitments in the uploaded encrypted votes. """
 #   proofs=load("pf_zksm",[])
 #   print(proofs)

def generate_proofs():
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
    print(({"verfpk":serialize_wrapper(verfpk),"sigs":serialize_wrapper(sigs),"enc_sigs":serialize_wrapper(enc_sigs),"enc_sigs_rands":serialize_wrapper(enc_sigs_rands)}))
    #print(type(verfpk),type(sigs),type(enc_sigs),type(enc_sigs_rands))
def generate_reverse_proofs():
    f = io.StringIO()
    with contextlib.redirect_stdout(f):
        elg_pk,pai_pk = load("setup",["elg_pk","pai_pk"]).values()
        comms=list(load("enc",["comm"]).values())[0]
        """Important: pfcomms is a part of the function parameter of get_verfsigs_rev to be completed"""
        #pfcomms = deserialize_wrapper(ast.literal_eval(pfcomms))
        print(comms,"comms")
        verfpk, sigs_rev, enc_sigs_rev, enc_sigs_rev_rands = get_verfsigs_rev(comms,elg_pk,pai_pk)
    print(({"verfpk": serialize_wrapper(verfpk), "sigs_rev":serialize_wrapper(sigs_rev), "enc_sigs_rev":serialize_wrapper(enc_sigs_rev), "enc_sigs_rev_rands":serialize_wrapper(enc_sigs_rev_rands)}))

def pf_zksm(verfpk, sigs, enc_sigs, enc_sigs_rands):
    """ Get the list of proofs (dummy or real) for encrypted votes identified by index set I, proving or 
    disproving (in zero-knowledge) whether they encrypt a plaintext identified by index set J. The additional 
    parameters verfpk and verfsigs are because of the way our scheme works - it requires the verifier to 
    compute BB signatures on plaintexts in set J. 
    
    The verifier code should take the output of this function --- the proofs --- and verify them.
    """
    #print(type(verfpk),"type of verfpk")
    #print(type(sigs),"type of sigs")
    f = io.StringIO()
    if(True):
    #with contextlib.redirect_stdout(f):
        verfpk = deserialize_wrapper(ast.literal_eval(verfpk))
        sigs= deserialize_wrapper(ast.literal_eval(sigs))
        enc_sigs= deserialize_wrapper(ast.literal_eval(enc_sigs))
        enc_sigs_rands= deserialize_wrapper(ast.literal_eval(enc_sigs_rands))
    #print(type(verfpk),type(sigs),type(enc_sigs),type(enc_sigs_rands))
        dict=load("mix",["msgs_out","_msg_shares","_rand_shares"])
    #print(dict['msgs_out'] , "checking if messages remain the same")
    #print(verfpk,"verfpk")
    #print(sigs,"sigs")
        alpha,ck,permcomm,elg_pk,_svecperm,_pi,_re_pi,_elg_sklist=load("setup",["alpha","ck","permcomm","elg_pk","_svecperm","_pi","_re_pi","_elg_sklist"]).values()
        comms=list(load("enc",["comm"]).values())[0]
        print(comms,"comms")
    #print(type(comms),"type of comms")
    # Check verifier signatures
        #from bbsig import bbbatchverify
        #print(bbbatchverify(sigs,dict['msgs_out'],verfpk),"checking bbbatch outside the assert statement") 
        status_verfsigs = check_verfsigs(dict['msgs_out'], sigs, verfpk, enc_sigs, enc_sigs_rands, elg_pk,alpha)
        #print(status_verfsigs)
        assert status_verfsigs

    # Get blinded signatures against comms
        blsigs, _blshares = get_blsigs(enc_sigs, ck, permcomm, alpha, elg_pk, _svecperm, _pi, _re_pi, _elg_sklist)

    # Proofs
        dpk_bbsig_pfs = dpk_bbsig_nizkproofs(comms, blsigs, verfpk, alpha,dict["_msg_shares"],dict["_rand_shares"], _blshares)
        status_dpk_bbsig = dpk_bbsig_nizkverifs(comms, blsigs, verfpk, dpk_bbsig_pfs)
    print("status_dpk_bbsig:",status_dpk_bbsig)    
    print({"dpk_bbsig_pfs":serialize_wrapper(dpk_bbsig_pfs),"blsigs":serialize_wrapper(blsigs)})
def pf_zkrsm(verfpk, sigs_rev, enc_sigs_rev, enc_sigs_rev_rands):
    """ Get the list of proofs (dummy or real) for plaintext votes identified by index set J, proving or 
    disproving (in zero-knowledge) whether they are encrypted by some ciphertext identified by index set I.
    The additional parameters verfpk and verfsigs are because of the way our scheme works - it requires the 
    verifier to compute quasi-BBS+ signatures on ciphertexts (commitments) in set I (note that this requires 
    the provers to demonstrate proof of knowledge of all the commitment openings, which they do using the 
    pkcomms endpoint).
    
    The verifier code should take the output of this function --- the proofs --- and verify them.
    """
    f = io.StringIO()
    if(True):
    #with contextlib.redirect_stdout(f):
        verfpk = deserialize_wrapper(ast.literal_eval(verfpk))
        sigs_rev= deserialize_wrapper(ast.literal_eval(sigs_rev))
        enc_sigs_rev= deserialize_wrapper(ast.literal_eval(enc_sigs_rev))
        enc_sigs_rev_rands= deserialize_wrapper(ast.literal_eval(enc_sigs_rev_rands))
        msgs_out,_rand_shares=load("mix",["msgs_out","_rand_shares"]).values()
        alpha, pai_pk, _pai_sklist,elg_pk, _elg_sklist,ck, ck_fo, _pi, _svecperm, permcomm=load("setup",['alpha','pai_pk','_pai_sklist','elg_pk','_elg_sklist','ck','ck_fo','_pi','_svecperm','permcomm']).values()
        comms=list(load("enc",["comm"]).values())[0]
        enc_rands=list(load("enc",["enc_rand"]).values())[0]
        print(enc_rands,"enc_rands")
    # Check verifier signatures
        status_verfsigs_rev = check_verfsigs_rev(sigs_rev, comms, verfpk, enc_sigs_rev, enc_sigs_rev_rands, elg_pk, pai_pk,alpha)
        assert status_verfsigs_rev
        print("status_verfsigs_rev: ", status_verfsigs_rev)
    # Get blinded signatures against msg_outs
        blsigs_rev, _blshares_rev = get_blsigs_rev(enc_sigs_rev, enc_rands, ck, ck_fo, permcomm, alpha, elg_pk, pai_pk, _svecperm, _rand_shares, _pi, _elg_sklist, _pai_sklist)

    # Proofs
        blsigs_S, blsigs_c, blsigs_r = blsigs_rev
        _blshares_S, _blshares_c, _blshares_r = _blshares_rev
        
        from bbsplussig import bbsplusverify
        _blshare_S = _blshares_S[0][0] + _blshares_S[1][0]
        _blshare_c =  _blshares_c[0][0] + _blshares_c[1][0]
        _blshare_r =  _blshares_r[0][0] + _blshares_r[1][0]
        sig_S = blsigs_S[0] * (g1 ** (-_blshare_S))
        sig_c = blsigs_c[0] - _blshare_c 
        sig_r = blsigs_r[0] - _blshare_r
        sigma = (sig_S, sig_c, sig_r)
        tmp_status_verif = bbsplusverify(sigma, msgs_out[0], verfpk)
        print("tmp_status_verif:", tmp_status_verif)

        dpk_bbsplussig_pfs = dpk_bbsplussig_nizkproofs(msgs_out, blsigs_S, blsigs_c, blsigs_r, verfpk, alpha, _blshares_S, _blshares_c, _blshares_r)
        status_dpk_bbsplussig = dpk_bbsplussig_nizkverifs(msgs_out, blsigs_S, blsigs_c, blsigs_r, verfpk, dpk_bbsplussig_pfs)
    print(status_dpk_bbsplussig,"verification is true i.e. system is correct")
    print({"dpk_bbsplussig_pfs":serialize_wrapper(dpk_bbsplussig_pfs),"blsigs_rev":serialize_wrapper(blsigs_rev)})


def audit(commitment,booth_num,bid):
    f = io.StringIO()
    g12,h12=load("generators",["g1","h1"]).values()
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
            result.append([True, v_w_nbar, name, str(gamma_w), str(comm[i])])
            if(name=="NOTA"):
                db=init()
                receipts_collection=db['receipts']
                votes_collection=db['votes']
                receipt = receipts_collection.find_one({'comm': serialize_wrapper(comm[i])})
                random_voter_id = random.randint(1000000000, 9999999999)
                receipt['voter_id'] = random_voter_id
                votes_collection.insert_one(receipt)
        else:
            result.append([False,None,None,None,None])
    print(json.dumps(result))
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
    
