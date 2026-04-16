<?php
include("../../../Login/validar_sesion.php");
require_once __DIR__ . '/../../../config/api.php';

// Configurar headers para JSON
header('Content-Type: application/json');

// Verificar que sea una petición POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['success' => false, 'message' => 'Método no permitido']);
    exit;
}

// Verificar que se haya enviado un archivo
if (!isset($_FILES['pdf_file']) || $_FILES['pdf_file']['error'] !== UPLOAD_ERR_OK) {
    echo json_encode(['success' => false, 'message' => 'No se recibió ningún archivo']);
    exit;
}

// Obtener los datos del formulario
$documentId = $_POST['document_id'] ?? '';
$authType = $_POST['auth_type'] ?? '';
$documentNumber = $_POST['document_number'] ?? ''; // Nuevo campo para el número de documento
$file = $_FILES['pdf_file'];

// Validar que tengamos todos los datos necesarios
if (empty($documentId) || empty($authType) || empty($documentNumber)) {
    echo json_encode(['success' => false, 'message' => 'Datos incompletos']);
    exit;
}

// Verificar que el archivo sea un PDF
$allowedTypes = ['application/pdf'];
$finfo = finfo_open(FILEINFO_MIME_TYPE);
$mimeType = finfo_file($finfo, $file['tmp_name']);
unset($finfo); // PHP 8.0+ libera automáticamente los recursos finfo

if (!in_array($mimeType, $allowedTypes)) {
    echo json_encode(['success' => false, 'message' => 'Solo se permiten archivos PDF']);
    exit;
}

// Verificar tamaño del archivo (máximo 10MB)
if ($file['size'] > 10 * 1024 * 1024) {
    echo json_encode(['success' => false, 'message' => 'El archivo es demasiado grande. Máximo 10MB permitido']);
    exit;
}

// Crear el nuevo nombre del archivo
$newFileName = 'File_' . $documentNumber . '.pdf';

// URL de la API (base en GSO/config/api.php)
$apiUrl = rtrim(api_base('documentos'), '/') . "/document/uploadfile";

// Preparar los datos para enviar a la API con el nuevo nombre
$postData = [
    'file' => new CURLFile($file['tmp_name'], 'application/pdf', $newFileName)
];

// Inicializar cURL
$ch = curl_init($apiUrl);

// Configurar la petición
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, $postData);
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Accept: application/json',
    'Content-Type: multipart/form-data'
));

// Ejecutar la petición
$response = curl_exec($ch);

// Verificar si hay errores
if(curl_errno($ch)) {
    echo json_encode(['success' => false, 'message' => 'Error de conexión: ' . curl_error($ch)]);
    unset($ch); // PHP 8.0+ libera automáticamente los recursos cURL
    exit;
}

// Obtener el código de respuesta HTTP
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

// Liberar recurso cURL (PHP 8.0+ libera automáticamente)
unset($ch);

// Decodificar la respuesta de la API
$apiResponse = json_decode($response, true);

// Verificar el código de respuesta HTTP
if ($httpCode === 200) {
    // Éxito - la API devuelve {"path": "ruta.pdf"}
    if (isset($apiResponse['path'])) {
        echo json_encode([
            'success' => true, 
            'message' => 'PDF enviado exitosamente a la API',
            'filename' => basename($apiResponse['path']), // Extraer solo el nombre del archivo
            'path_file' => $apiResponse['path'] // Usar el path completo como path_file
        ]);
    } else {
        // La API respondió pero sin los campos esperados
        echo json_encode([
            'success' => false, 
            'message' => 'Respuesta inesperada de la API',
            'debug_response' => $apiResponse,
            'raw_response' => $response
        ]);
    }
} else {
    // Error HTTP
    echo json_encode(['success' => false, 'message' => 'Error en la API (HTTP ' . $httpCode . ')']);
}
?> 