function _a(str, data) {
//  $('#log-a').prepend(str + ":"+data + "<br/>");
}
function _b(str) {
//  $('#log-b').html(str);
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
    if( worldState.level < 6 )
      change = (8-worldState.level);

    worldState.interval -= change;
    if( worldState.interval < 2 ) {
      worldState.inteval = 2;
      _b("nopea vauti!");
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
  gameOverLimit : 10,
  high : [],
  show : function() {
    $('#score .points').html(""+ score.points);
    $('#score .broken').html(""+ score.broke);

  },
  add : function(p) {
    score.points += p;
    score.show();
  },
  broken : function() {
    score.brokenPlates++;
    score.show();
    if( score.brokenPlates == score.gameOverLimit )
      world.gameOver();
  },
  init : function() {
    score.points = 0;
    score.brokenPlates = 0;
    score.show();
  }
};








/**
 * Random number between min and max
 */
function getRandomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
}
/**
 * The line of plates, moving from left to right.
 * @type {Object}
 */
var plates = {
  a : [],
  rate : 1600,
  start : function() {
    var startTime = 0;
    plates.killed = 0;
    plates.a = [];
    for(var i=0; i < worldState.levelPlates; i++ ) {
      var r = 25;
      if( getRandomInt(0,100) < 35 )
         r = 20;
      var p =new Plate(r);

      startTime += getRandomInt(700, this.rate);
      p.init(50,200,startTime);
      plates.a.push(p);
    }
  },
  hitsPlate : function(x, y) {
    for (var i = 0; i < plates.a.length; i++) {
      var p = plates.a[i].hits(x,y);
      if( p != undefined ) {
        return p;
      }
    }
    return undefined;
  },
  touch : function(id) {
    for (var i = 0; i < plates.a.length; i++) {
      if( plates.a[i].getId() == id ) {
          plates.a[i].score();
          plates.a[i].kill();
          plates.a.splice(i, 1);
          return;
      }
    }
    if( plates.a.length == 0 )
      plates.start();
  },
  clearAll : function() {
    for (var i = 0; i < plates.a.length; i++) {
      plates.a[i].clear();
    }
    plates.a = [];
  },
  update : function() {
    for (var i = 0; i < plates.a.length; i++) {
      var p = plates.a[i];
      if( p.x < 900 )
        p.move(worldState.baseSpeed,0);
      else {
        score.broken();
        p.x = 0;
        p.init(50,200,0);
      }
      p.graphics();
    }

  }
}











/**
 * What the gameworld contains, and and a function to update the world.
 * @type {Object}
 */
var world = {
  tid : false,
  i : 0,
  robot1 : new Robot(250,270, 40, 20, 1, 3),
  robot2 : new Robot(650,270, 40, 20, 1, 3),
  firstTime : true,

  /**
   * Start running the function in time intervals.
   * @return -
   */
  start : function() {
    $('#score .level').html(""+ worldState.level);

    plates.start();
    if( world.tid == false ) {
      _b("World interval: " + worldState.timer);
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
    world.firstTime = true;
    plates.clearAll();
    window.clearInterval(world.tid);
    worldState.resetLevel();
    $('#score .level').html(""+ worldState.level);
    world.tid = 0;
    score.init();
  },
  /**
   * On firstTime only draw the plates-line, and robots.
   * Advance to nextLevel if needed, or
   * update robots, plates, and refresh the SVG content.
   */
  update : function() {
    if( world.firstTime ) {
      $('.game-over').remove();
      $('#world').append('<path d="M50 190 H 900" stroke="black"/>'
        +'<path d="M50 200 H 900" stroke="black"/>'
        +'<path d="M50 210 H 900" stroke="black"/>'
        );

      $('#world').append(world.robot1.svg() + world.robot2.svg());
      world.firstTime = false;
    }
    if( worldState.nextLevel() ) {
      world.stop();
      plates.clearAll();
      plates.start();
      $('#score .level').html(""+ worldState.level);
      _a("interval: ", worldState.timer);
      world.tid = window.setInterval(world.update, worldState.interval);

    }
    worldState.timer += worldState.interval;

    world.robot1.update();
    world.robot2.update();
    plates.update();
    $("#world").html($("#world").html());
    // do some stuff...
    // no need to recall the function (it's an interval, it'll loop forever)
  },
  setTarget : function(entity) {
    _a("setTarget", entity.getId());
    world.i++;
    if( world.i % 2 == 1 ) {
      world.robot1.setTask("grab", entity);
    }
    if( world.i % 2 == 0 ) {
      world.robot2.setTask("grab", entity);
    }
  },
  setIdle : function() {
    world.i++;
    _a("setIdle", world.i);
    if( world.i % 2 == 1 ) {
      world.robot1.setTask("idle", undefined);
    }
    if( world.i % 2 == 0 ) {
      world.robot2.setTask("idle", undefined);
    }
  },
  gameOver : function() {
    world.stop();
    $('#world').html('<image class="game-over" xlink:href="robot.png" x="370" y="50" height="300px" width="300px"/>'
    +'<text class="game-over" x="300" y="400" font-family="courier" font-size="80px" fill="#f00">GAME OVER</text>'
    +'<text class="game-over" x="320" y="430" font-family="courier" font-size="16px" fill="#999">Robots, you destroyed my precious dishes!</text>');
    $('.game-over').css('opacity', 1);
  }

};
