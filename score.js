function pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : new Array(width - n.length + 1).join(z) + n;
}


function after_pad(n, width, z) {
  z = z || '0';
  n = n + '';
  return n.length >= width ? n : n+ new Array(width - n.length + 1).join(z);
}


function print_score(json) {
  s = "<pre>\n";
  $.each(json.players, function(i, elem) {
    s += ".." + after_pad(i+1, 3, ".") + "............robot...."
      + after_pad(elem.name,8,".") + "..."
      + pad(elem.score,10,".") + "..\n";
  });
  s += "</pre>"
  $("#highScore").html(s);
}
function readHighScore() {
  $.ajax({
      cache: false,
      url: "scores.json",
      dataType: "json",
      success: print_score
  });
}


function saveHighScore(score) {
  var name = $('#player').val();
  if( !(/^[a-zA-Z]+$/.test(name)) ) {
    console.log("bad name:" + name);
  }
  else {
    console.log("getting it");
    $.ajax({
        cache: false,
        url: "score-api.php?name="+name+"&score="+score,
        dataType: "json",
        success: print_score
      });
  }

  hide('.gameOverWindow');
  show('.highScoreWindow');

}
