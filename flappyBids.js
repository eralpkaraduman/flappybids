var game = new Phaser.Game(
    320 * 1.0,
    568 * 1.0,
    Phaser.AUTO,
    '',
    { preload: preload,
      create: create,
      update: update 
    });

var marvin;
var chart;
var gateGroup;
var gateHeight = 123;
var numLines = 5;
var gaps = game.height/(numLines+1);
var gateOffset = gateHeight*2;
var speed = 180;
var ground;
var startOffset = game.width*1.5; 
var gateFrequency = game.width/5*4; //game.width/4*3;
var gatePairs = [];
var wallColliderWidth = 5;
var downLineGFX ;
var lineStartX = 40;
var DEBUG = false;
var climbStartOffset = gateFrequency/10;
var leftMask;
var scoreCounter;
var score = 0;
var bestScore = 0;
var justPassedWall = null;
var passOffset = 10;
var endGameBannerGroup;
var endGamePullStartY = -180-1;
var endGamePullEndY = game.height+180+1;
var endGamePullTween;
var endGamePullEndTween;
var endGameCurrentScoreText;
var endGameCurrentBestScoreText;
var canClick = true;
var scoreBoardButton;
var tryAgainButton;

var currentScorePrefix = "";
var bestScorePrefix = "Best ";

var startInfoText;

var dead = false;
var started = false;

var sfx_jump;
var sfx_wall;
var sfx_gate;

var root = "file://localhost/Users/eralpkaraduman/Documents/FlappyBids"; 

function preload() {
    game.load.image('marvin_gfx','marvin.png');
    game.load.image('click','click_flat.png');
    game.load.image('logo','logo.png');
    game.load.image('endgame','endgame.png');
    game.load.image('sumbit','submit.png');
    game.load.image('tryAgain','tryAgain.png');
    game.load.audio('s_wall', ['wall.mp3', 'wall.ogg']);
    game.load.audio('s_gate', ['gate.mp3', 'gate.ogg']);
    game.load.audio('s_jump', ['jump.mp3', 'jump.ogg']);

}

function create() {

    game.world.setBounds(0, 0, game.width*3, game.height);
    game.stage.backgroundColor = '#FCFCFC';

    sfx_jump = game.add.audio('s_jump');
    sfx_wall = game.add.audio('s_wall');
    sfx_gate = game.add.audio('s_gate');

    game.stage.scale.pageAlignHorizontally = true;
    game.stage.scale.refresh();

    downLineGFX = game.add.graphics(0,0);
    upLineGFX = game.add.graphics(0,0);

    leftMask = game.add.graphics(0,0);
    leftMask.beginFill(0xFCFCFC);
    leftMask.drawRect(0,0,lineStartX,game.height);
    leftMask.endFill();

    //lines
    var i=1;
    var lineGFX = game.add.graphics(0,0);
    lineGFX.lineStyle(2, 0xdddddd, 1);
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

    var title_logo = game.add.sprite(gaps/2+30,gaps/2,"logo");
    title_logo.anchor.setTo(0.5,0.5);

    var titleStyle = { font: "24px Arial", fill: "#686B7A", align: "left" };
    var title_text = game.add.text(100+10,gaps/2,"FLAPPY BIDS",titleStyle);
    title_text.anchor.setTo(0,0.5);

    var scoreCounterStyle = { font: "27px Arial", fill: "#00CFB5", align: "center" };
    scoreCounter = game.add.text(100+45,gaps/2,"0",scoreCounterStyle);
    scoreCounter.x = game.width/2;
    scoreCounter.anchor.setTo(0.5,0.5);
    scoreCounter.y = 130;

    endGameBannerGroup = game.add.group();
    //endGameBannerGroup.anchor.setTo(0.5,0.5);
    endGameBannerGroup.x = game.width/2;
    endGameBannerGroup.y = endGamePullEndY;
    var endGameBanner = game.add.sprite(0,0,'endgame');
    endGameBanner.anchor.setTo(0.5,0.5);
    endGameBannerGroup.add(endGameBanner);

    var endGameScoreTextStyle = { font: "18px Arial", fill: "#00CFB5", align: "center" };
    var currentScoreY = -50;

    
    

    endGameCurrentScoreText = game.add.text(0,currentScoreY,currentScorePrefix+scoreStringFromScore(score),endGameScoreTextStyle);
    endGameCurrentBestScoreText = game.add.text(0,currentScoreY+25,bestScorePrefix+scoreStringFromScore(bestScore),endGameScoreTextStyle);
    endGameCurrentScoreText.anchor.setTo(0.5,0.5);
    endGameCurrentBestScoreText.anchor.setTo(0.5,0.5);
    endGameBannerGroup.add(endGameCurrentScoreText);
    endGameBannerGroup.add(endGameCurrentBestScoreText);

    scoreBoardButton = game.add.button(0, 35, 'sumbit', onClickScoreboard, this, 0, 0, 0);
    scoreBoardButton.anchor.setTo(0.5,0.5);
    endGameBannerGroup.add(scoreBoardButton);

    tryAgainButton = game.add.button(0, 85, 'tryAgain', onClickTryAgain, this, 0, 0, 0);
    tryAgainButton.anchor.setTo(0.5,0.5);
    endGameBannerGroup.add(tryAgainButton);

    resetGame();

}

