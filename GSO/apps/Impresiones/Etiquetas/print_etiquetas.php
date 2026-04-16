<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Manejar preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Verificar que sea una petición POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'success' => false,
        'message' => 'Método no permitido'
    ]);
    exit;
}

// Obtener el contenido JSON de la petición
$input = file_get_contents('php://input');
$data = json_decode($input, true);

if (json_last_error() !== JSON_ERROR_NONE) {
    echo json_encode([
        'success' => false,
        'message' => 'Error al parsear JSON: ' . json_last_error_msg()
    ]);
    exit;
}

// URL del endpoint de impresión
$url = "http://192.168.10.80:8002/label/print_label";

// Configurar el contexto de la petición HTTP
$context = stream_context_create([
    'http' => [
        'method' => 'POST',
        'header' => [
            'Content-Type: application/json',
            'Accept: application/json'
        ],
        'content' => json_encode($data),
        'timeout' => 30
    ]
]);

try {
    // Realizar la petición HTTP
    $response = file_get_contents($url, false, $context);
    
    if ($response === false) {
        echo json_encode([
            'success' => false,
            'message' => 'Error al conectar con el servicio de impresión'
        ]);
        exit;
    }
    
    // Decodificar la respuesta JSON
    $responseData = json_decode($response, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        echo json_encode([
            'success' => false,
            'message' => 'Error al parsear respuesta JSON: ' . json_last_error_msg()
        ]);
        exit;
    }
    
    // Devolver la respuesta del endpoint
    echo json_encode([
        'success' => true,
        'data' => $responseData
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?> 