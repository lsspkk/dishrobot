
/**
 * Using degrees in variables, but sin/cos calculation requires radians.
 */
function toRadians (angle) {
  return angle * (Math.PI / 180);
}


function distanceBetween(loc1, loc2) {
  var a = loc1[0]-loc2[0];
  var b = loc1[1]-loc2[1];
  return Math.sqrt((a*a)+(b*b));
}

/**
 * Arm class, also used as forearm.
 * @param {[type]} x      Starting location
 * @param {[type]} y      Starting location
 * @param {[type]} width  How much muscle/fat.
 * @param {[type]} height How long the arm is.
 * @param {[type]} angle  Starting angle.
 */
var Arm = function(x, y, width, length, angle) {
  this.id = Key.new();
  this.x = x;
  this.y = y;
  this.width = width;
  this.length = length;
  this.angle = angle;
  this.p1 = [0, 0];
  this.p2 = [0, 0];
  this.p3 = [0, 0];
  this.p4 = [0, 0];
  this.setPoints();
  this.speed = 1;
}
Arm.prototype.getId = function() {
  return this.id;
}
Arm.prototype.setSpeed = function(s) {
  this.speed = s;
}

/**
 * Set the corner points of rectangle that is the arm.
 */
Arm.prototype.setPoints = function() {
   this.p1[0] = this.x + 0.5*this.width* Math.cos(toRadians(this.angle+90));
   this.p1[1] = this.y + 0.5*this.width* Math.sin(toRadians(this.angle+90));
   this.p2[0] = this.p1[0] + this.length * Math.cos(toRadians(this.angle));
   this.p2[1] = this.p1[1] + this.length * Math.sin(toRadians(this.angle));
   this.p3[0] = this.p2[0] + this.width * Math.cos(toRadians(this.angle-90));
   this.p3[1] = this.p2[1] + this.width * Math.sin(toRadians(this.angle-90));
   this.p4[0] = this.p3[0] + this.length * Math.cos(toRadians(this.angle-180));
   this.p4[1] = this.p3[1] + this.length * Math.sin(toRadians(this.angle-180));
 };
Arm.prototype.endPoint = function() {
  var arr = [ this.x + this.length* Math.cos(toRadians(this.angle)),
     this.y + this.length* Math.sin(toRadians(this.angle))];
  //_a("elbowLocation", arr);
  return arr;
}

Arm.prototype.setLocation = function(a) {
  if( !(a instanceof Array) || a.length != 2 )
    return;

  if( this.x != a[0] || this.y != a[1] ) {
    this.x = a[0];
    this.y = a[1];
    this.setPoints();
  }
}

Arm.prototype.turnCCW = function(d) {
  if( this.angle + d < 0 )
    this.angle = 360 + ( this.angle + d );
  else if (this.angle + d > 360 ) {
    this.angle += d - 360;
  }
  else {
    this.angle += d;
  }
  this.setPoints();
}
Arm.prototype.turnCW = function(d) {
  if( this.angle - d < 0 )
    this.angle = 360 + ( this.angle - d );
  else if (this.angle - d > 360 ) {
    this.angle -= d - 360;
  }
  else {
    this.angle -= d;
  }
  this.setPoints();
};
Arm.prototype.move =  function(x, y) {
    this.x = this.x+x;
    this.y = this.y+y;
};

Arm.prototype.graphics = function() {
  //_a("getid", this.id);
  if( $('#world .dish-'+this.id) )
    this.kill();

  $('#world').append(this.svg("arm-"+this.id, "#ddd", "#777"));
};
Arm.prototype.svg =  function(cname, color1, color2) {

  return '<path class="' + cname + '" d="M ' + this.p1[0] +' ' + this.p1[1]
    + ' L ' + this.p2[0] + ' ' + this.p2[1]
    + ' L ' + this.p3[0] + ' ' + this.p3[1]
    + ' L ' + this.p4[0] + ' ' + this.p4[1]

    + '" fill="' + color1 + '" stroke="' + color2 + '"/>'
};
Arm.prototype.kill = function() {
  $('#world .arm-'+this.id).remove();
};
Arm.prototype.turnTowardsPoint = function(x, y) {
  var direction = Math.atan2((-(this.y-y)), -(this.x-x));
  if( direction < 0 )
    direction += 2 * Math.PI;

  direction *= 180/ Math.PI;
  //http://stackoverflow.com/questions/3309617/calculating-degrees-between-2-points-with-inverse-y-axis

  if( (this.angle - direction +180)%360 < 180 )
    this.turnCCW(this.speed);
  else
    this.turnCW(this.speed);

}
/**
 * Turn only if needed.
 * @param  {[type]} a     Target angle.
 * @param  {[type]} speed How many degrees we can turn..
 */
