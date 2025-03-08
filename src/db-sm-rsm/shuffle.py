# Following the proof of shuffle ideas in the following papers:
# 1. D. Wikstrom, "A commitment-consistent proof of a shuffle", ACISP 2009, https://eprint.iacr.org/2011/168.pdf
# 2. B. Terelius, D. Wikstrom, "Proofs of restricted shuffles", AFRICACRYPT 2010, https://www.csc.kth.se/~dog/research/papers/TW10Conf.pdf
# 3. I. Damgard, M. Jurik, "A generalization of Paillier's public key system with applications to electronic voting", Intl. J. of Information Security, 2010, https://link.springer.com/content/pdf/10.1007/s10207-010-0119-9.pdf?pdf=inline%20link

from math import ceil
from copy import copy
import random

from charm.toolbox.pairinggroup import ZR, G1
import gmpy2

from globals import group, iden, logq, kappa_e, kappa_c, kappa_r, kappaby2
from numtheory import randcoprime
from perm import gen_rand_perm
from misc import timed, retval, hash_gmpy2, pprint
from db import load,store
kappaby2dash = kappaby2+kappa_e+20 # this is for \sum_{i=1}^{n} r_ie_i, where each r_i is kappaby2 bits long.

# Random state for the gmpy2 random operations
rs = gmpy2.random_state(random.randint(0,100000))

#### Utilities ############################################################################

def commkey(n,election_id):
    # Ensuring we generate at least two generators because the generating set of the Paillier 
    # ciphertext is of size 2. Protocol 15 of the first paper above (step 2) then requires that 
    # the commitment key must support at least two elements. 
    g1,h1=load("generators",["g1","h1"],election_id).values()
    return n, h1, [group.random(G1) for i in range(max(n,2))]

def commit_vector(ck, vs, s):
    n, h1, gs = ck
    res = h1 ** group.init(ZR, int(s))
    for i in range(len(vs)):
        res *= gs[i] ** (group.init(ZR, int(vs[i])))
    return res

def commkey_fo(n, N):
    """ Commitment key for the Fujisaki-Okamoto commitments (n+1 generators of SQ(N) group). """
    comm_fo = []
    for i in range(max(n,2)+1):
        x = randcoprime(N)
        comm_fo.append(gmpy2.powmod(x, 2, N))
    return n, N, comm_fo[0], comm_fo[1:]

def commit_vector_fo(ck_fo, vs, s):
    """ Commit to a vector using the Fujisaki-Okamoto commitment. """
    n, N, g_fo, gs_fo = ck_fo
    
    res = gmpy2.powmod(g_fo, s, N)
    for i in range(len(vs)):
        res = gmpy2.t_mod(res * gmpy2.powmod(gs_fo[i], gmpy2.mpz(vs[i]), N), N)
    return res

def commit_matrix(ck, M, svec):
    return [commit_vector(ck, M[i], svec[i]) for i in range(len(M))]

def commit_perm(ck, repi, svec):
    """ Use the above matrix formulation to commit to a *permutation matrix*, but much more efficiently.
    
    The input is the inverse of the permutation one wants to commit, aka the "reverse permutation."
    """
    n, h1, gs = ck
    return [(h1 ** svec[i]) * gs[repi[i]] for i in range(n)]

def permmat(pi, n):
    """ Obtain an nxn matrix representation of a permutation pi such that M[e_1, ..., e_n] = [e_{pi(1)}, ..., e_{pi(n)}]. """
    M = []
    for i in range(n):
        M.append([])
        for j in range(n):
            M[-1].append(0)
    for i in range(n):
        M[i][pi[i]] = 1
    return M

def applyperm(evec, pi):
    """ Apply a given permutation function pi to the given list evec to obtain a new list evecdash. """
    return [evec[pi[i]] for i in range(len(evec))]

def dot(u, v, mod=None):
    """ Given vectors u:=(u1,...,un) and v:=(v1,...,vn), compute their dot product u1v1 + ... + unvn. 
    
    If `mod' is not None, it is interpreted as the modulus under which the operation is to be performed.
    """
    if mod is None:
        return sum(u[i]*v[i] for i in range(len(u)))
    else:
        res = gmpy2.t_mod(u[0] * v[0], mod)
        for i in range(1, len(u)):
            res = gmpy2.t_mod(res + u[i]*v[i], mod)
    return res

