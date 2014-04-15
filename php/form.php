<?php

require_once('include/sqAES.php');
require_once('include/javascrypt.php');

javascrypt::decryptform();

Header('Content-type: text/plain');
print_r($_POST);

?>