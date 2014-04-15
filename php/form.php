<?php

require_once('include/sqAES.php');
require_once('include/javascrypt.php');

Header('Content-type: text/plain');

echo "What the browser POSTED:\n";
print_r($_POST);

javascrypt::decryptform();

echo "Unencrypted POST:\n";
print_r($_POST);

?>