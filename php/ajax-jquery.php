<?php

require_once('include/sqAES.php');
require_once('include/javascrypt.php');

Header('Content-type: text/plain');

$json = javascrypt::decryptraw();

$decoded = json_decode($json);

$output['sent-by-browser'] = file_get_contents('php://input');
$output['decoded'] = $decoded;
$output['response'] = 'Hello jQuery';

echo javascrypt::encrypt(json_encode($output));

?>
