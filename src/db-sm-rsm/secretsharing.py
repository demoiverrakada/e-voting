from charm.toolbox.pairinggroup import ZR

from globals import group
from misc import timed, timer, pprint
from db import load,store


#### Simple alpha-out-of-alpha secret sharing scheme

def share(val, alpha):
    shares = [0]*alpha
    sum_shares = group.init(ZR, 0)
    for a in range(alpha-1):
        shares[a] = group.random(ZR)
        sum_shares = sum_shares + shares[a]
    shares[alpha-1] = val - sum_shares
    return shares

def reconstruct(shares):
    val = group.init(ZR, 0)
    for share in shares:
        val = val + share
    return val

def sharerands(n, alpha, purpose):
    """ Compute [(z11,...,zn1),...,(z1m,...,znm)] where each zik is a random Zq element. """
    res = []
    for a in range(alpha):
        with timer("mixer %d: creating additive shares for %s" % (a, purpose)):
            res.append([group.random(ZR) for i in range(n)])
    return res

def sharemults(shares1, shares2, alpha, purpose):
    """ Given shares1 = [(x11,...,xn1),...,(x1m,...,xnm)] and shares2 = [(y11,...,yn1),...,(y1m,...,ynm)] where n 
    denotes the number of items and m (=alpha) denotes the number of parties, compute [(z11,...,zn1),...,(z1m,...,znm)], 
    where zi1 + ... + zim = zi = xi * yi = (xi1 + ... + xim) * (yi1 + ... + yim). """
    beaver_a_shares,beaver_b_shares,beaver_c_shares=load("setup",["beaver_a_shares","beaver_b_shares","beaver_c_shares"]).values()
    myn = len(shares1[0])
    dshares, eshares = [], []
    for a in range(alpha):
        with timer("mixer %d: creating multiplicative shares for %s step 1" % (a, purpose)):
            dshares.append([shares1[a][j] - beaver_a_shares[purpose][a][j] for j in range(myn)])
            eshares.append([shares2[a][j] - beaver_b_shares[purpose][a][j] for j in range(myn)])

    res = []
    for a in range(alpha):
        with timer("mixer %d: creating multiplicative shares for %s step 2" % (a, purpose)):
            d = [reconstruct(dshares_item) for dshares_item in zip(*dshares)]
            e = [reconstruct(eshares_item) for eshares_item in zip(*eshares)]

            res.append([d[j]*beaver_b_shares[purpose][a][j] + e[j]*beaver_a_shares[purpose][a][j] + beaver_c_shares[purpose][a][j] for j in range(myn)])
            if a == 0:
                res[a] = [res[a][j] + d[j]*e[j] for j in range(myn)]
    return res

@timed
def gen_beaver_triples(myn, alpha):
    """ Note: here, we are not actually modelling the generation of Beaver's triples through an actual MPC protocol,
    but rather only generating valid triples assuming a trusted setup. Since this is an input-independent preprocessing 
    step, we are not too concerned with the efficiency of the MPC protocol to generate these tuples. """
    
    beaver_a_shares = {}
    beaver_b_shares = {}
    beaver_c_shares = {}

    # Note that Beaver's triples should not be repeated. We therefore create separate triples for the 
    # purpose of computing secret shares of delta1 (in DPK-RSM) and for the purpose of computing 
    # secret shares of delta2. 
    purposes = ['delta1', 'delta2']
    for purpose in purposes:
        beaver_a = [group.random(ZR) for i in range(myn)]
        beaver_b = [group.random(ZR) for i in range(myn)]
        beaver_c = [beaver_a[i] * beaver_b[i] for i in range(myn)]
        beaver_a_shares[purpose] = list(zip(*[share(beaver_a[i], alpha) for i in range(myn)]))
        beaver_b_shares[purpose] = list(zip(*[share(beaver_b[i], alpha) for i in range(myn)]))
        beaver_c_shares[purpose] = list(zip(*[share(beaver_c[i], alpha) for i in range(myn)]))
    return beaver_a_shares,beaver_b_shares,beaver_c_shares

if __name__ == "__main__":
    alpha = 2
    beaver_a_shares = {}
    beaver_b_shares = {}
    beaver_c_shares = {}
    beaver_a = [group.init(ZR, 10), group.init(ZR, 20)]
    beaver_b = [group.init(ZR, 100), group.init(ZR, 200)]
    beaver_c = [group.init(ZR, 1000), group.init(ZR, 4000)]
    beaver_a_shares['test'] = list(zip(*[share(beaver_a[i], alpha) for i in range(2)]))
    beaver_b_shares['test'] = list(zip(*[share(beaver_b[i], alpha) for i in range(2)]))
    beaver_c_shares['test'] = list(zip(*[share(beaver_c[i], alpha) for i in range(2)]))
    
    shares1 = list(zip(*[share(group.init(ZR, 3), alpha), share(group.init(ZR, 6), alpha)]))
    shares2 = list(zip(*[share(group.init(ZR, 5), alpha), share(group.init(ZR, 10), alpha)]))
    multshares = sharemults(shares1, shares2, alpha, purpose='test')
    mul = [reconstruct(multshares_item) for multshares_item in zip(*multshares)]
    print("Mul", mul)