from charm.toolbox.pairinggroup import ZR, pair

from globals import group
from secretsharing import sharerands, sharemults
from misc import timed, retval, timer, pprint,serialize_wrapper,deserialize_wrapper
from db import load,store

#### PoK of the opening of a commitment: PK{(m,r): C = g1^m h1^r} ###################
#### (to be given by the sender of a ciphertext - does not need to be distributed) ##

def pkcomm(C, _m, _r, base=None):
    """ PoK of the opening of the commitment, i.e., PK{(m, r): C = g^m h^r}. """
    g1,h1 = load("generators",["g1","h1"]).values()
    if base is None:
        base = (g1, h1)
    stmt = (base[0], base[1], C)

    # Commit
    _rm, _rr = group.random(ZR, 2)
    s = (base[0] ** _rm) * (base[1] ** _rr)

    # Challenge
    c = group.hash(stmt+ (s,), type=ZR)
   
    # Response
    zm = _rm - _m*c
    zr = _rr - _r*c

    return c, zm, zr

def pkcommverif(C, pf, base=None):
    g1,h1 = load("generators",["g1","h1"]).values()
    if base is None:
        base = (g1, h1)
    stmt = (base[0], base[1], C)
    c, zm, zr = pf
    verif = (C ** c) * (base[0] ** zm) * (base[1] ** zr)
    
    return c == group.hash(stmt +(verif,), type=ZR)

def pkcomms(comms, _msgs, _rands):
    return [pkcomm(comms[i], _msgs[i], _rands[i]) for i in range(len(comms))]

def pkcommverifs(comms, pfs):
    with timer("verifier: verifying proof of knowledge of commitment openings"):
        status = True
        for i in range(len(pfs)):
            status = status and pkcommverif(comms[i], pfs[i])
    return status

#### PoK of the encrypted blinding factors during the DB-SM protocol ############################################################################## 
# Given El Gamal public key pk = g_1^(sk1 + ... + skm), a ciphertext c:= (c0,c1) and its blinded version ctilde:=(ctilde0, ctilde1), this is a PoK 
# of the form:
#    PK{(r,b): ctilde0 = g_1^r c0^b, ctilde1 = pk^r c1^b } 
# (to be given by each mix-server - does not need to be distributed) ##############################################################################

def pk_enc_bl(elg_pk, ctilde, c, _r, _b):
    """ PoK of the encrypted blinding factors during the DB-SM protocol. """
    g1,f2,eg1f2,h1,ef1f2,inveh1f2,inveg1f2,fT,eh1f2,f1,idenT = load("generators",["g1","f2","eg1f2","h1","ef1f2","inveh1f2","inveg1f2","fT","eh1f2","f1","idenT"]).values()
    _elg_pk, _elgpklist = elg_pk

    # Commit
    _rr, _rb = group.random(ZR, 2)
    a1 = (g1 ** _rr) * (c[0] ** _rb)
    a2 = (_elg_pk ** _rr) * (c[1] ** _rb)

    # Challenge
    chal = group.hash((_elg_pk, ctilde, c, a1, a2), type=ZR)
   
    # Response
    zr = _rr - _r*chal
    zb = _rb - _b*chal

    return chal, zr, zb

def pk_enc_bl_verif(elg_pk, ctilde, c, pf):
    g1,f2,eg1f2,h1,ef1f2,inveh1f2,inveg1f2,fT,eh1f2,f1,idenT = load("generators",["g1","f2","eg1f2","h1","ef1f2","inveh1f2","inveg1f2","fT","eh1f2","f1","idenT"]).values()
    _elg_pk, _elgpklist = elg_pk
    chal, zr, zb = pf
    verif1 = (ctilde[0] ** chal) * (g1 ** zr) * (c[0] ** zb)
    verif2 = (ctilde[1] ** chal) * (_elg_pk ** zr) * (c[1] ** zb)    
    return chal == group.hash((_elg_pk, ctilde, c, verif1, verif2), type=ZR)

