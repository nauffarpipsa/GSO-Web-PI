<?php
header('Content-Type: application/json');

require_once __DIR__ . '/../config/api.php';

// Obtener datos del formulario
$usuario = $_POST['user'] ?? '';
$password = $_POST['password'] ?? '';
$company = $_POST['company'] ?? '';
$country = $_POST['country'] ?? '';
$companyCode = $_POST['companyCode'] ?? '';

// Validar que no estén vacíos
if (empty($usuario) || empty($password) || empty($company) || empty($country) || empty($companyCode)) {
    echo json_encode([
        'success' => false,
        'message' => 'Usuario, contraseña, compañía, país y código de compañía son requeridos',
        'icon' => 'error'
    ]);
    exit;
}

// URL de la API (centralizada en config/api.php)
$url = rtrim(api_base('auth'), '/') . '/Auth';

// Datos a enviar
$data = [
    'user' => $usuario,
    'password' => $password,
    'countryCode' => $country
];

// Inicializar cURL
$ch = curl_init();

// Configurar opciones de cURL
curl_setopt_array($ch, [
    CURLOPT_URL => $url,
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => json_encode($data),
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        'Accept: application/json'
    ],
    CURLOPT_TIMEOUT => 10
]);

// Ejecutar la solicitud
$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$error = curl_error($ch);
$info = curl_getinfo($ch);

unset($ch);

// Manejar errores de conexión
if ($error) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al conectar con el servidor. Intente nuevamente.',
        'icon' => 'error',
        'debug_info' => [
            'curl_error' => $error,
            'http_code' => $httpCode,
            'total_time' => $info['total_time'],
            'connect_time' => $info['connect_time'],
            'url' => $url
        ]
    ]);
    exit;
}

// Decodificar la respuesta JSON
$jsonResponse = json_decode($response, true);

// Verificar si la decodificación fue exitosa
if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode([
        'success' => false,
        'message' => 'Respuesta inválida del servidor. Formato JSON incorrecto.',
        'icon' => 'error',
        'raw_response' => $response
    ]);
    exit;
}