def expprod(basevec, expvec, mod=None):
    """ Given base vector (b1,...,bk) and exponent vector (e1,...,ek), compute the product b1^e1...bk^ek. 
    
    The optional argument `mod' is used to specify the modulus of exponentiation (only to be specified 
    when the exponentiation operation is to be performed by gmp). 
    """

    if mod is None:
        res = basevec[0] ** expvec[0]
        for i in range(1, len(basevec)):
            res *= basevec[i] ** expvec[i]
    else:
        res = gmpy2.powmod(basevec[0], gmpy2.mpz(expvec[0]), mod)
        for i in range(1, len(basevec)):
            res = gmpy2.t_mod(res * gmpy2.powmod(basevec[i], gmpy2.mpz(expvec[i]), mod), mod)
    return res

#### Proof of knowledge of the opening of a permutation matrix commitment. #########################

def compute_perm_nizkproof(ck, evec, _pi, _svec,election_id):
    n, h1, gs = ck
    g1,h12=load("generators",["g1","h1"],election_id).values()
    t = sum(_svec)
    edashvec = applyperm(evec, _pi)
    sdashvec = [group.random(ZR) for i in range(n)]
    k = dot(_svec, evec)
    B = [(h1 ** sdashvec[0]) * (g1 ** edashvec[0])]
    for i in range(1, n):
        B.append((h1 ** sdashvec[i]) * (B[i-1] ** edashvec[i]))
    w = sdashvec[0]
    for i in range(1,n):
        w = sdashvec[i] + w*edashvec[i]
    return B, t, k, edashvec, sdashvec, w

def commitmsg_perm_nizkproof(ck, B,election_id):
    g1,h12= load("generators",["g1","h1"],election_id).values()
    n, h1, gs = ck
    rt = group.random(ZR)
    rk = group.random(ZR)
    redash, rsdash = [], []
    for i in range(n):
        redash.append(group.random(ZR))
        rsdash.append(group.random(ZR))
    rw = group.random(ZR)
    C1 = h1 ** rt
    C2 = h1 ** rk
    for i in range(n):
        C2 *= gs[i] ** redash[i]
    CB = [(h1 ** rsdash[0]) * (g1 ** redash[0])]
    for i in range(1,n):
        CB.append((h1 ** rsdash[i]) * (B[i-1] ** redash[i]))
    CU = h1 ** rw
    return C1, C2, CB, CU, rt, rk, redash, rsdash, rw

def respmsg_perm_nizkproof(ck, t, k, edashvec, sdashvec, w, rt, rk, redash, rsdash, rw, c):
    n, h1, gs = ck
    zt = rt - t*c
    zk = rk - k*c
    zedash, zsdash = [], []
    for i in range(n):
        zedash.append(redash[i] - edashvec[i]*c)
        zsdash.append(rsdash[i] - sdashvec[i]*c)
    zw = rw - w*c
    return zt, zk, zedash, zsdash, zw

def lhs_perm_nizkverif(ck, a, evec, B,election_id):
    n, h1, gs = ck
    g1,h12=load("generators",["g1","h1"],election_id).values()
    LC1 = group.init(G1, iden)
    A = group.init(G1, iden)
    GS = group.init(G1, iden)
    for i in range(n):
        A *= a[i]
        GS *= gs[i]
    LC1 = A * (GS ** (-1))
    LC2 = group.init(G1, iden)
    for i in range(n):
        LC2 *= a[i] ** evec[i]
    LB = B
    LW = LB[-1]
    eprod = group.init(ZR, 1)
    for i in range(n):
        eprod *= evec[i]
    LW *= g1 ** (-eprod)
    return LC1, LC2, LB, LW

def rhs_perm_nizkverif(ck, B, zt, zk, zedash, zsdash, zw,election_id):
    n, h1, gs = ck
    g1,h12= load("generators",["g1","h1"],election_id).values()
    ZC1 = h1 ** zt
    ZC2 = h1 ** zk
    for i in range(n):
        ZC2 *= gs[i] ** zedash[i]
    ZB = [(h1 ** zsdash[0]) * (g1 ** zedash[0])]
    for i in range(1, n):
        ZB.append((h1 ** zsdash[i]) * (B[i-1] ** zedash[i]))
    ZW = h1 ** zw
    return ZC1, ZC2, ZB, ZW

