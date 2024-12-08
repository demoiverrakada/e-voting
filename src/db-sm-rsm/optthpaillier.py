# Threshold Paillier cryptosystem (for s=1) as per the following paper (based on the optimised version
# suggested in Section 4.1):
#   Damgard I., Jurik M., and Nielsen J. B., "A Generalization of Paillier’s Public-Key System
#   with Applications to Electronic Voting", Intl. J. of Information Security, 2010 
#   https://link.springer.com/content/pdf/10.1007/s10207-010-0119-9.pdf?pdf=inline%20link
#   (Section 5.1)
# Also following this implementation for some tips:
#   https://github.com/cryptovoting/damgard-jurik
#
# Note: we are currently implementing an m-out-of-m scheme instead of the full threshold version, 
# simplifying many complications due to the usage of Shamir secret sharing.

import gmpy2
from math import ceil
import random
import sys
import os

from numtheory import randprime, randcoprime, crm, safe_primes, precompute_powers, powmod_using_precomputing 
from misc import timed, retval, pprint, hash_gmpy2

from globals import group, ZR, kappa_r, kappa_c, kappa_e

# Lengths of prime factors of n
primelength = 1024  # leads to nbits = 2048
blocksize = 13      

# Random state for the gmpy2 random operations
rs = gmpy2.random_state(random.randint(0,100000))

def shareingroup(s, alpha, N):
    """ Create additive shares of secret s in the group modulo N when the number of parties is alpha. """
    shares = []
    sum_others = 0
    for k in range(alpha-1):
        share = gmpy2.mpz_random(rs, N)
        shares.append(share)
        sum_others += share
    shares.append((s - sum_others) % N)
    return shares

@timed
def pai_th_keygen(alpha, precomputing=None, debug=True):
    if debug:
        # In debug mode, we use a hardcoded set of primes to avoid spending a lot of time generating safe primes. This is obviously insecure but
        # since this is a preprocessing step, we are not concerned about the time it takes to securely generate them.
        pdash = gmpy2.mpz(89884656743115795386465259539451236680898848947115328636715040578866337902750481566354238661203768010560056939935696678829394884407208311246423715319737062188883946712432742638151109800623047059726541476042502884419075341171231440736956555270413618581675255342293149119973622969239858152417678164812112897541)
        p = gmpy2.mpz(179769313486231590772930519078902473361797697894230657273430081157732675805500963132708477322407536021120113879871393357658789768814416622492847430639474124377767893424865485276302219601246094119453082952085005768838150682342462881473913110540827237163350510684586298239947245938479716304835356329624225795083)
        qdash = gmpy2.mpz(179769313486231590772930519078902473361797697894230657273430081157732675805500963132708477322407536021120113879871393357658789768814416622492847430639474124377767893424865485276302219601246094119453082952085005768838150682342462881473913110540827237163350510684586298239947245938479716304835356329624224556533)
        q = gmpy2.mpz(359538626972463181545861038157804946723595395788461314546860162315465351611001926265416954644815072042240227759742786715317579537628833244985694861278948248755535786849730970552604439202492188238906165904170011537676301364684925762947826221081654474326701021369172596479894491876959432609670712659248449113067)
    else:
        while True:
            pdash, p = safe_primes(2 ** primelength)
            qdash, q = safe_primes(2 ** (primelength+1))
            if p % 4 == 3 and q % 4 == 3:
                break
    assert p.is_prime()
    assert pdash.is_prime()
    assert q.is_prime()
    assert qdash.is_prime()
    assert p == 2 * pdash + 1
    assert q == 2 * qdash + 1
    assert p % 4 == 3
    assert q % 4 == 3
    assert gmpy2.gcd(p-1, q-1) == 2

    n = p*q
    m = pdash * qdash
    n2 = n ** 2

    # Generating generator h of the group Zn*[+] as per Section 4.1 of the paper - to obtain 
    # optimised encryptions.
    x = randcoprime(n)
    h = (-gmpy2.powmod(x, 2, n2)) % n2
    hn = gmpy2.powmod(h, n, n2)
    kappa = n.bit_length()

    # Note that as per the optimised scheme given in Section 4.1 of the above paper, the secret key
    # lambda = (p-1)(q-1)/2, which equals 2p'q' if p=2p'+1 and q=2q'+1. This means lambda = 2m. This 
    # can therefore be threshold decrypted exactly as in Section 5.1 of the same paper.
    d = crm((0,1), (m, n))

    # Generate secret shares
    dshares = shareingroup(d, alpha, n*m)

    # Generate public values
    vs = []
    v = gmpy2.mpz_random(rs, n)
    for i in range(alpha):
        vs.append(gmpy2.powmod(v, dshares[i], n2))
    inv4 = gmpy2.invert(4, n)

    if precomputing is None:
        precomputing = bool(int(os.environ.get('precomputing', '1')))

    if precomputing:
        pprint('precomputing...')
        precompute_powers(hn, n2, ceil(kappa/2), blocksize)

    pai_pk = n, n2, inv4, h, hn, kappa, v, vs, precomputing
    pai_sklist = dshares

    return pai_sklist, pai_pk