#### PoK of the encrypted blinding factor for the S component during the DB-RSM protocol ########################################################## 
# Given El Gamal public key pk = g_1^(sk1 + ... + skm), a ciphertext c:= (c0,c1) = (g_1^r, g_1^b pk^r), this is a PoK of r,b:
#    PK{(r,b): c0 = g_1^r, c1 = g1^b pk^r } 
# (to be given by each mix-server - does not need to be distributed) ##############################################################################

def pk_enc_blrev_S(elg_pk, c, _r, _b):
    """ PoK of the encrypted blinding factors for the S component during the DB-RSM protocol. """
    g1,f2,eg1f2,h1,ef1f2,inveh1f2,inveg1f2,fT,eh1f2,f1,idenT = load("generators",["g1","f2","eg1f2","h1","ef1f2","inveh1f2","inveg1f2","fT","eh1f2","f1","idenT"]).values()
    _elg_pk, _elgpklist = elg_pk

    # Commit
    _rr, _rb = group.random(ZR, 2)
    a1 = (g1 ** _rr)
    a2 = (g1 ** _rb) * (_elg_pk ** _rr)

    # Challenge
    chal = group.hash((_elg_pk, c, a1, a2), type=ZR)

    # Response
    zr = _rr - _r*chal
    zb = _rb - _b*chal

    return chal, zr, zb

def pk_enc_blrev_S_verif(elg_pk, c, pf):
    g1,f2,eg1f2,h1,ef1f2,inveh1f2,inveg1f2,fT,eh1f2,f1,idenT = load("generators",["g1","f2","eg1f2","h1","ef1f2","inveh1f2","inveg1f2","fT","eh1f2","f1","idenT"]).values()
    _elg_pk, _elgpklist = elg_pk
    chal, zr, zb = pf
    verif1 = (c[0] ** chal) * (g1 ** zr)
    verif2 = (c[1] ** chal) * (g1 ** zb) * (_elg_pk ** zr)    
    return chal == group.hash((_elg_pk, c, verif1, verif2), type=ZR)


#### DPK{(v,r,bl): C = g1^v h1^r AND e(blsig^(1/bl), yf2^v) = e(g1, f2)} ########

def dpk_bbsig_nizkproofs(comms, blsigs, verfpk, alpha, _msg_shares, _rand_shares, _blshares):
    """ PoKs of Boneh-Boyen signatures on committed messages, i.e.:
     PK{(v_k, r_k, bl_k): comm[i] = g^(sum_{k=1}^{m} v_k) h^(sum_{k=1}^{m} r_k) and BBVer(blsigs[i]^{1/((sum_{k=1}^{m} bl_k))}, v, verfpk)} """
    g1,f2,eg1f2,h1,ef1f2,inveh1f2,inveg1f2,fT,eh1f2,f1,idenT = load("generators",["g1","f2","eg1f2","h1","ef1f2","inveh1f2","inveg1f2","fT","eh1f2","f1","idenT"]).values()
    myn = len(comms)
    one_T= eg1f2 ** 0
    one_G1=g1 ** 0
    C1 = [one_T]*myn
    C2 = [one_G1]*myn
    rv, rr, rbl = [], [], []
    for a in range(alpha):
        with timer("mixer %d: creating dpk_bbsig commit message" % a):
            rv.append([group.random(ZR) for i in range(myn)])
            rr.append([group.random(ZR) for i in range(myn)])
            rbl.append([group.random(ZR) for i in range(myn)])
            C1 = [C1[i] * (pair(blsigs[i], f2 ** (-rv[a][i]))) * (eg1f2 ** rbl[a][i]) for i in range(myn)]
            C2 = [C2[i] * (g1 ** rv[a][i]) * (h1 ** rr[a][i]) for i in range(myn)]

    for a in range(alpha):
        with timer("mixer %d: creating dpk_bbsig challenge" % a):
            chals = [group.hash((g1, h1, f2, comms[i], blsigs[i]) + (C1[i], C2[i]), type=ZR) for i in range(myn)]
    # Computes shares of the response messages (to be combined by the verifier).
    zvs, zrs, zbls = [], [], []
    for a in range(alpha):
        with timer("mixer %d: creating dpk_bbsig response message" % a):
            zvs.append([(rv[a][i] - _msg_shares[a][i]*chals[i]) for i in range(myn)])
            zrs.append([(rr[a][i] - _rand_shares[a][i]*chals[i]) for i in range(myn)])
            zbls.append([(rbl[a][i] - _blshares[a][i]*chals[i]) for i in range(myn)]) 
    print("chals in proof generation",chals)

    myC2 = C2[0]
    comm = comms[0]
    chal = chals[0]
    zr = zrs[0][0] + zrs[1][0]
    zv = zvs[0][0] + zvs[1][0]
    
    print("expected C2:", myC2)
    print("expected comm:", comm)
    msg = sum([_msg_shares[a][0] for a in range(alpha)])
    rand = sum([_rand_shares[a][0] for a in range(alpha)])
    print("msg:", msg)
    print("rand:", rand)
    print("actual comm:", (g1 ** msg) * (h1 ** rand))
    print("actual C2:", (comms[0] ** chal) * (h1 ** zr) * (g1 ** zv))

    return chals, zvs, zrs, zbls

