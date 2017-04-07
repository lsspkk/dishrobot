<?php
/*
if ( filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_NO_PRIV_RANGE) )
{
    // is not a local ip address
    echo "external ip";
    die();
}
*/
error_reporting(E_ALL);

$str = file_get_contents('scores.json');
$json = json_decode($str, true);


function cmp($a, $b) {
  if( $a['score'] == $b['score'] ) return 0;
  return( $a['score'] < $b['score'] ) ? 1 : -1;
}

if(isset($_GET['name']) && isset($_GET['score'])) {
  $newscore = [];
  $newscore['name'] = $_GET['name'];
  $newscore['score'] = $_GET['score'];
  if( !ctype_alpha($newscore['name']) ) {
    echo "{'players':[]}";
    exit();
  }
  if( !ctype_digit($newscore['score']) ) {
    echo "{'players':[]}";
    exit();
  }

  if( $newscore['score'] > '1') {
    array_push($json['players'],$newscore);
    usort($json['players'], "cmp");
    $tmp = $json['players'];
    $json['players'] = array_slice($tmp,0,15);
    $fp = fopen('scores.json', 'w');
    fwrite($fp, json_encode($json,JSON_PRETTY_PRINT));
    fclose($fp);
  }
}
if(isset($_GET['task']) && $_GET['task'] == "clear") {
  $json['players'] = [];
  $fp = fopen('scores.json', 'w');
  fwrite($fp, json_encode($json,JSON_PRETTY_PRINT));
  fclose($fp);

}

usort($json['players'], "cmp");
echo json_encode($json,JSON_PRETTY_PRINT);

 ?>