def pai_encrypt(pai_pk, M, randIn=None, randOut=False, embedded_q=None):
    """ Encrypt the given message M under paillier public key pai_pk. 
    If randIn is None, a random value is used for the randomness. 
    If randOut is True, the randomness is returned. 
    If embedded_q is not None, the actual encrypted message is M+embedded_q*x for a random x. 
    """
    
    n, n2, inv4, h, hn, kappa, v, vs, precomputing = pai_pk
    M = gmpy2.mpz(M)
    if randIn is None:
        r = gmpy2.mpz_urandomb(rs, ceil(kappa/2))
    else:
        r = randIn
    if embedded_q is not None:
        x = gmpy2.mpz_random(rs, embedded_q)
        M = M + embedded_q*x
    cterm = 1+M*n
    if precomputing:
        rn = powmod_using_precomputing(hn, r, n2, blocksize)
    else:
        rn = gmpy2.powmod(hn, r, n2)
    if randOut:
        return (cterm * rn) % n2, r
    else:
        return (cterm * rn) % n2

def pai_share_decrypt(pai_pk, pai_c, _pai_skshare):
    """ Share decryption by the k^th server. """

    n, n2, inv4, h, hn, kappa, v, vs, precomputing = pai_pk
    return gmpy2.powmod(pai_c, gmpy2.mpz(4*_pai_skshare), n2)

