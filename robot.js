
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
 * Task class, Base class for Iterator pattern..
 *  Robots have many limbs, and limbs have changing amount of  arms.
 *
 * idle, grab (entity)
 */
var TASK = { IDLE : 0,
             GRAB : 1,
             WAITFORBASKET : 3,
             MOVETOBASKET : 4 };

var Task = function(action, target) {
  this.action = action;
  this.target = target;
  this.basket = undefined;
  this.armId = -1;
}
Task.prototype.toString = function() {
  switch (this.action) {
    case TASK.IDLE:
      return "IDLE";
    case TASK.WAITFORBASKET:
      return "WAITFORBASKET";
    case TASK.MOVETOBASKET:
      return "MOVETOBASKET";
    case TASK.GRAB:
      return "GRAB";
  }
  return "NO TASK";
}
Task.prototype.setBasket = function(basket) {
  this.basket = basket;
  if( basket != undefined ) {
    this.action = TASK.MOVETOBASKET;
  }
}
/**
 * Test if coordinates hit an entity that is the target plate of this task.
 */
Task.prototype.hits = function(x, y) {
  var e = this.target.hits(x,y);
  if( e == undefined ) {
    return false;
  }
  return true;
}
Task.prototype.changeAction = function(action, target) {
  this.action = action;
  this.target = target;
}
Task.prototype.setTarget = function(target) {
  this.target = target;
}



/**
 * Enum for different arm types
 * - different idle-angles
 *
 * @todo different looking grabbing endpoints
 */
var ARMTYPE = { LEFT : 0,
                RIGTH : 1,
                TOP : 3,
                BOTTOM : 4 };


/**
 * Arm class, also used as forearm.
 * @param {[type]} x      Starting location
 * @param {[type]} y      Starting location
 * @param {[type]} width  How much muscle/fat.
 * @param {[type]} height How long the arm is.
 * @param {[type]} angle  Starting angle.
 */
var Arm = function(x, y, width, length, angle, armType) {
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
  this.armType = armType;
  this.next = undefined;
  this.task = new Task(TASK.IDLE, undefined);
  this.graphics();
}
Arm.prototype.getId = function() {
  return this.id;
}
Arm.prototype.printState = function() {
  if( this.task != undefined )
    return this.id + ":" + this.task.action;
  return this.id + ":has undefined task";
}


Arm.prototype.setSpeed = function(s) {
  this.speed = s;
}
Arm.prototype.setNext = function(arm) {
  this.next = arm;
}

/**
 * How far can we reach with this armchain
 * @return {int} length
 */
Arm.prototype.totalLength = function() {
  if( this.next != undefined ) {
    return this.length + this.next.totalLength();
  }
  return this.length;
}
/**
 * How many arms does exist in the chain "beneath" this arm.
 * @return {int} amount
 */
Arm.prototype.armAmount = function () {
  if( this.next != undefined )
    return 1 + this.next.armAmount();
  else {
    return 1;
  }
}
Arm.prototype.addSubArm = function(speed) {
  var le = this.totalLength();
  var a = this.armAmount()+1;
  var newLength = le/a;

  if( this.length != newLength ) {
    this.recursiveAddSubArm(speed, newLength);
  }
}

Arm.prototype.recursiveAddSubArm = function(speed, newLength) {
  this.length = newLength;
  this.setPoints();
  this.updateGraphics();


  if( this.next == undefined ) {
    var loc = this.endPoint();
    this.next = new Arm(loc[0], loc[1], this.width, newLength, this.angle, this.armType);
    this.next.setSpeed(speed);
  }
  else {
    this.next.recursiveAddSubArm(speed, newLength);
  }
}
Arm.prototype.replaceSpeeds = function(oldSpeed, newSpeed) {
  if( this.speed == oldSpeed )
    this.speed = newSpeed;
  if( this.next != undefined )
    this.next.replaceSpeeds(oldSpeed, newSpeed);
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
}
Arm.prototype.move =  function(x, y) {
    this.x = this.x+x;
    this.y = this.y+y;
}

