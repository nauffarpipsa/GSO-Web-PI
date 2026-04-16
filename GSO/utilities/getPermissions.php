<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

// Verificar si hay sesión activa
if (!isset($_SESSION['user'])) {
    echo json_encode([
        'success' => false,
        'message' => 'No hay sesión activa',
        'authenticated' => false
    ]);
    exit;
}

// Devolver permisos del usuario
echo json_encode([
    'success' => true,
    'authenticated' => true,
    'userName' => $_SESSION['userName'] ?? null,
    'roles' => $_SESSION['roles'] ?? [],
    'allAccesses' => $_SESSION['allAccesses'] ?? [],
    'accessActions' => $_SESSION['accessActions'] ?? []
]);
?>

