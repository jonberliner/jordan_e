/********************
*    ROTATION GAME             *
********************/
var rotationGame = function(){
    "use strict";
    // var njs = numeric;
    var canvas = document.getElementById('easel');
    var W = canvas.width;
    var H = canvas.height;
    var GROUNDLINEY = H - H*0.5;
    var GROUNDLINE2BOTTOM = H - GROUNDLINEY;
    var stage = new createjs.Stage(canvas);
    stage.enableMouseOver(10); // check for mouseovers 5x per sec

    //////// STYLE SHEETS FOR THE GAME
    var STYLE = [];
    STYLE.groundLine = [];
    STYLE.hidFcn = [];
    STYLE.samArray = [];
    STYLE.drillArray = [];
    STYLE.ground = [];
    STYLE.sky = [];
    STYLE.groundLine_glow = [];
    STYLE.ulButton_text = [];
    STYLE.score_text = [];
    STYLE.roundSummary_text = [];
    STYLE.scalar_obs = [];

    STYLE.groundLine.STROKECOLOR = '#D9BAAB';
    STYLE.groundLine.FILLCOLOR = null;
    STYLE.groundLine.STROKESIZE = 10;

    STYLE.hidFcn.FILLCOLOR = null;
    STYLE.hidFcn.STROKECOLOR = 'black';
    STYLE.hidFcn.STROKESIZE = 3;

    STYLE.samArray.STROKECOLOR = 'white';
    STYLE.samArray.FILLCOLOR = null;
    STYLE.samArray.STROKESIZE = 3;
    STYLE.samArray.CIRCRADIUS = 8;

    STYLE.drillArray.STROKECOLOR = 'red';
    STYLE.drillArray.FILLCOLOR = null;
    STYLE.drillArray.STROKESIZE = 4;
    STYLE.drillArray.CIRCRADIUS = 12;

    STYLE.ground.STROKESIZE = 5;
    STYLE.ground.STROKECOLOR = '#A0522D';
    STYLE.ground.FILLCOLOR = '#A0522D';

    STYLE.sky.STROKESIZE = 5;
    STYLE.sky.STROKECOLOR = '#33CCCC';
    STYLE.sky.FILLCOLOR = '#33CCCC';

    STYLE.groundLine_glow.STROKECOLOR = '#EACDDC';
    STYLE.groundLine_glow.STROKESIZE = 15;

    STYLE.ulButton_text.TEXTSTYLE = '1.5em Helvetica';
    STYLE.ulButton_text.COLOR = 'black';

    STYLE.score_text.TEXTSTYLE = '2em Helvetica';
    STYLE.score_text.COLOR = 'black';

    STYLE.scalar_obs.TEXTSTYLE = '2em Helvetica';
    STYLE.scalar_obs.COLOR = 'white';

    STYLE.roundSummary_text.TEXTSTYLE = '1.5em Helvetica';
    STYLE.roundSummary_text.COLOR = 'white';



    //////// GAME OBJECT GRAPHICS
    // ground Graphics
    var ground = new createjs.Shape();
    ground.graphics.s(STYLE.ground.STROKECOLOR).
                    f(STYLE.ground.FILLCOLOR).
                    ss(STYLE.ground.STROKESIZE, 0, 0).
                    r(0, GROUNDLINEY, W, GROUNDLINE2BOTTOM);
    ground.visible = true;

    // sky Graphics
    var sky = new createjs.Shape();
    sky.graphics.s(STYLE.sky.STROKECOLOR).
                    f(STYLE.sky.FILLCOLOR).
                    ss(STYLE.sky.STROKESIZE, 0, 0).
                    r(0, 0, W, GROUNDLINEY);
    sky.visible = true;

    // groundLine_glow Graphics
    var groundLine_glow = new createjs.Shape();
    groundLine_glow.graphics.s(STYLE.groundLine_glow.STROKECOLOR).
                                ss(STYLE.groundLine_glow.STROKESIZE, 0, 0).
                                mt(0, GROUNDLINEY). // GROUNDLINE HEIGHT
                                lt(W, GROUNDLINEY);
    groundLine_glow.visible = false;

    // groundLine Graphics
    var groundLine = new createjs.Shape();
    groundLine.graphics.s(STYLE.groundLine.STROKECOLOR).
                        ss(STYLE.groundLine.STROKESIZE, 0, 0).
                        mt(0, GROUNDLINEY). // GROUNDLINE HEIGHT
                        lt(W, GROUNDLINEY);
    groundLine.visible = true;

    //////// GAME OBJECT ACTIONS
    // groundLine Actions
    groundLine.addEventListener('mouseover', function(){
        groundLine_glow.visible = true;
        stage.update();
    });

    groundLine.addEventListener('mouseout', function(){
        groundLine_glow.visible = false;
        stage.update();
    });

    groundLine.addEventListener('click', function(){
        pxDrill = stage.mouseX;
        nextTrial(pxDrill);
    });


    function nlast(elt, currtrial, n) {
        // says yes if this elt's trial was one of the n last trials
        return currtrial - elt.itrial < n;
    }


    function make_vis_obs_array(drill_history, critfcn) {
        // takes drill_history, filters by crit, returns array of ScalarObs
        var currtrial = drill_history[drill_history.length-1].itrial
        var to_show = drill_history.filter(critfcn);  // filter to only shown
        // make obs for all valid sams in drill_history
        var obs_array = drill_history.map(
            function(elt){return ScoreObs(elt.x, elt.y)}
        );
        return obs_array;
    }


    function ScalarObs(x, y, score){
        // score to be placed at drill location
        var obs = new createjs.Text('',
                                    STYLE.scalar_obs.TEXTSTYLE,
                                    STYLE.scalar_obs.COLOR);
        obs.x = x;
        obs.y = GROUNDLINEY;
        obs.text = y.toString();
        obs.visible = true;
        return obs;
    }


    function stageArray(shapeArray){
        shapeArray.map(function(elt){
            stage.addChild(shapeArray[i]);
            shapeArray[i].visible = true;
        });
        stage.update();
    }


    function unstageArray(shapeArray){
        shapeArray.map(function(elt){
            shapeArray[i].visible = false;
            stage.removeChild(shapeArray[i]);
        });
    }


    function errorToPoints(error) {
        return Math.round((1 - abs(XRANGE - error)) * 100);
    }




    //////// GAME LOGIC
    var XMIN, XMAX, XRANGE;
    var PXMIN, PXMAX, PXRANGE;
    PXMIN = 0.;
    PXMAX = W;
    PXRANGE = PXMAX - PXMIN;
    var X, nX, NTRIAL
    var drill, xDrill, pxDrill, yDrill;
    var obs_array;
    var expScore, trialScore;
    var itrial;
    var OPTQUEUE, xOpt;
    var RNGSEED;

    customRoute('init_experiment',  // call init_experiment in custom.py...
                {'condition': condition,  // w params condition adn counter...
                 'counterbalance': counterbalance},
                 function(resp){  // once to get back resp from custom.py...
                    RNGSEED = resp['rngseed'];
                    itrial = resp['itrial'];
                    INITSCORE = resp['initscore'];
                    X = resp['x'];
                    XMIN = min(X);
                    XMAX = max(X);
                    XRANGE = XMAX - XMIN;
                    OPTQUEUE = resp['optQueue'];  // which location gets 100% points?
                    optX = OPTQUEUE[itrial];
                    NTRIAL = OPTQUEUE.length;
                    nX = X.length;
                    XMIN = min(X);
                    XMAX = max(X);
                    XRANGE = XMAX - XMIN;
                    pX = math2pixX(X);

                    expScore = INITSCORE;
                    // score_text.text = monify(expScore);
                    trialScore = NaN;

                    obs_array = [];

                    // add all objects to the stage
                    stage.addChild(ground);
                    stage.addChild(sky);
                    stage.addChild(groundLine_glow);
                    stage.addChild(groundLine);
                    stage.update();
                });


    function nextTrial(itrial, pxDrill){
        jsb_recordTurkData(function(){
            // if have more trials to go...
            console.log('trial '+itrial.toString()+' saved successfully.');
            if (itrial < NTRIAL){
                optX = OPTQUEUE[itrial];  // get target
                xDrill = pix2mathX(pxDrill);  // convert to numeric space
                signederror = xDrill - xOpt;
                yDrill = errorToPoints(abs(signederror)); // get the reward
                expScore += yDrill;
                drill_history.push({'x': xDrill,
                                    'y': yDrill,
                                    'itrial': itrial});
                // update feedback stage
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


    function stageArray(shapeArray){
        for (var i=0; i<shapeArray.length; i++){
            stage.addChild(shapeArray[i]);
            shapeArray[i].visible = true;
        }
        stage.update();
    }


    function unstageArray(shapeArray){
        for (var i=0; i<shapeArray.length; i++){
            shapeArray[i].visible = false;
            stage.removeChild(shapeArray[i]);
        }
    }


    function endExp(){
        psiTurk.showPage('debriefing.html');
    }


    //////// HELPER FUNCTIONS
    function math2pixX(A){
        var a = A.map(function(elt){return elt-XMIN})
        a = a.map(function(elt){return elt/XRANGE}) // now [0,1]
        a = a.map(function(elt){return elt*PXRANGE})
        a = a.map(function(elt){return elt+PXMIN})
        return a;
    }


    function pix2mathX(A){
        var a = A.map(function(elt){return elt-PXMIN})
        a = a.map(function(elt){return elt/PXRANGE}) // now [0,1]
        a = a.map(function(elt){return elt*XRANGE})
        a = a.map(function(elt){return elt+XMIN})
        return a;
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
            'expScore': expScore,
            'trialScore': trialScore,
            'xOpt': xOpt,
            'xDrill': xDrill,
            'signederror': signederror,
            'yDrill': yDrill,
            'pxDrill': pxDrill,
            'RNGSEED': RNGSEED,
            'LENSCALE': LENSCALE,
            'SIGVAR': SIGVAR,
            'NOISEVAR2': NOISEVAR2,
            'condition': condition,
            'counterbalance': counterbalance
        });
        psiTurk.saveData();
        callback();
    }
};
