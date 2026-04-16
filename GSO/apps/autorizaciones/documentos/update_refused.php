<?php
include("../../../Login/validar_sesion.php");
require_once __DIR__ . '/../../../config/api.php';

// Obtener el ID del documento, tipo de autorización y el comentario
$id = $_POST['id'] ?? '';
$authorization_type = $_POST['authorization_type'] ?? '';
$comment = $_POST['comment'] ?? '';

if (empty($id)) {
    echo json_encode(['error' => true, 'message' => 'ID no proporcionado']);
    exit;
}

if (empty($authorization_type)) {
    echo json_encode(['error' => true, 'message' => 'Tipo de autorización no proporcionado']);
    exit;
}

// Construir la URL con los parámetros (base en GSO/config/api.php)
$url = rtrim(api_base('documentos'), '/') . "/document/update_refused/" . urlencode($id);
$url .= "?authorization_type=" . urlencode($authorization_type);
$url .= "&comment=" . urlencode($comment);

// Inicializar cURL
$ch = curl_init($url);

// Configurar la petición
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PUT");
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Content-Type: application/json',
    'Accept: application/json'
));

// Ejecutar la petición
$response = curl_exec($ch);

// Verificar si hay errores
if(curl_errno($ch)) {
    $error = array(
        'error' => true,
        'message' => curl_error($ch)
    );
    unset($ch); // PHP 8.0+ libera automáticamente los recursos cURL
    echo json_encode($error);
    exit;
}

// Obtener el código de respuesta HTTP
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

// Liberar recurso cURL (PHP 8.0+ libera automáticamente)
unset($ch);

// Enviar la respuesta
header('Content-Type: application/json');
echo $response; 