def perm_nizkproof(ck, a, evec, _pi, _svec,election_id):
    """ Proof of knowledge of the opening of a permutation matrix commitment (see protocol 1
    of paper 2 above): 
    
    PK{(t, k, (e1',...,en')): 
        h1^t gs1^1 ... gsn^1 = a1^1 ... an^1 AND 
        h1^k gs1^e1' ... gsn^en' = a1^e1 ... an^en AND
        e1' ... en' = e1 ... en 
    }

    which can be proved as:

    PK{(t, k, (e1',...,en'), (s1',...,sn'), w): 
        (a1 ... an)/(gs1 ... gsn) = h1^t                     AND 
        a1^e1 ... an^en           = h1^k gs1^e1' ... gsn^en' AND
        b1                        = h1^s1' g1^e1'            AND 
        b2                        = h1^s2' b1^e2'            AND 
        ...                                                  AND 
        bn                        = h1^sn' (bn-1)^en'        AND
        bn/(g1^(e1...en))         = h1^w 
    }

    where (e1,...,en) are supplied by the verifier,
          a = (h1^s1, gs_{piinv(1)},...,h1^sn, gs_{piinv(n)}), 
          t = dot((1,...,1), (s1,...,sn)) = sum((s1,...,sn))
          k = dot((s1,...,sn),(e1,...,en)),
          (e1',...,en') = (e_{pi(1)},...,e_{pi(n)}),
          (s1',...,sn') <-$-- Zq
          w = sn'+(...s3'+(s2'+s1'e1'e2')e3'...)en' 

    Note that unlike the original paper, the permutation here is expressed as a function rather
    than as a matrix, but this does not affect the proof at all since the proof only depends on 
    a list obtained by *applying* the permutation to an input list.
    """

    # Compute
    evec = [group.init(ZR, int(e)) for e in evec]
    B, t, k, edashvec, sdashvec, w = compute_perm_nizkproof(ck, evec, _pi, _svec,election_id)

    # Commit
    C1, C2, CB, CU, rt, rk, redash, rsdash, rw = commitmsg_perm_nizkproof(ck, B,election_id)

    # Challenge
    c = group.hash((a, evec) + (C1, C2) + tuple(CB) + (CU, ), type=ZR)

    # Response
    zt, zk, zedash, zsdash, zw = respmsg_perm_nizkproof(ck, t, k, edashvec, sdashvec, w, rt, rk, redash, rsdash, rw, c)

    return B, c, zt, zk, zedash, zsdash, zw

def perm_nizkverif(ck, a, evec, pf,election_id):
    """ Verify the proof of knowledge of the opening of a permutation matrix commitment.
    
    Recall the POK:

    PK{(t, k, (e1',...,en'), (s1',...,sn'), w): 
        (a1 ... an)/(gs1 ... gsn) = h1^t AND 
        a1^e1 ... an^en = h1^k gs1^e1' ... gsn^en' AND
        b1 = h1^s1' g1^e1' AND b2 = h1^s2' b1^e2' AND .... AND bn = h1^sn' (bn-1)^en' AND
        bn/(g1^(e1...en)) = h1^w 
    }
    """
    n, h1, gs = ck
    B, c, zt, zk, zedash, zsdash, zw = pf

    # LHS of the equation
    evec = [group.init(ZR, int(e)) for e in evec]
    LC1, LC2, LB, LW = lhs_perm_nizkverif(ck, a, evec, B,election_id)

    # RHS of the equation, but evaluated using the z-values received from the prover
    ZC1, ZC2, ZB, ZW = rhs_perm_nizkverif(ck, B, zt, zk, zedash, zsdash, zw,election_id)

    verif = (
        ((LC1 ** c) * ZC1, 
         (LC2 ** c) * ZC2) + 
        tuple([(LB[i] ** c) * ZB[i] for i in range(n)]) + 
        ((LW ** c) * ZW, )
    )

    return c == group.hash((a,evec) + verif, type=ZR)

#### Proof of an El Gamal shuffle ################################################################

