import gmpy2
import math
import random

# Random state for the gmpy2 random operations
rs = gmpy2.random_state(random.randint(0,100000))

# Global precomputation table as a dictionary, where the keys are the (base, modulus) tuples such that
# the powers of the base modulo the modulus are computed as arrays and stored in the values.
PRECOMP_TABLE = {}

def prod(n_list):
    product = gmpy2.mpz(1)
    for n_item in n_list:
        product = product * n_item
    return product

def oddrandnum(bitlength):
    """ Generate a random number of given bitlength. """

    while True:
        r = gmpy2.mpz_urandomb(rs, bitlength)
        if r % 2 == 1:
            break
    return r

def randprime(bitlength):
    """ Generate a random prime number of given bitlength. """

    while True:
        r = gmpy2.mpz_urandomb(rs, bitlength)
        if r.is_prime():
            break
    return r

def randcoprime(n):
    """ Generate a random less than and coprime to n. """

    while True:
        r = gmpy2.mpz_random(rs, n)
        if gmpy2.gcd(r,n)==1:
            break
    return r

def crm(a_list, n_list):
    """ Given x = a_1 mod n_1, x = a_2 mod n_2, ..., x = a_k mod n_k, find x mod n_1n_2...n_k using Chinese remainder theorem. """

    a_list = [gmpy2.mpz(a_i) for a_i in a_list]
    n_list = [gmpy2.mpz(n_i) for n_i in n_list]

    N = prod(n_list)
    y_list = [N // n_i for n_i in n_list]
    z_list = [gmpy2.invert(y_i, n_i) for y_i, n_i in zip(y_list, n_list)]
    x = sum(a_i * y_i * z_i for a_i, y_i, z_i in zip(a_list, y_list, z_list))

    return x

def safe_primes(last=1):
    """ Generate a safe prime pair (p, q) such that p = 2q + 1."""
    
    last = (last - 1) // 2
    while True:
        last = gmpy2.next_prime(last)
        other = 2 * last + 1
        if gmpy2.is_prime(other):
            break
    return last, other

def precompute_powers(base, modulus, bitlength, blocksize):
    PRECOMP_TABLE[(base, modulus)] = []
    nblockelems = 2 ** blocksize
    for i in range(math.ceil(bitlength/blocksize)):
        e = 2 ** (i*blocksize)
        basee = gmpy2.powmod(base, e, modulus)
        for j in range(nblockelems):
            row = gmpy2.powmod(basee, j, modulus)
            PRECOMP_TABLE[(base, modulus)].append(row)

def powmod_using_precomputing(base, e, modulus, blocksize):
    elist = []
    while e > 0:
        quo, rem = gmpy2.f_divmod_2exp(e, blocksize)
        elist.append(rem)
        e = quo
    nblockelems = 2 ** blocksize

    res = 1
    for i, eblock in enumerate(elist):
        term = PRECOMP_TABLE[(base, modulus)][i*nblockelems + eblock]
        res = (res * term) % modulus
    return res