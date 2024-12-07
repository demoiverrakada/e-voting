import random
import sys

import gmpy2

from charm.toolbox.pairinggroup import ZR

from globals import g1, group, pai_group, beta, q, kappa_e
from pedersen import commit
from bbsig import bbkeygen, bbsign, bbbatchverify
from bbsplussig import bbspluskeygen, bbsplusquasisign_commitment, bbsplusquasibatchverify
from optthpaillier import pai_th_keygen, pai_encrypt, pai_share_decrypt, pai_combine_decshares, pai_reencrypt, pai_add, pkenc_paillier, pkenc_paillier_verif, pai_share_decryption_batchpf, pai_share_decryption_batchverif
from optpaillier import pai_keygen as pai_keygen_single, pai_encrypt as pai_encrypt_single, pai_decrypt as pai_decrypt_single, pkenc_paillier as pkenc_paillier_single, pkenc_paillier_verif as pkenc_paillier_verif_single
from elgamal import elgamal_th_keygen, elgamal_encrypt, elgamal_share_decrypt, elgamal_combine_decshares, elgamal_reencrypt, elgamal_mult, elgamal_exp, elgamal_share_decryption_batchpf, elgamal_share_decryption_batchverif 
from secretsharing import gen_beaver_triples, share
from perm import permute, gen_rand_perm
from shuffle import commkey, commkey_fo, commit_perm, perm_nizkproof, perm_nizkverif, shuffle_paillier_nizkproof, shuffle_paillier_nizkverif, shuffle_elgamal_nizkproof, shuffle_elgamal_nizkverif
from pok import pkcomms, pkcommverifs, pk_enc_bl, pk_enc_bl_verif, pk_enc_blrev_S, pk_enc_blrev_S_verif, dpk_bbsig_nizkproofs, dpk_bbsig_nizkverifs, dpk_bbsplussig_nizkproofs, dpk_bbsplussig_nizkverifs
from misc import timed, timer, sz, pprint

random.seed()
rs = gmpy2.random_state(random.randint(0,100000)) # random seed for gmpy2 operations

mixers = lambda alpha: ["mixer %d" % a for a in range(alpha)]
verifier = ['verifier']

def prepare_inp(n, alpha, pai_pk, pai_pklist_single):
    """ Create the list of ciphertexts sent by n senders. """    
    myn = n

    _msgs  = [group.random(ZR) for _ in range(myn)]
    _rands = [group.random(ZR) for _ in range(myn)]
    enc_msgs, _enc_msg_rands = zip(*[pai_encrypt(pai_pk, _msgs[i], randOut=True) for i in range(myn)])
    enc_rands, _enc_rand_rands = zip(*[pai_encrypt(pai_pk, _rands[i], randOut=True) for i in range(myn)])
    
    comms  = [commit(_msgs[i], _rands[i]) for i in range(myn)]
    pfcomms = pkcomms(comms, _msgs, _rands)
    
    encs_msg_shares, encs_rand_shares = [], []
    pfs_enc_msg_shares, pfs_enc_rand_shares = [], []
    for i in range(myn):
        _msg_shares = share(_msgs[i], alpha)
        _rand_shares = share(_rands[i], alpha)
        enc_msg_shares, _enc_msg_share_rands = zip(*[pai_encrypt_single(pai_pklist_single[a], _msg_shares[a], randOut=True) for a in range(alpha)])
        enc_rand_shares, _enc_rand_share_rands = zip(*[pai_encrypt_single(pai_pklist_single[a], _rand_shares[a], randOut=True) for a in range(alpha)])
        encs_msg_shares.append(enc_msg_shares)
        encs_rand_shares.append(enc_rand_shares)
        pf_enc_msg_shares = [pkenc_paillier_single(pai_pklist_single[a], enc_msg_shares[a], _msg_shares[a], _enc_msg_share_rands[a]) for a in range(alpha)]
        pf_enc_rand_shares = [pkenc_paillier_single(pai_pklist_single[a], enc_rand_shares[a], _rand_shares[a], _enc_rand_share_rands[a]) for a in range(alpha)]
        pfs_enc_msg_shares.append(pf_enc_msg_shares)
        pfs_enc_rand_shares.append(pf_enc_rand_shares)

    pf_encmsgs = [pkenc_paillier(pai_pk, enc_msgs[i], _msgs[i], _enc_msg_rands[i]) for i in range(myn)]
    pf_encrands = [pkenc_paillier(pai_pk, enc_rands[i], _rands[i], _enc_rand_rands[i]) for i in range(myn)]

    return enc_msgs, comms, encs_msg_shares, encs_rand_shares, pfcomms, enc_rands, pf_encmsgs, pf_encrands, pfs_enc_msg_shares, pfs_enc_rand_shares

def genperms(n, alpha):
    """ Generate secret permutations (and reverse permutations) for each authority. """

    pi = []
    re_pi =[]
    for a in range(alpha):
        pi_a, re_pi_a = gen_rand_perm(n)
        pi.append(pi_a)
        re_pi.append(re_pi_a)
    return pi, re_pi