function onClickTryAgain(){
    console.log("try again");
}

function onClickScoreboard(){
    window.location.href = "index.html?s=" + encodeURIComponent(scoreStringFromScore(score));
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

    if(canClick==false)return;

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

    hideEndGame();

    justPassedWall = null;
}

function setScore(_score){
    score = _score;

    if(score>bestScore){
        bestScore = score;
    }

    scoreCounter.setText(scoreStringFromScore(score));
    endGameCurrentScoreText.setText(currentScorePrefix+scoreStringFromScore(score));
    endGameCurrentBestScoreText.setText(bestScorePrefix+scoreStringFromScore(bestScore));
}

function scoreStringFromScore(_score){

    //var s = _score+"%";
    //return s;

    var s = _score/10;
    return "ROI: "+s+(s%1==0?".0":"")+"x";
}

function resetMarvin(){
    marvin.y = game.height/2;
    marvin.x = game.width*0.25;
    marvin.body.velocity.y = 0;
    marvin.body.gravity.y = 0;
}

function jump(){
    marvin.body.velocity.y = -400;
    sfx_jump.play();
}

function startGame(){
    
    if(parent.onPlay){
        parent.onPlay();
    }

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
        sfx_gate.play();
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
    downLineGFX.lineStyle(2, 0x00cfb5, 1);
    downLineGFX.moveTo(-10,game.height-gaps);

    upLineGFX.clear();
    upLineGFX.lineStyle(2, 0x00cfb5, 1);
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
        downLineGFX.drawCircle(pair.down.x,pair.down.y,10);
        downLineGFX.drawCircle(pair.up.x,pair.up.y,10);
        downLineGFX.endFill();
    }

    if(marvin.y<gaps){
        marvin.y = gaps;
        marvin.body.velocity.y = 0;
    }

}

function showEndGame(){
    canClick = false;
    if(endGamePullEndTween)endGamePullEndTween.stop();
    endGameBannerGroup.y =endGamePullStartY;
    endGamePullTween = game.add.tween(endGameBannerGroup);
    endGamePullTween.to({y:game.height/2},800,Phaser.Easing.Bounce.Out);
    endGamePullTween.onComplete.add(function(){
        canClick = true;
    }, this);
    endGamePullTween.start();
}

function hideEndGame(){
    if(endGamePullTween)endGamePullTween.stop();
    endGamePullEndTween = game.add.tween(endGameBannerGroup);
    endGamePullEndTween.to({y:endGamePullEndY},300,Phaser.Easing.Bounce.Out);
    endGamePullEndTween.start();
}

function hitWall(){
    if(!started)return;
    if(dead)return;
    dead = true;

    sfx_wall.play();

    showEndGame();

    //console.log('hit');
}

function updateGaps(gap){

    gap.x -= (speed*game.time.elapsed/1000);
    
}