def shuffle_elgamal_nizkproof(ck, elgpk, cinvec, coutvec, permcomm, evec, _pi, _svec, _rvec,election_id):
    """ Proof that coutvec is a permutation and re-encryption of cinvec under the El Gamal 
    encryption scheme (protocol 3 of paper 2 above): 
    
    PK{(t, k, (e1',...,en'), (s1',...,sn'), w, u): 
        // PoK of the opening of a permutation matrix commitment (see function perm_nizkproof)
        (permcomm1 ... permcommn)/(gs1 ... gsn) = h1^t AND 
        permcomm1^e1 ... permcommn^en = h1^k gs1^e1' ... gsn^en' AND
        b1 = h1^s1' g1^e1' AND b2 = h1^s2' b1^e2' AND .... AND bn = h1^sn' (bn-1)^en' AND
        bn/(g1^(e1...en)) = h1^w

        // PoK that ElGamal ciphertexts are re-encrypted and permuted under the committed permutation: c1^e1'...cn^en' = c1^e1...cn^en E(1,u) 
        c1[0]^e1...cn[0]^en = (g1^(-u) c1'[0]^e1' ... cn'[0]^en') AND  // El Gamal ciphertext's first component
        c1[1]^e1...cn[1]^en = (elgpk^(-u) c1'[1]^e1' ... cn'[1]^en')   // El Gamal ciphertext's second component
    }
    """
    _elgpk, _elgpklist = elgpk

    # Compute
    n, h1, gs = ck
    g1,h12= load("generators",["g1","h1"],election_id).values()
    evec = [group.init(ZR, int(e)) for e in evec]
    B, t, k, edashvec, sdashvec, w = compute_perm_nizkproof(ck, evec, _pi, _svec,election_id)
    u = dot(_rvec, evec)

    # Commit
    C1, C2, CB, CU, rt, rk, redash, rsdash, rw = commitmsg_perm_nizkproof(ck, B,election_id)
    ru = group.random(ZR)
    CC = (g1 ** (-ru), _elgpk ** (-ru))
    for i in range(n):
        CC = (CC[0] * (coutvec[i][0] ** redash[i]), CC[1] * (coutvec[i][1] ** redash[i]))

    # Challenge
    c = group.hash((cinvec, coutvec, permcomm, evec) + (C1, C2) + tuple(CB) + (CU, ) + CC, type=ZR)

    # Response
    zt, zk, zedash, zsdash, zw = respmsg_perm_nizkproof(ck, t, k, edashvec, sdashvec, w, rt, rk, redash, rsdash, rw, c)
    zu = ru - u*c

    return B, c, zt, zk, zedash, zsdash, zw, zu

def shuffle_elgamal_nizkverif(ck, elgpk, cinvec, coutvec, permcomm, evec, pf,election_id):
    """ Verify the proof that coutvec is a permutation and re-encryption of cinvec under the 
    El Gamal encryption scheme.
    
    Recall the POK:

    PK{(t, k, (e1',...,en'), (s1',...,sn'), w, u): 
        // PoK of the opening of a permutation matrix commitment (see function perm_nizkproof)
        (permcomm1 ... permcommn)/(gs1 ... gsn) = h1^t AND 
        permcomm1^e1 ... permcommn^en = h1^k gs1^e1' ... gsn^en' AND
        b1 = h1^s1' g1^e1' AND b2 = h1^s2' b1^e2' AND .... AND bn = h1^sn' (bn-1)^en' AND
        bn/(g1^(e1...en)) = h1^w

        // PoK that ElGamal ciphertexts are re-encrypted and permuted under the committed permutation: c1^e1'...cn^en' = c1^e1...cn^en E(1,u) 
        c1[0]^e1...cn[0]^en = (g1^(-u) c1'[0]^e1' ... cn'[0]^en') AND  // El Gamal ciphertext's first component
        c1[1]^e1...cn[1]^en = (elgpk^(-u) c1'[1]^e1' ... cn'[1]^en')   // El Gamal ciphertext's second component
    }
    """
    _elgpk, _elgpklist = elgpk
    g1,h12= load("generators",["g1","h1"],election_id).values()
    n, h1, gs = ck
    B, c, zt, zk, zedash, zsdash, zw, zu = pf
    
    # LHS of the equation
    evec = [group.init(ZR, int(e)) for e in evec]
    LC1, LC2, LB, LW = lhs_perm_nizkverif(ck, permcomm, evec, B,election_id)
    LCC1, LCC2 = group.init(G1, iden), group.init(G1, iden)  # Note that x = group.init(G1, iden) gives an identity element whereas x = iden does not!
    for i in range(n):
        LCC1 *= (cinvec[i][0] ** evec[i])
        LCC2 *= (cinvec[i][1] ** evec[i])

    # RHS of the equation, but evaluated using the z-values received from the prover
    ZC1, ZC2, ZB, ZW = rhs_perm_nizkverif(ck, B, zt, zk, zedash, zsdash, zw,election_id)
    ZCC1, ZCC2 = (g1 ** (-zu), _elgpk ** (-zu))
    for i in range(n):
        ZCC1 *= coutvec[i][0] ** zedash[i]
        ZCC2 *= coutvec[i][1] ** zedash[i]

    verif = (
        ((LC1 ** c) * ZC1, 
         (LC2 ** c) * ZC2) + 
        tuple([(LB[i] ** c) * ZB[i] for i in range(n)]) + 
        ((LW ** c) * ZW, ) +
        ((LCC1 ** c) * ZCC1, (LCC2 ** c) * ZCC2)
    )

    return c == group.hash((cinvec, coutvec, permcomm, evec) + verif, type=ZR)

#### Proof of a Paillier shuffle ################################################################

