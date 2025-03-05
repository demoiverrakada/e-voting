from charm.toolbox.pairinggroup import ZR
from globals import group
from secretsharing import share
from db import load,store
from misc import serialize_wrapper,deserialize_wrapper

def elgamal_th_keygen(alpha,election_id):
    sk = group.random(ZR)
    sklist = share(sk, alpha)
    g1,h1 = load("generators",[election_id,"g1","h1"]).values()
    pk = (g1 ** sk, [g1 ** sklist[a] for a in range(len(sklist))]) 
    return sklist, pk

def elgamal_encrypt(pk, m, election_id,randIn=None, randOut=False):
    _pk, _ = pk
    g1,h1 = load("generators",[election_id,"g1","h1"]).values()
    if randIn is None:
        r  = group.random(ZR)
    else:
        r = randIn
    if randOut:
        return (g1 ** r, m * (_pk ** r)), r
    else:
        return (g1 ** r, m * (_pk ** r))

def elgamal_decrypt(sk, c):
    c1, c2 = c 
    return c2 / (c1 ** sk)

def elgamal_share_decrypt(pk, c, _skshare):
    c1, c2 = c
    return c1 ** _skshare

def elgamal_combine_decshares(pk, cs, decshares,election_id):
    g1,h1 = load("generators",[election_id,"g1","h1"]).values()
    decfactors = [g1 ** 0] * len(cs)
    for a in range(len(decshares)):
        decfactors = [decfactors[i] * decshares[a][i] for i in range(len(cs))]
    c1s, c2s = zip(*cs)
    ms = [c2s[i] / decfactors[i] for i in range(len(cs))]
    return ms

def elgamal_th_decrypt(sklist, c,election_id):
    g1,h1 = load("generators",[election_id,"g1","h1"]).values()
    c1, c2 = c 
    c1term = g1 ** 0
    for k in range(len(sklist)):
        c1term = c1term * (c1 ** sklist[k])
    return c2 / c1term

def elgamal_mult(c1, c2):
    return (c1[0]*c2[0], c1[1]*c2[1])

def elgamal_div(c1, c2):
    return (c1[0]/c2[0], c1[1]/c2[1])

def elgamal_exp(c1, a):
    return (c1[0] ** a, c1[1] ** a)

def elgamal_reencrypt(pk, c, election_id,randIn=None, randOut=False):
    g1,h1 = load("generators",[election_id,"g1","h1"]).values()
    if randOut:
        c_iden, r = elgamal_encrypt(pk, g1 ** 0, election_id,randIn=randIn, randOut=True)
        return elgamal_mult(c, c_iden), r
    else:
        c_iden = elgamal_encrypt(pk, g1 ** 0, election_id,randIn=randIn)
        return elgamal_mult(c, c_iden)

#### Proof of knowledge of correct decryption share ####

def elgamal_share_decryption_batchpf(pk, decshares, cs, deltavec, k, _sklist,election_id):
    """ Batch proof of correctness of the decryption shares. 

    Given ElGamal ciphertexts ((c10,c11),...,(cN0,cN1)) and decryption shares (c1k,...,cNk) for the k^th decryptor alongwith values 
    hk = g_1^{sk_k} as part of the public key, the k^th decryptor proves:
        PK{(d_k): hk = g_1^{sk_k}, c1k = c10^{sk_k}, ..., cNk = cN0^{sk_k}}

    Using batching techniques from the following paper:
        Bellare, M., Garay, J. A., Rabin, T., "Fast Batch Verification for Modular Exponentiation and Digital Signatures", 
        EUROCRYPT 1998, LNCS 1403.
    we can prove the above statement efficiently in a single proof, by asking the verifier to supply deltavec:=[delta,delta1,...,deltaN]
    such that delta,delta1,...,deltaN are drawn randomly from [0,2^kappae-1] (for kappae ~ 80) and proving:
        PK{(d_k): hk^{delta}c1k^{delta1}...cNk^{deltaN} = (g_1^{delta}c10^{delta1}...cN0^{deltaN})^{sk_k}},
    which is a proof of the form PK{(d): a=b^d}. This is efficient because the deltas are small!
    """
    g1,h1 = load("generators",[election_id,"g1","h1"]).values()
    _pk, pklist = pk
    lhs = pklist[k] ** deltavec[0]
    for i in range(1, len(deltavec)):
        lhs = lhs * (decshares[i] ** deltavec[i])

    rhsbase = g1 ** deltavec[0]
    for i in range(1, len(deltavec)):
        rhsbase = rhsbase * (cs[i][0] ** deltavec[i])
    
    # Commit
    r_skshare = group.random(ZR)
    crhsbase = rhsbase ** r_skshare 

    # Challenge
    chal = group.hash((lhs, rhsbase, crhsbase), ZR)

    # Response
    z_skshare = r_skshare - chal*_sklist[k]

    return chal, z_skshare

def elgamal_share_decryption_batchverif(pk, decshares, cs, deltavec, k, pf,election_id):
    g1,h1 = load("generators",[election_id,"g1","h1"]).values()
    _pk, pklist = pk
    lhs = pklist[k] ** deltavec[0]
    for i in range(1, len(deltavec)):
        lhs = lhs * (decshares[i] ** deltavec[i])

    rhsbase = g1 ** deltavec[0]
    for i in range(1, len(deltavec)):
        rhsbase = rhsbase * (cs[i][0] ** deltavec[i])
    
    chal, z_skshare = pf

    verif = ((lhs ** chal) * (rhsbase ** z_skshare))

    return chal == group.hash((lhs, rhsbase, verif), ZR)