def dpk_bbsig_nizkverifs(comms, blsigs, verfpk, pfs):
    zero_Zq = group.init(ZR, 0)
    result_comms=[]
    g1,f2,eg1f2,h1,ef1f2,inveh1f2,inveg1f2,fT,eh1f2,f1,idenT = load("generators",["g1","f2","eg1f2","h1","ef1f2","inveh1f2","inveg1f2","fT","eh1f2","f1","idenT"]).values()
    with timer("verifier: verifying dpk_bbsig proof"):
        chals, zvs, zrs, zbls = pfs
        alpha = len(zvs)
        print("chals in proof verification",chals)
        # Combine shares of the response messages received from all the provers
        zv, zr, zbl = [zero_Zq]*len(comms), [zero_Zq]*len(comms), [zero_Zq]*len(comms)
        for a in range(alpha):
            zv = [zv[i] + zvs[a][i] for i in range(len(comms))]
            zr = [zr[i] + zrs[a][i] for i in range(len(comms))]
            zbl = [zbl[i] + zbls[a][i] for i in range(len(comms))]
            #print(zv,zr,zbl)
        status = True
        for i in range(len(comms)):
            stmt = (g1, h1, f2, comms[i], blsigs[i])
            verif = ((pair(blsigs[i], (verfpk**chals[i]) * (f2**(-zv[i]))) * (eg1f2 ** (zbl[i]))),
                    (comms[i] ** chals[i]) * (h1 ** zr[i]) * (g1 ** zv[i]))
            #print(verif,"verif")
            #print("chals[i]",chals[i])
            result_comms.append(chals[i] == group.hash((g1, h1, f2, comms[i], blsigs[i]) + verif, type=ZR))
            status = status and (chals[i] == group.hash((g1, h1, f2, comms[i], blsigs[i]) + verif, type=ZR))
    return status,result_comms

#### DPK{(bS,bC,br,delta0,delta1,delta2):                #######################################
####            z1     = g4^bS g5^delta0             AND #######################################
####            idenT = z1^-bc g4^delta1 g5^delta2 } AND #######################################
####            z2   = g1^bc g2^bS g3^br g4^delta1       #######################################