Arm.prototype.graphics = function() {
  //_a("getid", this.id);
  if( $('#world .dish-'+this.id) )
    this.kill();

  $('#world').append(this.svg("arm-"+this.id, "#ddd", "#777"));
}
Arm.prototype.updateGraphics = function() {
  $('#world .arm-'+this.id).remove();
  $('#world').append(this.svg("arm-"+this.id, "#ddd", "#777"));
  //console.log(this.svg("arm-"+this.id, "#ddd", "#777"));
}

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
Arm.prototype.turnSlowlyTowardsPoint = function(x, y) {
  var direction = Math.atan2((-(this.y-y)), -(this.x-x));
  if( direction < 0 )
    direction += 2 * Math.PI;
  direction *= 180/ Math.PI;

  if( (this.angle - direction +180)%360 < 180 )
    this.turnCCW(this.speed/2.5);
  else
    this.turnCW(this.speed/2.5);
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


Arm.prototype.grab = function(t) {
  if( t.target == undefined ) {
    _a("Target undefined in GRAB.", this.id);
    return false;
  }
  var x = t.target.x;
  var y = t.target.y;

  if( t.target.state == "broken") {
    _a("Plate was broken, I go back to Idle", "");
    t.changeAction(TASK.IDLE, undefined);
    t.armId = -1;
    return false;
  }
  if( t.target.state == "grabbed") {
    _a("Plate was grabbed by someone, I go back to Idle", "");
    t.changeAction(TASK.IDLE, undefined);
    t.armId = -1;
    return false;
  }

  this.turnTowardsPoint(x, y);
  var loc = this.endPoint();
  if( t.hits(loc[0], loc[1]) ) {
    _a("arm:"+this.id+" grabbed plate", t.target.getId());
    t.target.setState("grabbed");
    t.changeAction(TASK.WAITFORBASKET, t.target);
    t.armId = this.id;

    return true;
  }
  return false;
}

Arm.prototype.idle = function(armsCount, currentCount) {
  var niceAngle;
  if( this.armType == ARMTYPE.LEFT )
    niceAngle = 45 + (90/armsCount)*(currentCount-1);
  if( this.armType == ARMTYPE.RIGHT )
  niceAngle = 135 - (90/armsCount)*(currentCount-1);

  this.turnTowardsAngle(niceAngle);
}


Arm.prototype.moveToBasket = function(task) {
  if( task.basket.hits(task.target.x, task.target.y) ) {
    _a("plate" + task.target.getId() +" hits basket ", task.basket.getId());
    task.target.score();
    task.target.kill();
    task.changeAction(TASK.IDLE, undefined);
    task.setBasket(undefined);
    return true;
  }
  var loc1 = task.basket.getCenterCoordinates();
  this.turnSlowlyTowardsPoint(loc1[0], loc1[1]);
  return false;

/*
  // @todo have to think about this:

  // if the elbow is too close to the basket center,
  // we got problems, the plate will go too far...
  // should turn arm away from it
  // this code did it with two part arms

  var f = forearm...

  if( distanceBetween(loc1, loc) < (f.length +25) ) {
    _a("Too close, turning away("+Math.round(loc2[0])+","+Math.round(loc2[1])+")-", Math.round(distanceBetween(loc1, loc2)));
    this.turnArmTowardsIdle(a);
  }
  else {
    a.turnTowardsPoint(loc1[0], loc1[1]);
  }
  f.setLocation(a.endPoint());
  f.turnTowardsPoint(loc1[0], loc1[1]);
  this.task.target.setLocation(f.endPoint());
*/
}


/**
 * iterate through arm chain... for every task.
 */
Arm.prototype.iterate = function() {
  this.iterateParams(undefined, this.task, this.armAmount(), 1, 0);
}
Arm.prototype.iterateParams = function(parent, task, armsCount, currentCount, i) {
  i++;
  if( task == undefined )
    return;
  if( parent != undefined )
    this.setLocation(parent.endPoint());


  switch (task.action) {
    case TASK.GRAB:
      if( this.grab(task) ) {
        break;
      }
      else if( this.next != undefined ) {
        this.next.iterateParams(this, task, armsCount, currentCount+1,i);
      }
      break;
    case TASK.MOVETOBASKET:
      if( this.moveToBasket(task) )
        break;
      else if( this.next != undefined ) {
        this.next.iterateParams(this, task, armsCount, currentCount+1,i);
      }
      else {
        task.target.setLocation(this.endPoint())
      }
      break;
    case TASK.IDLE:
      this.idle(armsCount, currentCount);
      if( this.next != undefined ) {
        this.next.iterateParams(this, task, armsCount, currentCount+1,i);
      }
      break;
    case TASK.WAITFORBASKET:
        break;
    default:
  }
  this.updateGraphics();
}












/**
 * Robot class with two arms and forearms.
 * Logic to do the tasks.
 *
 * @todo Add two tasks, one for each hand,
 *       Add angle limits, that can not turn arms over the body.
 */
var Robot = function(x, y, width, height, armSpeed, armSpeed2) {
  this.id = Key.new();
  this.x = x;
  this.y = y;
  this.width = width;
  this.height = height;
  this.arm1 = new Arm(x-10,y+height/10, width/5, 120, 225, ARMTYPE.LEFT);
  this.arm2 = new Arm(x+width+10,y+height/10, width/5, 120, 315, ARMTYPE.RIGHT);
  this.arm1.setSpeed(armSpeed);
  this.arm2.setSpeed(armSpeed);
  this.addSubArms(armSpeed);
  this.addSubArms(armSpeed);
  this.addSubArms(armSpeed);
  this.addSubArms(armSpeed);
  this.addSubArms(armSpeed2);
  this.addSubArms(armSpeed);
  this.addSubArms(armSpeed2);
  this.addSubArms(armSpeed2);
  this.addSubArms(armSpeed2);
  this.addSubArms(armSpeed);
  this.addSubArms(armSpeed);
  this.addSubArms(armSpeed);
  this.addSubArms(armSpeed2);
  this.addSubArms(armSpeed2);
  this.addSubArms(armSpeed2);
  this.addSubArms(armSpeed2);
  this.armSpeed = armSpeed;
  this.armSpeed2 = armSpeed2;

  $('#world').append(this.svg());
  $("#world").html($("#world").html());
};

/**
 * lets update the armchain, replacing old speeds with new
 * @param {[type]} armSpeed  [description]
 * @param {[type]} armSpeed2 [description]
 */
Robot.prototype.setSpeed = function(newSpeed, newSpeed2) {
    this.arm1.replaceSpeeds(this.armSpeed, newSpeed);
    this.arm1.replaceSpeeds(this.armSpeed2, newSpeed2);
    this.arm2.replaceSpeeds(this.armSpeed, newSpeed);
    this.arm2.replaceSpeeds(this.armSpeed2, newSpeed2);

    this.armSpeed = newSpeed;
    this.armSpeed2 = newSpeed2
}

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


Robot.prototype.addSubArms = function(speed) {
  this.arm1.addSubArm(speed);
  this.arm2.addSubArm(speed);
}

Robot.prototype.setToIdle = function() {
  this.setArmToIdle(this.arm1);
  this.setArmToIdle(this.arm2);
}
Robot.prototype.setArmToIdle = function(a) {
  a.task.changeAction(TASK.IDLE, undefined);
  a.task.armId = -1;
}


Robot.prototype.printState = function() {
  return this.arm1.printState() + "--" + this.arm2.printState();
}





/**
 * When robot waits for basket, and user has clicked one,
 * we should check if we are able to reach that far...
 *
 * @param  {basket} basket the one that user clicked
 */
Robot.prototype.handleBasketInput = function(basket) {
  if( this.handleBasketInputArm(basket, this.arm1) )
    return true;

  return this.handleBasketInputArm(basket, this.arm2);
}

Robot.prototype.handleBasketInputArm = function(basket, arm) {
  if( arm.task == undefined ) {
    _a("no task in arm", arm.getId());
    return false;
  }
  if( arm.task.action == TASK.WAITFORBASKET ) {
    _a("handleBasketInputArm:"+arm.getId()+", basket:", basket.getId());

    //if( arm.task.armId != arm.getId() ) {
    //  return false;
    //}
    var maxReach = arm.totalLength();
    var startLocation = [arm.x, arm.y];
    var distanceToReach = distanceBetween(basket.getCenterCoordinates(), startLocation) - (basket.width/2) + 10;

    if( distanceToReach > maxReach ) {
      _a("Basket too far: "+ Math.round(distanceToReach) +", can reach: ", Math.round(maxReach));
      if( arm.task.target != undefined ) {
        _a("plate released: ", arm.task.target.getId());

        arm.task.target.setState("onDishLine");
        // free the grabbed entity
      }
      arm.task.changeAction(TASK.IDLE, undefined);
      arm.task.armId = -1;
      return false;
    }

    arm.task.setBasket(basket);
    arm.task.changeAction(TASK.MOVETOBASKET, arm.task.target);
    return true;
  }
  return false;
}




Robot.prototype.handleGrabInput = function(entity) {
  _a("handleGrabInput", entity.getId());
  var distance = Math.abs(this.x + this.width / 2 - entity.x);
  if( this.arm1.task.action == TASK.IDLE ) {
    _a("arm:"+this.arm1.getId()+" trying to grab", entity.getId());
    if( distance > 10000 ) {//this.arm1.totalLength() ) {
      _a("too far for arm1: ", distance);
    }
    else {
      _a("My arm1 is grabbing this ", entity.getId());
      this.arm1.task.changeAction(TASK.GRAB, entity);
      return;
    }

  }
  if( this.arm2.task.action == TASK.IDLE ) {
    _a("arm:"+this.arm2.getId()+" trying to grab", entity.getId());
    if( distance > 10000 ) { //this.arm2.totalLength() ) {
      _a("too far for arm2: ", distance);
      return;
    }
    else {
      _a("My arm2 is grabbing this ", entity.getId());
      this.arm2.task.changeAction(TASK.GRAB, entity);
    }
  }
}


Robot.prototype.update = function() {
  this.arm1.iterate();
  this.arm2.iterate();
  //$("#world").html($("#world").html());
}