def shuffle_paillier_pf_equalexp(ck, ck_fo, paipk, cinvec, coutvec, evec, _pi, _svec):
    """ Proof of equal exponents (protocol 26 in Appendix D.2 of paper 1 above, which is invoked at step 3 of
    protocol 15 of the same paper): 
    
    PK{(e0 in Zq, (t0, t1, t2)  in Zq, (e1',...,en') in [0,2^{kappa_e}-1]): 
        a  = h1^e0 gs1^e1' ... gsn^en' AND
        b1 = h1^t0 gs1^t1 gs2^t2 AND
        b2 = (1+N)^t1 (h^N)^t2 c1'^e1' ... cn'^en' mod N^2 (where N is the Paillier modulus)
    }

    where 
        (N,h) is the public key of the optimised threshold Paillier cryptosystem by Damgard-Jurik where Enc(m;r) = (1+N)^m (h^N)^r mod N^2,
        a = a1^e1 ... an^en is computed by both the prover and the verifier from the permutation commitment (a1,...,an) in protocol 15,
        b1, b2 are calculated by the prover and given to the verifier in protocol 15,
        e1',...,en' are permuted versions of e1, ..., en in protocol 15; and
        e0, t0, t1, t2 are fresh randomnesses generated by the prover in protocol 15.

    The optimised threshold Paillier scheme we are following is given in Section 4.1 of the following paper: 
        Damgard I., Jurik M., and Nielsen J. B., "A Generalization of Paillier’s Public-Key System
        with Applications to Electronic Voting", Intl. J. of Information Security, 2010 
        https://link.springer.com/content/pdf/10.1007/s10207-010-0119-9.pdf?pdf=inline%20link   
    """

    # Compute
    n, h1, gs = ck
    N, N2, inv2, h, hN, kappa, v, vs, precomputing = paipk
    
    evec = [group.init(ZR, int(e)) for e in evec]
    e0 = dot(_svec, evec)
    edashvec = applyperm(evec, _pi)
    a = commit_vector(ck, edashvec, e0)

    t0, t1, t2 = group.random(ZR, 3)
    b1 = commit_vector(ck, [t1, t2], t0)
    b2 = expprod([1+N, hN] + coutvec, [t1,t2] + edashvec, mod=N2)
    y1 = gmpy2.mpz_urandomb(rs, kappa+kappa_r)
    y2 = gmpy2.mpz_urandomb(rs, kappa+kappa_r)
    z1 = commit_vector_fo(ck_fo, edashvec, y1)
    z2 = commit_vector_fo(ck_fo, [t1, t2], y2)
    
    # Commit
    re0 = gmpy2.mpz_urandomb(rs, kappa+2*kappa_r+kappa_c)
    rt0 = gmpy2.mpz_urandomb(rs, kappa+2*kappa_r+kappa_c)
    ry1 = gmpy2.mpz_urandomb(rs, kappa+2*kappa_r+kappa_c)
    ry2 = gmpy2.mpz_urandomb(rs, kappa+2*kappa_r+kappa_c)
    redashvec = [gmpy2.mpz_urandomb(rs, kappa_e+kappa_r+kappa_c) for i in range(n)]
    rt1 = gmpy2.mpz_urandomb(rs, logq+kappa_r+kappa_c)
    rt2 = gmpy2.mpz_urandomb(rs, logq+kappa_r+kappa_c)
    
    Ca = commit_vector(ck, redashvec, re0)
    Cb1 = commit_vector(ck, [rt1, rt2], rt0)
    Cb2 = expprod([1+N, hN] + coutvec, [rt1,rt2] + redashvec, mod=N2)
    Cz1 = commit_vector_fo(ck_fo, redashvec, ry1)
    Cz2 = commit_vector_fo(ck_fo, [rt1, rt2], ry2)

    # Challenge 
    # (split the hash computation in two steps - one for items in the pairing group and other for gmpy2 integers.)
    chal_partial = group.hash((a, evec) + (Ca, Cb1), type=ZR)
    chal = gmpy2.mpz(hash_gmpy2((gmpy2.mpz(chal_partial), cinvec, coutvec, Cb2, Cz1, Cz2)).digits(2)[:kappa_e], 2)

    # Response
    de0 = gmpy2.t_mod_2exp(re0 + chal*gmpy2.mpz(e0), kappa+2*kappa_r+kappa_c)
    dt0 = gmpy2.t_mod_2exp(rt0 + chal*gmpy2.mpz(t0), kappa+2*kappa_r+kappa_c)
    dedashvec = [gmpy2.t_mod_2exp(redashvec[i] + chal*gmpy2.mpz(edashvec[i]), kappa_e+kappa_r+kappa_c) for i in range(n)]
    dt1 = gmpy2.t_mod_2exp(rt1 + chal*gmpy2.mpz(t1), logq+kappa_r+kappa_c)
    dt2 = gmpy2.t_mod_2exp(rt2 + chal*gmpy2.mpz(t2), logq+kappa_r+kappa_c)
    dy1 = gmpy2.t_mod_2exp(ry1 + chal*gmpy2.mpz(y1), kappa+2*kappa_r+kappa_c)
    dy2 = gmpy2.t_mod_2exp(ry2 + chal*gmpy2.mpz(y2), kappa+2*kappa_r+kappa_c)

    return b1, b2, (z1, z2, Ca, Cb1, Cb2, Cz1, Cz2, de0, dt0, dedashvec, dt1, dt2, dy1, dy2), t0, t1, t2

