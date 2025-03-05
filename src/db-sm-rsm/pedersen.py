from db import load

def commit(m, _r,election_id):
    g1,h1=load("generators",[election_id,"g1","h1"]).values()
    return (g1**m) * (h1**_r)


def open(c, m, _r,election_id):
    g1,h1=load("generators",[election_id,"g1","h1"]).values()
    return c == (g1**m) * (h1**_r)