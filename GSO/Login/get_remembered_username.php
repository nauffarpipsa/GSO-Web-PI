<?php
/**
 * Endpoint para obtener las credenciales guardadas en cookies HttpOnly
 * Devuelve username y password si existen las cookies (seguro, no accesible desde JS)
 */
header('Content-Type: application/json');

// Debug: verificar todas las cookies (solo para desarrollo)
$debug = isset($_GET['debug']) && $_GET['debug'] === '1';
$allCookies = $_COOKIE;

// Verificar si existen las cookies HttpOnly de "remember me"
$hasUsername = isset($_COOKIE['remembered_username']) && !empty($_COOKIE['remembered_username']);
$hasPassword = isset($_COOKIE['remembered_password']) && !empty($_COOKIE['remembered_password']);
$hasRememberMe = $hasUsername || $hasPassword;

if ($hasRememberMe) {
    // Descifrar password si existe
    $decryptedPassword = null;
    if ($hasPassword) {
        try {
            $encryptionKey = hash('sha256', 'GSOP_REMEMBER_ME_SECRET_KEY_' . $_SERVER['HTTP_HOST'], true);
            $encryptedData = base64_decode($_COOKIE['remembered_password']);
            $iv = substr($encryptedData, 0, 16); // Primeros 16 bytes son el IV
            $encryptedPassword = substr($encryptedData, 16); // Resto es el password cifrado
            $decryptedPassword = openssl_decrypt($encryptedPassword, 'AES-256-CBC', $encryptionKey, 0, $iv);
            
            if ($decryptedPassword === false) {
                // Si el descifrado falla, puede ser una cookie antigua sin cifrar (compatibilidad)
                $decryptedPassword = $_COOKIE['remembered_password'];
            }
        } catch (Exception $e) {
            // Si hay error, usar el valor original (compatibilidad con cookies antiguas)
            $decryptedPassword = $_COOKIE['remembered_password'];
        }
    }
    
    $response = [
        'success' => true,
        'username' => $hasUsername ? htmlspecialchars($_COOKIE['remembered_username'], ENT_QUOTES, 'UTF-8') : null,
        'password' => $decryptedPassword,
        'hasRememberMe' => true
    ];
    
    if ($debug) {
        $scriptPath = dirname($_SERVER['SCRIPT_NAME']);
        $basePath = dirname($scriptPath);
        $expectedPath = rtrim($basePath, '/') . '/';
        
        $response['debug'] = [
            'cookie_username_found' => $hasUsername,
            'cookie_password_found' => $hasPassword,
            'all_cookies' => array_keys($allCookies),
            'script_path' => $_SERVER['SCRIPT_NAME'],
            'expected_cookie_path' => $expectedPath,
            'server_info' => [
                'REQUEST_URI' => $_SERVER['REQUEST_URI'] ?? '',
                'HTTP_HOST' => $_SERVER['HTTP_HOST'] ?? ''
            ]
        ];
    }
    
    echo json_encode($response);
} else {
    $response = [
        'success' => true,
        'username' => null,
        'password' => null,
        'hasRememberMe' => false
    ];
    
    if ($debug) {
        $scriptPath = dirname($_SERVER['SCRIPT_NAME']);
        $basePath = dirname($scriptPath);
        $expectedPath = rtrim($basePath, '/') . '/';
        
        $response['debug'] = [
            'cookie_username_found' => false,
            'cookie_password_found' => false,
            'all_cookies' => array_keys($allCookies),
            'cookie_keys' => array_keys($allCookies),
            'script_path' => $_SERVER['SCRIPT_NAME'],
            'expected_cookie_path' => $expectedPath,
            'server_info' => [
                'REQUEST_URI' => $_SERVER['REQUEST_URI'] ?? '',
                'HTTP_HOST' => $_SERVER['HTTP_HOST'] ?? ''
            ]
        ];
    }
    
    echo json_encode($response);
}
?>