def shuffle_paillier_verif_equalexp(ck, ck_fo, paipk, cinvec, coutvec, permcomm, evec, b1, b2, pf):
    """ Verification of the proof of equal exponents. """

    n, h1, gs = ck
    N, N2, inv2, h, hN, kappa, v, vs, precomputing = paipk
    evec = [group.init(ZR, int(e)) for e in evec]
    a = expprod(permcomm, evec)
    z1, z2, Ca, Cb1, Cb2, Cz1, Cz2, de0, dt0, dedashvec, dt1, dt2, dy1, dy2 = pf
    chal_partial = group.hash((a, evec) + (Ca, Cb1), type=ZR)
    chal = gmpy2.mpz(hash_gmpy2((gmpy2.mpz(chal_partial), cinvec, coutvec, Cb2, Cz1, Cz2)).digits(2)[:kappa_e], 2)

    # LHS of the equation
    La = (a ** group.init(ZR, int(chal))) * Ca
    Lb1 = (b1 ** group.init(ZR, int(chal))) * Cb1
    Lb2 = gmpy2.t_mod(gmpy2.powmod(b2, chal, N2) * Cb2, N2)
    Lz1 = gmpy2.t_mod(gmpy2.powmod(z1, chal, N) * Cz1, N)
    Lz2 = gmpy2.t_mod(gmpy2.powmod(z2, chal, N) * Cz2, N)
    
    # RHS of the equation, but evaluated using the z-values received from the prover
    Ra = commit_vector(ck, dedashvec, de0)
    Rb1 = commit_vector(ck, [dt1, dt2], dt0)
    Rb2 = expprod([1+N, hN] + coutvec, [dt1,dt2] + dedashvec, mod=N2)
    Rz1 = commit_vector_fo(ck_fo, dedashvec, dy1)
    Rz2 = commit_vector_fo(ck_fo, [dt1, dt2], dy2)

    return La == Ra and Lb1 == Rb1 and Lb2 == Rb2 and Lz1 == Rz1 and Lz2 == Rz2

