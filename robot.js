
/**
 * Using degrees in variables, but sin/cos calculation requires radians.
 */
function toRadians (angle) {
  return angle * (Math.PI / 180);
}

/**
 * Arm class, also used as forearm.
 * @param {[type]} x      Starting location
 * @param {[type]} y      Starting location
 * @param {[type]} width  How much muscle/fat.
 * @param {[type]} height How long the arm is.
 * @param {[type]} angle  Starting angle.
 */
var Arm = function(x, y, width, height, angle) {
  this.id = Key.new();
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
  this.angle = angle;
  this.p1 = [0, 0];
  this.p2 = [0, 0];
  this.p3 = [0, 0];
  this.p4 = [0, 0];
  this.setPoints();
}
/**
 * Set the corner points of rectangle that is the arm.
 */
Arm.prototype.setPoints = function() {
   this.p1[0] = this.x + 0.5*this.width* Math.cos(toRadians(this.angle+90));
   this.p1[1] = this.y + 0.5*this.width* Math.sin(toRadians(this.angle+90));
   this.p2[0] = this.p1[0] + this.height * Math.cos(toRadians(this.angle));
   this.p2[1] = this.p1[1] + this.height * Math.sin(toRadians(this.angle));
   this.p3[0] = this.p2[0] + this.width * Math.cos(toRadians(this.angle-90));
   this.p3[1] = this.p2[1] + this.width * Math.sin(toRadians(this.angle-90));
   this.p4[0] = this.p3[0] + this.height * Math.cos(toRadians(this.angle-180));
   this.p4[1] = this.p3[1] + this.height * Math.sin(toRadians(this.angle-180));
 };
Arm.prototype.endPoint = function() {
  var arr = [ this.x + this.height* Math.cos(toRadians(this.angle)),
     this.y + this.height* Math.sin(toRadians(this.angle))];
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
Arm.prototype.turnTowardsPoint = function(x, y, speed) {
  var direction = Math.atan2((-(this.y-y)), -(this.x-x));
  if( direction < 0 )
    direction += 2 * Math.PI;

  direction *= 180/ Math.PI;
  //http://stackoverflow.com/questions/3309617/calculating-degrees-between-2-points-with-inverse-y-axis

  if( (this.angle - direction +180)%360 < 180 )
    this.turnCCW(speed);
  else
    this.turnCW(speed);

}
/**
 * Turn only if needed.
 * @param  {[type]} a     Target angle.
 * @param  {[type]} speed How many degrees we can turn..
 */
Arm.prototype.turnTowardsAngle = function(a, speed) {
  var difference = Math.abs((this.angle - a + 360)%360 - 180);
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
}
/**
 * Test if coordinates hit an entity that is the target of this task.
 */
Task.prototype.hits = function(x, y) {
  if( this.task == "idle" )
    return;
  var e = this.target.hits(x,y);
  if( e == undefined ) {
    return;
  }
  if( this.task == "grab" ) {
    plates.touch(e.getId());
  }
  this.task = "idle";
  this.target = undefined;
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
  this.armSpeed = armSpeed;
  this.forearmSpeed = forearmSpeed;
  this.arm1 = new Arm(x-10,y+height/10, width/5, 50, 225);
  this.arm2 = new Arm(x+width+10,y+height/10, width/5, 50, 315);
  this.forearm1 = new Arm(0, 0, width/6, 40, 0);
  this.forearm2 = new Arm(0, 0, width/6, 40, 180);
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
    + '<circle class="robothead-'+this.id+'" cx="'+ (this.x+this.width/2)+ '" cy="'+ (this.y+4)
    + '" r="10" fill="#ddd" stroke="#778"/>'
    + ' <circle class="roboteye-'+this.id+'" cx="'+ (this.x+4+this.width/2)+ '" cy="'+ (this.y+4-4)
    + '" r="2" fill="#fff" stroke="#778"/>'
    + '  <circle class="roboteye-'+this.id+'" cx="'+ (this.x-4+this.width/2)+ '" cy="'+ (this.y+4-4)
    + '" r="2" fill="#fff" stroke="#778"/>';
};

function wipe(id) {
  $('#world class$="-'+id+'"').remove();
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
  this.task.setTask(task, target);
}


Robot.prototype.idle = function() {
  this.arm1.turnTowardsAngle(30, this.armSpeed);

  this.forearm1.setLocation(this.arm1.endPoint());
  this.forearm1.turnTowardsAngle(160, this.forearmSpeed);

  this.arm2.turnTowardsAngle(150, this.armSpeed);

  this.forearm2.setLocation(this.arm2.endPoint());
  this.forearm2.turnTowardsAngle(20, this.forearmSpeed);
}

Robot.prototype.grab = function() {
  var x = this.task.target.x;
  var y = this.task.target.y;
  if( Math.abs(this.x + this.width/2 - x) > 400 ) {
    _a("Plate out of reach", x);
    this.setTask("idle", undefined);
    return;
  }
  this.arm1.turnTowardsPoint(x, y, this.armSpeed);
  this.forearm1.setLocation(this.arm1.endPoint());
  this.forearm1.turnTowardsPoint(x, y, this.forearmSpeed);

  this.arm2.turnTowardsPoint(x, y, this.armSpeed);
  this.forearm2.setLocation(this.arm2.endPoint());
  this.forearm2.turnTowardsPoint(x, y, this.forearmSpeed);

  var loc = this.forearm1.endPoint();
  this.task.hits(loc[0], loc[1]);
  loc = this.forearm2.endPoint();
  this.task.hits(loc[0], loc[1]);
}

Robot.prototype.update = function() {
  if( this.task.task == "grab" )
    this.grab();
  else {
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
