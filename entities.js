
/**
 * creating unique IDs..
 */
var Key = {
  id : 0,
  new : function() {
    Key.id++;
    return Key.id;
  }
};


/**
 * Base Class for plates, (baskets, cups, glasses, deep plates, whatever moving objects)
 *
 * Has a position,
 * and a birthTime for delayed appearance.
 */
var Entity = function() {
  this.birthTime = 100000000;
  this.x = 0;
  this.y = 0;
  this.hold = 0;
  this.id = Key.new();
  this.dead = false;
  this.speed = 1;
};
Entity.prototype.getId = function() {
  return this.id;
};
Entity.prototype.setSpeed = function(speed) {
  if( speed > 0 && speed < 100 )
  this.speed = speed;
}
Entity.prototype.init = function(setx, sety, birth) {
  this.x = setx; this.y = sety;
  this.birthTime = worldState.timer + birth;
  worldState.entityes++;

};
Entity.prototype.move =  function(addx, addy) {
    if( worldState.timer > this.birthTime ) {
      this.x = this.x+addx;
      this.y = this.y+addy;
    }
};
Entity.prototype.kill = function() {
  this.birthTime = worldState.timer + 1000000000;
  this.dead = true;
}



/**
 * Plate Class, Inherits Entity.
 *
 * Two SVG circles.
 * Can test if clicked coordinates are inside the plate-area.
 */
var Plate = function(radius) {
  Entity.call(this);
  this.radius = radius;
  this.color = "#fcfcfc";
};
Plate.prototype = Object.create(Entity.prototype);
Plate.prototype.constructor = Plate;
Plate.prototype.init = function(setx, sety, birth) {
  this.color = "#fcfcfc";
  Entity.prototype.init.call(this, setx, sety, birth);
};
Plate.prototype.setColor = function(color){
  this.color = color;
}
Plate.prototype.graphics = function() {
  if( worldState.timer < this.birthTime ) {
    //_a("notalive-timer", worldState.timer);
    //_a("birthTime", this.birthTime);
    return;
  }
  if( this.dead )
    return;

  var id = Entity.prototype.getId.call(this);
  //_a("getid", this.id);
  if( !$('#world .entity-'+id)[0] ) {
    $('#world').append(this.svg("entity-"+id, this.color, "#ececec"));
  }
};
Plate.prototype.move = function(addx, addy) {
  Entity.prototype.move.call(this, addx, addy);
  //_a('move entity-'+this.id,  this.x);

  $('#world .entity-'+this.id).attr('cx',""+ this.x);
  $('#world .entity-'+this.id).attr('cy',""+ this.y);
};
Plate.prototype.svg =  function(cname, color1, color2) {
  var r2 = this.radius - (this.radius / 5);

  return '<circle class="' + cname + '" cx="' + this.x +'" cy="'
    + this.y + '" r="' + this.radius + '" fill="' + color1 + '" stroke="#ddd"/>'
    + '<circle class="' + cname + '" cx="' + this.x +'" cy="'
    + this.y + '" r="' + r2 + '" fill="' + color2 + '" stroke="#ddd" '//onclick="touch(\''+this.id+'\')"
    +'/>';
}
Plate.prototype.clear = function() {
  Entity.prototype.kill.call(this);
  $('#world .entity-'+this.id).remove();
}
function mycode(id) {
  $('#world .bomb-'+id).remove();
}

/**
 * Delayed destroying of hitted plate...
 * @todo add animation
 */
Plate.prototype.kill = function() {
  Entity.prototype.kill.call(this);

  worldState.touches++;

  var tid = setTimeout(mycode, 2000, this.id);

  $('#world .entity-'+this.id).addClass('bomb-'+this.id);
  $('#world .bomb-'+this.id).removeClass('entity-'+this.id);
  $('#world .bomb-'+this.id).attr('fill', '#558');
}


Plate.prototype.hits = function(x, y) {
  //_b("hits!!!", this.id);
  //_a("("+x +","+ y + ")-?->", "("+this.x +","+ this.y + ")")
  if( Math.sqrt((x-this.x)*(x-this.x)+(y-this.y)*(y-this.y)) < this.radius ) {
    return this;
  }
  else {
    return undefined;
  }
}

/**
 * The farther away a plate is, lesser the score.
 * @return number
 */
Plate.prototype.score = function() {
  score.add(Math.round(1000/this.x));
}