def shuffle_paillier_pf_renc(ck, ck_fo, paipk, b1, b2, c, _r, _t0, _t1, _t2):
    """ Proof of correct re-encryption (invoked at step 4 of protocol 15 of paper 1 above; using the general framework of 
    Fujisaki-Okamoto commitments given in protocol 23 of the same paper): 
    
    PK{(r in Z_{ord(h)}, (t0, t1, t2)  in Zq: 
        b1 = h1^t0 gs1^t1 gs2^t2 AND
        b2/c = (1+N)^t1 (h^N)^{t2+r} mod N^2 (where N is the Paillier modulus)
    }

    where 
        (N,h) is the public key of the optimised threshold Paillier cryptosystem by Damgard-Jurik where Enc(m;r) = (1+N)^m (h^N)^r mod N^2,
        b1, b2 are calculated by the prover and given to the verifier in protocol 15,
        c = c_1^e_1 ... c_n^e_n is calculated by both the prover and the verifier in protocol 15,
        r = r1e1 + ... + rnen is calculated by the prover in protocol 15.

    The optimised threshold Paillier scheme we are following is given in Section 4.1 of the following paper: 
        Damgard I., Jurik M., and Nielsen J. B., "A Generalization of Paillier’s Public-Key System
        with Applications to Electronic Voting", Intl. J. of Information Security, 2010 
        https://link.springer.com/content/pdf/10.1007/s10207-010-0119-9.pdf?pdf=inline%20link   
    """

    # Compute
    n, h1, gs = ck
    N, N2, inv2, h, hN, kappa, v, vs, precomputing = paipk
    
    y1 = gmpy2.mpz_urandomb(rs, kappa+kappa_r)
    y2 = gmpy2.mpz_urandomb(rs, kappa+kappa_r)
    z1 = commit_vector_fo(ck_fo, [_r], y1)
    z2 = commit_vector_fo(ck_fo, [_t1, _t2], y2)
    
    # Commit
    rt0 = gmpy2.mpz_urandomb(rs, kappa+2*kappa_r+kappa_c)
    ry1 = gmpy2.mpz_urandomb(rs, kappa+2*kappa_r+kappa_c)
    ry2 = gmpy2.mpz_urandomb(rs, kappa+2*kappa_r+kappa_c)
    rr = gmpy2.mpz_urandomb(rs, kappaby2dash+kappa_r+kappa_c)
    rt1 = gmpy2.mpz_urandomb(rs, logq+kappa_r+kappa_c)
    rt2 = gmpy2.mpz_urandomb(rs, logq+kappa_r+kappa_c)
    
    Cb1 = commit_vector(ck, [rt1, rt2], rt0)
    Cb2byc = expprod([1+N, hN], [rt1,rt2+rr], mod=N2)
    Cz1 = commit_vector_fo(ck_fo, [rr], ry1)
    Cz2 = commit_vector_fo(ck_fo, [rt1, rt2], ry2)

    # Challenge 
    # (split the hash computation in two steps - one for items in the pairing group and other for gmpy2 integers.)
    chal_partial = group.hash((b1, Cb1), type=ZR)
    chal = gmpy2.mpz(hash_gmpy2((gmpy2.mpz(chal_partial), b2, c, Cb2byc, Cz1, Cz2)).digits(2)[:kappa_e], 2)

    # Response
    dt0 = gmpy2.t_mod_2exp(rt0 + chal*gmpy2.mpz(_t0), kappa+2*kappa_r+kappa_c)
    dr =  gmpy2.t_mod_2exp(rr + chal*gmpy2.mpz(_r), kappaby2dash+kappa_r+kappa_c)
    dt1 = gmpy2.t_mod_2exp(rt1 + chal*gmpy2.mpz(_t1), logq+kappa_r+kappa_c)
    dt2 = gmpy2.t_mod_2exp(rt2 + chal*gmpy2.mpz(_t2), logq+kappa_r+kappa_c)
    dy1 = gmpy2.t_mod_2exp(ry1 + chal*gmpy2.mpz(y1), kappa+2*kappa_r+kappa_c)
    dy2 = gmpy2.t_mod_2exp(ry2 + chal*gmpy2.mpz(y2), kappa+2*kappa_r+kappa_c)

    return (z1, z2, Cb1, Cb2byc, Cz1, Cz2, dt0, dr, dt1, dt2, dy1, dy2)

def shuffle_paillier_verif_renc(ck, ck_fo, paipk, b1, b2, c, pf):
    """ Verification of the proof of correct re-encryption. """
    
    n, h1, gs = ck
    N, N2, inv2, h, hN, kappa, v, vs, precomputing = paipk
    z1, z2, Cb1, Cb2byc, Cz1, Cz2, dt0, dr, dt1, dt2, dy1, dy2 = pf
    chal_partial = group.hash((b1, Cb1), type=ZR)
    chal = gmpy2.mpz(hash_gmpy2((gmpy2.mpz(chal_partial), b2, c, Cb2byc, Cz1, Cz2)).digits(2)[:kappa_e], 2)

    # LHS of the equation
    Lb1 = (b1 ** group.init(ZR, int(chal))) * Cb1
    Lb2byc = gmpy2.t_mod(gmpy2.powmod(gmpy2.t_mod(b2 * gmpy2.invert(c,N2), N2), chal, N2) * Cb2byc, N2)
    Lz1 = gmpy2.t_mod(gmpy2.powmod(z1, chal, N) * Cz1, N)
    Lz2 = gmpy2.t_mod(gmpy2.powmod(z2, chal, N) * Cz2, N)
    
    # RHS of the equation, but evaluated using the z-values received from the prover
    Rb1 = commit_vector(ck, [dt1, dt2], dt0)
    Rb2byc = expprod([1+N, hN], [dt1,dt2+dr], mod=N2)
    Rz1 = commit_vector_fo(ck_fo, [dr], dy1)
    Rz2 = commit_vector_fo(ck_fo, [dt1, dt2], dy2)

    return Lb1 == Rb1 and Lb2byc == Rb2byc and Lz1 == Rz1 and Lz2 == Rz2

