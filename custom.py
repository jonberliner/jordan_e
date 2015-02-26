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
from numpy import linspace, array

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
    # made with numpy.random.randint(sys.maxint, size=100)  # (number is max allowed on amazon linux)
    RNGSEEDPOOL =\
        array([2042262297146163799,  541971329638842197,   14721814019426356,
       8610443125589119320, 3769737793755371400, 1292727505209796434,
       6746617584792493666, 5536743154077178970, 5733427307618910228,
       8876671222925904304, 4877922201360856730, 5492632134755730561,
       1786515981627140838, 4112748283761228387, 6937988323781256920,
       3387525394581463497, 5527285278803008056, 7532435935184463542,
       2180004754386339908, 2734208926954907902, 8337248722068314226,
       3767202244524476264, 2051410689967677461, 7710422566989185538,
       3397541870437218900, 2572815413756301079, 1414478772248110638,
       2705255554300955744, 6803293886392689987, 5599530464535205092,
       3979309212094279141, 3352930653829446763, 6617386010794526232,
       5839545782576316856, 8717045751013929965, 7872406519216948796,
       3718274863099430651, 6233834398423644957, 7594413003023606358,
       2729684773607135806, 9126793218053285633, 2221371898487063148,
       2945660447554685276, 8200430219364988913, 3158504842337881279,
       5352739162305202135,   57430526756349749,  747005389243603861,
       2742526738895708228, 6698397220364144410,  831104758621786752,
        174996493328209744, 7497638400133644037, 3375690145240880546,
       6164398422644492637, 3666511748679932661, 2513532896109037104,
       5381124676307495400, 7716887884946263597, 7698760928059979953,
        307885502758169972, 3780543348524533255, 6077732267860057280,
       2016675760687449643,  608607084070070918, 6331674547289577152,
       7493388167590738685, 7778019375103541468, 3757205787229301642,
       3410102630005631684,  537890947662639415, 2753448838094490288,
       7232303477305152144, 3035235215189111809, 2766891985726956632,
       9064167390159741190, 6654716781117798213, 6083542640352042903,
       7516543893219482799, 1321060958394039924, 7619565265236844617,
       5422728806492755282, 1143635196365374900, 8825650192873969362,
       2812613739804813695, 1130170868353227074, 5329723275559001470,
       3604099532575871558, 2023232762551426572, 1165910932973925300,
       3430587773348059471, 1101733453044471532, 9079576278647166166,
         67172678068201409, 1983969835626482886, 4229016683266863979,
       4756393615225405542,  639941721654863281, 3775748472563965712,
       3867439393769721666])

    nX = 1028
    X = linspace(-1., 1., nX)
    ROTMAGPOOL = [0.25, 0.5, 0.75, 1.]  # proxy for 15, 30, 45, 60 degree rots

    ROTMAG = ROTMAGPOOL[CONDITION]
    NPERXOPT = [90, 40, 40, 90]  # how many trials per block?
    MAXROTMAG = 1.  # maximum rotation considered for these experiments
    BASE_XOPT = None  # if none, will be random
    EDGEBUF = 0.05  # random base_xOpt will be between [-1+EDGEBUF, 1-EDGEBUF]
    RNGSEED = RNGSEEDPOOL[COUNTERBALANCE]
    # 'b' for base, 'r' for rot, 'c' for counterrot
    BLOCKTYPES = ['b', 'r', 'c', 'b']
    # if None, all abrupt blocks.
    # (can be explicitely written as ['a', 'a', 'a', 'a'])
    AGTYPES = None

    experParams = {'x': X,
                   'rotmag': ROTMAG,
                   'nPerXOpt': NPERXOPT,
                   'maxrotmag': MAXROTMAG,
                   'base_xOpt': BASE_XOPT,
                   'edgebuf': EDGEBUF,
                   'rngseed': RNGSEED,
                   'blockTypes': BLOCKTYPES,
                   'agTypes': AGTYPES}

    # make experiment params for this subject!
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

    resp['trial'] = 0  # start at trial 0
    resp['rotmag'] = ROTMAG
    resp['rngseed'] = RNGSEED
    resp['initscore'] = 0  # start w 0 points

    return jsonify(**resp)