def check_encs(pai_pk, pai_pklist_single, enc_msgs, enc_rands, enc_msg_shares, enc_rand_shares, pf_encmsgs, pf_encrands, pfs_encs_msg_shares, pfs_encs_rand_shares):
    status_encs = True
    alpha = len(pai_pklist_single)

    for a in range(alpha):
        with timer("mixer %d: checking proofs of knowledge of input ciphertexts" % a):
            for i in range(len(enc_msgs)):
                status_encs = status_encs and pkenc_paillier_verif(pai_pk, enc_msgs[i], pf_encmsgs[i])
                status_encs = status_encs and pkenc_paillier_verif(pai_pk, enc_rands[i], pf_encrands[i])
                status_encs = status_encs and pkenc_paillier_verif_single(pai_pklist_single[a], enc_msg_shares[i][a], pfs_encs_msg_shares[i][a])
                status_encs = status_encs and pkenc_paillier_verif_single(pai_pklist_single[a], enc_rand_shares[i][a], pfs_encs_rand_shares[i][a])
    return status_encs

def mix(ck, ck_fo, permcomm, enc_msgs, enc_msg_shares, enc_rand_shares, alpha, pai_pk, pai_pklist_single, _pai_sklist, _pai_sklist_single, _pi, _svecperm):
    """ Process messages using the stored message shares and permutations at each authority. """

    n = len(enc_msgs)
    N, N2, inv4, h, hN, kappa, v, vs, precomputing = pai_pk

    # Re-encrypt and permute 
    with timer("re-encryption and permutation", report_subtimers=mixers(alpha)):
        status_shuffle = True
        evec, pf, enc_msgs_1, enc_msgs_2 = [], [], [], []
        for a in range(alpha):
            with timer("mixer %d: re-encryption" % a):
                reenc_msgs, _rands = zip(*(pai_reencrypt(pai_pk, enc_msg, randOut=True) for enc_msg in enc_msgs))
                enc_msgs_new = permute(reenc_msgs, _pi[a])

            with timer("mixer %d: creating proof of correct shuffle" % a):
                evec.append([gmpy2.mpz_urandomb(rs, kappa_e) for i in range(n)])
                pf.append(shuffle_paillier_nizkproof(ck, ck_fo, pai_pk, enc_msgs, enc_msgs_new, permcomm[a], evec[a], _pi[a], _svecperm[a], _rands))
                enc_msgs_1.append(enc_msgs)
                enc_msgs_2.append(enc_msgs_new)
            enc_msgs = enc_msgs_new

        for a in range(alpha):
            with timer("mixer %d: verifying others' proofs of shuffle" % a):
                for adash in range(alpha):
                    if adash == a: continue
                    else: status_shuffle = status_shuffle and shuffle_paillier_nizkverif(ck, ck_fo, pai_pk, enc_msgs_1[adash], enc_msgs_2[adash], permcomm[adash], evec[adash], pf[adash])
        pprint("status_shuffle:", status_shuffle)

    # Decryption
    with timer("decryption of output messages", report_subtimers=mixers(alpha)):
        status_decshares = True
        pai_cshares, deltavec = [], []
        pf = []
        for a in range(alpha):
            with timer("mixer %d: threshold decryption" % a):
                pai_cshares_a = [pai_share_decrypt(pai_pk, enc_msg, _pai_sklist[a]) for enc_msg in enc_msgs]
                pai_cshares.append(pai_cshares_a)
                deltavec.append([gmpy2.mpz_urandomb(rs, kappa_e) for i in range(n)])
                pf.append(pai_share_decryption_batchpf(pai_pk, pai_cshares_a, enc_msgs, deltavec[a], a, _pai_sklist))

        for a in range(alpha):
            with timer("mixer %d: verifying others' decryption shares (batched)" % a):
                for adash in range(alpha):
                    if adash == a: continue
                    else: status_decshares = status_decshares and pai_share_decryption_batchverif(pai_pk, pai_cshares[adash], enc_msgs, deltavec[adash], adash, pf[adash])
        
        for a in range(alpha):
            with timer("mixer %d: combining decryption shares" % a):
                msgs_out = pai_combine_decshares(pai_pk, pai_cshares, embedded_q=q)
        pprint("status_decshares:", status_decshares)

    # Decryption of encrypted message and randomness shares by each mix-server
    with timer("decryption of individual message/randomness shares", report_subtimers=mixers(alpha)):
        _msg_shares, _rand_shares = [], []
        for a in range(alpha):
            with timer("mixer %d: decryption of individual message/randomness shares" % a):
                enc_msg_shares_a = list(zip(*enc_msg_shares))[a]
                enc_rand_shares_a = list(zip(*enc_rand_shares))[a]
                _msg_shares_a = [pai_decrypt_single(pai_pklist_single[a], _pai_sklist_single[a], enc_msg_share_a, embedded_q=q) for enc_msg_share_a in enc_msg_shares_a]
                _rand_shares_a = [pai_decrypt_single(pai_pklist_single[a], _pai_sklist_single[a], enc_rand_share_a, embedded_q=q) for enc_rand_share_a in enc_rand_shares_a]
                _msg_shares.append(_msg_shares_a)
                _rand_shares.append(_rand_shares_a)

    return msgs_out, _msg_shares, _rand_shares

