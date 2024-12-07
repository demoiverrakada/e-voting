# Implement the optimisations suggested in the following paper:
#   Ma H., Han S., and Lei H., "Optimized Paillier’s Cryptosystem with Fast 
#   Encryption and Decryption", ACSAC'21, 
#   https://dl.acm.org/doi/pdf/10.1145/3485832.3485842 
#   (Section 3.2)

import gmpy2
import random
import os

from numtheory import oddrandnum, randprime, precompute_powers, powmod_using_precomputing
from misc import timed, pprint, hash_gmpy2

from globals import group, ZR, kappa, kappa_r, kappa_c

### Decide n,l as a function of the security level as per Table 2 of the above paper:
###   Note: The blocksize here refers to the bitlength of each block within which an l-bit number
###   x has been divided, for precomputation purposes. The chosen blocklength is such that it 
###   results in about a 128 MB sized precomputation table. More details in Section 6 of the 
###   above paper (text near Equation 20).
n = 2048
l = 448
blocksize = 13

# Random state for the gmpy2 random operations
rs = gmpy2.random_state(random.randint(0,100000))

def Ngen(debug=True):
    """ The Ngen algorithm, as per Section 3.2 of the above paper. 
    Generally, this algorithm takes about 2-3 minutes to find the primes that satisfy all
    the required conditions. Since this is a preprocessing step to be run much ahead of the
    deployment of the system, this cost does not matter and we do not benchmark it.
    For debugging purposes, we use a hardcoded set of values obtained in one of the previous
    runs, to avoid spending 2-3 minutes every time we run a benchmark.
    """
    while True:
        if debug:
            p = gmpy2.mpz(566143920234629737983748951610274946137113024543800134956594906323)
            q = gmpy2.mpz(4929577754205118911048053787072451147432110097027322064359428798591)
            P = gmpy2.mpz(764477120324447408776882050563798911744066359175890552883700496260525445803283976230882318572094907799491103228029388134386118937982724829472455830392536361122294515696717314876213816332727349550800847938355584240359906804967453757129569038689587680959096173349335461586370271373486912089234928177254423691)
            Q = gmpy2.mpz(28278489992780393461998288721467727426342763686771403399561307150597673820531179329509570242758561404961648238498488305051960273399905530412181557720364194406559812319750735753370844136474361145467455860204518809431529439480691050702462124758469201192028827345584008271525250417650547484951508100786314093979) 
            break

        else:
            p = randprime(l//2)
            q = randprime(l//2)
            pdash = oddrandnum((n-l)//2 - 1)
            qdash = oddrandnum((n-l)//2 - 1)
            P = 2*p*pdash + 1
            Q = 2*q*qdash + 1
            
            if P.is_prime() and Q.is_prime() and \
                gmpy2.gcd(p, q)==1 and \
                gmpy2.gcd(p, pdash)==1 and \
                gmpy2.gcd(p, qdash)==1 and \
                gmpy2.gcd(q, pdash)==1 and \
                gmpy2.gcd(q, qdash)==1 and \
                gmpy2.gcd(qdash, pdash)==1:
                break      
    N = P * Q
    return N, P, Q, p, q

@timed
def pai_keygen(precomputing=None):
    N, P, Q, p, q = Ngen()
    alpha = p * q
    beta = (P-1) * (Q-1) // (4 * p * q)
    while True:
        y = gmpy2.mpz_random(rs, N)
        if gmpy2.gcd(y, N) == 1:
            break
    h = -gmpy2.powmod(y, 2*beta, N)
    N2 = N ** 2
    hN = gmpy2.powmod(h, N, N2)

    hp = gmpy2.invert((gmpy2.powmod(1+N, 2*alpha, P**2) - 1) // P, P)
    hq = gmpy2.invert((gmpy2.powmod(1+N, 2*alpha, Q**2) - 1) // Q, Q)
    PinvmodQ = gmpy2.invert(P, Q)
    QinvmodP = gmpy2.invert(Q, P)

    pai_sk = alpha, P, Q, hp, hq, PinvmodQ, QinvmodP
    pai_pk = (N, h, N2, hN, precomputing)

    if precomputing is None:
        precomputing = bool(int(os.environ.get('precomputing', '1')))

    if precomputing:
        pprint('precomputing...')
        precompute_powers(hN, N2, l, blocksize)

    return pai_sk, pai_pk

def pai_encrypt(pai_pk, m, randIn=None, randOut=False, embedded_q=None):
    N, h, N2, hN, precomputing = pai_pk
    m = gmpy2.mpz(m)
    if randIn is None:
        r = gmpy2.mpz_urandomb(rs, l)
    else:
        r = randIn
    if embedded_q is not None:
        x = gmpy2.mpz_random(rs, embedded_q)
        m = m + embedded_q*x
    cterm = 1+m*N
    if precomputing:
        hterm = powmod_using_precomputing(hN, r, N2, blocksize)
    else:
        hterm = gmpy2.powmod(hN, r, N2)
    if randOut:
        return (cterm * hterm) % N2, r
    else:
        return (cterm * hterm) % N2

def pai_decrypt(pai_pk, pai_sk, pai_c, crt=True, embedded_q=None):
    alpha, P, Q, hp, hq, PinvmodQ, QinvmodP = pai_sk
    N, h, N2, hN, precomputing = pai_pk
    if crt:
        cpterm = gmpy2.powmod(pai_c[0], 2*alpha, P ** 2)
        cqterm = gmpy2.powmod(pai_c[0], 2*alpha, Q ** 2)
        Lpcterm = (cpterm - 1) // P
        Lqcterm = (cqterm - 1) // Q
        mp = (Lpcterm * hp) % P
        mq = (Lqcterm * hq) % Q
        m = (mp * Q * QinvmodP + mq * P * PinvmodQ) % (P * Q)
    else:
        cterm = gmpy2.powmod(pai_c, 2*alpha, N2)
        Lcterm = (cterm - 1) // N 
        muterm = gmpy2.invert(2*alpha, N)
        m = (Lcterm * muterm) % N
    if embedded_q is not None:
        m = group.init(ZR, int(m)) 
    return m

def pai_add(pai_pk, cipher1, cipher2):
    N, h, N2, hN, precomputing = pai_pk
    return (cipher1 * cipher2) % N2

def pai_reencrypt(pai_pk, cipher, embedded_q=None):
    return pai_add(pai_pk, cipher, pai_encrypt(pai_pk, 0, embedded_q=embedded_q))

#### Proof of knowledge of plaintext of a Paillier ciphertext ####

def pkenc_paillier(pai_pk, pai_c, _m, _r):
    """ Proof of knowledge of (_m, _r) s.t. c = (1+N)^m hN^r mod N^2. """
    
    N, h, N2, hN, precomputing = pai_pk

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
    N, h, N2, hN, precomputing = pai_pk
    C, zm, zr = pf

    chal = gmpy2.mpz(hash_gmpy2((pai_c, C)).digits(2)[:kappa_c], 2)

    lhs = (gmpy2.powmod(pai_c, chal, N2) * C) % N2
    rhs = ((1+N*zm) * gmpy2.powmod(hN, zr, N2)) % N2

    return lhs == rhs