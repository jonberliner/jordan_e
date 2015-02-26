from numpy import sum, concatenate, repeat, linspace, abs
from numpy.random import RandomState

def rotationExperiment(x, rotmag, nPerXOpt, maxrotmag=None, base_xOpt=None,\
    edgebuf=None, rngseed=None, blockTypes=None, agTypes=None):
"""def rotationExperiment(x, rotmag, nPerXOpt, maxrotmag=None, base_xOpt=None,\
    edgebuf=None, rngseed=None, blockTypes=None, agTypes=None)

    inputs:
        (note: - lo* means list of *
               - nparray means numpy array
               - lo* can usually be an nparray of *
               - float is a non-integer real scalar)
        - x (lofloat): domain
        - rotmag (float or lofloat): rotation magnitude
        - nPerXOpt (loint): n trials for each block
        - maxrotmag (float, default=None): max rotation used in this experiment
            by any subject (not necessarily this sub).  Useful for matching
            base_xOpt between conditions, which is done randomly.
            if None, maxrotmag=rotmag
        - base_xOpt (float, default=None):  where on the line it means
            rotation equals zero.  If None, will be set randomly to fall
            within edgebuf of domain bounds.
        - rngseed (int, default=None): random number generator seed for
            matching between subjects.  If None, will init rng w/o seed.
        - blockTypes (lostring, default=None): tells whether each block is
            'baseline' (no rotation), 'rotation', or 'counterrotation'.
            If None, assumes all are rotation, and that the rotations are
            explicitely provided in rotmag as a lofloat
        - agTypes (lostring, default=None): whether each block is 'abrupt' or
            'gradual'.  If None, sets all blocks to abrupt.  Last block must
            always be 'abrupt' (because nothing to gradually transition to)

    outputs:
        - xOptQueue (nparray): optimal location in the domain for each trial
"""

    nBlock = len(nPerXOpt)
    # ambuiguous what rotation or counterrotation mean when multiple rots
    if type(rotmag) is list: assert not blockTypes

    if not base_xOpt:  # random valid base_xOpt (i.e. veridical location)
        if rngseed: rng = RandomState(rngseed)  # use seed if given
        else: rng = RandomState()

        if not edgebuf: edgebuf = 0.  # no edge buffer by default
        if not maxrotmag: maxrotmag = rotmag

        # ensure rotations will fall in within edgebuf of domain
        # (wrt maxrotmag for counterbalancing b.t. groups)
        good = False
        while not good:
            base_xOpt = rng.rand()
            if base_xOpt - maxrotmag > min(x) + edgebuf:
                if base_xOpt + maxrotmag < max(x) - edgebuf:
                    good = True

    # default rotation for all blocks (so you can pass vector of custom rots)
    if not blockTypes:
        blockTypes = ['rotation' for _ in xrange(nBlock)]
    # get xOpt for each block relative to base_xOpt
    for bt in blockTypes:
        basenames = ['baseline', 'base', 'b']
        rotnames = ['rotation', 'rot', 'r']
        crotnames = ['counterrotation', 'crot', 'c']
        if bt in basenames:
            xOpt = base_xOpt
        elif bt in rotnames:
            xOpt = base_xOpt + rotmag
        elif bt in crotnames:
            xOpt = base_xOpt - rotmag
        else:
            raise ValueError('invalid blockType name %s' % (bt))
        xOpts.append(xOpt)

    if not agTypes:
        agTypes = ['abrupt' for _ in xrange(nBlock)]

    assert len(blockTypes) == len(xOpts) == len(nPerXOpt) == len(agTypes)
    xOptQueue = make_abrupt_xOptQueue(xOpts, nPerXOpt, agTypes)
    return {'xOptQueue': xOptQueue}


# BEGIN DEFS
def make_mixed_xOptQueue(xOpts, nPerXOpt, agBlockTypes):
    """def make_mixed_xOptQueue(xOpts, nPerXOpt, agBlockTypes)
    input:
        xOpts (float): a list of optimal aim locatations
        nPerXOpt (int): how many times each xOpt should be repeated
        agBlockTypes (str): 'a' (abrupt) or 'g' (gradual) block
    output:
        xOptQueue (lofloats): opt location for each trial
    """
    abruptnames = ['abrupt', 'a']
    gradualnames = ['gradual', 'g']
    nBlock = len(xOpts)
    assert nBlock == len(nPerXOpt)
    nTrial = sum(nPerXOpt)
    blockqueues = []
    for b in xrange(nBlock):
        agThisBlock = agBlockTypes[b]
        if agThisBlock in abruptnames:
            blockqueue = repeat(xOpts[b], nPerXOpt[b])
        elif agThisBlock in gradualnames:
            blockqueue = linspace(xOpts[b], xOpts[b+1], nPerXOpt[b])
        else: raise ValueError('invalid agBlockType %s' % (agThisBlock))
        blockqueues.append(blockqueue)

    xOptQueue = concatenate(blockqueues)
    return xOptQueue


def make_abrupt_xOptQueue(xOpts, nPerXOpt):
    """def make_abrupt_xOptQueue(xOpts, nPerXOpt)
    input:
        xOpts (float): a list of optimal aim locatations
        nPerXOpt (int): how many times each xOpt should be repeated
    output:
        xOptQueue (lofloats): opt location for each trial
    """
    nBlock = len(xOpts)
    assert nBlock == len(nPerXOpt)
    nTrial = sum(nPerXOpt)
    miniqueues = [repeat(xOpts[b], nPerXOpt[b]) for b in xrange(nBlock)]
    xOptQueue = concatenate(miniqueues)
    return xOptQueue


def make_gradual_xOptQueue(xOpts, nPerXOpt):
    """def make_abrupt_xOptQueue(xOpts, nPerXOpt)
    input:
        xOpts (float): a list of optimal aim locatations
        nPerXOpt (int): how many steps to move from xOpt[i] to xOpt[i+1]
            for final block, nPerXOpt repeats final value nPerXOpt[-1] times
    output:
        xOptQueue (lofloats): opt location for each trial
    """
    nBlock = len(xOpts)
    assert nBlock == len(nPerXOpt)
    nTrial = sum(nPerXOpt)
    miniqueues = [linspace(xOpts[b], xOpts[b+1], nPerXOpt[b])
                  for b in xrange(nBlock)-1]
    miniqueues += repeat(xOpts[-1], nPerXOpt[-1])
    xOptQueue = concatenate(miniqueues)
    return xOptQueue
