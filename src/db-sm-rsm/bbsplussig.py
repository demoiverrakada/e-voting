import random

from charm.toolbox.pairinggroup import ZR, pair

from globals import group
from db import load,store
def bbspluskeygen(election_id):
    _sk = group.random(ZR)
    g1,f2 = load("generators",[election_id,"g1","f2"]).values()
    print(type(f2),type(_sk))
    pk = f2 ** _sk
    return _sk, pk

def bbsplussign(m, _sk,election_id):
    c, r = group.random(ZR, 2)
    f1,g1,h1=load("generators",[election_id,"f1","g1","h1"]).values()
    S = (f1 * (g1 ** m) * (h1 ** r)) ** (1 / (c + _sk))
    return (S, c, r)

def bbsplusverify(sigma, m, pk,election_id):
    S, c, r = sigma
    f2,g1,h1,f1 = load("generators",[election_id,"f2","g1","h1","f1"]).values()
    return pair(S, pk * (f2 ** c)) == pair(f1 * (g1 ** m) * (h1 ** r), f2)

def bbsplusquasisign_commitment(C, _sk,election_id):
    c, rhat = group.random(ZR, 2)
    f1,h1 = load("generators",[election_id,"f1","h1"]).values()
    print(type(c),"type of c")
    print(type(rhat),"type of rhat")
    print(type(f1),"type of f1")
    print(type(C),"type of C")
    print(type(_sk),"type of sk")
    S = (f1 * (h1 ** rhat) * C) ** (1 / (c + _sk))
    return (S, c, rhat)

def bbsplussign_obtain(sigma, r):
    S, c, rhat = sigma
    return (S, c, rhat + r)

def bbsplusquasibatchverify(sigmas, comms, pk,election_id):
    # Consider that the quasi signature sigma can be extracted as S, c, r = sigma'.
    # Choose random delta_i. Batch verification is thus verifying the following:
    #    prod_i e(S_i, pk )**delta_i * e((S_i ** c_i)( C_i ** (-1))(h1 ** (-r_i)), f2) ** delta_i = prod_i ef1f2 ** delta_i
    #
    # The above can be efficiently calculated using a single pairing computation:
    #    e(prod_i S_i ** delta_i, pk) * e(prod_i ((S_i ** c_i)( C_i ** (-1))(h1 ** (-r_i))) ** delta_i, f2) = ef1f2 ** (sum_i delta_i)
    #
    # Ref: Anna Lisa Ferrara, Matthew Green, Susan Hohenberger, ``Practical Short Signature Batch Verification'', https://eprint.iacr.org/2008/015.pdf
    g1,f1,f2,h1,ef1f2 = load("generators",[election_id,"g1","f1","f2","h1","ef1f2"]).values()
    deltas = [random.getrandbits(80) for _ in range(len(sigmas))]

    S_delta_prod = g1 ** 0
    SCh_delta_prod = g1 ** 0
    delta_sum = 0
    q = group.order()

    for i in range(len(sigmas)):
        S, c, rhat = sigmas[i]
        C = comms[i]
        S_delta = S ** deltas[i]
        SCh_delta = ((S ** c) * (C ** (-1)) * (h1 ** (q-rhat))) ** deltas[i]
        S_delta_prod = S_delta_prod * (S_delta)
        SCh_delta_prod = SCh_delta_prod * (SCh_delta)
        delta_sum = delta_sum + deltas[i]
    return pair(S_delta_prod, pk) * pair(SCh_delta_prod, f2) == ef1f2 ** delta_sum
