var game = new Phaser.Game(
    320 * 1.2,
    568 * 1.2,
    Phaser.AUTO,
    '',
    { preload: preload,
      create: create,
      update: update 
    });

var marvin;
var chart;
var gateGroup;
var gateHeight = 130;
var numLines = 5;
var gaps = game.height/(numLines+1);
var gateOffset = gateHeight*2;
var speed = 180;
var ground;
//var startOffset = game.width*2;
var startOffset = game.width*1.5;
var gateFrequency = game.width/4*3;
var gatePairs = [];
var wallColliderWidth = 5;
var downLineGFX ;
var lineStartX = 40;
var DEBUG = false;
var climbStartOffset = gateFrequency/10;
var leftMask;
var scoreCounter;
var score = 0;
var justPassedWall = null;
var passOffset = 10;

var startInfoText;

var dead = false;
var started = false;

var root = "file://localhost/Users/eralpkaraduman/Documents/FlappyBids"; 

function preload() {
    game.load.image('marvin_gfx','marvin.png');
    game.load.image('click','click_flat.png');
    game.load.image('logo','logo.png');
}

function create() {

    game.world.setBounds(0, 0, game.width*3, game.height);
    game.stage.backgroundColor = '#FCFCFC';

    downLineGFX = game.add.graphics(0,0);
    upLineGFX = game.add.graphics(0,0);

    leftMask = game.add.graphics(0,0);
    leftMask.beginFill(0xFCFCFC);
    leftMask.drawRect(0,0,lineStartX,game.height);
    leftMask.endFill();

    //lines
    var i=1;
    var lineGFX = game.add.graphics(0,0);
    lineGFX.lineStyle(1, 0xdddddd, 1);
    for(;i<=numLines;i++){
        
        lineGFX.moveTo(lineStartX,gaps*i);
        lineGFX.lineTo(game.width, gaps*i);

        var l_text = -(0.5*i)+2.5;
        if(l_text%1==0)l_text+=".0"
        var style = { font: "14px Arial", fill: "#dddddd", align: "center" };

        var t = game.add.text(10, gaps*i, l_text, style);
        t.anchor.setTo(0, 0.5);

    }
    
    lineGFX.endFill();
    
    //walls
    gateGroup = game.add.group();
    
    
    
    // marvin
    marvin = game.add.sprite(0,0,"marvin_gfx");
    marvin.anchor.setTo(0.5,0.5);

    marvin.y = game.height/2;
    marvin.x = game.width*0.25;
    marvin.name = "marvin";

    ground = game.add.sprite(0,game.height-gaps,"ground");
    ground.width = game.width;
    ground.height = gaps;
    ground.body.immovable = true;
    if(DEBUG==false){
        ground.alpha = 0;
    }

    game.input.onDown.add(onTap, this);

    //start info

    startInfoText = game.add.sprite(0,game.height-gaps,"click");
    startInfoText.anchor.setTo(0, 0.5);
    startInfoText.x = game.width/2;
    startInfoText.y = game.height/2;

    var title_logo = game.add.sprite(gaps/2+45,gaps/2,"logo");
    title_logo.anchor.setTo(0.5,0.5);

    var titleStyle = { font: "24px Arial", fill: "#686B7A", align: "left" };
    var title_text = game.add.text(100+45,gaps/2,"FLAPPY BIDS",titleStyle);
    title_text.anchor.setTo(0,0.5);

    var scoreCounterStyle = { font: "42px Arial", fill: "#00CFB5", align: "center" };
    scoreCounter = game.add.text(100+45,gaps/2,"0",scoreCounterStyle);
    scoreCounter.x = game.width/2;
    scoreCounter.anchor.setTo(0.5,0.5);
    scoreCounter.y = 150;

    resetGame();

}

function generateWalls(){
    
    var oldPairs = gatePairs;
    gatePairs = [];
    for (var i = 0; i < 3; i++)
    {
        var gateY = randomGateY();

        var pair;
        
        if(oldPairs){
            var oldPair = oldPairs[i];
            if(oldPair!=null)pair = oldPair;
        }

        if(oldPair!=null){
            pair = oldPair;

            pair.up.x = startOffset+gateFrequency*i;
            pair.up.y = gateY.up;

            pair.down.x = startOffset+gateFrequency*i;
            pair.down.y = gateY.down;

        }else{
            pair = {};
            pair.up = gateGroup.create(startOffset+gateFrequency*i,gateY.up, 'gate');
            pair.down = gateGroup.create(startOffset+gateFrequency*i,gateY.down, 'gate');
        }
        
        pair.up.anchor.setTo(0.5,1);
        pair.down.anchor.setTo(0.5,0);
        if(DEBUG==false){
            pair.up.alpha = 0;
            pair.down.alpha = 0;
        }
        pair.up.height = pair.down.height = game.height;
        pair.up.width = pair.down.width = wallColliderWidth;
        gatePairs.push(pair);
    }
}

