/********************
*    DRILLING GAME             *
********************/

// function drill_game_instructions(Y){
//     currentview = new run_game_instructions(Y);
// }

var run_game_instructions = function(Y){

    "use strict";

    console.log('running!');
    var njs = numeric;
    var canvas = document.getElementById('instreasel');
    var stage = new createjs.Stage(canvas);
    stage.enableMouseOver(10); // check for mouseovers 5x per sec

    var ins, instrStage, W, H;
    var timer = 0;

    instrStage = 0;

    W = canvas.width;
    H = canvas.height;


    var cursor = new createjs.Bitmap("static/images/cursor.png");
    cursor.scaleX = 0.1;
    cursor.scaleY = 0.1;
    cursor.alpha = 0.3;
    cursor.visible = false;

    var colorz = [];
    colorz.sky = '#33CCCC';
    colorz.ground = '#A0522D';
    colorz.xline = '#D9BAAB';
    colorz.xglow = '#EACDDC';

    var xline = []; // container for the "xline" in the drilling game
    xline.y = H - H*0.75;
    xline.thickness = 10;
    xline.shape = new createjs.Shape();
    xline.shape.graphics.s(colorz.xline).ss(xline.thickness,0,0,0).mt(0,xline.y).lt(W,xline.y);
    xline.d2bottom = H - xline.y; // # pixels from topline to bottom of screen

    xline.glow = new createjs.Shape(); // container for the glow around the ground
    xline.glow.graphics.s(colorz.xglow).ss(15,0,0).mt(0,xline.y).lt(W,xline.y);
    xline.glow.visible = false;

    var button = []; // trial control button (and corresponding messages)
    button.shape = new createjs.Shape();
    button.shape.graphics.s('gray').f('blue').ss(5,0,0).dc(0,0,20);
    button.shape.x = 40;
    button.shape.y = 64;

    button.glow = new createjs.Shape(); // container for the glow around the ground
    button.glow.x = 40;
    button.glow.y = 64;
    button.glow.graphics.s('green').f('blue').ss(20,0,0).dc(0,0,20);
    button.glow.visible = false;

    button.shape.visible = false;
    button.msg = new createjs.Text('','2em Helvetica','black');
    button.msg.x = 70;
    button.msg.y = 45;
    button.shape.addEventListener('mouseover',function(){
        button.glow.visible = true;
        stage.update();
    });
    button.shape.addEventListener('mouseout',function(){
        button.glow.visible = false;
        stage.update();
    });

    var sky = [];
    sky.shape = new createjs.Shape();
    sky.shape.graphics.s(colorz.sky).f(colorz.sky).ss(5,0,0).r(0,0,W,xline.y);

    var ground = [];
    ground.shape = new createjs.Shape();
    ground.shape.graphics.s(colorz.ground).f(colorz.ground).ss(5,0,0).r(0,xline.y,W,xline.d2bottom);

    var xscale = W;
    var yscale = xline.d2bottom * 0.98;
    var yshift = xline.thickness/(1.75);

    var nInstrStage = 10;

    $("#prevButton").click(function(){
        console.log('prev clicked!');
        instrStage -= 1;
        instrStage = max([instrStage,0]);
        instr_update(instrStage);
    });
    $("#nextButton").click(function(){
        console.log('next clicked!');
        instrStage += 1;
        instrStage = min([instrStage,nInstrStage-1]);
        instr_update(instrStage);
    });




    var EP = []; // container for experiment params
    EP.T = 1028;


    var msg = [];

    function get_new_gpfcn(gpsd, callback){
        $.ajax('compute_bonus',{
            type: "GET",
            data: {uniqueId: self.taskdata.id},
            success: callback
        });
    }

    function assign_gpfcn(data){
        testvar = data.gpfcn;
        console.log(testvar);
    }

    function init_setup(){




        var testvar;
        customRoute()
        get_new_gpfcn(gpsd, assign_gpfcn);



        var ins = [];
        ins.istart = [];
        ins.ifinish = [];
        ins.Y = [];
        ins.nSam = [];
        ins.samArray = [];
        ins.px = [];
        ins.x = [];
        ins.py = [];
        ins.y = [];
        ins.hf = [];
        ins.sams_on_screen = [];
        ins.ymin = [];
        ins.ymax = [];
        ins.xmin = [];
        ins.xmax = [];
        ins.onoff = true;
        ins.samInDemo = [];




        ins.istart = randi(0, Y.length-1, 4);
        for(var i = 0; i < 4; i++){
            ins.ifinish[i] = ins.istart[i] + EP.T;
            ins.Y[i] = Y.slice(ins.istart[i], ins.ifinish[i]);
            ins.Y[i]  = normalize(ins.Y[i]);
            ins.ymax[i] = max(ins.Y[i]);
            ins.ymin[i] = min(ins.Y[i]);
            ins.xmax[i] = pix2math(imax(ins.Y[i]) * T2W, 'x');
            ins.xmin[i] = pix2math(imin(ins.Y[i]) * T2W, 'x');

            ins.hf[i] = make_hf(ins.Y[i]);

            stage.addChild(ins.hf[i]);
        }

        ins.nSam = randi(3,6); // number of samples to use in this example
        ins.samInDemo = ins.nSam; // for demo_sample used later

        //  add samples for instruction gp
        for(var i=0; i<ins.nSam; i++){
            ins.x[i] = rand();
            ins.px[i] = math2pix(ins.x[i], 'x');
            var j = 0;
            // find yval for this bad boy
            while(j < (ins.x[i] * EP.T)){
                j++;
            }
            ins.y[i] = ins.Y[0][j]; //
            ins.py[i] = math2pix(ins.y[i],'y');

            // add samples but make invisible
            add_sam(ins.samArray, ins.px[i], ins.py[i], 'white', null, 3, 8);
            ins.samArray[i].visible = false;
        }
        return ins;
    }

    function instr_update(instrStage){
        switch(instrStage){
            case 0:
                $("#instrText").html("\
                    <p> \
                        You've landed on an alien planet where you will lead a mining expidition. \
                    </p> \
                    <p> \
                      You will be taken to multiple landscapes where you will be searching for and mining exotic alien minerals. \
                    </p>\
                ");

                button.shape.visible = false;
                button.msg.visible = false;

                break;

            case 1:
                $("#instrText").html("\
                      <p> \
                        The deeper into the ground you drill, the rarer the minerals you will find (and the more profit you will earn from them!) \
                      </p> \
                      <p> \
                        At each drilling area, it will be your goal to try to find the deepest mineral deposit area and drill there. \
                      <p/> \
                ");

                ins.hf[0].visible = true;

                ins.sams_on_screen = [];

                // add max and min vals of hidden function
                add_sam(ins.sams_on_screen,
                    math2pix(ins.xmax[0], 'x'),
                    math2pix(ins.ymax[0], 'y'),
                    'green', null, 4, 12
                    );

                msg.best = new createjs.Text('','1em Helvetica','green');
                msg.best.text = "Here is the most valuable in this area. \nI'm what you're trying to find!";
                msg.best.x = math2pix(ins.xmax[0], 'x');
                msg.best.y = math2pix(ins.ymax[0] - 0.16, 'y');
                msg.best.lineHeight = 20;
                if(msg.best.x > W-250){
                    msg.best.x -= 250;
                }


                stage.addChild(msg.best);


                add_sam(ins.sams_on_screen,
                    math2pix(ins.xmin[0], 'x'),
                    math2pix(ins.ymin[0], 'y'),
                    'red', null, 4, 12
                    );

                msg.worst = new createjs.Text('','1em Helvetica','red');
                msg.worst.text = "Here is the least valuable. \nI'll lose you money!";
                msg.worst.x = math2pix(ins.xmin[0], 'x');
                msg.worst.y = math2pix(ins.ymin[0] - 0.16, 'y');
                msg.worst.lineHeight = 20;
                if(msg.worst.x > W-250){
                    msg.worst.x -= 250;
                }

                stage.addChild(msg.worst);

                break;

            case 2:
                $("#instrText").html("\
                  <p> \
                    To try to locate the deepest deposits in a location, you will first have the opportunity to SAMPLE the ground by clicking it. \
                  </p> \
                  <p> \
                    The ground will glow when your mouse is over it and you can click it. \
                  </p> \
                ");

                // empty samples on screen array
                unstage_all_in(ins.sams_on_screen);
                remove_all_in(ins.sams_on_screen);
                stage.removeChild(msg.worst);
                stage.removeChild(msg.best);
                ins.hf[0].visible = false;

                // TODO : ADD CURSOR BITMAP AND ANIMATE
                msg.xglow = new createjs.Text('','1em Helvetica');
                msg.xglow.visble = false;
                stage.addChild(msg.xglow);
                cursor.visible = true;
                cursor.addEventListener("tick", demo_cursor);


                break;

            case 3:
                $("#instrText").html(" \
                  <p> \
                    When you arrive at a new area, you will not know where the deepest mineral deposits are. \
                  </p> \
                  <p> \
                    When you click the ground to sample, a white marker will appear indicating how deep the mineral line is at that location of the area. \
                  </p> \
                ");

                msg.xglow = new createjs.Text('','1em Helvetica');
                cursor.removeEventListener("tick", demo_cursor);
                cursor.visible = true;
                cursor.addEventListener("tick", demo_sample);



                break;

            case 4:
              $("#instrText").html(" \
                  <p> \
                    Each sample you take in an area will cost you some money. \
                  </p> \
                  <p> \
                    Sample too little, and you may not have a good idea of where to drill. \
                  </p> \
                  <p> \
                    Sample too much, and you will have spent too much sampling to have made a profit. \
                  </p> \
                ");

            var score = [];
            score.msg = new createjs.Text('','2em Helvetica','black');
            score.msg.x = canvas.width - 90;
            score.msg.y = 45;
            score.msg.visible = true;


            break;

        } // end switch

        stage.update();
    } // end instr_update


    function demo_sample(){
        if( timer % 10 == 0){
            if(ins.samInDemo === ins.nSam){
                for( var i = 0; i<ins.nSam; i++){
                    ins.samArray[i].visible = false;
                }
                cursor.visible = false;
                xline.glow.visible = false;
            }
            else {
                cursor.x = ins.px[ins.samInDemo]-40;
                cursor.y = xline.y - 5;
                cursor.visible = true;
                xline.glow.visible = true;


                ins.samArray[ins.samInDemo].visible = true;
            }
            ins.samInDemo += 1;
            ins.samInDemo = ins.samInDemo % (ins.nSam+1);
        }
    }


    function add_sam(container, px, py, scol, fcol, ssize, circsize){
        container.push( new createjs.Shape() );
        container[container.length-1].graphics.s(scol).f(fcol).ss(ssize,0,0).dc(0,0,circsize);
        container[container.length-1].x = px;
        container[container.length-1].y = py;
        container[container.length-1].visible = true;
        stage.addChild(container[container.length-1]);
    }


    function demo_cursor(){
        // flicker the cursor on and off the xline to make it glow or not
        if( timer%10 == 0 ){
            cursor.x = randi(-30,W-30);
            if(ins.onoff){
                cursor.y = xline.y - 5;

                xline.glow.visible = true;
                msg.xglow.text = "Can click!";
                msg.xglow.color = 'green';
                msg.xglow.x = cursor.x;
                msg.xglow.y = cursor.y;

            }
            else {
                // pick random y off the screen
                var good = false;
                while(!good){
                    cursor.y = randi(0,H-50);
                    if( Math.abs(xline.y-cursor.y) > 20 ){
                        good = true;
                        break;
                    }
                }

                xline.glow.visible = false;
                msg.xglow.text = "Can't click!";
                msg.xglow.color = 'red';
                msg.xglow.x = cursor.x;
                msg.xglow.y = cursor.y;
            }
            ins.onoff = !ins.onoff;
        }
    }

    function max( array ){
        return Math.max.apply( Math, array );
    }

    function min( array ){
        return Math.min.apply( Math, array );
    }

    function imin(arr){
        // return x and yvals of function f
        return arr.indexOf(Math.min.apply(Math, arr));
    }

    function imax(arr){
        // return x and yvals of function f
        return arr.indexOf(Math.max.apply(Math, arr));
    }

    function randi(min,max,n){
        var range,vals,ii;
        n = typeof n!== 'undefined' ? n : 1; // default n=1

        vals = [];
        range = max - min;

        ii = 0;
        while(ii<n){
            vals[ii] = Math.round( Math.random() *range + min );
            ii+=1;
        }
        if(n===1){
            return vals[0];
        }
        else{
            return vals;
        }
    }

    function rand(N){
        N = typeof N!== 'undefined' ? N : 1; // default N=1
        var a = [];
        for(var i=0; i<N; i++){
            a.push(Math.random());
        }
        if(N===1){
            return a[0];
        }
        else{
            return a;
        }

    }



    var W2T = EP.T/W;
    var T2W = W/EP.T;
    function math2pix(val, xORy){
        var out;
        switch(xORy){
            case 'x':
                out =  (val * W);
                break;
            case 'y':
                out = (val * xline.d2bottom) + xline.y;
                // out = (val * xline.d2bottom) + xline.y;
                break;
        }
        return out;
    }

    function pix2math(val, xORy){
        var out;
        switch(xORy){
            case 'x':
                out =  (val / W);
                break;
            case 'y':
                out = (val - xline.y) / xline.d2bottom;
                break;
        }
        return out;
    }

    function unstage_all_in(container){
        var c = container;
        for( var i = 0; i < container.length; i++ ){
            stage.removeChild( container[i] ); // remove from stage
        }
    }

    function remove_all_in(container){
        while( container.length ){
            container.pop();
        }
    }


    // normalize y-vals
    function normalize( a ){
        var mn = min(a);
        var mx = max(a);
        var rng = Math.abs(mx-mn);
        for(var i=0; i<a.length; i++){
            a[i] -= mn;
            a[i] /= rng;
        }

        return a;
    }

    function make_hf( Y ){
        var hf, ghf, px0, py0, prevx, prevy;

        hf = new createjs.Shape();
        hf.graphics = null; // update with update_hf

        ghf = new createjs.Graphics();
        ghf.f('red').s('black').ss(3,0,0);

        for(var i=0;i<EP.T;i++){

            // scale for drawing
            px0 = i * (T2W);
            py0 = math2pix(Y[i], 'y');

            if(i>0){ // if not first point ...
                ghf.mt(prevx,prevy).lt(px0,py0); // draw line from prev point to this point
            }

            // set this point as prev point
            prevx = px0;
            prevy = py0;
        }

        hf.graphics = ghf; // set hidden function graphics
        hf.visible = false;

        return hf;
    }

    // BEGIN GAME
    stage.addChild(ground.shape);
    stage.addChild(sky.shape);
    stage.addChild(xline.glow);
    stage.addChild(xline.shape);
    stage.addChild(cursor);



    ins = init_setup();
    instr_update(instrStage);
    stage.update();

    // update every 100ms
    function handleTick(event) {
        timer += 1;
        stage.update();
     }

    createjs.Ticker.setInterval(100);
    createjs.Ticker.addEventListener("tick", handleTick);



};