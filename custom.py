# this file imports custom routes into the experiment server
from flask import Blueprint, render_template, request, jsonify, Response, abort, current_app
from jinja2 import TemplateNotFound
from functools import wraps
from sqlalchemy import or_

from psiturk.psiturk_config import PsiturkConfig
from psiturk.experiment_errors import ExperimentError
from psiturk.user_utils import PsiTurkAuthorization, nocache

# # Database setup
from psiturk.db import db_session, init_db
from psiturk.models import Participant
from json import dumps, loads

# for basic experiment setup
from numpy import linspace
from numpy import array as npa

# load the configuration options
config = PsiturkConfig()
config.load_config()
config.SECREY_KEY = 'my_secret_key'
myauth = PsiTurkAuthorization(config)  # if you want to add a password protect route use this

# explore the Blueprint
custom_code = Blueprint('custom_code', __name__, template_folder='templates', static_folder='static')

from rotationExperiment import rotationExperiment

## GET SUBJECT EXPERIMENT PARAMS
@custom_code.route('/init_experiment', methods=['GET'])
def init_experiment():
    if not request.args.has_key('condition'):
        raise ExperimentError('improper_inputs')  # i don't like returning HTML to JSON requests...  maybe should change this

    CONDITION = int(request.args['condition'])
    COUNTERBALANCE = int(request.args['counterbalance'])

    ## FREE VARS
    # made with numpy.random.randint(4294967295, size=100)  # (number is max allowed on amazon linux)
    RNGSEEDPOOL =\
        npa([3298170796, 2836114699,  599817272, 4120600023, 2084303722,
               3397274674,  422915931, 1268543322, 4176768264, 3919821713,
               1110305631, 1751019283, 2477245129,  658114151, 3344905605,
               1041401026,  232715019,  326334289, 2686111309, 2708714477,
                737618720, 1961563934, 2498601877,  210792284,  474894253,
               4028779193,  237326432, 3676530999,  529417255, 3092896686,
                169403409, 2615770170, 1339086861, 3757383830, 2082288757,
               4170457367,  371267289, 3248256753, 1696640091, 2779201988,
                492501592, 2278560761, 2146121483,  772692697, 2009991030,
               1917110505,  621292942, 1900862326, 3924210345, 2834685808,
               2782250785, 3978659517,  230589819, 3266844848, 1789706566,
               1926158994, 3334290749, 2564647456, 2780425615, 2453304773,
               2867246165, 2853230235, 3943014068, 1849702346, 1006440977,
                326290567,  779365638, 2796156127, 2850718974, 4250010213,
               1627130691, 3538373920, 1807938670, 2430758838, 1678867555,
                515849939,  323252975, 1062571753,  551895230, 1003551997,
                902827309, 2496798931, 4165811834,   88322007, 1998993400,
               3260624632, 2504021401,  915464428, 2503603945, 1138822767,
               1487903826, 3534352433, 2793970570, 3696596236, 3057302268,
               2924494158, 1308408238, 2181850436, 2485685726, 1958873721])

    MINDOMAIN = -1.
    MAXDOMAIN = 1.

    ROTMAGPOOL = npa([15., 30., 45., 60.])/90.  # proxy for 15, 30, 45, 60 degree rots

    ROTMAG = ROTMAGPOOL[CONDITION]
    NPERXOPT = [90, 40, 40, 90]  # how many trials per block?
    NTRIAL = sum(NPERXOPT)  # total number trials in experiment
    MAXROTMAG = 60./90.  # maximum rotation considered for these experiments
    BASE_XOPT = None  # if none, will be random
    EDGEBUF = 0.05  # random base_xOpt will be between [-1+EDGEBUF, 1-EDGEBUF]
    RNGSEED = RNGSEEDPOOL[COUNTERBALANCE]
    # 'b' for base, 'r' for rot, 'c' for counterrot
    BLOCKTYPES = ['b', 'r', 'c', 'b']
    # if None, all abrupt blocks.
    # (can be explicitely written as ['a', 'a', 'a', 'a'])
    AGTYPES = None

    # params for make_clickArcQueue, which determines startpoint and heading ang
    NTARGET = 4
    MINDEGARCPOOL = linspace(0., 360., NTARGET+1)[:-1]  # ccw-most part of choice arc
    MAXDEGARCPOOL = MINDEGARCPOOL + 90.;   # cw-most part of choice arc
    assert NTRIAL % NTARGET == 0
    NEPICYCLE = NTRIAL / NTARGET  # how many epicycles through each target loc
    RADWRTXARC = 0.3  # percent of window width that determines dist(start, arc)
    XORIGIN = 0.5  # x startpoint as percentage of window width
    YORIGIN = 0.5  # y startpoint as percentage of window height


    experParams = {# needed for make_mixed_xOptQueue
                   'domainbounds': [MINDOMAIN, MAXDOMAIN],
                   'rotmag': ROTMAG,
                   'nPerXOpt': NPERXOPT,
                   'radwrtxArc': RADWRTXARC,
                   'maxrotmag': MAXROTMAG,
                   'base_xOpt': BASE_XOPT,
                   'edgebuf': EDGEBUF,
                   'rngseed': RNGSEED,
                   'blockTypes': BLOCKTYPES,
                   'agTypes': AGTYPES,
                   # needed for make_clickArcQueue
                   'mindegArcPool': MINDEGARCPOOL,
                   'maxdegArcPool': MAXDEGARCPOOL,
                   'nEpicycle': NEPICYCLE,
                   'radwrtxArc': RADWRTXARC,
                   'xOrigin': XORIGIN,
                   'yOrigin': YORIGIN}

    # make experiment params for this subject!
    # (** means unpack and pass in params in a dict)
    subParams = rotationExperiment(**experParams)
    # bundle response to send
    resp = {}
    for f in subParams:
        try:
            resp[f] = subParams[f].tolist()
        except:
            resp[f] = subParams[f]

    for f in experParams:
        try:  # convet numpy array to list if possible
            resp[f] = experParams[f].tolist()
        except:
            resp[f] = experParams[f]

    resp['inititrial'] = 0  # start at trial 0
    resp['rotmag'] = ROTMAG
    resp['rngseed'] = RNGSEED
    resp['initscore'] = 0  # start w 0 points
    resp['mindomain'] = MINDOMAIN
    resp['maxdomain'] = MAXDOMAIN

    return jsonify(**resp)