Arm.prototype.turnTowardsAngle = function(a) {
  var difference = Math.abs((this.angle - a + 360)%360 - 180);
  var speed = this.speed;
  if( difference == 0 )
    return;
  if( speed > difference )
    speed = difference;
  if( (this.angle - a +360)%360 > 180 )
    this.turnCW(speed);
  else
    this.turnCCW(speed);
}








/**
 * Task class for robot actions = strings, and targets.
 *
 * idle, grab (entity)
 */
var Task = function(task, target) {
  this.task = task;
  this.target = target;
  this.basket = undefined;
  this.arm = undefined;
}
Task.prototype.setBasket = function(basket) {
  this.basket = basket;
  if( basket != undefined ) {
    this.task = "putInBasket";
  }
}
/**
 * Test if coordinates hit an entity that is the target plate of this task.
 */
Task.prototype.hits = function(arm) {
  if( this.task == "idle" )
    return false;

  var loc = arm.endPoint();
  var e = this.target.hits(loc[0],loc[1]);
  if( e == undefined ) {
    return false;
  }
  if( this.task == "grab" ) {
    dishLine.touch(e.getId());
  }
  this.target.setState("grabbed");
  this.task = "waitsForBasket";
  this.arm = arm;
  return true;
}
Task.prototype.setTask = function(task, target) {
  this.task = task;
  this.target = target;
}






/**
 * Robot class with two arms and forearms.
 * Logic to do the tasks.
 *
 * @todo Add two tasks, one for each hand,
 *       Add angle limits, that can not turn arms over the body.
 */
var Robot = function(x, y, width, height, armSpeed, forearmSpeed) {
  this.id = Key.new();
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
  this.arm1 = new Arm(x-10,y+height/10, width/5, 50, 225);
  this.arm2 = new Arm(x+width+10,y+height/10, width/5, 50, 315);
  this.arm1.setSpeed(armSpeed);
  this.arm2.setSpeed(armSpeed);
  this.forearm1 = new Arm(0, 0, width/6, 80, 0);
  this.forearm2 = new Arm(0, 0, width/6, 80, 180);
  this.forearm1.setSpeed(forearmSpeed);
  this.forearm2.setSpeed(forearmSpeed);

  this.tid = false;
  this.task = new Task("idle", undefined);

  this.taskArm1 = new Task("idle", undefined);
  this.taskArm2 = new Task("idle", undefined);

  $('#world').append(this.svg());
  $("#world").html($("#world").html());
};
Robot.prototype.svg = function() {
  return '<rect class="robotbody-'+this.id+'" x="'+ this.x+ '" y="'+ this.y
    + '" width="'+ this.width+ '" height="'+ this.height
    + '" stroke="#ddd" fill="#aaf"/>'
    + '<rect class="robotbody-'+this.id+'" x="'+ (this.x-10)+ '" y="'+ (this.y+5)
    + '" width="10" height="'+ (this.height/1.5)
    + '" stroke="#bbb" fill="#aaa"/>'
    + '<rect class="robotbody-'+this.id+'" x="'+ (this.x+this.width)+ '" y="'+ (this.y+5)
    + '" width="10" height="'+ (this.height/1.5)
    + '" stroke="#bbb" fill="#aaa"/>'
    + '<circle class="robothead-'+this.id+'" cx="'+ (this.x+this.width/2)+ '" cy="'+ (this.y+2)
    + '" r="14" fill="#ddd" stroke="#778"/>'
    + ' <circle class="roboteye-'+this.id+'" cx="'+ (this.x+6+this.width/2)+ '" cy="'+ (this.y+2-5)
    + '" r="3" fill="#fff" stroke="#778"/>'
    + '  <circle class="roboteye-'+this.id+'" cx="'+ (this.x-6+this.width/2)+ '" cy="'+ (this.y+2-5)
    + '" r="3" fill="#fff" stroke="#778"/>';
};

