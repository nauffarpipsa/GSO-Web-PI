<?php
/**
 * Endpoints de Cuotas Pendientes de Interés - Maestro de Préstamos
 * Versión: 1.0.0
 * 
 * Este archivo maneja las operaciones de cuotas pendientes de interés
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Usar configuración segura de sesión (HttpOnly cookies)
if (session_status() === PHP_SESSION_NONE) {
    require_once __DIR__ . '/../../../../Login/session_config.php';
}
require_once __DIR__ . '/../../../../config/api.php';
// Variable global para companyCode
$companyCode = $_SESSION['companyCode'] ?? '';

// Configuración de timezone
date_default_timezone_set('America/Tegucigalpa');

/**
 * Clase para manejar endpoints de cuotas pendientes
 */
class CuotasPendientesEndpoints {
    
    // URLs base (se asignan desde GSO/config/api.php)
    private $baseUrlAmortizacion;
    private $baseUrlSap;
    private $timeout = 200;
    
    public function __construct() {
        $this->baseUrlAmortizacion = api_base('amortizacion');
        $this->baseUrlSap = api_base('pagos_sap');
        // Validar método HTTP
        $method = $_SERVER['REQUEST_METHOD'];
        $action = $_GET['action'] ?? '';
        
        try {
            switch ($action) {
                case 'obtenerCuotasPendientesInteres':
                    if ($method !== 'GET') {
                        $this->sendError('Método no permitido', 405);
                        return;
                    }
                    $this->obtenerCuotasPendientesInteres();
                    break;
                case 'guardarFacturaIPM':
                    if ($method !== 'POST') {
                        $this->sendError('Método no permitido', 405);
                        return;
                    }
                    $this->guardarFacturaIPM();
                    break;
                default:
                    $this->sendError('Acción no válida', 400);
                    break;
            }
        } catch (Exception $e) {
            $this->sendError('Error interno del servidor: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Obtener cuotas pendientes de interés
     */
    private function obtenerCuotasPendientesInteres() {
        try {
            global $companyCode;
            
            // Validar que tengamos companyCode
            if (empty($companyCode)) {
                $this->sendError('No se encontró el código de compañía en la sesión', 400);
                return;
            }
            
            // Obtener parámetros
            $month = $_GET['month'] ?? '';
            $year = $_GET['year'] ?? '';
            
            // Validar parámetros
            if (empty($month) || empty($year)) {
                $this->sendError('Los parámetros month y year son requeridos', 400);
                return;
            }
            
            // Validar que month sea un número entre 1 y 12
            $month = intval($month);
            if ($month < 1 || $month > 12) {
                $this->sendError('El mes debe ser un número entre 1 y 12', 400);
                return;
            }
            
            // Validar que year sea un número válido
            $year = intval($year);
            if ($year < 2000 || $year > 2100) {
                $this->sendError('El año debe ser un número válido', 400);
                return;
            }
            
            // Llamar al endpoint externo
            $url = $this->baseUrlAmortizacion . "loans/amortization/pending-interest-only?month={$month}&year={$year}&company={$companyCode}";
            
            $fullResponse = $this->makeApiCall($url, 'GET', null, true);
            
            $httpCode = $fullResponse['httpCode'];
            $response = $fullResponse['response'];
            
            // Manejar respuesta
            if ($httpCode === 200) {
                $this->sendSuccess($response, 'Cuotas pendientes obtenidas exitosamente');
            } else {
                $errorMessage = $response['message'] ?? "Error HTTP: $httpCode";
                $this->sendError($errorMessage, $httpCode >= 400 && $httpCode < 500 ? $httpCode : 500);
            }
            
        } catch (Exception $e) {
            $this->sendError('Error al obtener cuotas pendientes: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Realizar llamada a API externa
     */
    private function makeApiCall($url, $method = 'GET', $data = null, $returnFullResponse = false) {
        $ch = curl_init();
        
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $this->timeout,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => [
                'Content-Type: application/json',
                'Accept: application/json'
            ]
        ]);
        
        if ($data !== null && ($method === 'POST' || $method === 'PUT')) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data, JSON_UNESCAPED_UNICODE));
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        
        unset($ch);
        
        if ($error) {
            throw new Exception("Error cURL: $error");
        }
        
        // Si se solicita respuesta completa, devolver información detallada
        if ($returnFullResponse) {
            $decoded = [];
            if (!empty($response)) {
                $decoded = json_decode($response, true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    $decoded = ['raw_response' => $response];
                }
            }
            return [
                'httpCode' => $httpCode,
                'response' => $decoded,
                'rawResponse' => $response
            ];
        }
        
        // Comportamiento original: lanzar excepción en errores HTTP
        if ($httpCode < 200 || $httpCode >= 300) {
            throw new Exception("Error HTTP: $httpCode - Response: $response");
        }
        
        if (empty($response)) {
            return [];
        }
        
        $decoded = json_decode($response, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            if ($httpCode === 200 || $httpCode === 201) {
                return [];
            }
            throw new Exception("Error JSON: " . json_last_error_msg());
        }
        
        return $decoded;
    }

    /**
     * Guardar factura IPM en la base de datos
     */
    private function guardarFacturaIPM() {
        try {
            global $companyCode;
            
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (!$data) {
                $this->sendError('Datos JSON inválidos', 400);
                return;
            }
            
            // Validar campos requeridos
            $requiredFields = ['proveedorId', 'prestamoId', 'fecha', 'nCuota', 'facturaId', 'interes'];
            foreach ($requiredFields as $field) {
                if (!isset($data[$field]) || $data[$field] === '' || $data[$field] === null) {
                    $this->sendError("Campo requerido faltante: $field", 400);
                    return;
                }
            }
            
            // Obtener company: del request si viene, sino de la sesión
            $company = !empty($data['company']) ? $data['company'] : $companyCode;
            if (empty($company)) {
                $this->sendError('Campo company es requerido', 400);
                return;
            }
            
            // Preparar datos para la API externa
            $apiData = [
                'id' => 0,
                'proveedorId' => $data['proveedorId'],
                'prestamoId' => $data['prestamoId'],
                'fecha' => $data['fecha'],
                'nCuota' => intval($data['nCuota']),
                'facturaId' => $data['facturaId'],
                'interes' => floatval($data['interes']),
                'paid' => false,
                'valid' => true,
                'company' => $company
            ];
            
            // Llamar al endpoint externo
            $url = $this->baseUrlSap . 'InvoiceMasterIpm/Create';
            
            $fullResponse = $this->makeApiCall($url, 'POST', $apiData, true);
            
            $httpCode = $fullResponse['httpCode'];
            $response = $fullResponse['response'];
            
            // Manejar respuesta
            if ($httpCode === 200 || $httpCode === 201) {
                $this->sendSuccess($response, 'Factura IPM guardada exitosamente');
            } else {
                $errorMessage = $response['message'] ?? "Error HTTP: $httpCode";
                $this->sendError($errorMessage, $httpCode >= 400 && $httpCode < 500 ? $httpCode : 500);
            }
            
        } catch (Exception $e) {
            $this->sendError('Error al guardar factura IPM: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Enviar respuesta de éxito
     */
    private function sendSuccess($data, $message = 'Operación exitosa') {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => $message,
            'data' => $data
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    /**
     * Enviar respuesta de error
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

// Inicializar endpoints
new CuotasPendientesEndpoints();

