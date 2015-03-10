/********************
*    ROTATION GAME             *
********************/
var rotationGame = function(){
    "use strict";
    var canvas = document.getElementById('easel');
    var W = canvas.width;
    var H = canvas.height;

    var stage = new createjs.Stage(canvas);  // objects will go on stage

    var CHECKMOUSEFREQ = 10;  // check for mouseover CHECKMOUSEFREQ times per sec
    stage.enableMouseOver(CHECKMOUSEFREQ);

    var MSTICK = 100;  // run checkOnTick every MSTICK ms
    createjs.Ticker.setInterval(MSTICK);
    createjs.Ticker.addEventListener("tick", function(event){
        checkOnTick(event, tp, wp, EP, STYLE.startPoint.sp.radius);
    });

    //////// INITIATE GAME
    var EP = {};  // params that stay constant through experiment
    var tp = {};  // params that change trial by trial
    var wp = {};  // params that can change within a trial
    var tsub = {}; // trial responses from subject that change trial by trial
    var obs_array, drill_history;  // used to show (possibly persistent) feedback
    // containers that make up easeljs objects - objects are for easily
    // accessing shapes by name
    var background, startPoint, choiceSet;
    var a_background, a_startPoint, a_choiceSet; // arrays for ordered staging
    var QUEUES = {};  // queues containing trial params for each trial of experiment
    customRoute('init_experiment',  // call init_experiment in custom.py...
                {'condition': condition,  // w params condition adn counter...
                 'counterbalance': counterbalance},
                 function(resp){  // once to get back resp from custom.py...
                    EP.RNGSEED = resp['rngseed'];
                    EP.INITSCORE = resp['initscore'];
                    EP.MINDEG = resp['mindeg'];  // min degree for choiceSet
                    EP.MAXDEG = resp['maxdeg'];  // max degree for choiceSet
                    EP.RANGEDEG = EP.MAXDEG - EP.MINDEG;
                    EP.NTRIAL = resp['ntrial'];
                    QUEUES.XSTART = resp['xoriginqueue'];
                    QUEUES.YSTART = resp['yoriginqueue'];
                    QUEUES.RADWRTXARC = resp['radwrtxarcqueue'];
                    QUEUES.MINDEGARC = resp['mindegarcqueue'];
                    QUEUES.MAXDEGARC = resp['maxdegarcqueue'];
                    QUEUES.DEGOPT = resp['degoptqueue'];  // which location gets 100% points?
                    EP.NTRIAL = QUEUES.DEGOPT.length;

                    EP.NLASTTOSHOW = resp['nlasttoshow'];
                    EP.MSMINTIMEINSTART = resp['msmintimeinstart'];
                    EP.MSMAXTIMETOCHOICE = resp['msmaxtimetochoice'];
                    if(EP.MSMAXTIMETOCHOICE==='None'){
                        EP.MSMAXTIMETOCHOICE = null;
                    }
                    EP.MSSHOWFEEDBACK = resp['msshowfeedback'];

                    tp.itrial = resp['inititrial'];
                    tp = set_itrialParams(tp.itrial, QUEUES);
                    tsub.expScore = EP.INITSCORE;

                    obs_array = [];
                    drill_history = [];

                    background = make_background(STYLE.background, W, H);
                    a_background = [background.background];
                    startPoint = make_startPoint(tp.pxStart, tp.pyStart, STYLE.startPoint);
                    a_startPoint = [startPoint.sp_glow, startPoint.sp];
                    choiceSet = make_choiceSet();
                    a_choiceSet = [choiceSet.arc_glow, choiceSet.arc];

                    update_choiceSet(tp.pxStart, tp.pyStart, tp.pradArc,
                                     tp.minthetaArc, tp.maxthetaArc, STYLE.choiceSet);

                    stageArray(a_background);
                    stageArray(a_startPoint);
                    stageArray(a_choiceSet);

                    // let's get it started!
                    setup_goToStart();
                }  // end callback
    );  // end init_experiment


    //////// GAME LOGIC (besides createjs shape event handlers)
    function checkOnTick(event, tp, wp, EP, radStart){
        // this function checks the logic loop every MSTICK seconds
        // only checks timing things - interaction with objects should be
        // added with addEventListener in a easeljs object's construction
        if (wp.trialSection==='goToStart'){
            var pxMouse = stage.mouseX;
            var pyMouse = stage.mouseY;
            var inStartPoint = withinRad(pxMouse, pyMouse, tp.pxStart, tp.pyStart,
                                         radStart);
            if(inStartPoint){
                var tNow = getTime();
                if(tNow - wp.tInStart > EP.MSMINTIMEINSTART){
                    setup_makeChoice();
                }
            }
        }  // end goToStart
        else if (wp.trialSection==='makeChoice'){
            if(EP.MSMAXTIMETOCHOICE !== null){  // if choice time constraint
                var tNow = getTime();
                if(tNow - wp.tChoiceStarted > EP.MSMAXTIMETOCHOICE){
                    setup_tooSlow();
                }
            }
        }  // end makeChoice
        else if (wp.trialSection==='showFeedback'){
            var tNow = getTime();
            if(tNow - wp.tFeedbackOn > EP.MSSHOWFEEDBACK){
                setup_nextTrial();
            }
        }
        else if (wp.trialSection==='tooSlow'){
            var tNow = getTime();
            if(tNow - wp.tTooSlow > EP.MSTOOSLOW){
                msgs.tooSlow.visible = false;
                setup_goToStartPoint();
            }
        }  // end tooSlow
        stage.update(event);
    }


    //// setups for various parts of a trial
    function setup_goToStart(){
        // what happens when we move to 'goToStart' section of a trial
        console.log('setup_goToStart was called');
        wp.trialSection = 'goToStart';
        choiceSet.arc.visible = false;
        choiceSet.arc_glow.visible = false;
        startPoint.sp.visible = true;
        startPoint.sp_glow.visible = false;
        stage.update();
    }


    function setup_makeChoice(){
        // what happens when we move to 'makeChoice' section of a trial
        wp.trialSection = 'makeChoice';
        choiceSet.arc_glow.visible = false;
        choiceSet.arc.visible = true;
        startPoint.sp.visible = false;
        startPoint.sp_glow.visible = false;
        stage.update();
        wp.tChoiceStarted = getTime();  // start choice timer
    }


    function setup_showFeedback(){
        wp.trialSection = 'showFeedback';
        wp.tFeedbackOn = getTime();
        unstageArray(obs_array);
        // show scores from last NLASTTOSHOW trials
        obs_array = make_vis_obs_array(drill_history, tp.mindegArc,
            function(elt){return nlast(elt, tp.itrial, EP.NLASTTOSHOW)},
            STYLE.scalar_obs);
        stageArray(obs_array);
        stage.update();
    }


    function setup_tooSlow(){
        wp.trialSection==='tooSlow';
        msgs.tooSlow.visible = true;
        wp.tTooSlow = getTime();
    }


    //// functions for setting up a trial
    function setup_nextTrial(){
        // increment tp.itrial and setup the next trial
        tp.itrial += 1;
        console.log('itrial ' + tp.itrial.toString());
        setup_trial(tp.itrial, EP, QUEUES, STYLE.choiceSet);
    }


    function setup_trial(itrial, ep, queues, stylecs){
        // set up things for trial itrial
        tp = set_itrialParams(itrial, queues);
        update_choiceSet(tp.pxStart, tp.pyStart, tp.pradArc,
                         tp.minthetaArc, tp.maxthetaArc, stylecs);
        // update feedback
        unstageArray(obs_array);
        // show scores from last NLASTTOSHOW trials
        obs_array = make_vis_obs_array(drill_history, tp.mindegArc,
            function(elt){return nlast(elt, itrial-1, ep.NLASTTOSHOW)},
            STYLE.scalar_obs);
        stageArray(obs_array);
        setup_goToStart();
    }


    function set_itrialParams(itrial, queues){
        // extract trial params for itrial itrial from the queues in queues
        var tp = {};  // init trial params

        // get values in abstract space
        // angle on arc where get max points.  assumes deg(mindegArc) = 0
        tp.degOpt = queues.DEGOPT[itrial];
        tp.xStart = queues.XSTART[itrial];
        tp.yStart = queues.YSTART[itrial];
        tp.radwrtxArc = queues.RADWRTXARC[itrial];
        tp.mindegArc = mod(queues.MINDEGARC[itrial], 360.);
        tp.maxdegArc = mod(queues.MAXDEGARC[itrial], 360.);
        tp.rangedegArc = tp.maxdegArc - tp.mindegArc;
        // convert what's needed to pixel space
        tp.pradArc = tp.radwrtxArc * W;
        tp.pxStart = tp.xStart * W;
        tp.pyStart = tp.yStart * H;
        // convert to theta for arcs
        tp.minthetaArc = degToRad(tp.mindegArc);
        tp.maxthetaArc = degToRad(tp.maxdegArc);

        tp.itrial = itrial;

        return tp;
    }


    function update_choiceSet(pxStart, pyStart, pradArc,
                              minthetaArc, maxthetaArc, stylecs){
        // update the graphics of choiceSet wrt incoming args
        // negatives come from >0 being down screen.  huge PITA
        choiceSet.arc.graphics.clear();
        choiceSet.arc_glow.graphics.clear();
        choiceSet.arc.graphics.s(stylecs.arc.strokeColor).
                               ss(stylecs.arc.strokeSize, 0, 0).
                               arc(pxStart, pyStart, pradArc,
                                   -minthetaArc, -maxthetaArc, true);

        var arc_glow_size = stylecs.arc.strokeSize *
                            stylecs.arc_glow.ratioGlowBigger;
                        stylecs.arc_glow.ratioGlowBigger;
        choiceSet.arc_glow.graphics.s(stylecs.arc_glow.strokeColor).
                                ss(arc_glow_size, 0, 0).
                                arc(pxStart, pyStart, pradArc,
                                    -minthetaArc, -maxthetaArc, true);
    }


    //// functions for saving and tearing down a trial
    function choice_made(pxDrill, pyDrill){
        // what happens after a choice is made
        console.log('choice_made called');
        store_thisTrial(pxDrill, pyDrill, setup_showFeedback);
    }


    function store_thisTrial(pxDrill, pyDrill, callback){
        // store things from this trial and then run callback
        tsub.pxDrill = pxDrill;
        tsub.pyDrill = pyDrill;
        tsub.degDrill = pToDegDrill(pxDrill, pyDrill, tp.pxStart, tp.pyStart);
        tsub.signederror = get_signederror(tsub.degDrill, tp.degOpt, tp.mindegArc);
        tsub.fDrill = errorToPoints(Math.abs(tsub.signederror), EP.RANGEDEG); // get the reward
        tsub.expScore += tsub.fDrill;
        tsub.choiceRT = getTime() - wp.tChoiceStarted;
        drill_history.push({'px': tsub.pxDrill,
                            'py': tsub.pyDrill,
                            'degDrill': tsub.degDrill,
                            'mindegArc': tp.mindegArc,
                            'f': tsub.fDrill,
                            'itrial': tp.itrial});
        jsb_recordTurkData([EP, tp, tsub], callback);
    }


    //////// GAME OBJECTS AND OBJECT CONSTRUCTORS
    function make_messages(stylemsgs){
        var msgs = {};
        msgs.tooSlow = new createjs.Text();
        msgs.tooSlow.text('TOO SLOW');

        return msgs;
    }


    function make_background(stylebg, canvasW, canvasH){
        var background_objs = [];
        var background = new createjs.Shape();
        background.graphics.s(stylebg.strokeColor).
                            f(stylebg.fillColor).
                            ss(stylebg.strokeSize, 0, 0).
                            r(0, 0, canvasW, canvasH);

        // add to background array
        background_objs.background = background;

        return background_objs;
    }


    function make_startPoint(pxStart, pyStart, stylesp){
        var startPoint_objs = {};
        // startPoint graphics
        var sp = new createjs.Shape();
        sp.graphics.s(stylesp.sp.strokeColor).
                        f(stylesp.sp.fillColor).
                        ss(stylesp.sp.strokeSize, 0, 0).
                        dc(pxStart, pyStart, stylesp.sp.radius);
        sp.visible = true;
        // startPoint Actions
        sp.addEventListener('mouseover', function(){
            if(wp.trialSection==='goToStart'){
                startPoint.sp_glow.visible = true;
                stage.update();
                wp.tInStart = getTime();
            }  // end trialSection==='goToStart'

        });
        // glow graphics
        var sp_glow = new createjs.Shape();
        var sp_glow_rad = stylesp.sp.radius * stylesp.sp_glow.ratioGlowBigger;
        sp_glow.graphics.s(stylesp.sp_glow.strokeColor).
                                 f(stylesp.sp_glow.fillColor).
                                 ss(stylesp.sp_glow.strokeSize, 0, 0).
                                 dc(pxStart, pyStart, sp_glow_rad);
        startPoint_objs.sp = sp;
        startPoint_objs.sp_glow = sp_glow;
        return startPoint_objs;
    }


    function make_choiceSet(){
        var choiceSet = {};

        var arc = new createjs.Shape();
        var arc_glow = new createjs.Shape();

        // choiceArc Actions
        arc.addEventListener('mouseover', function(){
            arc_glow.visible = true;
            stage.update();
        });

        arc.addEventListener('mouseout', function(){
            arc_glow.visible = false;
            stage.update();
        });

        arc.addEventListener('click', function(){
            if(wp.trialSection==='makeChoice'){
                var pxDrill = stage.mouseX;
                var pyDrill = stage.mouseY;
                choice_made(pxDrill, pyDrill);
            }
        });

        choiceSet.arc = arc;
        choiceSet.arc_glow = arc_glow;
        return choiceSet;
    }


    ////////////  HELPERS  ////////////
    function pToDegDrill(pxDrill, pyDrill, pxStart, pyStart){
        // ALWAYS ASSUMES mindegArc IS 0!!!!!
        // * pyDrill-pyStart is negative b.c. >y is lower in pixel space
        var theta = Math.atan2(-(pyDrill-pyStart), pxDrill-pxStart);
        var deg = mod(radToDeg(theta), 360.);
        return deg;
    }

    function degDrillToP(degDrill, prad, pxStart, pyStart){
        // ALWAYS ASSUMES mindegArc IS 0!!!!!
        var theta = degToRad(degDrill);
        var px = prad * Math.cos(theta);
        var py = - (prad * Math.sin(theta));  // negative b.c of reflection in pixel space
        px += pxStart;
        py += pyStart;
        return {'x': px, 'y': py};
    }


    function get_signederror(degDrill, degOpt, mindegArc){
        var ccwerr = degDrill - mod(degOpt + mindegArc, 360.);  // e.g. 270-0 = 270
        var cwerr = degDrill-360. - mod(degOpt + mindegArc, 360.);  // e.g. -90-0 = -90 (correct)
        var signederror = Math.abs(ccwerr) < Math.abs(cwerr) ? ccwerr : cwerr;
        return signederror;
    }


//// HELPER FUNCTIONS
    function nlast(elt, currtrial, n) {
        // says yes if this elt's trial was one of the n last trials
        var good = currtrial - elt.itrial < n;
        return good;
    }


    function make_vis_obs_array(drill_history, mindegArc, critfcn, styleso) {
        // takes drill_history, filters by crit, returns array of ScalarObs
        var to_show = drill_history.filter(critfcn);  // filter to only shown
        // rotate to match choiceArc's rotation for this trial
        to_show = to_show.map(function(elt){
                                  var rot_degDrill = mod(elt.degDrill - elt.mindegArc + mindegArc, 360.);
                                  var pposn = degDrillToP(rot_degDrill, tp.pradArc,
                                                          tp.pxStart, tp.pyStart);
                                  elt.px = pposn.x;
                                  elt.py = pposn.y;
                                  return elt;});
        // make obs for all valid sams in drill_history
        var obs_array = to_show.map(
            function(elt){return ScalarObs(elt.px, elt.py, elt.f, styleso)}
        );
        return obs_array;
    }


    function ScalarObs(x, y, val, styleso){
        // val to be placed at drill location
        var obs = new createjs.Text('',
                                    styleso.textstyle,
                                    styleso.color);
        obs.x = x;
        obs.y = y;
        obs.text = val.toString();
        obs.visible = true;
        return obs;
    }


    function stageArray(shapeArray){
        // add all elements in shapeArray to the canvas
        shapeArray.map(function(elt){
            stage.addChild(elt);
            elt.visible = true;
        });
        stage.update();
    }


    function stageObject(object){
        // add all fields of object to the canvas
        for (var field in object){
            stage.addChild(object[field]);
            object[field].visible = true;
        }
        stage.update();
    }


    function unstageArray(shapeArray){
        // remove all elements in shapeArray from the canvas
        shapeArray.map(function(elt){
            elt.visible = false;
            stage.removeChild(elt);
        });
    }


    function unstageObject(object){
        // remove all fields of object from the canvas
        for (var field in object){
            object[field].visible = true;
            stage.removeChild(object[field]);
        }
        stage.update();
    }


    function errorToPoints(unsignederror, degrange) {
        return Math.round((1 - (unsignederror/degrange)) * 100);
    }


    function endExp(){
        psiTurk.showPage('debriefing.html');
    }


    function monify(n){
        n = Math.round(n);
        if (n<0){
            return '-$' + (-n).toString();
        }
        else{
            return '$' + n.toString();
        }
    }


    function max(array) {
        return Math.max.apply(Math, array);
    }


    function min(array) {
        return Math.min.apply(Math, array);
    }


    function getTime(){
        return new Date().getTime();
    }


    function normalize(a, tobounds, frombounds){
        // takes aa, which lives in interval frombounds, and maps to interval tobounds
        // default tobounds = [0,1]
        tobounds = typeof tobounds !== 'undefined' ? tobounds : [0., 1.];
        // default frombounds are the min and max of a
        frombounds = typeof frombounds !== 'undefined' ? frombounds : [min(a), max(a)];

        var fromlo = frombounds[0];
        var fromhi = frombounds[1];
        var tolo = tobounds[0];
        var tohi = tobounds[1];
        var fromrange = fromhi-fromlo;
        var torange = tohi-tolo;

        a = a.map(function(elt){return elt-fromlo;});
        a = a.map(function(elt){return elt/fromrange;}); // now in 0, 1
        a = a.map(function(elt){return elt*torange});
        a = a.map(function(elt){return elt+tolo});

        return a;
    }


    function get_dist(p1, p2){
        return Math.sqrt(Math.pow(p1[0]-p2[0], 2.) +
                         Math.pow(p1[1]-p2[1], 2.));
    }

    function withinRad(x, y, xOrigin, yOrigin, rad){
        return get_dist([x, y], [xOrigin, yOrigin]) < rad;
    }


    function radToDeg(theta){
        return mod(theta * (180./Math.PI), 360.);
    }


    function degToRad(deg){
        return mod(deg, 360.) * (Math.PI/180.);
    }


    // use instead of % b.c. javascript can't do negative mod
    function mod(a, b){return ((a%b)+b)%b;}


    function keys(obj, sorted){
        // gets object keys
        sorted = typeof tobounds !== 'undefined' ? tobounds : true; // default sorted
        var keys = [];
        for(var key in obj){
            if(obj.hasOwnProperty(key)){
                keys.push(key);
            }
        }
        return keys;
    }


    function objToArray(obj){
        return keys(obj).map(function(k){return obj[k]});
    }


    function jsb_recordTurkData(loObj, callback){
        var toSave = {};
        loObj.map(function(obj){  // for every obj in loObj...
            for(var field in obj){
                toSave[field] = obj[field];  // add to dict toSave
            }
        });

        psiTurk.recordTrialData(toSave);  // store on client side
        psiTurk.saveData();  // save to server side
        callback();
    }


    //////// STYLE SHEETS FOR THE GAME
    var STYLE = [];

    STYLE.background = [];
    STYLE.background.strokeSize = 5;
    STYLE.background.strokeColor = '#171717';
    STYLE.background.fillColor = '#171717';

    STYLE.choiceSet = [];
    STYLE.choiceSet.arc = [];
    STYLE.choiceSet.arc.strokeColor = '#8B8B8B';
    STYLE.choiceSet.arc.fillColor = null;
    STYLE.choiceSet.arc.strokeSize = 10;

    STYLE.choiceSet.arc_glow = [];
    STYLE.choiceSet.arc_glow.strokeColor = '#AEAEAE';
    STYLE.choiceSet.arc_glow.ratioGlowBigger = 1.5;

    STYLE.scalar_obs = [];
    STYLE.scalar_obs.textstyle = '2em Helvetica';
    STYLE.scalar_obs.color = 'white';

    STYLE.startPoint = [];
    STYLE.startPoint.sp = [];
    STYLE.startPoint.sp.strokeColor = '#8B8B8B';
    STYLE.startPoint.sp.fillColor = '#8B8B8B';
    STYLE.startPoint.sp.strokeSize = 2;
    STYLE.startPoint.sp.radius = 20;

    STYLE.startPoint.sp_glow = [];
    STYLE.startPoint.sp_glow.strokeColor = '#AEAEAE';
    STYLE.startPoint.sp_glow.fillColor = '#AEAEAE';
    STYLE.startPoint.sp_glow.ratioGlowBigger = 1.2;
};
