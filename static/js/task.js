/*
 * Requires:
 *     psiturk.js
 *     utils.js
 */

// Initalize psiturk object
var psiTurk = JSBPsiTurk(uniqueId, adServerLoc);  // costomized with some helpers I use

var mycondition = condition;  // these two variables are passed by the psiturk server process
var mycounterbalance = counterbalance;  // they tell you which condition you have been assigned to
// they are not used in the stroop code but may be useful to you

var INS_FOLDER = 'instructions';

var pages = [ // list of all html pages to be used through interaction with partiipant
    INS_FOLDER + "/instr_1.html",
    INS_FOLDER + "/instr_2.html",
    INS_FOLDER + "/instr_3.html",
    INS_FOLDER + "/instr_4.html",
    INS_FOLDER + "/instr_5.html",
    INS_FOLDER + "/instr_6.html",
    INS_FOLDER + "/instr_7.html",
    INS_FOLDER + "/instr_ready.html",
    "stage.html",
    "debriefing.html"
];

psiTurk.preloadPages(pages);
var instructionPages = [ // indicate which are specifically instructions
    INS_FOLDER + "/instr_1.html",
    INS_FOLDER + "/instr_2.html",
    INS_FOLDER + "/instr_3.html",
    INS_FOLDER + "/instr_4.html",
    INS_FOLDER + "/instr_5.html",
    INS_FOLDER + "/instr_6.html",
    INS_FOLDER + "/instr_7.html",
    INS_FOLDER + "/instr_ready.html",
];


/*******************
 * Run Task
 ******************/
var currentview;  // psiturk residue (not sure if needed)
$(window).load( function(){
    // ensure uniform experiment size
    var WIDTH = 1028;
    var HEIGHT = 768;
    var BUFFER = 100;
    // center window on computer screen
    window.resizeTo(WIDTH + BUFFER, HEIGHT + BUFFER);
    window.moveTo(((screen.width - WIDTH) / 2), 0); //((screen.height - height) / 2));
    psiTurk.doInstructions(
        instructionPages, // a list of instruction pages you want to display in sequence
        function(){  // when instructions done...
            psiTurk.finishInstructions();  // JBEDIT: don't know what this does but it's important
            psiTurk.showPage('stage.html'); // load game stage (rather than experiment stage)
            currentview = new rotationGame();  // start experiment
        }
    );
});