def get_verfsigs(msgs_out, elgpk):
    """ Get verifier signatures on published messages. """
    with timer("verifier: creating BB signatures and encryptions"):
        _verfsk, verfpk = bbkeygen()
        sigs = [bbsign(msg_out, _verfsk) for msg_out in msgs_out]
        enc_sigs, enc_sigs_rands = encrypt_sigs(elgpk, sigs)
        print(verfpk, sigs, enc_sigs, enc_sigs_rands)
        return verfpk, sigs, enc_sigs, enc_sigs_rands

def encrypt_sigs(elgpk, sigs):
    return zip(*[elgamal_encrypt(elgpk, sig, randOut=True) for sig in sigs])

def check_verfsigs(msgs_out, sigs, verfpk, enc_sigs, enc_sigs_rands, elgpk, alpha):
    """ Check whether verifier signatures on published messages and their encryptions are correct. """

    status_checkverfsigs = True
    for a in range(alpha):
        with timer("mixer %d: checking verifier's signatures and encryptions" % a):
            #print(sigs,"in check_verfsigs")
            status_checkverfsigs = status_checkverfsigs and bbbatchverify(sigs, msgs_out, verfpk)
            #print(bbbatchverify(sigs, msgs_out, verfpk),"check for bbatchverify")
            enc_sigs_dash = tuple([elgamal_encrypt(elgpk, sigs[i], randIn=enc_sigs_rands[i]) for i in range(len(sigs))])
            #print(enc_sigs_dash,"enc_sigs_dash")
            #print(enc_sigs,"enc_sigs")
            status_checkverfsigs = status_checkverfsigs and (enc_sigs_dash == enc_sigs)
            #print(enc_sigs_dash ,"enc_sigs_dash")
    return status_checkverfsigs

def get_blsigs(enc_sigs, ck, permcomm, alpha, elgpk, _svecperm, _pi, _re_pi, _elgsklist):
    """ Obtain blinded signatures on the published message outputs, but ordered by the same
    order as the published commitments. """

    n = len(enc_sigs)

    # Re-encrypt and reverse-permute signatures
    with timer("re-encrypt and reverse-permute BB signatures", report_subtimers=mixers(alpha)):
        status_shuffle_blsigs = True
        evec, enc_sigs_1, enc_sigs_2, pf = [], [], [], []
        for a in reversed(range(alpha)):
            with timer("mixer %d: reencrypting encrypted BB signatures" % a):
                reenc_sigs, _rands = zip(*[elgamal_reencrypt(elgpk, enc_sig, randOut=True) for enc_sig in enc_sigs])
                enc_sigs_new = permute(reenc_sigs, _re_pi[a])
                
                # Note here that we are using the permutation commitment for pi[a] to prove statements about 
                # repi[a]. This is done by reversing the order of cinvec and coutvec in the proof-of-shuffle call.
                _rands_new = permute(_rands, _re_pi[a])
                _negrands_new = [-_rand_new for _rand_new in _rands_new]
            
            with timer("mixer %d: creating proof of shuffle of encrypted BB signatures" % a):
                evec_a = [group.init(ZR, random.getrandbits(kappa_e)) for i in range(n)]
                evec.insert(0, evec_a)
                pf.insert(0, shuffle_elgamal_nizkproof(ck, elgpk, enc_sigs_new, enc_sigs, permcomm[a], evec_a, _pi[a], _svecperm[a], _negrands_new))
                enc_sigs_1.insert(0, enc_sigs_new)
                enc_sigs_2.insert(0, enc_sigs)
            enc_sigs = enc_sigs_new

        for a in range(alpha):
            with timer("mixer %d: verifying others' proofs of shuffle of encrypted BB signatures" % a):
                for adash in range(alpha):
                    if adash == a: continue
                    else: status_shuffle_blsigs = status_shuffle_blsigs and shuffle_elgamal_nizkverif(ck, elgpk, enc_sigs_1[adash], enc_sigs_2[adash], permcomm[adash], evec[adash], pf[adash])
        pprint("status_shuffle_blsigs:", status_shuffle_blsigs)

    # Generate encrypted blinded signatures
    with timer("generate encrypted blinded BB signatures", report_subtimers=mixers(alpha)):
        _blshares = []
        enc_bls, pf = [], []
        for a in range(alpha):
            with timer("mixer %d: generate encrypted blinded BB signatures and proofs of knowledge of blinding factors" % a):
                _blshares.append([group.random(ZR) for _ in range(n)])
                enc_bl_a, _rand_enc_bl_a = zip(*[elgamal_reencrypt(elgpk, elgamal_exp(enc_sigs[i], _blshares[a][i]), randOut=True) for i in range(len(enc_sigs))])
                pf.append([pk_enc_bl(elgpk, enc_bl_a[i], enc_sigs[i], _rand_enc_bl_a[i], _blshares[a][i]) for i in range(len(enc_sigs))])
                enc_bls.append(enc_bl_a)

        for a in range(alpha):
            status_pk_bl = True
            with timer("mixer %d: verifying others' proofs of knowledge of blinding factors" % a):
                for adash in range(alpha):
                    if adash == a: continue
                    else: 
                        for i in range(len(enc_sigs)):
                            status_pk_bl = status_pk_bl and pk_enc_bl_verif(elgpk, enc_bls[adash][i], enc_sigs[i], pf[adash][i])
        pprint("status_pk_bl:", status_pk_bl)

        enc_blsigs = [elgamal_encrypt(elgpk, g1 ** 0, randIn=0)] * n
        for a in range(alpha):
            with timer("mixer %d: generate encrypted blinded BB signatures" % a):
                enc_blsigs = [elgamal_mult(enc_blsigs[i], enc_bls[a][i]) for i in range(len(enc_blsigs))]

    # Decryption of blinded signatures
    with timer("decrypt blinded signatures", report_subtimers=mixers(alpha)):
        status_decshares_blsigs = True
        decshares = []
        deltavec, pf = [], []
        for a in range(alpha):
            with timer("mixer %d: obtain decryption shares" % a):
                decshares_a = [elgamal_share_decrypt(elgpk, enc_blsigs[i], _elgsklist[a]) for i in range(len(enc_blsigs))]
                decshares.append(decshares_a)
                deltavec.append([group.init(ZR, int(gmpy2.mpz_urandomb(rs, kappa_e))) for i in range(n)])
                pf.append(elgamal_share_decryption_batchpf(elgpk, decshares_a, enc_blsigs, deltavec[a], a, _elgsklist))

        for a in range(alpha):
            with timer("mixer %d: verifying others' decryption shares" % a):
                for adash in range(alpha):
                    if adash == a: continue
                    else: status_decshares_blsigs = status_decshares_blsigs and elgamal_share_decryption_batchverif(elgpk, decshares[adash], enc_blsigs, deltavec[adash], adash, pf[adash])

        for a in range(alpha):
            with timer("mixer %d: combine decryption shares" % a):
                blsigs = elgamal_combine_decshares(elgpk, enc_blsigs, decshares)

        pprint("status_decshares_blsigs:", status_decshares_blsigs)

    return blsigs, _blshares

