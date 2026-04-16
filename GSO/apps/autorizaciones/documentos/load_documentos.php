<?php
//include("../../../Login/validar_sesion.php");
// Usar configuración segura de sesión (HttpOnly cookies)
if (session_status() === PHP_SESSION_NONE) {
    require_once __DIR__ . '/../../../Login/session_config.php';
}
require_once __DIR__ . '/../../../config/api.php';
// Obtener los parámetros de la sesión
$country = $_SESSION['country'] ?? '';
$company = $_SESSION['company'] ?? '';
$approver_user = $_SESSION['userName'] ?? '';

// Obtener los parámetros de fecha
$requested_date_initial = $_GET['requested_date_initial'] ?? '';
$requested_date_end = $_GET['requested_date_end'] ?? '';
$limit = $_GET['limit'] ?? 10; // Valor por defecto de 10 registros

// Validar que tengamos los datos necesarios
if (empty($country) || empty($company) || empty($approver_user)) {
    echo json_encode(['data' => []]);
    exit;
}

// Construir la URL con los parámetros (base en GSO/config/api.php)
$url = rtrim(api_base('documentos'), '/') . "/document/get_by_date?";
$url .= "country=" . urlencode($country);
$url .= "&company=" . urlencode($company);
$url .= "&approver_user=" . urlencode($approver_user);
$url .= "&requested_date_initial=" . urlencode($requested_date_initial);
$url .= "&requested_date_end=" . urlencode($requested_date_end);
$url .= "&limit=" . urlencode($limit);

// Inicializar cURL
$ch = curl_init($url);

// Configurar la petición
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "GET");
curl_setopt($ch, CURLOPT_HTTPHEADER, array(
    'Accept: application/json'
));

// Ejecutar la petición
$response = curl_exec($ch);

// Verificar si hay errores
if(curl_errno($ch)) {
    unset($ch); // PHP 8.0+ libera automáticamente los recursos cURL
    echo json_encode(['data' => []]);
    exit;
}

// Liberar recurso cURL (PHP 8.0+ libera automáticamente)
unset($ch);

// Decodificar la respuesta
$data = json_decode($response, true);

// Formatear la respuesta para DataTables
$formattedData = array();
if (is_array($data)) {
    foreach ($data as $doc) {
        // Obtener el primer detalle de autorización para mostrar en la tabla principal
        $firstAuth = !empty($doc['authorization_detail']) ? $doc['authorization_detail'][0] : null;
        
        $formattedData[] = array(
            'id' => $doc['id'],
            'branch_country' => $doc['branch_country'],
            'requested_date' => $doc['requested_date'],
            'number' => $doc['number'],
            'client_code' => $doc['client_code'],
            'client_name' => $doc['client_name'],
            'petitioner' => $doc['petitioner'],
            'authorization_detail' => $doc['authorization_detail'] ?? [],
            'total_amount' => $doc['total_amount'] ?? 0,
            'total_contribution' => $doc['total_contribution'] ?? 0,
            'total_freight' => $doc['total_freight'] ?? 0,
            'total_isv' => $doc['total_isv'] ?? 0,
            'path_file' => !empty($doc['path_file']) ? $doc['path_file'] : '',
            // Campos para la tabla principal (tomados del primer detalle)
            'authorization_type' => $firstAuth ? $firstAuth['authorization_type'] : null,
            'authorization_description' => $firstAuth ? $firstAuth['authorization_description'] : null,
            'autorized' => $firstAuth ? $firstAuth['autorized'] : false,
            'refused' => $firstAuth ? $firstAuth['refused'] : false,
            'approver_comment' => $firstAuth ? $firstAuth['approver_comment'] : null
        );
    }
}

// Enviar la respuesta
header('Content-Type: application/json');
echo json_encode(['data' => $formattedData]);
?> 