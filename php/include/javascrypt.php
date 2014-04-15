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
	
	function pubkey()
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
	
	function aeshandshake()
	{
		openssl_private_decrypt(base64_decode(file_get_contents('php://input')), $this->aeskey, $this->getprivatekey($this->private_key_file));
		// I think this is the best you can do in php to get the key out of memory.
		$this->bzero($this->private_key_file);
		unset($this->private_key_file);
		$_SESSION[self::SESSION_KEY] = $this->aeskey;
		Header('Content-type: text/plain');
		echo sqAES::crypt($this->aeskey, $this->aeskey);
		exit();	
	}
	
	static function decryptform()
	{
		self::session_start();
		$decrypted = sqAES::decrypt($_SESSION[self::SESSION_KEY], $_POST[self::POST_KEY]);
		if($decrypted === false)
		{
			return(false);
		}
		
		parse_str($decrypted, $_POST);
		unset($_REQUEST[self::POST_KEY]);
		$_REQUEST = array_merge($_POST, $_REQUEST);
		return($_POST);
	}
	
	static function decryptraw()
	{
		self::session_start();
		$raw_post = file_get_contents('php://stdin');
		$decrypted = sqAES::decrypt($_SESSION[self::SESSION_KEY], $raw_post);
		if($decrypted === false)
		{
			return($raw_post);
		}
		return($decrypted);
	}
	
	static function decrypt()
	{
		self::session_start();
		
		if(isset($_POST[self::POST_KEY]))
		{
			return(self::decryptform());
		} else {
			return(self::decryptraw());
		}
	}
	
	function go()
	{
		if(isset($_GET['m']) && $_GET['m'] == 'pubkey')
		{
			$this->pubkey();
		}
		if(isset($_GET['m']) && $_GET['m'] == 'aes')
		{
			$this->aeshandshake();
		}
		throw new Exception('Unsupported method.');
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
