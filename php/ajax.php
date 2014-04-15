<?php

require_once('include/sqAES.php');
require_once('include/javascrypt.php');

Header('Content-type: text/plain');

/* It seems like php will let you read php://input multiple times
 * can it be updated? (post decrypt?).
 */


echo "Sent from browser:\n";

echo "HTTP_RAW_POST_DATA: $HTTP_RAW_POST_DATA\n";
echo "php://input: " . file_get_contents('php://input') . "\n";

javascrypt::decryptraw() . "\n";

print "After decryption:\n";

echo "HTTP_RAW_POST_DATA: $HTTP_RAW_POST_DATA\n";
echo "php://input: " . file_get_contents('php://input') . "\n";
?>