def dpk_bbsplussig_nizkproofs(msgs, blsigs_S, blsigs_c, blsigs_r, verfpk, alpha, _blshares_S, _blshares_c, _blshares_r):
    """ PoKs of BBS+ signatures on the given messages. """
    myn = len(msgs)
    g1,f2,eg1f2,h1,ef1f2,inveh1f2,inveg1f2,fT,eh1f2,f1,idenT = load("generators",["g1","f2","eg1f2","h1","ef1f2","inveh1f2","inveg1f2","fT","eh1f2","f1","idenT"]).values()
    z1 = [eg1f2 ** 0] * myn
    C1 = [eg1f2 ** 0] * myn
    C2 = [eg1f2 ** 0] * myn
    C3 = [eg1f2 ** 0] * myn
    _rbS, _rbc, _rbr, _rdelta0, _rdelta1, _rdelta2 = [], [], [], [], [], []
    _delta0 = sharerands(myn, alpha, purpose='delta0')
    _delta1 = sharemults(_blshares_S, _blshares_c, alpha, purpose='delta1')
    _delta2 = sharemults(_delta0, _blshares_c, alpha, purpose='delta2')

    z1s, pf_z1 = [], [] 
    for a in range(alpha):
        with timer("mixer %d: computing shares of z1 and proof of knowledge of their openings" % a):
            genh1 = inveh1f2
            genh2 = inveg1f2
            genh3 = fT
            z1s.append([(genh2 ** _blshares_S[a][j]) * (genh3 ** _delta0[a][j]) for j in range(myn)])
            pf_z1.append([pkcomm(z1s[a][j], _blshares_S[a][j], _delta0[a][j], base=(genh2, genh3)) for j in range(myn)])

    status_pk_z1 = True
    for a in range(alpha):
        with timer("mixer %d: verifying others' proof of knowledge of openings of shares of z1" % a):
            for adash in range(alpha):
                if adash == a: continue
                else: 
                    for j in range(myn):
                        status_pk_z1 = status_pk_z1 and pkcommverif(z1s[adash][j], pf_z1[adash][j], base=(genh2, genh3))
    pprint("status_pk_z1:", status_pk_z1)

    for a in range(alpha):
        with timer("mixer %d: computing generators" % a):
            z1 = [z1[j] * z1s[a][j] for j in range(myn)]
            eg1verfpk = pair(g1, verfpk)
            z2 = [pair(blsigs_S[j], verfpk * (f2 ** blsigs_c[j])) / (ef1f2 * (eg1f2 ** msgs[j]) * (eh1f2 ** blsigs_r[j])) for j in range(myn)]
            geng1 = [pair(blsigs_S[j], f2) for j in range(myn)]
            geng2 = [eg1verfpk * (eg1f2 ** blsigs_c[j]) for j in range(myn)]

    # Commit
    for a in range(alpha):
        with timer("mixer %d: creating dpk_bbsplussig commit message" % a):
            _rbS.append([group.random(ZR) for j in range(myn)])
            _rbc.append([group.random(ZR) for j in range(myn)])
            _rbr.append([group.random(ZR) for j in range(myn)])
            _rdelta0.append([group.random(ZR) for j in range(myn)])
            _rdelta1.append([group.random(ZR) for j in range(myn)])
            _rdelta2.append([group.random(ZR) for j in range(myn)])
            C1 = [C1[j] * (geng1[j] ** _rbc[a][j]) * (geng2[j] ** _rbS[a][j]) * (genh1 ** _rbr[a][j]) * (genh2 ** _rdelta1[a][j]) for j in range(myn)]
            C2 = [C2[j] * (genh2 ** _rbS[a][j]) * (genh3 ** _rdelta0[a][j]) for j in range(myn)]
            C3 = [C3[j] * (z1[j] ** (-_rbc[a][j])) * (genh2 ** _rdelta1[a][j]) * (genh3 * _rdelta2[a][j]) for j in range(myn)]

    # Challenge
    for a in range(alpha):
        with timer("mixer %d: creating dpk_bbsplussig challenge" % a):
            stmt = [(blsigs_S[j], blsigs_c[j], blsigs_r[j], geng1, geng2, genh1, genh2, genh3, z1[j], z2) for j in range(myn)]
            chals = [group.hash((stmt[j] + (C1[j], C2[j], C3[j])), type=ZR) for j in range(myn)]

    # Computes shares of the response messages (to be combined by the verifier).
    zbSs, zbcs, zbrs, zdelta0s, zdelta1s, zdelta2s = [], [], [], [], [], [] 
    for a in range(alpha):
        with timer("mixer %d: creating dpk_bbsplussig response message" % a):
            zbSs.append([(_rbS[a][j] - chals[j] * _blshares_S[a][j]) for j in range(myn)])
            zbcs.append([(_rbc[a][j] - chals[j] * _blshares_c[a][j]) for j in range(myn)])
            zbrs.append([(_rbr[a][j] - chals[j] * _blshares_r[a][j]) for j in range(myn)])
            zdelta0s.append([(_rdelta0[a][j] - chals[j] * _delta0[a][j]) for j in range(myn)])
            zdelta1s.append([(_rdelta1[a][j] - chals[j] * _delta1[a][j]) for j in range(myn)])
            zdelta2s.append([(_rdelta2[a][j] - chals[j] * _delta2[a][j]) for j in range(myn)])

    return z1, chals, zbSs, zbcs, zbrs, zdelta0s, zdelta1s, zdelta2s