def pai_combine_decshares(pai_pk, pai_cshares, embedded_q=None):
    n, n2, inv4, h, hn, kappa, v, vs, precomputing = pai_pk

    pai_cdashes = []
    for i in range(len(pai_cshares[0])):
        pai_cdash = 1
        for a in range(len(vs)):
            pai_cdash = (pai_cdash * pai_cshares[a][i]) % n2
        pai_cdashes.append(pai_cdash)

    ms = [(((pai_cdash - 1) // n) * inv4) % n for pai_cdash in pai_cdashes]

    if embedded_q is not None:
        ms = [group.init(ZR, int(m)) for m in ms]

    return ms

def pai_add(pai_pk, cipher1, cipher2):
    n, n2, inv4, h, hn, kappa, v, vs, precomputing = pai_pk
    cipher3 = (cipher1 * cipher2)
    print(cipher3)
    return (cipher3) % n2

def pai_reencrypt(pai_pk, cipher, randIn=None, randOut=False, embedded_q=None):
    c, r = pai_encrypt(pai_pk, 0, randIn=randIn, randOut=True, embedded_q=embedded_q)
    if randOut:
        return pai_add(pai_pk, cipher, c), r
    else:
        return pai_add(pai_pk, cipher, c)

#### Proof of knowledge of the encrypted message ####

def pkenc_paillier(pai_pk, pai_c, _m, _r):
    """ Proof of knowledge of (_m, _r) s.t. c = (1+N)^m hN^r mod N^2. """
    
    N, N2, inv4, h, hN, kappa, v, vs, precomputing = pai_pk

    # Commit
    rm = gmpy2.mpz_urandomb(rs, kappa+2*kappa_r+kappa_c)
    rr = gmpy2.mpz_urandomb(rs, kappa+2*kappa_r+kappa_c)
    C = (1+N*rm) * gmpy2.powmod(hN, rr, N2)

    # Challenge
    chal = gmpy2.mpz(hash_gmpy2((pai_c, C)).digits(2)[:kappa_c], 2)

    # Response
    zm = gmpy2.t_mod_2exp(rm + chal*gmpy2.mpz(_m), kappa+2*kappa_r+kappa_c)
    zr = gmpy2.t_mod_2exp(rr + chal*gmpy2.mpz(_r), kappa+2*kappa_r+kappa_c)

    return C, zm, zr

def pkenc_paillier_verif(pai_pk, pai_c, pf):
    N, N2, inv4, h, hN, kappa, v, vs, precomputing = pai_pk
    C, zm, zr = pf

    chal = gmpy2.mpz(hash_gmpy2((pai_c, C)).digits(2)[:kappa_c], 2)

    lhs = (gmpy2.powmod(pai_c, chal, N2) * C) % N2
    rhs = ((1+N*zm) * gmpy2.powmod(hN, zr, N2)) % N2

    return lhs == rhs

#### (Batched) proofs of correct generation of decryption shares #####

def pai_share_decryption_batchpf(pai_pk, pai_cshares, pai_cs, deltavec, k, _pai_sklist):
    """ Batch proof of correctness of the decryption shares. 

    Given ciphertexts (c1,...,cN) and decryption shares (c1k,...,cNk) for the k^th decryptor alongwith values 
    v and vk = v^{d_k} as part of the public key, the k^th decryptor proves:
        PK{(d_k): vk = v^{d_k}, c1k = c1^{4.d_k}, ..., cNk = cN^{4.d_k}}

    Using batching techniques from the following paper:
        Bellare, M., Garay, J. A., Rabin, T., "Fast Batch Verification for Modular Exponentiation and Digital Signatures", 
        EUROCRYPT 1998, LNCS 1403.
    we can prove the above statement efficiently in a single proof, by asking the verifier to supply deltavec:=[delta,delta1,...,deltaN]
    such that delta,delta1,...,deltaN are drawn randomly from [0,2^kappae-1] (for kappae ~ 80) and proving:
        PK{(d_k): vk^{delta}c1k^{delta1}...cNk^{deltaN} = (v^{4.delta}c1^{4.delta1}...cN^{4.deltaN})^{d_k}},
    which is a proof of the form PK{(d): a=b^d}. This is efficient because the deltas are small!
    """

    n, n2, inv4, h, hn, kappa, v, vs, precomputing = pai_pk
    _dshare = _pai_sklist[k]
    pai_csharedash = gmpy2.powmod(vs[k], deltavec[0], n2)
    for i in range(1, len(deltavec)):
        pai_csharedash = gmpy2.t_mod(pai_csharedash * gmpy2.powmod(pai_cshares[i], deltavec[i], n2), n2)
    pai_cdash = gmpy2.powmod(v, deltavec[0], n2)
    for i in range(1, len(deltavec)):
        pai_cdash = gmpy2.t_mod(pai_cdash * gmpy2.powmod(pai_cs[i], 4*deltavec[i], n2), n2)

    # Commit
    rdshare = gmpy2.mpz_urandomb(rs, kappa+kappa_e)
    cpaicdash = gmpy2.powmod(pai_cdash, rdshare, n2)

    # Challenge
    chal = hash_gmpy2((pai_csharedash, pai_cdash, cpaicdash))
    chal_small = gmpy2.mpz(chal.digits(2)[:kappa_e], 2)

    # Response
    zdshare = rdshare - chal_small*_dshare

    return chal, zdshare

def pai_share_decryption_batchverif(pai_pk, pai_cshares, pai_cs, deltavec, k, pf):
    n, n2, inv4, h, hn, kappa, v, vs, precomputing = pai_pk
    pai_csharedash = gmpy2.powmod(vs[k], deltavec[0], n2)
    for i in range(1, len(deltavec)):
        pai_csharedash = gmpy2.t_mod(pai_csharedash * gmpy2.powmod(pai_cshares[i], deltavec[i], n2), n2)
    pai_cdash = gmpy2.powmod(v, deltavec[0], n2)
    for i in range(1, len(deltavec)):
        pai_cdash = gmpy2.t_mod(pai_cdash * gmpy2.powmod(pai_cs[i], 4*deltavec[i], n2), n2)

    chal, zdshare = pf
    chal_small = gmpy2.mpz(chal.digits(2)[:kappa_e], 2)

    verif = (gmpy2.powmod(pai_csharedash, chal_small, n2) * gmpy2.powmod(pai_cdash, zdshare, n2)) % n2

    return chal == hash_gmpy2((pai_csharedash, pai_cdash, verif))