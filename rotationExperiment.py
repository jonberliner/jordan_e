from numpy import sum, concatenate, repeat, linspace, abs, ndarray, arange, mean
from numpy.random import RandomState, permutation
from numpy import array as npa

def rotationExperiment(domainbounds, rotmag, nPerXOpt,\
                       mindegArcPool, maxdegArcPool, nEpicycle, radwrtxArc,\
                       maxrotmag=None, degWhereRotIsZero=None, edgebuf=None,\
                       rngseed=None, blockTypes=None, agTypes=None,\
                       xOrigin=0.5, yOrigin=0.5):
    """FIXME: need to include the params used for making clickArcQueue:
    mindegArcPool, maxdegArcPool, nEpicycle, radwrtx, xOrigin, and yOrigin.

    def rotationExperiment(domainbounds, rotmag, nPerXOpt,
                           maxrotmag=None, degWhereRotIsZero=None, edgebuf=None,
                           rngseed=None, blockTypes=None, agTypes=None)

    inputs:
        (note: - lo* means list of *
               - nparray means numpy array
               - lo* can usually be an nparray of *
               - float is a non-integer real scalar)
        - domainbounds (lofloat): min and max of domain
        - rotmag (float or lofloat): rotation magnitude
        - nPerXOpt (loint): n trials for each block
        - maxrotmag (float, default=None): max rotation used in this experiment
            by any subject (not necessarily this sub).  Useful for matching
            degWhereRotIsZero between conditions, which is done randomly.
            if None, maxrotmag=rotmag
        - degWhereRotIsZero (float, default=None):  where on the line it means
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
        - xOptQueue (nparray): optimal location in the domain for each trial"""

    nBlock = len(nPerXOpt)
    mindomain, maxdomain = domainbounds
    # ambuiguous what rotation or counterrotation mean when multiple rots
    if type(rotmag) is list: assert not blockTypes

    if not degWhereRotIsZero:  # random valid degWhereRotIsZero (i.e. veridical location)
        if rngseed: rng = RandomState(rngseed)  # use seed if given
        else: rng = RandomState()

        if not edgebuf: edgebuf = 0.  # no edge buffer by default
        if not maxrotmag: maxrotmag = rotmag

        # ensure rotations will fall in within edgebuf of domain
        # (wrt maxrotmag for counterbalancing b.t. groups)
        good = False
        while not good:
            degWhereRotIsZero = rng.uniform(low=mindomain, high=maxdomain)
            if degWhereRotIsZero - maxrotmag > mindomain + edgebuf:
                if degWhereRotIsZero + maxrotmag < maxdomain - edgebuf:
                    good = True

    # default rotation for all blocks (so you can pass vector of custom rots)
    if not blockTypes:
        blockTypes = ['rotation' for _ in xrange(nBlock)]

    xOpts = []
    # get xOpt for each block relative to degWhereRotIsZero
    for bt in blockTypes:
        basenames = ['baseline', 'base', 'b']
        rotnames = ['rotation', 'rot', 'r']
        crotnames = ['counterrotation', 'crot', 'c']
        if bt in basenames:
            xOpt = degWhereRotIsZero
        elif bt in rotnames:
            xOpt = degWhereRotIsZero + rotmag
        elif bt in crotnames:
            xOpt = degWhereRotIsZero - rotmag
        else:
            raise ValueError('invalid blockType name %s' % (bt))
        xOpts.append(xOpt)

    if not agTypes:
        agTypes = ['abrupt' for _ in xrange(nBlock)]

    assert len(blockTypes) == len(xOpts) == len(nPerXOpt) == len(agTypes)
    xOptQueue = make_mixed_xOptQueue(xOpts, nPerXOpt, agTypes)

    # get the arcline for the experiment
    clickArcQueue = make_clickArcQueue(mindegArcPool, maxdegArcPool,\
                                       nEpicycle, radwrtxArc,\
                                       xOrigin, yOrigin)

    # package in dict and ship off
    experParams = {}
    experParams['xOptQueue'] = xOptQueue
    for ff in clickArcQueue:  # extract params in clickArcQueue
        experParams[ff] = clickArcQueue[ff]

    return experParams


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


def repeatIfScalar(thing, n):
    """def repeatIfScalar(thing, n)
    input:
        thing (anything): thing checking if scalar
        n (int): times to repeat if scalar

    output:
        thing (list): thing repeated n times is scalar, else thing"""
    if not hasattr(thing, "__len__"):  # if not list or nparray
        thing = repeat(thing, n)
    return thing


def make_clickArcQueue(mindegArcPool, maxdegArcPool, nEpicycle, radwrtxArc,\
                       xOrigin=0.5, yOrigin=0.5):
    """make_clickArcQueue(mindegArcPool, maxdegArcPool, nEpicycle, radwrtxArc,\
                          xStart=0.5, yStart=0.5)
    input:
        - mindegArcPool (lofloat): degrees of cw-most edge of choice arc
        - mindegArcPool (lofloat): degrees of ccw-most edge of choice arc
            must be same size as mindegArcPool
        - nEpicycle (loint): number of rand perms of mindegArcPool
        - radwrtxArc (float in [0., 1.]): radius, in terms of percentage of
            width (x) of screen
        - xOrigin (float or lofloat in [0., 1.], default 0.5): arc origin as
            percent of screen width
        - yOrigin (float or lofloat in [0., 1.], default 0.5): arc origin as
            percent of screen height
    output:
        - out w fields [mindegqueue, maxdegqueue, radwrtxqueue,
                        xoriginqueue, yoriginqueue],
            which specify the startpoint and choice arc for every trial of
            the experiment
    """
    iInPool = len(mindegArcPool)
    assert len(maxdegArcPool) == iInPool
    radwrtxArcPool = repeatIfScalar(radwrtxArc, iInPool)
    xOriginPool = repeatIfScalar(xOrigin, iInPool)
    yOriginPool = repeatIfScalar(yOrigin, iInPool)
    # ensure lengths all kosher
    assert len(radwrtxArcPool) == iInPool
    assert len(xOriginPool) == iInPool
    assert len(yOriginPool) == iInPool

    iDegPool = arange(iInPool)
    iDegPoolQueue = concatenate([permutation(iDegPool)
                                 for _ in xrange(nEpicycle)])
    out = {}
    out['mindegarcqueue'] = npa([mindegArcPool[ii] for ii in iDegPoolQueue])
    out['maxdegarcqueue'] = npa([maxdegArcPool[ii] for ii in iDegPoolQueue])
    out['radwrtxarcqueue'] = npa([radwrtxArcPool[ii] for ii in iDegPoolQueue])
    out['xoriginqueue'] = npa([xOriginPool[ii] for ii in iDegPoolQueue])
    out['yoriginqueue'] = npa([yOriginPool[ii] for ii in iDegPoolQueue])

    return out