def dpk_bbsplussig_nizkverifs(msgs, blsigs_S, blsigs_c, blsigs_r, verfpk, pfs):
    result_msgs=[]
    zero_Zq = group.init(ZR, 0)
    g1,f2,eg1f2,h1,ef1f2,inveh1f2,inveg1f2,fT,eh1f2,f1,idenT = load("generators",["g1","f2","eg1f2","h1","ef1f2","inveh1f2","inveg1f2","fT","eh1f2","f1","idenT"]).values()
    with timer("verifier: verifying dpk_bbsplussig proofs"):
        myn = len(msgs)
        z1, chals, zbSs, zbcs, zbrs, zdelta0s, zdelta1s, zdelta2s = pfs
        alpha = len(zbSs)

        # Combine shares of the response messages received from all the provers
        zbS, zbc, zbr, zdelta0, zdelta1, zdelta2 = [zero_Zq] * myn, [zero_Zq] * myn, [zero_Zq] * myn, [zero_Zq] * myn, [zero_Zq] * myn, [zero_Zq] * myn
        for a in range(alpha):
            zbS = [zbS[j] + zbSs[a][j] for j in range(myn)]
            zbc = [zbc[j] + zbcs[a][j] for j in range(myn)]
            zbr = [zbr[j] + zbrs[a][j] for j in range(myn)]
            zdelta0 = [zdelta0[j] + zdelta0s[a][j] for j in range(myn)]
            zdelta1 = [zdelta1[j] + zdelta1s[a][j] for j in range(myn)]
            zdelta2 = [zdelta2[j] + zdelta2s[a][j] for j in range(myn)]

        status = True
        eg1verfpk = pair(g1, verfpk)
        z2  = [pair(blsigs_S[j], verfpk * (f2 ** blsigs_c[j])) / (ef1f2 * (eg1f2 ** msgs[j]) * (eh1f2 ** blsigs_r[j])) for j in range(myn)]
        geng1 = [pair(blsigs_S[j], f2) for j in range(myn)]
        geng2 = [eg1verfpk * (eg1f2 ** blsigs_c[j]) for j in range(myn)]
        genh1 = inveh1f2
        genh2 = inveg1f2
        genh3 = fT
        stmt = [(blsigs_S[j], blsigs_c[j], blsigs_r[j], geng1, geng2, genh1, genh2, genh3, z1[j], z2) for j in range(myn)]

        for j in range(len(msgs)):
            verif = (
                (z2[j] ** chals[j]) * (geng1[j] ** zbc[j]) * (geng2[j] ** zbS[j]) * (genh1 ** zbr[j]) * (genh2 ** zdelta1[j]),
                (z1[j] ** chals[j]) * (genh2 ** zbS[j]) * (genh3 ** zdelta0[j]),
                (idenT ** chals[j]) * (z1[j] ** (-zbc[j])) * (genh2 ** zdelta1[j]) * (genh3 * zdelta2[j])     
            )
            result_msgs.append((chals[j] == group.hash(stmt[j] + verif, type=ZR)))
            status = status and (chals[j] == group.hash(stmt[j] + verif, type=ZR))
    return status,result_msgs
