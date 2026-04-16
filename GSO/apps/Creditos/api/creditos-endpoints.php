<?php
/**
 * Endpoints del Módulo de Créditos
 * Versión: 1.0.0
 * 
 * Este archivo maneja las operaciones de servidor para el módulo de créditos
 * sirviendo como puente entre JS y la API en C#.
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST');
header('Access-Control-Allow-Headers: Content-Type');

// Usar configuración segura de sesión
if (session_status() === PHP_SESSION_NONE) {
    require_once __DIR__ . '/../../../Login/session_config.php';
}

// Requerir archivo global de APIs
require_once __DIR__ . '/../../../config/api.php';

// Validar que exista usuario logueado
if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['success' => false, 'message' => 'No autorizado']);
    exit;
}

class CreditosEndpoints {
    private $baseUrlCreditos;
    private $timeout = 30;

    public function __construct() {
       
        $this->baseUrlCreditos = api_base('report-viewer');

        // Validar acción recibida
        $action = $_GET['action'] ?? '';

        try {
            switch ($action) {
                case 'getReportsByAccessId':
                    $this->getReportsByAccessId();
                    break;
                case 'getAccessIdByName':
                    $this->getAccessIdByName();
                    break;
                default:
                    $this->sendError('Acción no válida', 400);
            }
        } catch (Exception $e) {
            $this->sendError('Error interno del servidor: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Obtener reportes desde el catálogo general por accessId
     */
    private function getReportsByAccessId() {
        try {
            // Leer y decodificar body
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);

            // También soportar GET para compatibilidad o pruebas rápidas
            $accessId = $data['accessId'] ?? $_GET['accessId'] ?? null;

            if (!$accessId) {
                $this->sendError('El accessId es requerido', 400);
                return;
            }

            // URL del API de C#
            $url = $this->baseUrlCreditos . "/ReportConfiguration/GetReporByAccessId/{$accessId}";
            
            // Llamar al API usando cURL
            $response = $this->makeApiCall($url);
            
            // Devolver la respuesta transparente al frontend
            echo json_encode($response, JSON_UNESCAPED_UNICODE);
            exit;

        } catch (Exception $e) {
            $this->sendError('Error al obtener reportes del API: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Obtener toda la lista plana del catálogo de Accesos
     */
    private function getAccessIdByName() {
        try {
            $url = $this->baseUrlCreditos . "/Access/Get";
            $response = $this->makeApiCall($url);
            
            echo json_encode($response, JSON_UNESCAPED_UNICODE);
            exit;
        } catch (Exception $e) {
            $this->sendError('Error al cargar catálogo de accesos: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Realizar llamada a API externa en C#
     */
    private function makeApiCall($url, $method = 'GET', $data = null) {
        $ch = curl_init();
        
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $this->timeout,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Accept: application/json'
            ]
        ]);
        
        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            if (!empty($data)) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data, JSON_UNESCAPED_UNICODE));
            }
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        
        curl_close($ch);
        
        if ($error) {
            throw new Exception("Error de conexión cURL: {$error}");
        }
        
        if ($httpCode !== 200) {
            throw new Exception("Error HTTP: {$httpCode}. Respuesta: {$response}");
        }
        
        if (empty($response)) {
            return [];
        }
        
        $decoded = json_decode($response, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            if ($httpCode === 200) return [];
            throw new Exception('Error al decodificar JSON nativo: ' . json_last_error_msg());
        }
        
        return $decoded;
    }

    /**
     * Enviar respuesta estandarizada de error
     */
    private function sendError($message, $code = 500) {
        http_response_code($code);
        echo json_encode([
            'success' => false,
            'message' => $message,
            'error_code' => $code,
            'timestamp' => date('Y-m-d H:i:s')
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// Inicializar y ejecutar endpoint
new CreditosEndpoints();
