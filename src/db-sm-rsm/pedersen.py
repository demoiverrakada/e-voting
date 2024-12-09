from db import load

def commit(m, _r):
    g1,h1=load("generators",["g1","h1"]).values()
    return (g1**m) * (h1**_r)


def open(c, m, _r):
    g1,h1=load("generators",["g1","h1"]).values()
    return c == (g1**m) * (h1**_r)