def shuffle_paillier_nizkproof(ck, ck_fo, paipk, cinvec, coutvec, permcomm, evec, _pi, _svec, _rvec):
    n, h1, gs = ck
    N, N2, inv2, h, hN, kappa, v, vs, precomputing = paipk
    b1, b2, pf_equalexp, _t0, _t1, _t2 = shuffle_paillier_pf_equalexp(ck, ck_fo, paipk, cinvec, coutvec, evec, _pi, _svec)
    _r = dot(_rvec, evec)
    c = expprod(cinvec, evec, mod=N2)
    pf_renc = shuffle_paillier_pf_renc(ck, ck_fo, paipk, b1, b2, c, _r, _t0, _t1, _t2)
    return b1, b2, pf_equalexp, pf_renc

def shuffle_paillier_nizkverif(ck, ck_fo, paipk, cinvec, coutvec, permcomm, evec, pf):
    N, N2, inv2, h, hN, kappa, v, vs, precomputing = paipk
    b1, b2, pf_equalexp, pf_renc = pf
    status_equalexp = shuffle_paillier_verif_equalexp(ck, ck_fo, paipk, cinvec, coutvec, permcomm, evec, b1, b2, pf_equalexp)
    c = expprod(cinvec, evec, mod=N2)
    status_renc = shuffle_paillier_verif_renc(ck, ck_fo, paipk, b1, b2, c, pf_renc)
    return status_equalexp and status_renc

if __name__ == "__main__":
    import sys
    import gmpy2
    from elgamal import elgamal_th_keygen, elgamal_encrypt, elgamal_reencrypt
    from optthpaillier import pai_th_keygen, pai_encrypt, pai_reencrypt
    from numtheory import randcoprime

    n = int(sys.argv[1])
    alpha = 2
    
    # Commit to a permutation
    _pi, _repi = gen_rand_perm(n)
    ck = commkey(n)
    _svec = [group.random(ZR) for i in range(n)]
    permcomm = commit_perm(ck, _repi, _svec)

    # Proof of knowledge of the opening of a permutation commitment
    evec = [gmpy2.mpz_urandomb(rs, kappa_e) for i in range(n)]
    pf = perm_nizkproof(ck, permcomm, evec, _pi, _svec)
    perm_nizkverif(ck, permcomm, evec, pf)

    # Proof of shuffle using El Gamal encryption
    elgsklist, elgpk = elgamal_th_keygen(alpha)
    _mvec = [group.random(ZR) for i in range(n)]
    _rvec = [group.random(ZR) for i in range(n)]
    cinvec = [elgamal_encrypt(elgpk, _mvec[i]) for i in range(n)]
    coutdashvec = applyperm(cinvec, _pi)
    _rdashvec = applyperm(_rvec, _pi)
    coutvec = [elgamal_reencrypt(elgpk, coutdashvec[i], randIn=_rdashvec[i]) for i in range(n)]
    pf = shuffle_elgamal_nizkproof(ck, elgpk, cinvec, coutvec, permcomm, evec, _pi, _svec, _rvec)
    shuffle_elgamal_nizkverif(ck, elgpk, cinvec, coutvec, permcomm, evec, pf)

    # Proof of shuffle using Paillier encryption
    paisklist, paipk = pai_th_keygen(alpha)
    N, N2, inv2, h, hN, k, v, vs, precomputing = paipk
    ck_fo = commkey_fo(n, N)
    _mvec = [gmpy2.mpz(group.random(ZR)) for i in range(n)]
    _rvec = [gmpy2.mpz_urandomb(rs, kappaby2) for i in range(n)]
    cinvec = [pai_encrypt(paipk, _mvec[i]) for i in range(n)]
    coutdashvec = applyperm(cinvec, _pi)
    _rdashvec = applyperm(_rvec, _pi)
    coutvec = [pai_reencrypt(paipk, coutdashvec[i], randIn=_rdashvec[i]) for i in range(n)]
    b1, b2, pf, _t0, _t1, _t2 = shuffle_paillier_pf_equalexp(ck, ck_fo, paipk, cinvec, coutvec, evec, _pi, _svec)
    status_equalexp = shuffle_paillier_verif_equalexp(ck, ck_fo, paipk, cinvec, coutvec, permcomm, evec, b1, b2, pf)
    _r = dot(_rvec, evec)
    c = expprod(cinvec, evec, mod=N2)
    pf = shuffle_paillier_pf_renc(ck, ck_fo, paipk, b1, b2, c, _r, _t0, _t1, _t2)
    status_renc = shuffle_paillier_verif_renc(ck, ck_fo, paipk, b1, b2, c, pf)
    print("status_equalexp", status_equalexp)
    print("status_renc", status_renc)