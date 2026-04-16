<?php
header('Content-Type: application/json');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');

// Verificar si se recibió el parámetro branch_code
if (!isset($_GET['branch_code']) || empty($_GET['branch_code'])) {
    echo json_encode([
        'success' => false,
        'message' => 'El parámetro branch_code es requerido'
    ]);
    exit;
}

$branch_code = $_GET['branch_code'];

// URL del endpoint
$url = "http://192.168.10.80:8002/label/get_all?branch_code=" . urlencode($branch_code);

// Configurar el contexto de la petición HTTP
$context = stream_context_create([
    'http' => [
        'method' => 'GET',
        'timeout' => 30,
        'header' => [
            'Content-Type: application/json',
            'Accept: application/json'
        ]
    ]
]);

try {
    // Realizar la petición HTTP
    $response = file_get_contents($url, false, $context);
    
    if ($response === false) {
        echo json_encode([
            'success' => false,
            'message' => 'Error al conectar con el servicio'
        ]);
        exit;
    }
    
    // Decodificar la respuesta JSON
    $data = json_decode($response, true);
    
    if (json_last_error() !== JSON_ERROR_NONE) {
        echo json_encode([
            'success' => false,
            'message' => 'Error al parsear la respuesta JSON: ' . json_last_error_msg()
        ]);
        exit;
    }
    
    // Verificar si la respuesta es un array
    if (!is_array($data)) {
        echo json_encode([
            'success' => false,
            'message' => 'Formato de respuesta inválido'
        ]);
        exit;
    }
    
    // Transformar los datos para la tabla
    $transformedData = [];
    foreach ($data as $item) {
        $transformedData[] = [
            'branch_code' => $item['branch_code'] ?? '',
            'lote' => $item['serie_code'] ?? '',
            'codigo' => $item['product_code'] ?? '',
            'descripcion' => $item['product_description'] ?? '',
            'sede' => $item['branch_description'] ?? '',
            'inventario' => number_format($item['quantity'], 2),
            'unidad' => $item['unit'] ?? '',
            'cantidad_etiquetas' => $item['quantity'] ?? '',
            'fecha_produccion' => $item['production_date'] ?? ''
        ];
    }
    
    echo json_encode([
        'success' => true,
        'data' => $transformedData,
        'total' => count($transformedData)
    ]);
    
} catch (Exception $e) {
    echo json_encode([
        'success' => false,
        'message' => 'Error: ' . $e->getMessage()
    ]);
}
?>
