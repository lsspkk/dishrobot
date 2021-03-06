function _a(str, data) {
  $('#log-a').prepend(str + ":"+data + "<br/>");
}
function _b(str) {
  $('#log-b').html(str);
}

/**
 * Game playability settings, and global variables.
 * @type {Object}
 */
var worldState = {
  baseSpeed : 2,
  interval : 40,
  timer : 0,
  level : 1,
  gameOverLimit : 10,
  levelPlates : 5,
  changeLevel : 4,
  touches : 0,
  entityes : 0,
  nextLevel : function() {
    if( worldState.touches <= worldState.changeLevel )
      return false;

    worldState.touches = 0;
    worldState.changeLevel += 1;
    worldState.level +=1;
    worldState.levelPlates += 1;
    var change = 1;
    // no need to speed up very fast
    //if( worldState.level < 6 )
    //  change = (8-worldState.level);

    worldState.interval -= change;
    if( worldState.interval < 2 ) {
      worldState.inteval = 2;
      _b("nopea vauhti!");
    }
    worldState.baseSpeed += 0.1;


    return true;
  },
  resetLevel : function() {
    worldState.level = 1;
    worldState.changeLevel = 20;
    worldState.entityes = 0;
    worldState.interval = 40;
    worldState.levelPlates = 5;
  }
};


/**
 * Counting the score, and testing for end game.
 * @type {Object}
 */
var score = {
  points : 0,
  brokenPlates : 0,
  high : [],
  show : function() {
    $('#score .points').html(""+ score.points);
    $('#score .broken').html(""+ score.brokenPlates);

  },
  add : function(p) {
    score.points += p;
    score.show();
  },
  broken : function() {
    score.brokenPlates++;
    score.show();
    if( score.brokenPlates == worldState.gameOverLimit )
      world.gameOver();
  },
  init : function() {
    score.points = 0;
    score.brokenPlates = 0;
    score.show();
  }
};



function rect(c, x, y, w, h, s, f) {
  return '<rect class="'+c+'" x="'+x+ '" y="'+y+ '" width="'+w+'" height="'+ h +'" stroke="'+s+'" fill="'+f+'"/>';
}

/**
 * Random number between min and max
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}














/**************************************************************************************************
 * The line of dishes, moving from left to right.
 * @type {Object}
 */
var dishLine = {
  a : [],
  rate : 2500,
  addPlate : function(startTime) {
    var r = 25;
    if( getRandomInt(0,100) < 35 )
       r = 20;
    var p = new Plate(r);

    //_a("startTime", startTime);

    p.init(50,200,startTime);
    dishLine.a.push(p);
  },
  start : function() {
    var startTime = 0;
    dishLine.killed = 0;
    dishLine.a = [];
    for(var i=0; i < worldState.levelPlates; i++ ) {
      startTime += getRandomInt(1200, dishLine.rate);
      dishLine.addPlate(startTime);
    }
  },
  svg : function() {
    return rect("dishline", 50, 170, 900, 60, "#aaf", "#ccf")
    +'<path class="dishline" d="M50 180 H 950" stroke="black"/>'
    +'<path class="dishline" d="M50 200 H 950" stroke="black"/>'
    +'<path class="dishline" d="M50 220 H 950" stroke="black"/>';
  },
  hitsPlate : function(x, y) {
    for (var i = 0; i < dishLine.a.length; i++) {
      var p = dishLine.a[i].hits(x,y);
      //_a(Math.round(dishLine.a[i].x) + "," + Math.round(dishLine.a[i].y) + "-=-"
      //  + Math.round(x) + "," + Math.round(y), dishLine.a.length);
      if( p != undefined ) {
        return p;
      }
    }
    return undefined;
  },
  touch : function(id) {
    for (var i = 0; i < dishLine.a.length; i++) {
      if( dishLine.a[i].getId() == id ) {
          dishLine.a.splice(i, 1);
          return;
      }
    }
    if( dishLine.a.length == 0 )
      dishLine.start();
  },
  clearAll : function() {
    for (var i = 0; i < dishLine.a.length; i++) {
      dishLine.a[i].clear();
    }
    dishLine.a = [];
  },
  /**
   * If plate is broken, remove it from alive plates.
   */
  update : function() {
    var alive = [];
    var addNewPlates = 0;
    for (var i = 0; i < dishLine.a.length; i++) {
      //_a("testlength", dishLine.a.length);
      var p = dishLine.a[i];
      if( p.x < 900 ) {
        p.move(worldState.baseSpeed,0);
        alive.push(p);
        p.graphics();
      }
      else {
        score.broken();
        p.setState("broken");
        p.kill();
        addNewPlates += 1;
      }
    }
    dishLine.a = alive.slice();
    var startTime = 0;
    while( addNewPlates > 0 ) {
      startTime += getRandomInt(1200, dishLine.rate);
      dishLine.addPlate(startTime);
      addNewPlates -= 1;
    }
  }
}




var basketTable = {
  a : [],
  x : 100,
  y : 180,
  size : 8,
  start : function() {
    var startTime = 0;
    basketTable.a = [];
    for( i = 0; i < basketTable.size; i++ ) {
      basketTable.a.push(new Basket(basketTable.x + 101*i+3, basketTable.y+2));
    }
  },
  svg : function() {
    for( i = basketTable.x; i < (basketTable.x + basketTable.size*100); i += 38 ) {
      $('#world').append(rect("basketTable", i, basketTable.y, 15, 104, "#bbb", "#eee"));
    }
    for( i = 0; i < basketTable.a.length; i++ ) {
      basketTable.a[i].graphics();
    }
  },
  hitsBasket : function(x, y) {
    for (var i = 0; i < basketTable.a.length; i++) {
      var b = basketTable.a[i].hits(x,y);
      //_a("testlength", dishLine.a.length);
      if( b != undefined ) {
        return b;
      }
    }
    return undefined;
  },
  touch : function(id) {
    for (var i = 0; i < basketTable.a.length; i++) {
      if( basketTable.a[i].getId() == id ) {
          basketTable.a[i].score();
          basketTable.a[i].kill();
          basketTable.a.splice(i, 1);
          return;
      }
    }
  },
  clearAll : function() {
    for (var i = 0; i < basketTable.a.length; i++) {
      basketTable.a[i].clear();
    }
    basketTable.a = [];
  },
  update : function() {
  }
}



