Robot.prototype.setEyeColor = function(color) {
  $('.roboteye-'+this.id).attr('fill', color);
}


function wipe(id) {
  $('#world circle[class$="-'+id+'"]').remove();
  $('#world rect[class$="-'+id+'"]').remove();

}
Robot.prototype.kill = function() {
  $('circle[class^="robothead"]').attr('fill', '#a22');
  $('circle[class^="roboteye"]').attr('fill', '#aa2');
  $('circle[class^="roboteye"]').attr('stroke', '#884');
  $('rect[class^="robotbody"]').attr('fill', '#ddd');

  var tid = setTimeout(wipe, 5000, this.id);
}

Robot.prototype.setTask = function(task, target) {
  //if( task == "grab" && this.taskArm1.task == "idle") {
  //  this
  //}  @todo kaksi kättä....
  //
  this.task.setTask(task, target);
  if( task == "grab")
    this.setEyeColor("#2a2");
  if( task == "idle")
      this.setEyeColor("#fff");


}



Robot.prototype.idle = function() {
  this.turnArmTowardsIdle(this.arm1);
  this.forearm1.setLocation(this.arm1.endPoint());
  this.forearm1.turnTowardsAngle(160);

  this.turnArmTowardsIdle(this.arm2);
  this.forearm2.setLocation(this.arm2.endPoint());
  this.forearm2.turnTowardsAngle(20);
}


function clearEyes(id, color) {
  $('.roboteye-'+id).attr('fill', color);

}
Robot.prototype.grab = function() {
  var x = this.task.target.x;
  var y = this.task.target.y;
  if( Math.abs(this.x + this.width/2 - x) > 400 ) {
    _a("Plate out of reach", x);
    this.setTask("idle", undefined);
    this.setEyeColor("#822");
    var tid = window.setTimeout(clearEyes, 1000, this.id, "#fff");
    return;
  }
  if( this.task.target.state == "broken") {
    _a("Plate was broken, I go back to Idle", "");
    this.setTask("idle", undefined);
    this.setEyeColor("#522");
    var tid = window.setTimeout(clearEyes, 1000, this.id, "#fff");
    return;
  }
  if( this.task.target.state == "grabbed") {
    _a("Plate was grabbed by someone, I go back to Idle", "");
    this.setTask("idle", undefined);
    this.setEyeColor("#300");
    var tid = window.setTimeout(clearEyes, 1000, this.id, "#fff");
    return;
  }


  this.arm1.turnTowardsPoint(x, y);
  this.forearm1.setLocation(this.arm1.endPoint());
  this.forearm1.turnTowardsPoint(x, y);

  this.arm2.turnTowardsPoint(x, y);
  this.forearm2.setLocation(this.arm2.endPoint());
  this.forearm2.turnTowardsPoint(x, y);

  if( this.task.hits(this.forearm1) ) {
    this.setEyeColor("#fff");
    return;
  }
  if( this.task.hits(this.forearm2) ) {
    this.setEyeColor("#fff");
    return;
  }
}


/**
 * When robot waits for basket, and user has clicked one,
 * we should check if we are able to reach that far...
 *
 * @param  {basket} basket the one that user clicked
 */
Robot.prototype.waitsForBasket = function(basket) {
  if( this.task.task == "waitsForBasket" ) {

    var maxReach = 0;
    var startLocation = [0, 0];
    if( this.task.arm.getId() == this.forearm1.getId() ) {
      maxReach = this.arm1.length + this.forearm1.length;
      startLocation = [this.arm1.x, this.arm1.y];
    }
    else if( this.task.arm.getId() == this.forearm2.getId() ) {
      maxReach = this.arm2.length + this.forearm2.length;
      startLocation = [this.arm2.x, this.arm2.y];
    }

    var distanceToReach = distanceBetween(basket.getCenterCoordinates(), startLocation) - (basket.width/2) + 10;

    if( distanceToReach > maxReach ) {
      _a("Basket too far: "+ Math.round(distanceToReach) +", can reach: ", Math.round(maxReach));
      return false;
    }

    this.task.setBasket(basket);
    this.setEyeColor("#8f8");
    return true;
  }
  return false;
}

