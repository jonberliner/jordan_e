/********************
*    ROTATION GAME             *
********************/
var rotationGame = function(){
    "use strict";

    // use instead of % b.c. javascript can't do negative mod
    function mod(a, b){return ((a%b)+b)%b;}
    // var njs = numeric;
    var canvas = document.getElementById('easel');
    var W = canvas.width;
    var H = canvas.height;
    // groundline is homage to the mining task (it's the groung)
    // this is the arc where people can click (i.e. the "choice set")
    var stage = new createjs.Stage(canvas);
    var CHECKMOUSEFREQ;  // check for mouseover CHECKMOUSEFREQ times per sec
    stage.enableMouseOver(CHECKMOUSEFREQ);

    //////// STYLE SHEETS FOR THE GAME
    var STYLE = [];
    STYLE.choiceSet = [];
    STYLE.ground = [];
    STYLE.sky = [];
    STYLE.choiceSet_glow = [];
    STYLE.scalar_obs = [];

    STYLE.choiceSet.arc = [];
    STYLE.choiceSet.arc.strokeColor = '#D9BAAB';
    STYLE.choiceSet.arc.fillColor = null;
    STYLE.choiceSet.arc.strokeSize = 10;

    STYLE.ground.strokeSize = 5;
    STYLE.ground.strokeColor = '#A0522D';
    STYLE.ground.fillColor = '#A0522D';

    STYLE.sky.strokeSize = 5;
    STYLE.sky.strokeColor = '#33CCCC';
    STYLE.sky.fillColor = '#33CCCC';

    STYLE.choiceSet.arc_glow = [];
    STYLE.choiceSet.arc_glow.strokeColor = '#EACDDC';
    STYLE.choiceSet.arc_glow.strokeSize = 15;

    STYLE.scalar_obs.TEXTSTYLE = '2em Helvetica';
    STYLE.scalar_obs.COLOR = 'white';

    STYLE.startPoint.strokeColor = '#555555';
    STYLE.startPoint.fillColor = '#888888';
    STYLE.startPoint.strokeSize = 2;
    STYLE.startPoint.radius = 20;


    //////// GAME OBJECT GRAPHICS
    // ground Graphics
    var background; // container for background Shape objs
    function make_background(style, canvasH, canvasW){
        var background_objs = {};
        var groundLineY = canvasH - canvasH*0.5;
        var groundLineToBottom = canvasH - groundLineY;
        var ground = new createjs.Shape();
        ground.graphics.s(style.ground.strokeColor).
                        f(style.ground.fillColor).
                        ss(style.ground.strokeSize, 0, 0).
                        r(0, groundLineY, canvasW, groundLineToBottom);
        ground.visible = true;

        // sky Graphics
        var sky = new createjs.Shape();
        sky.graphics.s(style.sky.strokeColor).
                        f(style.sky.fillColor).
                        ss(style.sky.strokeSize, 0, 0).
                        r(0, 0, W, groundLineY);
        sky.visible = true;

        // add to background array
        background_objs.ground = ground;
        background_objs.sky = sky;

        return background_objs;
    }


    var startPoint;
    function make_startPoint(style){
        var startPoint_objs = {};
        // startPoint graphics
        var startPoint = new createjs.Shape();
        startPoint.graphics.s(style.startPoint.strokeColor).
                        f(style.startPoint.fillColor).
                        ss(style.startPoint.strokeSize, 0, 0).
                        r(pxStart, pyStart, style.startPoint.radius);
        startPoint.visible = true;
        // startPoint Actions
        startPoint.addEventListener('tick', function(){
            pxMouse = stage.mouseX;
            pyMouse = stage.mouseY;
            if(trialSection==='goToStart'){
                // check if in startPoint
                var inStartPoint = withinRad(pxMouse, pyMouse, pxStart, pyStart,
                                             style.startPoint.radius);
                if(inStartPoint){
                    timeInStart += 1;
                    // check if there long enough
                    if(timeInStart > MINTIMEINSTART){
                        trialSection = 'makeChoice';
                        startPoint.visible = false;
                        choiceSet.arc.visible = true;
                    }
                }
                else {
                    timeInStart = 0;
                }  // end if(inStartPoint)
            }  // end trialSection==='goToStart'

            // TODO: this is if you want times reaches
            // else if(trialSection==='inStartPoint'){
            //     // see if moving fast enough
            //     var mouseSpeed = get_mouseSpeed(pxMouse, pyMouse,
            //                                     prev_pxMouse, prev_pyMouse);
            //     if(mouseSpeed > MINMOUSEMOVESPEED){
            //         trialSection = 'moving';
            //     }
        });  // end startPoint.addEventListener('tick')
        startPoint_objs.startPoint = startPoint;

        return startPoint_objs;
    }


    var choiceSet;
    function make_choiceSet(style){
        var choiceSet = {};

        var choiceArc = new createjs.Shape();
        var choiceArc_glow = new createjs.Shape();


        // choiceArc Actions
        choiceArc.addEventListener('mouseover', function(){
            choiceArc_glow.visible = true;
            stage.update();
        });

        choiceArc.addEventListener('mouseout', function(){
            choiceArc_glow.visible = false;
            stage.update();
        });

        choiceArc.addEventListener('click', function(){
            if(trialSection==='inStart'){
                pxDrill = stage.mouseX;
                pyDrill = stage.mouseY;
                choice_made(pxDrill, pyDrill);
            }
        });

        choiceArc.addEventListener('tick', function(){
            if(trialSection==='makeChoice'){
                timeToChoice += 1;
                if(timeToChoice > MAXTIMETOCHOICE){
                    trialSection = 'tooSlow';
                }
            }
        });

        choiceSet.arc = choiceArc;
        choiceSet.arc_glow = choiceArc_glow;
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




    //////// GAME LOGIC
    var trialSection, timeInStart, timeMoving;
    var MINTIMEINSTART, MAXTIMETOCHOICE;
    var DEGMIN, DEGMAX, DEGRANGE;
    var NTRIAL
    var drill_history, xDrill, pxDrill, pyDrill, fDrill, degDrill;
    var obs_array;
    var signederror
    var expScore, trialScore, INITSCORE;
    var itrial;
    var DEGOPTQUEUE, degOpt;
    var RNGSEED;
    var NLASTTOSHOW;
    var XSTARTQUEUE, YSTARTQUEUE, xStart, yStart, pxStart, pyStart;
    var RADWRTXARCQUEUE, radwrtxArc, pradArc;  // radius from startpoint to choice arc
    var MINDEGARCQUEUE, MAXDEGARCQUEUE, mindegArc, maxdegArc, rangedegArc;
    var minthetaArc, maxthetaArc;


    function set_itrialParams(){
        // get values in abstract space
        // angle on arc where get max points.  assumes deg(mindegArc) = 0
        degOpt = DEGOPTQUEUE[itrial];
        xStart = XSTARTQUEUE[itrial];
        yStart = YSTARTQUEUE[itrial];
        radwrtxArc = RADWRTXARCQUEUE[itrial];
        mindegArc = mod(MINDEGARCQUEUE[itrial], 360.);
        maxdegArc = mod(MAXDEGARCQUEUE[itrial], 360.);
        rangedegArc = maxdegArc - mindegArc;
        // convert what's needed to pixel space
        pradArc = radwrtxArc * W;
        pxStart = xStart * W;
        pyStart = yStart * H;
        // convert to theta for arcs
        minthetaArc = degToRad(mindegArc);
        maxthetaArc = degToRad(maxdegArc);
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


    function update_choiceSet(){
        // negatives come from >0 being down screen.  huge PITA
        choiceSet.arc.graphics.clear();
        choiceSet.arc_glow.graphics.clear();
        choiceSet.arc.graphics.s(STYLE.choiceSet.arc.strokeColor).
                               ss(STYLE.choiceSet.arc.strokeSize, 0, 0).
                               arc(pxStart, pyStart, pradArc,
                                   -minthetaArc, -maxthetaArc, true);


        choiceSet.arc_glow.graphics.s(STYLE.choiceSet.arc_glow.strokeColor).
                                ss(STYLE.choiceSet.arc_glow.strokeSize, 0, 0).
                                arc(pxStart, pyStart, pradArc,
                                    -minthetaArc, -maxthetaArc, true);
    }


    function choice_made(pxDrill, pyDrill){
        store_thisTrial(pxDrill, pyDrill, function(){
            itrial += 1;
            setup_nextTrial();
        });
    }


    function store_thisTrial(pxDrill, pyDrill, callback){
        // store things from this trial
        degDrill = pToDegDrill(pxDrill, pyDrill, pxStart, pyStart);
        signederror = get_signederror(degDrill, degOpt);
        fDrill = errorToPoints(Math.abs(signederror)); // get the reward
        expScore += fDrill;
        drill_history.push({'px': pxDrill,
                            'py': pyDrill,
                            'mindegArc': mindegArc,
                            'f': fDrill,
                            'itrial': itrial});
        callback();
    }


    function setup_nextTrial(){
        // set up things for the next trial
        set_itrialParams();
        update_choiceSet();
        // update feedback
        unstageArray(obs_array);
        // show scores from last NLASTTOSHOW trials
        NLASTTOSHOW = 2;
        obs_array = make_vis_obs_array(drill_history, mindegArc,
            function(elt){return nlast(elt, itrial, NLASTTOSHOW)});
        stageArray(obs_array);
        startPoint.visible = true;
        trialSection = 'goToStart';
    }





    customRoute('init_experiment',  // call init_experiment in custom.py...
                {'condition': condition,  // w params condition adn counter...
                 'counterbalance': counterbalance},
                 function(resp){  // once to get back resp from custom.py...
                    RNGSEED = resp['rngseed'];
                    itrial = resp['inititrial'];
                    INITSCORE = resp['initscore'];
                    DEGMIN = resp['mindomain'];
                    DEGMAX = resp['maxdomain'];
                    DEGRANGE = DEGMAX - DEGMIN;
                    XSTARTQUEUE = resp['xoriginqueue'];
                    YSTARTQUEUE = resp['yoriginqueue'];
                    RADWRTXARCQUEUE = resp['radwrtxarcqueue'];
                    MINDEGARCQUEUE = resp['mindegarcqueue'];
                    MAXDEGARCQUEUE = resp['maxdegarcqueue'];
                    DEGOPTQUEUE = resp['degoptqueue'];  // which location gets 100% points?

                    set_itrialParams();
                    update_choiceSet();

                    NTRIAL = DEGOPTQUEUE.length;

                    expScore = INITSCORE;

                    obs_array = [];
                    drill_history = [];

                    background = make_background(STYLE, H, W);
                    startPoint = make_startPoint(STYLE);
                    choiceSet = make_choiceSet(STYLE);

                    stageArray(background);
                    stageArray(startPoint);
                    stageArray(choiceSet);

                    // add all objects to the stage
                    stage.update();

                    trialSection = 'goToStart';

                    console.log('init_experiment was called')
                });


    function pToDegDrill(pxDrill, pyDrill, pxStart, pyStart){
        // ALWAYS ASSUMES mindegArc IS 0!!!!!
        // * pyDrill-pyStart is negative b.c. >y is lower in pixel space
        var theta = Math.atan2(-(pyDrill-pyStart), pxDrill-pxStart);
        var deg = mod(radToDeg(theta), 360.);
        return deg;
    }


    function get_signederror(degDrill, degOpt){
        var ccwerr = degDrill - mod(degOpt + mindegArc, 360.);  // e.g. 270-0 = 270
        var cwerr = degDrill-360. - mod(degOpt + mindegArc, 360.);  // e.g. -90-0 = -90 (correct)
        var signederror = Math.abs(ccwerr) < Math.abs(cwerr) ? ccwerr : cwerr;
        return signederror;
    }


    function nextTrial(pxDrill, pyDrill){
        jsb_recordTurkData(function(){
            // if have more trials to go...
            console.log('trial '+itrial.toString()+' saved successfully.');
            itrial += 1;  // move to next trial
            if (itrial < NTRIAL){  // if more trials to go...

                // store things from this trial
                degDrill = pToDegDrill(pxDrill, pyDrill, pxStart, pyStart);
                signederror = get_signederror(degDrill, degOpt);
                fDrill = errorToPoints(Math.abs(signederror)); // get the reward
                expScore += fDrill;
                drill_history.push({'px': pxDrill,
                                    'py': pyDrill,
                                    'degDrill', degDrill,
                                    'mindegArc': mindegArc,
                                    'f': fDrill,
                                    'itrial': itrial});

                // set up things for the next trial
                set_itrialParams();
                update_choiceSet();
                // update feedback
                unstageArray(obs_array);
                // show scores from last NLASTTOSHOW trials
                NLASTTOSHOW = 2;
                obs_array = make_vis_obs_array(drill_history,
                    function(elt){return nlast(elt, itrial, NLASTTOSHOW)});
                stageArray(obs_array);
            }
            else {
                // endgame goes here
                experimentSection = 'expSummary';
                // show total feedback
                trialSummary_text.text = 'You played ' +
                    NTRIAL.toString() +
                    ' trials\n\n and earned ' +
                    monify(expScore) +
                    '\n\n' +
                    'Please click the button to finish.';

                trialSummary_text.visible = true;
                button.visible = true; // enable click-to-leave
                button_text.visible = false;
            }  // end if <NTRIAL
        });  // end jsb_recordTurkData
    } // end nextTrial


//// HELPER FUNCTIONS
    function nlast(elt, currtrial, n) {
        // says yes if this elt's trial was one of the n last trials
        var good = currtrial - elt.itrial < n;
        return good;
    }


    function make_vis_obs_array(drill_history, mindegArc, critfcn) {
        // takes drill_history, filters by crit, returns array of ScalarObs
        var to_show = drill_history.filter(critfcn);  // filter to only shown
        // rotate to match choiceArc's rotation for this trial
        to_show = to_show.map(function(elt){
                                  elt.degDrill += mindegArc - elt.mindegArc;
                                  return elt;});
        // make obs for all valid sams in drill_history
        var obs_array = to_show.map(
            function(elt){return ScalarObs(elt.px, elt.py, elt.f)}
        );
        return obs_array;
    }


    function ScalarObs(x, y, val){
        // val to be placed at drill location
        var obs = new createjs.Text('',
                                    STYLE.scalar_obs.TEXTSTYLE,
                                    STYLE.scalar_obs.COLOR);
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


    function unstageArray(shapeArray){
        // remove all elements in shapeArray from the canvas
        shapeArray.map(function(elt){
            elt.visible = false;
            stage.removeChild(elt);
        });
    }


    function errorToPoints(unsignederror) {
        return Math.round((1 - (unsignederror/DEGRANGE)) * 100);
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


    function jsb_recordTurkData(callback){
        psiTurk.recordTrialData({
            'trial': itrial,
            'mindomain': DEGMIN,
            'maxdomain': DEGMAX,
            'expScore': expScore,
            'degOpt': degOpt,
            'degDrill': degDrill,
            'signederror': signederror,
            'fDrill': fDrill,
            'pxDrill': pxDrill,
            'RNGSEED': RNGSEED,
            'condition': condition,
            'counterbalance': counterbalance
        });
        psiTurk.saveData();
        callback();
    }
};
