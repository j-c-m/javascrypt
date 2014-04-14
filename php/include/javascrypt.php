<?php
/* http://jmiller.mit-license.org/ */

class javascrypt {
	private $private_key_file;
	private $public_key_file;
	private $private_key;
	
	private $aeskey;
	
	const SESSION_KEY = '_javascryptaeskey';
	const POST_KEY = '_javascrypt';
	
	function __construct($public_key_file, $private_key_file)
	{
		$this->public_key_file = $public_key_file;
		$this->private_key_file = $private_key_file;		
		$this->session_start();
	}
	
	function bzero(&$str)
	{
		for($i=0;$i<strlen($str);$i++)
		{
			$str[i] = chr(0);
		}
	}
	
	function getpublickey()
	{
		if(!is_readable($this->public_key_file))
		{
			throw new Exception('Unable to read public key');
		}
		
		Header('Content-type: text/plain');
		echo file_get_contents($this->public_key_file);
		exit();
	}
	
	function getprivatekey()
	{
		if(!is_readable($this->private_key_file))
		{
			throw new Exception('Unable to read private key');
		}
		
		$this->private_key = file_get_contents($this->private_key_file);
		return($this->private_key);
	}
	
	function handshake()
	{
		openssl_private_decrypt(base64_decode(file_get_contents('php://input')), $this->aeskey, $this->getprivatekey($this->private_key_file));
		// I think this is the best you can do in php to get the key out of memory.
		bzero($this->private_key_file);
		unset($this->private_key_file);
		$_SESSION[self::SESSION_KEY] = $this->aeskey;
		Header('Content-type: text/plain');
		echo sqAES::crypt($this->aeskey, $this->aeskey);
		exit();	
	}
	
	static function decrypt()
	{
		self::session_start();
		parse_str(sqAES::decrypt($_SESSION[self::SESSION_KEY], $_POST[self::POST_KEY]), $_POST);
		//unset($_SESSION[self::SESSION_KEY]);
		unset($_REQUEST[self::POST_KEY]);
		$_REQUEST = array_merge($_POST, $_REQUEST);
	}
	
	function go()
	{
		if(isset($_GET['getpublickey']))
		{
			$this->getpublickey();
		}
		if(isset($_GET['handshake']))
		{
			$this->handshake();
		}
		if(isset($_POST[self::POST_KEY]))
		{
			$this->decrypt();
		}
	}
	
	static function session_start()
	{
		switch(session_status())
		{
			case PHP_SESSION_DISABLED :
				throw new Exception('javascrypt requires sessions');
				break;
			case PHP_SESSION_NONE :
				session_start();
				break;
		}
	}
}

?>
