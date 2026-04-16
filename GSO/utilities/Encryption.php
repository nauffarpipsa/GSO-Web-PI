<?php
class Encryption {
    private static $instance = null;
    private $key;
    private $method;
    
    private function __construct() {
        // Cargar configuración desde variables de entorno o valores por defecto
        // La clave debe estar en base64, se decodifica para usar
        $encryptionKey = $_ENV['ENCRYPTION_KEY'] ?? getenv('ENCRYPTION_KEY') ?? 'Qkg4SXUyM0YzcQ=='; // BH8Iu23F3q en base64
        $this->key = base64_decode($encryptionKey);
        $this->method = $_ENV['ENCRYPTION_METHOD'] ?? getenv('ENCRYPTION_METHOD') ?? 'AES-256-CBC';
    }
    
    public static function getInstance() {
        if (self::$instance === null) {
            self::$instance = new self();
        }
        return self::$instance;
    }
    
    public function encrypt($data) {
        $iv = random_bytes(openssl_cipher_iv_length($this->method));
        $encrypted = openssl_encrypt(
            $data,
            $this->method,
            $this->key,
            0,
            $iv
        );
        return base64_encode($iv . $encrypted);
    }
    
    public function decrypt($encryptedData) {
        $data = base64_decode($encryptedData);
        $ivLength = openssl_cipher_iv_length($this->method);
        $iv = substr($data, 0, $ivLength);
        $encrypted = substr($data, $ivLength);
        
        return openssl_decrypt(
            $encrypted,
            $this->method,
            $this->key,
            0,
            $iv
        );
    }
} 