def get_verfsigs_rev(comms, pfcomms, elgpk, paipk):
    """ Get verifier quasi-signatures on the committed messages by using only the commitments. """
    with timer("verifier: creating BBS+ signatures and encryptions"):
        _verfsk, verfpk = bbspluskeygen()
        sigs_rev = [bbsplusquasisign_commitment(comm, _verfsk) for comm in comms]
        enc_sigs_rev, enc_sigs_rev_rands = encrypt_sigs_rev(elgpk, paipk, sigs_rev)
    return verfpk, sigs_rev, enc_sigs_rev, enc_sigs_rev_rands

def encrypt_sigs_rev(elgpk, paipk, sigs_rev):
    enc_sigs_S, enc_sigs_S_rands = zip(*[elgamal_encrypt(elgpk, sigs_rev[i][0], randOut=True) for i in range(len(sigs_rev))])
    enc_sigs_c, enc_sigs_c_rands = zip(*[pai_encrypt(paipk, sigs_rev[i][1], randOut=True) for i in range(len(sigs_rev))])
    enc_sigs_rhat, enc_sigs_rhat_rands = zip(*[pai_encrypt(paipk, sigs_rev[i][2], randOut=True) for i in range(len(sigs_rev))])
    return (enc_sigs_S, enc_sigs_c, enc_sigs_rhat), (enc_sigs_S_rands, enc_sigs_c_rands, enc_sigs_rhat_rands)

def check_verfsigs_rev(sigs_rev, comms, verfpk, enc_sigs_rev, enc_sigs_rev_rands, elgpk, paipk, alpha):
    """ Check whether verifier quasi-signatures on published commitments are correct. """

    enc_sigs_S, enc_sigs_c, enc_sigs_rhat = enc_sigs_rev
    enc_sigs_S_rands, enc_sigs_c_rands, enc_sigs_rhat_rands = enc_sigs_rev_rands
    status_checkverfsigs_rev = True
    for a in range(alpha):
        with timer("mixer %d: checking verifier's signatures and encryptions" % a):
            status_checkverfsigs_rev = status_checkverfsigs_rev and bbsplusquasibatchverify(sigs_rev, comms, verfpk)
            enc_sigs_S_dash = tuple([elgamal_encrypt(elgpk, sigs_rev[i][0], randIn=enc_sigs_S_rands[i]) for i in range(len(sigs_rev))])
            enc_sigs_c_dash = tuple([pai_encrypt(paipk, sigs_rev[i][1], randIn=enc_sigs_c_rands[i]) for i in range(len(sigs_rev))])
            enc_sigs_rhat_dash = tuple([pai_encrypt(paipk, sigs_rev[i][2], randIn=enc_sigs_rhat_rands[i]) for i in range(len(sigs_rev))])
            status_checkverfsigs_rev = status_checkverfsigs_rev and (enc_sigs_S_dash == enc_sigs_S) and (enc_sigs_c_dash == enc_sigs_c) and (enc_sigs_rhat_dash == enc_sigs_rhat)
    return status_checkverfsigs_rev