/**
 * What the gameworld contains, and and a function to update the world.
 * @type {Object}
 */
var world = {
  tid : false,
  i : 0,
  robot1 : new Robot(335,290, 40, 30, 1, 3),
  robot2 : new Robot(635,290, 40, 20, 1, 3),
  firstTime : true,

  /**
   * Start running the function in time intervals.
   * @return -
   */
  start : function() {
    $('#score .level').html(""+ worldState.level);

    dishLine.start();
    if( world.tid == false ) {
      _a("World interval: ", worldState.interval);
      world.tid = window.setInterval(world.update, worldState.interval);
    }
  },
  stop : function() {
    if(world.tid != false ) {
      window.clearInterval(world.tid);
      world.tid = false;
    }
  },
  /**
   * Reset all:
   * plates, and score, worldState game level,
   * set firstTime on to ensure drawing of the world.
   * Stop the update-function
   */
  reset : function() {
    window.clearInterval(world.tid);
    world.firstTime = true;
    dishLine.clearAll();
    $('#world .dishline').remove();
    $('#world .basketTable').remove();
    worldState.resetLevel();
    world.tid = 0;
  },
  /**
   * On firstTime only
   *   draw the plates-line, and robots.
   *   init score and remove game-over display...
   *
   * Advance to nextLevel if needed, or
   * update robots, plates, and refresh the SVG content.
   */
  update : function() {
    if( world.firstTime ) {
      $('#score .level').html(""+ worldState.level);
      score.init();
      $('.game-over').remove();

      basketTable.start();
      $('#world').append(basketTable.svg() +dishLine.svg() + world.robot1.svg() + world.robot2.svg());
      world.firstTime = false;
    }
    if( worldState.nextLevel() ) {
      world.stop();
      dishLine.clearAll();
      dishLine.start();
      $('#score .level').html(""+ worldState.level);
      _a("interval: ", worldState.timer);
      world.tid = window.setInterval(world.update, worldState.interval);

    }
    worldState.timer += worldState.interval;
    //_a("worldState.timer", worldState.timer);

    world.robot1.update();
    world.robot2.update();
    dishLine.update();
    $("#world").html($("#world").html());
    // do some stuff...
    // no need to recall the function (it's an interval, it'll loop forever)
  },
  printRobotStates : function() {
    return  world.robot1.printState() + "-" + world.robot2.printState();
  },
  waitsForBasket : function(entity) {
    if( world.robot1.waitsForBasket(entity) )
      return true;
    if( world.robot2.waitsForBasket(entity) )
        return true;

    return false;
  },
  putInBasket : function(entity) {
    _a("putInBasket", entity.getId());
    var p = world.robot1.putInBasket();
    if( p == undefined )
      p = world.robot2.putInBasket();

    if( p != undefined ) {
      _a("this plate going in", p.getId());
      return true;
    }
    return false;
  },
  grabPlate : function(entity) {
    _a("grabPlate", entity.getId());
    world.robot1.grabIfLogical(entity);
    world.robot2.grabIfLogical(entity);
  },
  setIdle : function() {
    _a("setIdle", world.i);
    world.robot1.setTask("idle", undefined);
    world.robot2.setTask("idle", undefined);
  },
  gameOver : function() {
    world.reset();
    $('#world').html('<image class="game-over" xlink:href="robot.png" x="370" y="50" height="300px" width="300px"/>'
    +'<text class="game-over" x="300" y="400" font-family="courier" font-size="80px" fill="#f00">GAME OVER</text>'
    +'<text class="game-over" x="320" y="430" font-family="courier" font-size="16px" fill="#999">Robots, you destroyed my precious dishes!</text>');
    $('.game-over').css('opacity', 1);
  }

};














var worldPositionTop = 0;
var WorldPositionLeft = 0;

/**
 *  @todo keyboard kuuntelijat joka robotille...
 *
 *  [mousedown description]
 *
 *
 *   listening to click wont work, because plate is redrawn before mousedown...
 *   could also get id from the element (target) parameter that mousedown hits
 *
 * @param  {[type]} event [description]
 * @return {[type]}       [description]
 */
function mouseDown(event) {
  //console.log(event);
  var x =  parseInt(event.layerX)-worldPositionLeft;
  var y = parseInt(event.layerY)-worldPositionTop;
  var p = undefined;
  var b = undefined;
  //_b("clicked("+x+","+y+ ")");

  _a("RobotStates", world.printRobotStates());


  b = basketTable.hitsBasket(x, y);
  if( b != undefined ) {
    // if plate is ready to go into basket, put it in...

    if( world.waitsForBasket(b) || world.putInBasket(b) )
      // mistake dont return, let the other robots to try to grab plate
      //return;
      _b("one robot is moving a plate");
  }
  p = dishLine.hitsPlate(x, y);

  if( p == undefined )
    return;
  //_a("..clicked("+x+","+y+ ")", p.getId());

  if( p.state == "grabbed" )
    return;


  p.setColor('#a66');
  world.grabPlate(p);


  if( dishLine.a.length == 0 )
    dishLine.start();
}
