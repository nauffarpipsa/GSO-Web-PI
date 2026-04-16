<?php
// Usar configuración segura de sesión (HttpOnly cookies)
if (session_status() === PHP_SESSION_NONE) {
    require_once __DIR__ . '/session_config.php';
}

$tiempo_inactividad = 1200; // 20 minutos (1200 segundos)

// Verificar si es una petición AJAX para obtener información de sesión
$isAjax = !empty($_SERVER['HTTP_X_REQUESTED_WITH']) && 
          strtolower($_SERVER['HTTP_X_REQUESTED_WITH']) == 'xmlhttprequest';

// Verificar si es una petición para extender la sesión
$extendSession = isset($_GET['extend']) && $_GET['extend'] === 'true';

// Verificar si este script se está ejecutando directamente (no incluido desde otro archivo)
// Verificamos si el REQUEST_URI contiene 'validar_sesion.php' o si hay parámetros GET específicos
$requestUri = $_SERVER['REQUEST_URI'] ?? '';
$isDirectRequest = strpos($requestUri, 'validar_sesion.php') !== false || 
                   isset($_GET['extend']) || 
                   (isset($_GET['check_session']) && $_GET['check_session'] === 'true');

if (isset($_SESSION['ultimo_movimiento'])) {
    $tiempo_transcurrido = time() - $_SESSION['ultimo_movimiento'];
    $tiempo_restante = $tiempo_inactividad - $tiempo_transcurrido;
    
    if ($tiempo_transcurrido > $tiempo_inactividad) {
        session_unset();
        session_destroy();
        
        if ($isAjax && $isDirectRequest) {
            // Respuesta JSON para AJAX solo si es una petición directa
            header('Content-Type: application/json');
            echo json_encode([
                'expired' => true,
                'message' => 'Sesión expirada por inactividad',
                'time_remaining' => 0,
                'redirect' => '/Corporativo/GSO/authentication/layouts/corporate/sign-in.html?expirado=1'
            ]);
            exit;
        } else {
            // Redirección normal (tanto para peticiones directas como incluidas)
            header("Location: /Corporativo/GSO/authentication/layouts/corporate/sign-in.html?expirado=1");
            exit;
        }
    }
    
    // Si es AJAX y es una petición directa, devolver información de sesión
    if ($isAjax && $isDirectRequest) {
        // Si es una petición para extender la sesión, resetear el tiempo
        if ($extendSession) {
            $_SESSION['ultimo_movimiento'] = time();
            $tiempo_restante = $tiempo_inactividad;
            $tiempo_transcurrido = 0;
        }
        
        header('Content-Type: application/json');
        echo json_encode([
            'valid' => true,
            'time_remaining' => max(0, $tiempo_restante),
            'message' => 'Sesión activa',
            'time_elapsed' => $tiempo_transcurrido
        ]);
        exit;
    }
} else {
    // No hay registro de último movimiento
    if ($isAjax && $isDirectRequest) {
        header('Content-Type: application/json');
        echo json_encode([
            'valid' => true,
            'time_remaining' => $tiempo_inactividad,
            'message' => 'Sesión activa',
            'time_elapsed' => 0
        ]);
        exit;
    }
}

$_SESSION['ultimo_movimiento'] = time();

if (!isset($_SESSION['user'])) {
    if ($isAjax && $isDirectRequest) {
        // Respuesta JSON para AJAX solo si es una petición directa
        header('Content-Type: application/json');
        echo json_encode([
            'expired' => true,
            'message' => 'No hay sesión activa',
            'time_remaining' => 0,
            'redirect' => '/Corporativo/GSO/authentication/layouts/corporate/sign-in.html'
        ]);
        exit;
    } else {
        // Redirección normal (tanto para peticiones directas como incluidas)
        header("Location: /Corporativo/GSO/authentication/layouts/corporate/sign-in.html");
        exit;
    }
}
?>