def get_blsigs_rev(enc_sigs_rev, enc_rands, ck, ck_fo, permcomm, alpha, auth_elgpk, auth_paipk, _svecperm, _rand_shares, _pi, _auth_elgsklist, _auth_paisklist):
    """ Obtain blinded signatures on the published message outputs for the reverse set membership proof. """

    enc_sigs_S, enc_sigs_c, enc_sigs_rhat = enc_sigs_rev
    myn = len(enc_sigs_S)

    # Re-encrypt and permute signatures
    with timer("re-encrypt and permute BBS+ signatures", report_subtimers=mixers(alpha)):
        # Homomorphically obtain the r component of the BBS+ signature
        for a in range(alpha):
            with timer("mixer %d: homomorphically obtain the r component of BBS+ sig" % a):
                enc_sigs_r = [pai_add(auth_paipk, enc_sigs_rhat[i], enc_rands[i]) for i in range(myn)]

        status_shuffle_blsigs_rev = True
        evec_S, evec_c, evec_r = [], [], []
        enc_sigs_S_1, enc_sigs_S_2, enc_sigs_c_1, enc_sigs_c_2, enc_sigs_r_1, enc_sigs_r_2 = [], [], [], [], [], []
        pf_S, pf_c, pf_r = [], [], []
        for a in range(alpha):
            with timer("mixer %d: reencrypting encrypted BBS+ signatures" % a):
                reenc_sigs_S, _rands_S = zip(*[elgamal_reencrypt(auth_elgpk, enc_sig_S, randOut=True) for enc_sig_S in enc_sigs_S])
                reenc_sigs_c, _rands_c = zip(*[pai_reencrypt(auth_paipk, enc_sig_c, randOut=True) for enc_sig_c in enc_sigs_c])
                reenc_sigs_r, _rands_r = zip(*[pai_reencrypt(auth_paipk, enc_sig_r, randOut=True) for enc_sig_r in enc_sigs_r])
                enc_sigs_S_new = permute(reenc_sigs_S, _pi[a])
                enc_sigs_c_new = permute(reenc_sigs_c, _pi[a])
                enc_sigs_r_new = permute(reenc_sigs_r, _pi[a])

            with timer("mixer %d: creating proof of shuffle of encrypted BBS+ signatures" % a):
                evec_S.append([group.init(ZR, random.getrandbits(kappa_e)) for i in range(myn)])
                evec_c.append([gmpy2.mpz_urandomb(rs, kappa_e) for i in range(myn)])
                evec_r.append([gmpy2.mpz_urandomb(rs, kappa_e) for i in range(myn)])
                pf_S.append(shuffle_elgamal_nizkproof(ck, auth_elgpk, enc_sigs_S, enc_sigs_S_new, permcomm[a], evec_S[a], _pi[a], _svecperm[a], _rands_S))
                pf_c.append(shuffle_paillier_nizkproof(ck, ck_fo, auth_paipk, enc_sigs_c, enc_sigs_c_new, permcomm[a], evec_c[a], _pi[a], _svecperm[a], _rands_c))
                pf_r.append(shuffle_paillier_nizkproof(ck, ck_fo, auth_paipk, enc_sigs_r, enc_sigs_r_new, permcomm[a], evec_r[a], _pi[a], _svecperm[a], _rands_r))
                enc_sigs_S_1.append(enc_sigs_S)
                enc_sigs_S_2.append(enc_sigs_S_new)
                enc_sigs_c_1.append(enc_sigs_c)
                enc_sigs_c_2.append(enc_sigs_c_new)
                enc_sigs_r_1.append(enc_sigs_r)
                enc_sigs_r_2.append(enc_sigs_r_new)
            enc_sigs_S, enc_sigs_c, enc_sigs_r = enc_sigs_S_new, enc_sigs_c_new, enc_sigs_r_new

        for a in range(alpha):
            with timer("mixer %d: verifying others' proofs of shuffle of encrypted BBS+ signatures" % a):
                for adash in range(alpha):
                    if adash == a: continue
                    else: 
                        status_shuffle_blsigs_rev = status_shuffle_blsigs_rev and shuffle_elgamal_nizkverif(ck, auth_elgpk, enc_sigs_S_1[adash], enc_sigs_S_2[adash], permcomm[adash], evec_S[adash], pf_S[adash])        
                        status_shuffle_blsigs_rev = status_shuffle_blsigs_rev and shuffle_paillier_nizkverif(ck, ck_fo, auth_paipk, enc_sigs_c_1[adash], enc_sigs_c_2[adash], permcomm[adash], evec_c[adash], pf_c[adash])                               
                        status_shuffle_blsigs_rev = status_shuffle_blsigs_rev and shuffle_paillier_nizkverif(ck, ck_fo, auth_paipk, enc_sigs_r_1[adash], enc_sigs_r_2[adash], permcomm[adash], evec_r[adash], pf_r[adash])
        pprint("status_shuffle_blsigs_rev:", status_shuffle_blsigs_rev)

    # Generate encrypted blinded signatures
    with timer("generate encrypted blinded BBS+ signatures", report_subtimers=mixers(alpha)):
        _blshares_S, _blshares_c, _blshares_r, _blshares_cdash, _blshares_rdash = [], [], [], [], []
        enc_bls_S, enc_bls_c, enc_bls_r, pf_bl_S, pf_bl_c, pf_bl_r = [], [], [], [], [], []
        for a in range(alpha):
            with timer("mixer %d: generate encrypted blinding factors and proofs of knowledge of blinding factors" % a):
                _blshares_S.append([group.random(ZR) for _ in range(myn)])
                _blshares_c.append([group.random(ZR) for _ in range(myn)])
                _blshares_r.append([group.random(ZR) for _ in range(myn)])
                _blshares_cdash.append([(int(_blshares_c[a][i]) + q*random.randint(0, beta)) for i in range(myn)])
                _blshares_rdash.append([(int(_blshares_r[a][i]) + q*random.randint(0, beta)) for i in range(myn)])
                enc_bl_a_S, _rand_enc_bl_a_S = zip(*[elgamal_encrypt(auth_elgpk, g1**_blshares_S[a][i], randOut=True) for i in range(myn)])
                enc_bl_a_c, _rand_enc_bl_a_c = zip(*[pai_encrypt(auth_paipk, _blshares_cdash[a][i], randOut=True) for i in range(myn)])
                enc_bl_a_r, _rand_enc_bl_a_r = zip(*[pai_encrypt(auth_paipk, _blshares_rdash[a][i], randOut=True) for i in range(myn)])
                pf_bl_S.append([pk_enc_blrev_S(auth_elgpk, enc_bl_a_S[i], _rand_enc_bl_a_S[i], _blshares_S[a][i]) for i in range(myn)])
                pf_bl_c.append([pkenc_paillier(auth_paipk, enc_bl_a_c[i], _blshares_cdash[a][i], _rand_enc_bl_a_c[i]) for i in range(myn)])
                pf_bl_r.append([pkenc_paillier(auth_paipk, enc_bl_a_r[i], _blshares_rdash[a][i], _rand_enc_bl_a_r[i]) for i in range(myn)])
                enc_bls_S.append(enc_bl_a_S)
                enc_bls_c.append(enc_bl_a_c)
                enc_bls_r.append(enc_bl_a_r)

        for a in range(alpha):
            status_pk_blrev = True
            with timer("mixer %d: verifying others' proofs of knowledge of blinding factors" % a):
                for adash in range(alpha):
                    if adash == a: continue
                    else: 
                        for i in range(myn):
                            status_pk_blrev = status_pk_blrev and pk_enc_blrev_S_verif(auth_elgpk, enc_bls_S[adash][i], pf_bl_S[adash][i])
                            status_pk_blrev = status_pk_blrev and pkenc_paillier_verif(auth_paipk, enc_bls_c[adash][i], pf_bl_c[adash][i])
                            status_pk_blrev = status_pk_blrev and pkenc_paillier_verif(auth_paipk, enc_bls_r[adash][i], pf_bl_r[adash][i])
        pprint("status_pk_blrev:", status_pk_blrev)

        enc_blsigs_S = enc_sigs_S
        enc_blsigs_c = enc_sigs_c
        enc_blsigs_r = enc_sigs_r
        for a in range(alpha):
            with timer("mixer %d: generate encrypted blinded BBS+ signatures" % a):
                enc_blsigs_S = [elgamal_mult(enc_blsigs_S[i], enc_bls_S[a][i]) for i in range(len(enc_blsigs_S))]
                enc_blsigs_c = [pai_add(auth_paipk, enc_blsigs_c[i], enc_bls_c[a][i]) for i in range(len(enc_blsigs_c))]
                enc_blsigs_r = [pai_add(auth_paipk, enc_blsigs_r[i], enc_bls_r[a][i]) for i in range(len(enc_blsigs_r))]

    # Decryption of blinded signatures
    with timer("decryption of blinded BBS+ signatures", report_subtimers=mixers(alpha)):
        status_decshares_blsigs_rev = True
        decshares_S, decshares_c, decshares_r, deltavec_S, deltavec_c, deltavec_r, pf_S, pf_c, pf_r = [], [], [], [], [], [], [], [], [] 
        for a in range(alpha):
            with timer("mixer %d: obtain decryption shares" % a):
                decshares_S_a = [elgamal_share_decrypt(auth_elgpk, enc_blsig_S, _auth_elgsklist[a]) for enc_blsig_S in enc_blsigs_S]
                decshares_c_a = [pai_share_decrypt(auth_paipk, enc_blsig_c, _auth_paisklist[a]) for enc_blsig_c in enc_blsigs_c]
                decshares_r_a = [pai_share_decrypt(auth_paipk, enc_blsig_r, _auth_paisklist[a]) for enc_blsig_r in enc_blsigs_r]
                decshares_S.append(decshares_S_a)
                decshares_c.append(decshares_c_a)
                decshares_r.append(decshares_r_a)
                deltavec_S.append([group.init(ZR, int(gmpy2.mpz_urandomb(rs, kappa_e))) for i in range(myn)])
                deltavec_c.append([gmpy2.mpz_urandomb(rs, kappa_e) for i in range(n)])
                deltavec_r.append([gmpy2.mpz_urandomb(rs, kappa_e) for i in range(n)])
                pf_S.append(elgamal_share_decryption_batchpf(auth_elgpk, decshares_S_a, enc_blsigs_S, deltavec_S[a], a, _auth_elgsklist))
                pf_c.append(pai_share_decryption_batchpf(auth_paipk, decshares_c_a, enc_blsigs_c, deltavec_c[a], a, _auth_paisklist))
                pf_r.append(pai_share_decryption_batchpf(auth_paipk, decshares_r_a, enc_blsigs_r, deltavec_r[a], a, _auth_paisklist))

        for a in range(alpha):
            with timer("mixer %d: verifying others' decryption shares" % a):
                for adash in range(alpha):
                    if adash == a: continue
                    else: 
                        status_decshares_blsigs_rev = status_decshares_blsigs_rev and elgamal_share_decryption_batchverif(auth_elgpk, decshares_S[adash], enc_blsigs_S, deltavec_S[adash], adash, pf_S[adash])
                        status_decshares_blsigs_rev = status_decshares_blsigs_rev and pai_share_decryption_batchverif(auth_paipk, decshares_c[adash], enc_blsigs_c, deltavec_c[adash], adash, pf_c[adash])
                        status_decshares_blsigs_rev = status_decshares_blsigs_rev and pai_share_decryption_batchverif(auth_paipk, decshares_r[adash], enc_blsigs_r, deltavec_r[adash], adash, pf_r[adash])

        for a in range(alpha):
            with timer("mixer %d: combining decryption shares" % a):
                blsigs_S = elgamal_combine_decshares(auth_elgpk, enc_blsigs_S, decshares_S)
                blsigs_c = pai_combine_decshares(auth_paipk, decshares_c, embedded_q=q)
                blsigs_r = pai_combine_decshares(auth_paipk, decshares_r, embedded_q=q)
        pprint("status_decshares_blsigs_rev", status_decshares_blsigs_rev)

    return (blsigs_S, blsigs_c, blsigs_r), (_blshares_S, _blshares_c, _blshares_r) 
    

