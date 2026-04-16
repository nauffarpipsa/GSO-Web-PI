<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

require_once("WebSocketHelper.php");

header('Content-Type: application/json');

// Verificar que el usuario esté autenticado
if (!isset($_SESSION['user'])) {
    echo json_encode([
        'success' => false,
        'message' => 'No autorizado'
    ]);
    exit;
}

try {
    $wsHelper = new WebSocketSessionHelper('http://192.168.10.80:4002');
    
    // Obtener sesiones activas
    $activeSessions = $wsHelper->getActiveSessions();
    $serverStatus = $wsHelper->getServerStatus();
    
    if (ob_get_level()) {
        ob_clean();
    }
    
    echo json_encode([
        'success' => true,
        'sessions' => $activeSessions,
        'serverStatus' => $serverStatus,
        'count' => count($activeSessions)
    ]);
} catch (Exception $e) {
    if (ob_get_level()) {
        ob_clean();
    }
    echo json_encode([
        'success' => false,
        'message' => 'Error al obtener sesiones: ' . $e->getMessage()
    ]);
}

// Enviar y limpiar el buffer de salida
if (ob_get_level()) {
    ob_end_flush();
}
exit;


