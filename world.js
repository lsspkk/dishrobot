function _a(str, data) {
  //$('#log-a').prepend(str + ":"+data + "<br/>");
}
function _b(str) {
  //$('#log-b').html(str);
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
  plateDistanceMin : 800,
  plateDistanceMax : 2000,
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
    worldState.plateDistanceMax = worldState.plateDistanceMax / 1.1;
    worldState.plateDistanceMin = worldState.plateDistanceMin / 1.1;

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
      startTime += getRandomInt(worldState.plateDistanceMin, worldState.plateDistanceMax);
      dishLine.addPlate(startTime);
    }
  },
  svg : function() {
    return rect("dishline", 50, 170, 900, 60, "#aaf", "#ccf")
    +'<path class="dishline" d="M50 180 H 950" stroke="black"/>'
    +'<path class="dishline" d="M50 200 H 950" stroke="black"/>'
    +'<path class="dishline" d="M50 220 H 950" stroke="black"/>';
  },
  detectPlate : function(x, y) {
    for (var i = 0; i < dishLine.a.length; i++) {
      var p = dishLine.a[i].hits(x,y);
      _a(Math.round(dishLine.a[i].x) + "," + Math.round(dishLine.a[i].y) + "-=-"
        + Math.round(x) + "," + Math.round(y), dishLine.a.length);
      if( p != undefined ) {
        return p;
      }
    }
    return undefined;
  },
  clearAll : function() {
    for (var i = 0; i < dishLine.a.length; i++) {
      dishLine.a[i].clear();
    }
    dishLine.a = [];
  },
  /**
   * If plate is broken, remove it from alive plates.
   * If plate is on dishLine, move it forward
   * If plate was grabbed, its still alive.
   */
  update : function() {
    var alive = [];
    var addNewPlates = 0;
    for (var i = 0; i < dishLine.a.length; i++) {
      //_a("testlength", dishLine.a.length);
      var p = dishLine.a[i];
      if( p.x > 900 && p.state == "onDishLine") {
        score.broken();
        p.setState("broken");
        p.kill();
        addNewPlates += 1;
        continue;
      }

      if( p.state == "onDishLine") {
        p.move(worldState.baseSpeed,0);
        p.graphics();
      }

      alive.push(p);
    }
    dishLine.a = alive.slice();
    var startTime = 0;
    while( addNewPlates > 0 ) {
      startTime += getRandomInt(worldState.plateDistanceMin, worldState.plateDistanceMax);
      dishLine.addPlate(startTime);
      addNewPlates -= 1;
    }
  }
}










/*************************************************************************/

var basketTable = {
  a : [],
  x : 150,
  y : 230,
  amount: 6,
  size:110,
  start : function() {
    var startTime = 0;
    basketTable.a = [];
    for( var i = 0; i < basketTable.amount; i++ ) {
      if( i != 1 && i != 4 ) {
        basketTable.a.push(new Basket(basketTable.x + basketTable.size*i+3, basketTable.y+2, basketTable.size, 50));
      }
    }
  },
  svg : function() {
    for( i = basketTable.x; i < (basketTable.x + basketTable.amount*basketTable.size); i += 38 ) {
      $('#world').append(rect("basketTable", i, basketTable.y, 15, 54, "#bbb", "#eee"));
    }
    for( i = 0; i < basketTable.a.length; i++ ) {
      basketTable.a[i].graphics();
    }
  },
  detectBasket : function(x, y) {
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
  robot1 : new Robot(305,290, 70, 60, 0.5, 1),
  robot2 : new Robot(625,290, 40, 30, 2, 3),
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

      if( worldState.level == 3 )
        world.robot1.setSpeed(4, 6);

      if( worldState.level == 6 )
        world.robot2.setSpeed(4, 6);

      if( worldState.level == 9 )
        world.robot2.setSpeed(8, 12);

      if( worldState.level == 12 )
        world.robot1.setSpeed(15, 22);

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
  handleBasketInput : function(basket) {
    if( world.robot1.handleBasketInput(basket) )
      return true;
    if( world.robot2.handleBasketInput(basket) )
      return true;

    return false;
  },
  handleGrabInput : function(entity) {
    _a("grabPlate", entity.getId());
    world.robot1.handleGrabInput(entity);
    world.robot2.handleGrabInput(entity);
  },
  setIdle : function() {
    _a("setIdle", world.i);
    world.robot1.setTask(TASK.IDLE, undefined);
    world.robot2.setTask(TASK.IDLE, undefined);
  },
  gameOver : function() {
    world.reset();
    show('.gameOverWindow');
    console.log("should save score:"+score.points);
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

  _a("RobotStates ", world.printRobotStates());

  basket = basketTable.detectBasket(x, y);
  // if plate is ready to go into basket, put it in...
  if( basket != undefined ) {

    if( world.handleBasketInput(basket) ) {
      // dont return, let the other robots to try to grab plate
      _b("a robot is moving a plate to basket");
    }
  }

  plate = dishLine.detectPlate(x, y);
  if( plate == undefined )
    return;

  _a("..plate detected at("+x+","+y+ ")", plate.getId());

  if( plate.state != "grabbed" ) {
    plate.setColor('#a66');
    world.handleGrabInput(plate);
  }

  if( dishLine.a.length == 0 )
    dishLine.start();
}