/**
 * turnArmTowardsIdle
 *
 * turns arm towards right or left idle angle,
 * compared to robots position
 *
 * @param  {arm} a [description]
 */
Robot.prototype.turnArmTowardsIdle = function(a){
  var angle = 30;

  if( a.x > this.x ) // right arm
    angle = 150;

  _b("Towards - "+ angle);
  a.turnTowardsAngle(angle);
}
/**
 * ota taskista forearm, ja käännä sitä ja sen kättä kohti koria,
* sijoita koriin, jos osuu, ja pisteytä
*
*  @kesken tässä.. :)
 * @return {[type]} [description]
 */
Robot.prototype.putInBasket = function() {
  if( this.task == undefined ) {
    return undefined;
  }
  if( this.task.arm == undefined ) {
    _a("the task has no arm", this.task.task);
    return undefined;
  }
  if( this.task.task != "putInBasket" ) {
    _a("the task ist not putInBasket", this.task.task);

    return undefined;
  }



  var a = undefined;
  var f = undefined;
  if( this.task.arm.getId() == this.forearm1.getId() ) {
      a = this.arm1;
      f = this.forearm1;
  }
  if( this.task.arm.getId() == this.forearm2.getId() ) {
      a = this.arm2;
      f = this.forearm2;
  }

  if( a == undefined ) {
    _a("this robot did not grab", this.task.basket);
    this.task.setTask("idle", undefined);
    return undefined;
  }

  var loc = this.task.arm.endPoint();
  if( this.task.basket.hits(loc[0], loc[1]) ) {
    _a("plate" + this.task.target.getId() +" hits basket ", this.task.basket.getId());
    this.task.target.score();
    this.task.target.kill();
    this.task.setTask("idle", undefined);
    this.task.setBasket(undefined);
    return undefined;
  }
  var loc1 = this.task.basket.getCenterCoordinates();
  var loc2 = a.endPoint();
  // if the elbow is too close to the basket center, turn arm away from it
  if( distanceBetween(loc1, loc2) < (f.length +25) ) {
    _a("Too close, turning away("+Math.round(loc2[0])+","+Math.round(loc2[1])+")-", Math.round(distanceBetween(loc1, loc2)));
    this.turnArmTowardsIdle(a);
  }
  else {
    a.turnTowardsPoint(loc1[0], loc1[1]);
  }
  f.setLocation(a.endPoint());
  f.turnTowardsPoint(loc1[0], loc1[1]);
  this.task.target.setLocation(f.endPoint());


  this.setEyeColor("#8f8");
  return this.task.target;
}


Robot.prototype.grabIfLogical = function(entity) {
  if( this.task != undefined && this.task.task != "idle" ) {
    return;
  }
  var distance = Math.abs(this.x + this.width / 2 - entity.x);
  if( distance > this.arm1.length + this.forearm2.length ) {
    _a("too far: ", distance);
    return;
  }
  _a("Im going to grab it ", entity.getId());

  this.setTask("grab", entity);
}


Robot.prototype.update = function() {
  if( this.task.task == "grab" )
    this.grab();
  else if( this.task.task == "putInBasket" ){
    this.putInBasket();
  }
  else if( this.task.task == "waitsForBasket" ){
    this.setEyeColor("#229");
    return;
  } else {
    this.idle();
  }
  this.arm1.graphics();
  this.arm2.graphics();
  this.forearm1.graphics();
  this.forearm2.graphics();
  //$("#world").html($("#world").html());
}
Robot.prototype.update2 = function() {
  this.arm1.turnCW(this.armSpeed);
  var loc = this.arm1.elbowLocation();
  this.forearm1.setLocation(loc[0], loc[1]);
  this.arm2.turnCCW(this.armSpeed);
  loc = this.arm2.elbowLocation();
  this.forearm2.setLocation(loc[0], loc[1]);
  this.forearm1.turnCW(this.forearmSpeed);
  this.forearm2.turnCCW(this.forearmSpeed);

  this.arm1.graphics();
  this.arm2.graphics();
  this.forearm1.graphics();
  this.forearm2.graphics();
  $("#world").html($("#world").html());
    // do some stuff...
    // no need to recall the function (it's an interval, it'll loop forever)
};
