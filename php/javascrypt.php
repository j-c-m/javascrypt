<?php

/* example javascrypt entry point - will handle handshake, getpublickey
 * Key files specified below should be stored outside the web tree
 * but for the example they are not.
 *
 * To generate keys:
 * 
 * openssl genrsa -out rsa_2048_priv.pem 2048
 * openssl rsa -pubout -in rsa_2048_priv.pem -out rsa_2048_pub.pem
 */

require_once('include/sqAES.php');
require_once('include/javascrypt.php');

$jc = new javascrypt('rsa_2048_pub.pem','rsa_2048_priv.pem');
$jc->go();

?>