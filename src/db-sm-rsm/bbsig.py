import random
from charm.toolbox.pairinggroup import ZR, pair
from globals import group
from db import store,load
from misc import serialize_wrapper

def bbkeygen(election_id):
    g1,f2,eg1f2 = load("generators",["g1","f2","eg1f2"],election_id).values()
    _sk = group.random(ZR)
    pk = f2 ** _sk
    return _sk, pk

def bbsign(m, _sk,election_id):
    print(type(m))
    print(type(_sk))
    g1,f2,eg1f2 = load("generators",["g1","f2","eg1f2"],election_id).values()
    sigma = g1 ** (1 / (m + _sk))
    print(type(m))
    return sigma

def bbverify(sigma, m, pk,election_id):
    g1,f2,eg1f2 = load("generators",["g1","f2","eg1f2"],election_id).values()
    return pair(sigma, pk * (f2 ** m)) == eg1f2

def bbbatchverify(sigmas, ms, pk,election_id):
    # Choose random delta_i. Batch verification is thus verifying the following:
    #    prod_i e(sigma_i, pk * (f2 ** m_i))**delta_i = eg1f2 ** delta_i
    # which reduces to:
    #    prod_i (e(sigma_i, pk) ** delta_i) * (e(sigma_i, f2 ** m_i) ** delta_i) = prod_i eg1f2 ** delta_i
    #
    # The above can be efficiently checked by making only O(1) pairing computations:
    #    e(prod_i sigma_i ** delta_i, pk) * e(prod_i sigma_i ** (m_i * delta_i), f2) = eg1f2 ** (sigma_i delta_i)
    #
    # Ref: Anna Lisa Ferrara, Matthew Green, Susan Hohenberger, ``Practical Short Signature Batch Verification'', https://eprint.iacr.org/2008/015.pdf
    #g1,group,f2,eg1f2 = load("setup",["g1","group","f2","eg1f2"]).values()
    g1,f2,eg1f2 = load("generators",["g1","f2","eg1f2"],election_id).values()
    print(sigmas)
    deltas = [random.getrandbits(80) for _ in range(len(sigmas))]
    #print(deltas)
    sigma_delta_prod = g1 ** 0
    sigma_mdelta_prod = g1 ** 0
    delta_sum = 0
    #print(sigma_delta_prod,"sigma_delta_prod")
    #print(sigma_mdelta_prod,"sigma_mdelta_prod")
    #print(delta_sum,"delta_sum")
    for i in range(len(sigmas)):
        sigma_delta = sigmas[i] ** deltas[i]
        sigma_mdelta = sigma_delta ** ms[i]
        sigma_delta_prod = sigma_delta_prod * (sigma_delta)
        sigma_mdelta_prod = sigma_mdelta_prod * (sigma_mdelta)
        delta_sum = delta_sum + deltas[i]
        #print(sigma_delta,"sigma_delta")
        #print(sigma_mdelta,"sigma_mdelta")
        #print(sigma_delta_prod,"sigma_delta_prod")
        #print(sigma_mdelta_prod,"sigma_mdelta_prod")
        #print(delta_sum,"delta_sum")
    #print(pk,"pk")
    #print(delta_sum,"delta_sum")
    #print(sigma_mdelta_prod,"sigma_mdelta_prod")
    #print(serialize_wrapper(f2),"f2")
    #print(serialize_wrapper(eg1f2),"eg1f2")
    #print(serialize_wrapper(g1),"g1")
    #print((group),"group")
    #print(sigma_delta_prod,"sigma_delta_prod")
    return pair(sigma_delta_prod, pk) * pair(sigma_mdelta_prod, f2) == eg1f2 ** delta_sum