def main(n, alpha):
    """ Main benchmarking code for processing and proving forward and reverse set membership 
    for `n` messages with `alpha` mix-servers (note: we denote the number of mix-servers by `alpha` 
    instead of `m` in the code). """

    pprint("number of entries:", n)
    pprint("number of mix-servers:", alpha)

    ####### Preprocessing (input-independent) #########

    with timer("preprocessing"):
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
        with timer("creating proof of knowledge of permutation commitment opening"):
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
        pprint("status_permcomm:", status_permcomm)
        
    ####### Input preparation #######

    with timer("input preparation"):
        enc_msgs, comms, enc_msg_shares, enc_rand_shares, pfcomms, enc_rands, pf_encmsgs, pf_encrands, pfs_enc_msg_shares, pfs_enc_rand_shares = prepare_inp(n, alpha, pai_pk, pai_pklist_single)

    with timer("checking inputs"):
        status_encs = timed(check_encs, report_subtimers=mixers(alpha))(pai_pk, pai_pklist_single, enc_msgs, enc_rands, enc_msg_shares, enc_rand_shares, pf_encmsgs, pf_encrands, pfs_enc_msg_shares, pfs_enc_rand_shares)
        pprint("status_encs:", status_encs)

    ####### Mixing process #######

    with timer("mixing", report_subtimers=mixers(alpha)):
        msgs_out, _msg_shares, _rand_shares = mix(ck, ck_fo, permcomm, enc_msgs, enc_msg_shares, enc_rand_shares, alpha, pai_pk, pai_pklist_single, _pai_sklist, _pai_sklist_single, _pi, _svecperm)

    ####### Forward set membership proof ########

    with timer("forward set membership", report_subtimers=mixers(alpha)+verifier):
        # Get blinded signatures and blinded shares
        verfpk, sigs, enc_sigs, enc_sigs_rands = timed(get_verfsigs, report_subtimers=verifier)(msgs_out, elg_pk)
        status_verfsigs = timed(check_verfsigs, report_subtimers=mixers(alpha))(msgs_out, sigs, verfpk, enc_sigs, enc_sigs_rands, elg_pk, alpha)
        pprint("status_verfsigs:", status_verfsigs)
        blsigs, _blshares = timed(get_blsigs, report_subtimers=mixers(alpha))(enc_sigs, ck, permcomm, alpha, elg_pk, _svecperm, _pi, _re_pi, _elg_sklist)

        # Proofs
        dpk_bbsig_pfs = timed(dpk_bbsig_nizkproofs, report_subtimers=mixers(alpha))(comms, blsigs, verfpk, alpha, _msg_shares, _rand_shares, _blshares)

        # Verification
        status_dpk_bbsig = timed(dpk_bbsig_nizkverifs, report_subtimers=verifier)(comms, blsigs, verfpk, dpk_bbsig_pfs)
        pprint("status_dpk_bbsig:", status_dpk_bbsig)
        status_fwd = status_verfsigs and status_dpk_bbsig
        pprint("status_forward_set_membership:", status_fwd)

    ####### Reverse set membership proof ########

    with timer("reverse set membership", report_subtimers=mixers(alpha)+verifier):
        # Check proof of knowledge of commitment openings;
        status_pkcomms = timed(pkcommverifs, report_subtimers=verifier)(comms, pfcomms)
        pprint("status_pkcomms", status_pkcomms)
        
        # Verifier sends fresh public key and BBS+ quasi-signatures
        verfpk, sigs_rev, enc_sigs_rev, enc_sigs_rev_rands = timed(get_verfsigs_rev, report_subtimers=verifier)(comms, pfcomms, elg_pk, pai_pk)
        status_verfsigs_rev = timed(check_verfsigs_rev, report_subtimers=mixers(alpha))(sigs_rev, comms, verfpk, enc_sigs_rev, enc_sigs_rev_rands, elg_pk, pai_pk, alpha)
        pprint("status_verfsigs_rev:", status_verfsigs_rev)
        blsigs_rev, _blshares_rev = timed(get_blsigs_rev, report_subtimers=mixers(alpha))(enc_sigs_rev, enc_rands, ck, ck_fo, permcomm, alpha, elg_pk, pai_pk, _svecperm, _rand_shares, _pi, _elg_sklist, _pai_sklist)

        # Proofs
        blsigs_S, blsigs_c, blsigs_r = blsigs_rev
        _blshares_S, _blshares_c, _blshares_r = _blshares_rev
        dpk_bbsplussig_pfs = timed(dpk_bbsplussig_nizkproofs, report_subtimers=mixers(alpha))(msgs_out, blsigs_S, blsigs_c, blsigs_r, verfpk, alpha, _blshares_S, _blshares_c, _blshares_r)

        # Verification
        status_dpk_bbsplussig = timed(dpk_bbsplussig_nizkverifs, report_subtimers=verifier)(msgs_out, blsigs_S, blsigs_c, blsigs_r, verfpk, dpk_bbsplussig_pfs)
        pprint("status_dpk_bbsplussig:", status_dpk_bbsplussig)
        status_rev = status_pkcomms and status_verfsigs_rev and status_dpk_bbsplussig
        pprint("status_reverse_set_membership:", status_rev)

    # Sizes
    sz_enc_msg = enc_msgs[0].bit_length()/8
    sz_comm = sz(group.serialize(comms[0]))
    sz_enc_msg_share = enc_msg_shares[0][0].bit_length()/8
    sz_enc_rand_share = enc_rand_shares[0][0].bit_length()/8
    sz_pfcomm = sum([sz(group.serialize(pf_item)) for pf_item in pfcomms[0]])
    sz_enc_rand = enc_rands[0].bit_length()/8
    sz_pf_encmsg = sum([pf_item.bit_length()/8 for pf_item in pf_encmsgs[0]])
    sz_pf_encrand = sum([pf_item.bit_length()/8 for pf_item in pf_encrands[0]])
    sz_pf_enc_msg_share = sum([pf_item.bit_length()/8 for pf_item in pfs_enc_msg_shares[0][0]])
    sz_pf_enc_rand_share = sum([pf_item.bit_length()/8 for pf_item in pfs_enc_rand_shares[0][0]])
    
    sz_bbsig = sz(group.serialize(sigs[0]))
    chals, zvs, zrs, zbls = dpk_bbsig_pfs
    sz_dpk_bbsig_pf = sz(group.serialize(chals[0])) + alpha * (sz(group.serialize(zvs[0][0])) + sz(group.serialize(zrs[0][0])) + sz(group.serialize(zbls[0][0]))) 

    sz_bbsplussig = sz(group.serialize(sigs_rev[0][0])) + sz(group.serialize(sigs_rev[0][1])) + sz(group.serialize(sigs_rev[0][2]))
    z, chals, zbSs, zbcs, zbrs, zdelta0s, zdelta1s, zdelta2s = dpk_bbsplussig_pfs
    sz_dpk_bbsplussig_pf = sz(group.serialize(z[0])) + sz(group.serialize(chals[0])) + alpha * (sz(group.serialize(zbSs[0][0])) + sz(group.serialize(zbcs[0][0])) + sz(group.serialize(zbrs[0][0])) + sz(group.serialize(zdelta0s[0][0])) + sz(group.serialize(zdelta1s[0][0])) + sz(group.serialize(zdelta2s[0][0])))

    pprint("size of sender-uploaded input ciphertexts:", (sz_enc_msg + sz_comm + alpha * (sz_enc_msg_share + sz_enc_rand_share + sz_pf_enc_msg_share + sz_pf_enc_rand_share) + sz_pfcomm + sz_enc_rand + sz_pf_encmsg + sz_pf_encrand) * n / (1024 * 1024), "MB")
    pprint("size of verifier-uploaded BB signatures:", sz_bbsig * n / (1024 * 1024), "MB")
    pprint("size of DPK_BBsig proofs:", sz_dpk_bbsig_pf * n / (1024 * 1024), "MB")
    pprint("size of verifier-uploaded BBS+ signatures:", sz_bbsplussig * n / (1024 * 1024), "MB")
    pprint("size of DPK_BBSPlusSig proofs:", sz_dpk_bbsplussig_pf * n / (1024 * 1024), "MB")


if __name__ == "__main__":
    n = int(sys.argv[1])
    alpha = int(sys.argv[2])
    timed(main)(n, alpha)
