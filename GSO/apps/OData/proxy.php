<?php
header('Access-Control-Allow-Origin: *');
header('Content-Type: application/json');

$url = $_GET['url'];
if (!$url) {
    die(json_encode(['error' => 'URL no proporcionada']));
}

error_log("URL recibida: " . $url);

$username = 'Odatas';
$password = 'Kronos67421';

$ch = curl_init();
curl_setopt($ch, CURLOPT_URL, $url);
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_HTTPAUTH, CURLAUTH_BASIC);
curl_setopt($ch, CURLOPT_USERPWD, "$username:$password");
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
curl_setopt($ch, CURLOPT_VERBOSE, true);

$verbose = fopen('php://temp', 'w+');
curl_setopt($ch, CURLOPT_STDERR, $verbose);

$response = curl_exec($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

if (curl_errno($ch)) {
    $error = curl_error($ch);
    error_log("Error cURL: " . $error);
    die(json_encode(['error' => $error]));
}

rewind($verbose);
$verboseLog = stream_get_contents($verbose);
error_log("Log cURL: " . $verboseLog);

curl_close($ch);

if ($httpCode >= 400) {
    error_log("Error HTTP: " . $httpCode);
    die(json_encode(['error' => "Error HTTP: $httpCode", 'response' => $response]));
}

error_log("Respuesta exitosa: " . substr($response, 0, 100) . "...");
echo $response;
?> 