function onTap(){

    if(started==false){
        startGame();
        jump();
        return;
    }

    if(dead){
        
        resetGame();

        started = false;
        return;
    }

    jump();

}

function resetGame(){
    generateWalls();
    resetMarvin();
    startInfoText.alpha = 1;
    setScore(0);
    scoreCounter.alpha = 0;

    justPassedWall = null;
}

function setScore(_score){
    score = _score;
    scoreCounter.setText(score);
}

function resetMarvin(){
    marvin.y = game.height/2;
    marvin.x = game.width*0.25;
    marvin.body.velocity.y = 0;
    marvin.body.gravity.y = 0;
}

function jump(){
    marvin.body.velocity.y = -400;
}

function startGame(){
    
    scoreCounter.alpha = 1;

    startInfoText.alpha = 0;

    marvin.body.gravity.y = 1350;

    started = true;
    dead = false;
}

function randomGateY(){

    var minY = -game.height/5;
    var maxY = game.height/5;
    var rand = Math.random()*(maxY-minY)+minY;
    
    var origin = game.height/2 + rand;

    return {up:origin - gateHeight/2,
            down:origin + gateHeight/2};
}

function update () {
    // collide?
    game.physics.collide(marvin,ground,hitWall,null,this);
    game.physics.overlap(marvin, gateGroup, hitWall, null, this);

    // move gates
    if(!dead && started){
        gateGroup.forEach(updateGaps);
    }

    if(gatePairs.length<=0)return;

    var frontPairX = gatePairs[0].up.x;

    if(frontPairX+passOffset<marvin.x && gatePairs[0].up != justPassedWall){
        justPassedWall = gatePairs[0].up;
        setScore(++score);
    }

    var i=0;
    if((frontPairX - wallColliderWidth+climbStartOffset)  < 0){
        
        var newGatePairs = [];
        i=1;
        for(;i<gatePairs.length;i++){
            newGatePairs.push(gatePairs[i]);
        }
        var tailPairX = gatePairs[gatePairs.length-1].up.x;
        gatePairs[0].up.x = gatePairs[0].down.x = tailPairX+gateFrequency;
        var gateY = randomGateY();
        gatePairs[0].up.y = gateY.up;
        gatePairs[0].down.y = gateY.down;
        newGatePairs.push(gatePairs[0]);
        
        gatePairs = newGatePairs;
    }

    //draw lines
    downLineGFX.clear();
    downLineGFX.lineStyle(1, 0x00cfb5, 1);
    downLineGFX.moveTo(-10,game.height-gaps);

    upLineGFX.clear();
    upLineGFX.lineStyle(1, 0x00cfb5, 1);
    upLineGFX.moveTo(-10,gaps);
    
    i=0;
    for(;i<gatePairs.length;i++){
        var pair = gatePairs[i];
        
        downLineGFX.lineTo(pair.down.x-climbStartOffset,game.height-gaps);
        downLineGFX.lineTo(pair.down.x,pair.down.y);
        downLineGFX.lineTo(pair.down.x+climbStartOffset,game.height-gaps);

        upLineGFX.lineTo(pair.up.x-climbStartOffset,gaps);
        upLineGFX.lineTo(pair.up.x,pair.up.y);
        upLineGFX.lineTo(pair.up.x+climbStartOffset,gaps);

    }
    downLineGFX.endFill();

    i=0;
    for(;i<gatePairs.length;i++){
        var pair = gatePairs[i];
        downLineGFX.beginFill(0x00cfb5);
        downLineGFX.drawCircle(pair.down.x,pair.down.y,5);
        downLineGFX.drawCircle(pair.up.x,pair.up.y,5);
        downLineGFX.endFill();
    }


    

}

function hitWall(){
    if(!started)return;
    if(dead)return;
    dead = true;



    //console.log('hit');
}

function updateGaps(gap){

    gap.x -= (speed*game.time.elapsed/1000);
    
}