// Manejar la respuesta según la estructura real de la API
if ($httpCode === 200) {
 
    
    // Login exitoso (usuario tiene acceso y datos son válidos)
    if (isset($jsonResponse['isCorrect']) && $jsonResponse['isCorrect'] === true && isset($jsonResponse['data']['user']) && $jsonResponse['data']['user'] !== null) {
        // Usar configuración segura de sesión (HttpOnly cookies)
        require_once __DIR__ . '/session_config.php';
        
        // Guardar datos del usuario en sesión
        $_SESSION['user'] = $jsonResponse['data']['user'];
        $_SESSION['userName'] = $jsonResponse['data']['user']['userName'];
        $_SESSION['employeeCode'] = $jsonResponse['data']['user']['employeeCode'];
        $_SESSION['department'] = $jsonResponse['data']['user']['department'];
        $_SESSION['email'] = $jsonResponse['data']['user']['email'];
        $_SESSION['company'] = $company;
        $_SESSION['country'] = $country;
        $_SESSION['companyCode'] = $companyCode;
        
        // Guardar roles y accesos desde la estructura anidada en application
        if (isset($jsonResponse['data']['user']['application']['roles']) && is_array($jsonResponse['data']['user']['application']['roles'])) {
            $_SESSION['roles'] = $jsonResponse['data']['user']['application']['roles'];
        }
        
        // Guardar información de la aplicación
        if (isset($jsonResponse['data']['user']['application'])) {
            $_SESSION['application'] = $jsonResponse['data']['user']['application'];
        }
        
        // Guardar información de sucursales (branchs) y ubicaciones
        if (isset($jsonResponse['data']['user']['application']['branchs']) && is_array($jsonResponse['data']['user']['application']['branchs'])) {
            $_SESSION['branchs'] = $jsonResponse['data']['user']['application']['branchs'];
            
            // Extraer todas las ubicaciones de todas las sucursales
            $allLocations = [];
            foreach ($jsonResponse['data']['user']['application']['branchs'] as $branch) {
                if (isset($branch['locations']) && is_array($branch['locations'])) {
                    foreach ($branch['locations'] as $location) {
                        $allLocations[] = $location;
                    }
                }
            }
            $_SESSION['allLocations'] = $allLocations;
        }
        
        // Extraer todos los accesos de todos los roles con sus acciones
        $allAccesses = [];
        $accessActions = []; // Mapa de accesos con sus acciones
        
        if (isset($jsonResponse['data']['user']['application']['roles'])) {
            foreach ($jsonResponse['data']['user']['application']['roles'] as $role) {
                if (!isset($role['access']) || !is_array($role['access'])) {
                    continue;
                }

                foreach ($role['access'] as $access) {
                    if (!is_array($access)) {
                        continue;
                    }

                    $allAccesses[] = $access;

                    $accessName = $access['description'] ?? null;
                    if (empty($accessName)) {
                        continue;
                    }

                    if (!isset($accessActions[$accessName])) {
                        $accessActions[$accessName] = [
                            'byId' => [],
                            'byKey' => [],
                            'actions' => []
                        ];
                    }

                    if (!isset($access['actions']) || !is_array($access['actions'])) {
                        continue;
                    }

                    foreach ($access['actions'] as $action) {
                        if (!is_array($action)) {
                            continue;
                        }

                        $actionEntry = [
                            'actionId' => $action['actionId'] ?? null,
                            'description' => $action['description'] ?? '',
                            'active' => isset($action['active']) ? (bool) $action['active'] : false
                        ];

                        $normalizedDescription = '';
                        if (!empty($actionEntry['description'])) {
                            $normalizedDescription = mb_strtolower(trim($actionEntry['description']), 'UTF-8');
                        }

                        // Registrar por ID
                        if (!is_null($actionEntry['actionId'])) {
                            $actionIdKey = (string) $actionEntry['actionId'];
                            if (isset($accessActions[$accessName]['byId'][$actionIdKey])) {
                                // Combinar estados de active
                                $existing = $accessActions[$accessName]['byId'][$actionIdKey];
                                $actionEntry['active'] = ($existing['active'] ?? false) || $actionEntry['active'];
                            }
                            $accessActions[$accessName]['byId'][$actionIdKey] = $actionEntry;
                        }

                        // Registrar por descripción normalizada
                        if ($normalizedDescription !== '') {
                            if (isset($accessActions[$accessName]['byKey'][$normalizedDescription])) {
                                $existing = $accessActions[$accessName]['byKey'][$normalizedDescription];
                                $actionEntry['active'] = ($existing['active'] ?? false) || $actionEntry['active'];

                                // Mantener actionId si no existía previamente
                                if (is_null($existing['actionId']) && !is_null($actionEntry['actionId'])) {
                                    $accessActions[$accessName]['byKey'][$normalizedDescription]['actionId'] = $actionEntry['actionId'];
                                }
                            }

                            $accessActions[$accessName]['byKey'][$normalizedDescription] = $actionEntry;
                            $accessActions[$accessName]['actions'][$normalizedDescription] = $actionEntry;
                        } else {
                            $accessActions[$accessName]['actions'][] = $actionEntry;
                        }
                    }
                }
            }

            // Normalizar listado de acciones por acceso
            foreach ($accessActions as $name => $details) {
                if (isset($details['actions'])) {
                    $actions = $details['actions'];
                    $isAssociative = is_array($actions) && array_keys($actions) !== range(0, count($actions) - 1);

                    if ($isAssociative) {
                        $accessActions[$name]['actions'] = array_values($actions);
                    } else {
                        $accessActions[$name]['actions'] = $actions;
                    }
                } else {
                    $accessActions[$name]['actions'] = [];
                }
            }

            $_SESSION['allAccesses'] = $allAccesses;
            $_SESSION['accessActions'] = $accessActions;
        }
        
        // Manejar "Remember Me": guardar username en cookie HttpOnly (NUNCA guardar password)
        // Verificar rememberMe de múltiples formas (checkbox puede enviar 'true' o estar presente)
        $rememberMe = false;
        if (isset($_POST['rememberMe'])) {
            $rememberMeValue = $_POST['rememberMe'];
            $rememberMe = ($rememberMeValue === 'true' || $rememberMeValue === '1' || $rememberMeValue === true);
        }
        
        // Inicializar variable de debug
        $cookieDebug = null;
        
        if ($rememberMe) {
            // Cookie HttpOnly: segura, no accesible desde JavaScript
            // Duración: 30 días
            $expires = time() + (30 * 24 * 60 * 60); // 30 días
            
            // Calcular ruta dinámicamente desde el directorio actual
            $scriptPath = dirname($_SERVER['SCRIPT_NAME']); // Ej: /Pipsa/GSO/Login
            $basePath = dirname($scriptPath); // Ej: /CorporativoPruebas/GSO
            $path = rtrim($basePath, '/') . '/'; // Asegurar que termine con /
            
            // IMPORTANTE: No especificar dominio para que funcione en localhost y IP
            // Si especificamos dominio, la cookie solo funcionará en ese dominio específico
            $domain = ''; // Vacío = funciona en cualquier dominio (localhost, IP, etc.)
            $secure = false; // En desarrollo local sin HTTPS, debe ser false
            $httponly = true; // HttpOnly: no accesible desde JavaScript
            
            // Verificar si los headers ya se enviaron
            $headersSent = headers_sent($file, $line);
            
            // Guardar username en cookie HttpOnly
            if (PHP_VERSION_ID >= 70300) {
                $cookieSetUsername = @setcookie('remembered_username', $usuario, [
                    'expires' => $expires,
                    'path' => $path,
                    'domain' => $domain,
                    'secure' => $secure,
                    'httponly' => $httponly,
                    'samesite' => 'Lax'
                ]);
            } else {
                $cookieSetUsername = @setcookie('remembered_username', $usuario, $expires, $path, $domain, $secure, $httponly);
            }
            
            // Guardar password en cookie HttpOnly (CIFRADO para mayor seguridad)
            // Usar cifrado AES-256-CBC con una clave secreta
            $encryptionKey = hash('sha256', 'GSOP_REMEMBER_ME_SECRET_KEY_' . $_SERVER['HTTP_HOST'], true); // Clave derivada del host
            $iv = openssl_random_pseudo_bytes(16); // Vector de inicialización aleatorio
            $encryptedPassword = openssl_encrypt($password, 'AES-256-CBC', $encryptionKey, 0, $iv);
            $encryptedPasswordWithIV = base64_encode($iv . $encryptedPassword); // Combinar IV + password cifrado
            
            if (PHP_VERSION_ID >= 70300) {
                $cookieSetPassword = @setcookie('remembered_password', $encryptedPasswordWithIV, [
                    'expires' => $expires,
                    'path' => $path,
                    'domain' => $domain,
                    'secure' => $secure,
                    'httponly' => $httponly,
                    'samesite' => 'Lax'
                ]);
            } else {
                $cookieSetPassword = @setcookie('remembered_password', $encryptedPasswordWithIV, $expires, $path, $domain, $secure, $httponly);
            }
            
            // Debug: verificar si las cookies se establecieron correctamente
            $cookieDebug = [
                'cookie_set_username' => $cookieSetUsername,
                'cookie_set_password' => $cookieSetPassword,
                'path' => $path,
                'expires' => date('Y-m-d H:i:s', $expires),
                'username' => $usuario,
                'expires_timestamp' => $expires,
                'domain' => $domain ?: '(vacío - cualquier dominio)',
                'secure' => $secure,
                'httponly' => $httponly,
                'headers_sent' => $headersSent,
                'headers_sent_file' => $headersSent ? $file : null,
                'headers_sent_line' => $headersSent ? $line : null
            ];
        } else {
            // Eliminar cookies si existen (solo si el usuario desmarca "remember me")
            $scriptPath = dirname($_SERVER['SCRIPT_NAME']);
            $basePath = dirname($scriptPath);
            $path = rtrim($basePath, '/') . '/';
            $secure = false; // En desarrollo local sin HTTPS
            
            if (isset($_COOKIE['remembered_username'])) {
                if (PHP_VERSION_ID >= 70300) {
                    setcookie('remembered_username', '', [
                        'expires' => time() - 3600,
                        'path' => $path,
                        'domain' => '',
                        'secure' => $secure,
                        'httponly' => true,
                        'samesite' => 'Lax'
                    ]);
                } else {
                    setcookie('remembered_username', '', time() - 3600, $path, '', $secure, true);
                }
            }
            
            if (isset($_COOKIE['remembered_password'])) {
                if (PHP_VERSION_ID >= 70300) {
                    setcookie('remembered_password', '', [
                        'expires' => time() - 3600,
                        'path' => $path,
                        'domain' => '',
                        'secure' => $secure,
                        'httponly' => true,
                        'samesite' => 'Lax'
                    ]);
                } else {
                    setcookie('remembered_password', '', time() - 3600, $path, '', $secure, true);
                }
            }
        }
        
        // Mensaje personalizado con nombre de usuario
        $welcomeMessage = "¡Bienvenido " . $_SESSION['userName'] . "! Redirigiendo...";
        
        $response = [
            'success' => true,
            'message' => $welcomeMessage,
            'icon' => 'success',
            'redirect' => '/Pipsa/GSO/Corporativo/GSO/index.php'
        ];
        
        // Agregar información de debug sobre la cookie si está disponible
        if (isset($cookieDebug)) {
            $response['cookieDebug'] = $cookieDebug;
        }
        
        // Debug: también incluir información sobre rememberMe recibido
        $response['debug'] = [
            'rememberMe_received' => $_POST['rememberMe'] ?? 'no presente',
            'rememberMe_processed' => $rememberMe,
            'all_post_keys' => array_keys($_POST)
        ];
        
        echo json_encode($response);
    } else {
        // Login fallido (credenciales incorrectas)
        $errorMessage = $jsonResponse['message'] ;
        
        echo json_encode([
            'success' => false,
            'message' => $errorMessage,
            'icon' => 'error'
        ]);
    }
} else {
    // Error del servidor (código HTTP no es 200)
    $errorMessage = $jsonResponse['message'] ?? 'Error en el servidor. Código: ' . $httpCode;
    
    // Personalizar mensaje para códigos específicos
    if ($httpCode == 401) {
        $errorMessage = "No autorizado. Verifique sus credenciales.";
    } elseif ($httpCode == 403) {
        $errorMessage = "Acceso prohibido. No tiene permisos para acceder.";
    } elseif ($httpCode == 404) {
        $errorMessage = "Recurso no encontrado.";
    } elseif ($httpCode >= 500) {
        $errorMessage = "Error interno del servidor. Intente más tarde.";
    }
    
    echo json_encode([
        'success' => false,
        'message' => $errorMessage,
        'icon' => 'error'
    ]);
}
?>