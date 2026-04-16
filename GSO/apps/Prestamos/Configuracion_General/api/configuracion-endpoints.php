<?php
/**
 * Endpoints de Configuración General - Préstamos
 * Versión: 1.0.0
 * 
 * Este archivo maneja todas las operaciones CRUD para:
 * - Bancos
 * - Tipos de Cuota
 * - Líneas de Crédito
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Configuración de timezone
date_default_timezone_set('America/Tegucigalpa');
// Usar configuración segura de sesión (HttpOnly cookies)
if (session_status() === PHP_SESSION_NONE) {
    require_once __DIR__ . '/../../../../Login/session_config.php';
}
require_once __DIR__ . '/../../../../config/api.php';
// Variable global para companyCode
$companyCode = $_SESSION['companyCode'] ?? '';
/**
 * Clase para manejar endpoints de configuración
 */
class ConfiguracionEndpoints {
    
    private $baseUrl;
    private $timeout = 30;
    
    public function __construct() {
        $this->baseUrl = api_base('catalogos_bancos');
        // Validar método HTTP
        $method = $_SERVER['REQUEST_METHOD'];
        $action = $_GET['action'] ?? '';
        
        try {
            switch ($action) {
                case 'getBancos':
                    $this->getBancos();
                    break;
                case 'getTiposCuota':
                    $this->getTiposCuota();
                    break;
                case 'getLineasCredito':
                    $this->getLineasCredito();
                    break;
                case 'createBanco':
                    $this->createBanco();
                    break;
                case 'createTipoCuota':
                    $this->createTipoCuota();
                    break;
                case 'createLineaCredito':
                    $this->createLineaCredito();
                    break;
                case 'updateBanco':
                    $this->updateBanco();
                    break;
                case 'updateLineaCredito':
                    $this->updateLineaCredito();
                    break;
                case 'updateTipoCuota':
                    $this->updateTipoCuota();
                    break;
                case 'getCondiciones':
                    $this->getCondiciones();
                    break;
                case 'createCondicion':
                    $this->createCondicion();
                    break;
                case 'updateCondicion':
                    $this->updateCondicion();
                    break;
                case 'getSapCuentasBancarias':
                    $this->getSapCuentasBancarias();
                    break;
                default:
                    $this->sendError('Acción no válida', 400);
            }
        } catch (Exception $e) {
            $this->sendError('Error interno del servidor: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Obtener lista de bancos desde API externa
     */
    private function getBancos() {
        global $companyCode;
        $url = $this->baseUrl . 'SAP_Maestro_Bancos/GetAll/' . $companyCode;
        
        try {
            $response = $this->makeApiCall($url);
            
            if ($response['isCorrect']) {
                // Transformar datos al formato esperado por el grid
                $bancos = [];
                foreach ($response['data'] as $banco) {
                    $bancos[] = [
                        'id' => isset($banco['bank_id']) ? (int)$banco['bank_id'] : null,
                        'nombre' => isset($banco['bank_name']) ? (string)$banco['bank_name'] : '',
                        'activo' => isset($banco['status']) ? (bool)$banco['status'] : true,
                        'sapBankId' => isset($banco['sap_bank_id']) ? (string)$banco['sap_bank_id'] : ''
                    ];
                }
                
                $this->sendSuccess($bancos, 'Bancos obtenidos exitosamente');
            } else {
                $this->sendError('Error al obtener bancos: ' . ($response['message'] ?? 'Error desconocido'), 500);
            }
        } catch (Exception $e) {
            $this->sendError('Error al obtener bancos: ' . $e->getMessage(), 500);
        }
    }
    
         /**
      * Obtener tipos de cuota desde la API
      */
     private function getTiposCuota() {
         try {
             global $companyCode;
             $url = $this->baseUrl . 'Maestro_Cuota_Tipos/GetAll/' . $companyCode;
             $response = $this->makeApiCall($url);
             
             if ($response['isCorrect']) {
                 // Transformar datos al formato esperado por el grid
                 $tiposCuota = [];
                 foreach ($response['data'] as $item) {
                     $tiposCuota[] = [
                         'id' => isset($item['id']) ? (int)$item['id'] : 0,
                         'nombre' => isset($item['description']) ? (string)$item['description'] : '',
                         'activo' => isset($item['status']) ? (bool)$item['status'] : true
                     ];
                 }
                 
                 $this->sendSuccess($tiposCuota, 'Tipos de cuota obtenidos exitosamente');
             } else {
                 $this->sendError('Error al obtener tipos de cuota: ' . ($response['message'] ?? 'Error desconocido'), 500);
             }
         } catch (Exception $e) {
             $this->sendError('Error al obtener tipos de cuota: ' . $e->getMessage(), 500);
         }
     }
  
         /**
      * Obtener líneas de crédito desde API externa
      */
     private function getLineasCredito() {
         global $companyCode;
        $url = $this->baseUrl . 'Maestro_Lineas_Credito/GetAll/' . $companyCode;
         
         try {
             $response = $this->makeApiCall($url);
             
             if ($response['isCorrect']) {
                 // Transformar datos al formato esperado por el grid
                 $lineasCredito = [];
                 foreach ($response['data'] as $linea) {
                     $lineasCredito[] = [
                        'id' => $linea['id'] ?? null,
                        'nombre' => $linea['line_description'] ?? '',
                        'bancoId' => $linea['bank_id'] ?? null,
                        'bancoNombre' => $linea['bank_name'] ?? '',
                        'credito' => $linea['credito'] ?? 0,
                        // Usar status de la API si viene, por defecto true
                        'activo' => isset($linea['status']) ? (bool)$linea['status'] : true
                     ];
                 }
                 
                 $this->sendSuccess($lineasCredito, 'Líneas de crédito obtenidas exitosamente');
             } else {
                 $this->sendError('Error al obtener líneas de crédito: ' . ($response['message'] ?? 'Error desconocido'), 500);
             }
         } catch (Exception $e) {
             $this->sendError('Error al obtener líneas de crédito: ' . $e->getMessage(), 500);
         }
     }
    
    /**
     * Crear nuevo banco
     */
    private function createBanco() {
        global $companyCode;
        $data = $this->getRequestData();
        
        // Validar datos requeridos
        if (empty($data['nombre'])) {
            $this->sendError('El nombre del banco es requerido', 400);
            return;
        }
        
        // Preparar datos para la API externa
        $bancoData = [
            'company_id' => (int)$companyCode,
            'bank_name' => (string)$data['nombre'],
            'sap_bank_id' => isset($data['sapBankId']) ? (string)$data['sapBankId'] : '',
            'status' => isset($data['activo']) ? (bool)$data['activo'] : true
        ];
        
        try {
            $url = $this->baseUrl . 'SAP_Maestro_Bancos/AddBank';
            $response = $this->makeApiCall($url, 'POST', $bancoData);
            
            if ($response['isCorrect']) {
                $this->sendSuccess($response['data'], 'Banco creado exitosamente');
            } else {
                $this->sendError('Error al crear banco: ' . ($response['message'] ?? 'Error desconocido'), 500);
            }
        } catch (Exception $e) {
            $this->sendError('Error al crear banco: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Crear tipo de cuota
     */
    private function createTipoCuota() {
        global $companyCode;
        
        // Validar companyCode primero
        if (empty($companyCode)) {
            $this->sendError('Error: companyCode no está definido en la sesión', 400);
            return;
        }
        
        $data = $this->getRequestData();
        
        // Validar que los datos se recibieron correctamente
        if (!is_array($data) || empty($data)) {
            $rawInput = file_get_contents('php://input');
            $this->sendError('Error: Datos no válidos recibidos. Raw input: ' . $rawInput . ' | Decoded: ' . json_encode($data), 400);
            return;
        }
        
        // Validar nombre (usar trim para eliminar espacios en blanco)
        $nombre = isset($data['nombre']) ? trim($data['nombre']) : '';
        if (empty($nombre)) {
            $this->sendError('El nombre del tipo de cuota es requerido. Datos recibidos: ' . json_encode($data), 400);
            return;
        }
        
        // Preparar datos para la API externa
        $tipoCuotaData = [
            'company_id' => (int)$companyCode,
            'description' => (string)$nombre,
            'status' => isset($data['activo']) ? (bool)$data['activo'] : true
        ];
        
        try {
            $url = $this->baseUrl . 'Maestro_Cuota_Tipos/Add';
            $response = $this->makeApiCall($url, 'POST', $tipoCuotaData);
            
            if ($response['isCorrect']) {
                $this->sendSuccess($response['data'], 'Tipo de cuota creado exitosamente');
            } else {
                $this->sendError('Error al crear tipo de cuota: ' . ($response['message'] ?? 'Error desconocido'), 500);
            }
        } catch (Exception $e) {
            $this->sendError('Error al crear tipo de cuota: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Crear línea de crédito
     */
    private function createLineaCredito() {
        global $companyCode;
        $data = $this->getRequestData();
        
        if (empty($data['nombre'])) {
            $this->sendError('El nombre de la línea de crédito es requerido', 400);
            return;
        }
        
        // Preparar datos para la API externa
        $lineaCreditoData = [
            'company_id' => (int)$companyCode,
            'line_description' => $data['nombre'],
            'bank_id' => (int)($data['bancoId'] ?? 0),
            'credito' => (float)($data['credito'] ?? 0)
        ];
        
        try {
            $url = $this->baseUrl . 'Maestro_Lineas_Credito/Add';
            $response = $this->makeApiCall($url, 'POST', $lineaCreditoData);
            
            if ($response['isCorrect']) {
                $this->sendSuccess($response['data'], 'Línea de crédito creada exitosamente');
            } else {
                $this->sendError('Error al crear línea de crédito: ' . ($response['message'] ?? 'Error desconocido'), 500);
            }
        } catch (Exception $e) {
            $this->sendError('Error al crear línea de crédito: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Actualizar banco
     */
    private function updateBanco() {
        global $companyCode;
        $data = $this->getRequestData();
        
        if (empty($data['id'])) {
            $this->sendError('El ID del banco es requerido', 400);
            return;
        }
        
        if (empty($data['nombre'])) {
            $this->sendError('El nombre del banco es requerido', 400);
            return;
        }
        
        // Preparar datos para la API externa
        $bancoData = [
            'bank_name' => (string)$data['nombre'],
            'sap_bank_id' => isset($data['sapBankId']) ? (string)$data['sapBankId'] : '',
            'status' => isset($data['activo']) ? (bool)$data['activo'] : true
        ];
        
        try {
            $url = $this->baseUrl . 'SAP_Maestro_Bancos/UpdateBank/' . $data['id'] . '/' . $companyCode;
            $response = $this->makeApiCall($url, 'PUT', $bancoData);
            
            if ($response['isCorrect']) {
                $this->sendSuccess($response['data'], 'Banco actualizado exitosamente');
            } else {
                $this->sendError('Error al actualizar banco: ' . ($response['message'] ?? 'Error desconocido'), 500);
            }
        } catch (Exception $e) {
            $this->sendError('Error al actualizar banco: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Actualizar línea de crédito
     */
    private function updateLineaCredito() {
        global $companyCode;
        $data = $this->getRequestData();
        
        if (empty($data['id'])) {
            $this->sendError('El ID de la línea de crédito es requerido', 400);
            return;
        }
        
        if (empty($data['nombre'])) {
            $this->sendError('El nombre de la línea de crédito es requerido', 400);
            return;
        }
        
        // Preparar datos para la API externa
        $lineaCreditoData = [
            'line_description' => $data['nombre'],
            'bank_id' => (int)($data['bancoId'] ?? 0),
            'credito' => (float)($data['credito'] ?? 0),
            'status' => isset($data['activo']) ? (bool)$data['activo'] : true
        ];
        
        try {
            // Endpoint recibe id y company como parámetros de ruta
            $url = $this->baseUrl . 'Maestro_Lineas_Credito/Update/' . $data['id'] . '/' . $companyCode;
            $response = $this->makeApiCall($url, 'PUT', $lineaCreditoData);
            
            if ($response['isCorrect']) {
                $this->sendSuccess($response['data'], 'Línea de crédito actualizada exitosamente');
            } else {
                $this->sendError('Error al actualizar línea de crédito: ' . ($response['message'] ?? 'Error desconocido'), 500);
            }
        } catch (Exception $e) {
            $this->sendError('Error al actualizar línea de crédito: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Actualizar tipo de cuota
     */
    private function updateTipoCuota() {
        global $companyCode;
        $data = $this->getRequestData();
        
        if (empty($data['id'])) {
            $this->sendError('El ID del tipo de cuota es requerido', 400);
            return;
        }
        
        if (empty($data['nombre'])) {
            $this->sendError('El nombre del tipo de cuota es requerido', 400);
            return;
        }
        
        // Preparar datos para la API externa
        $tipoCuotaData = [
            'description' => (string)$data['nombre'],
            'status' => isset($data['activo']) ? (bool)$data['activo'] : true
        ];
        
        try {
            // Endpoint recibe id y company como parámetros de ruta
            $url = $this->baseUrl . 'Maestro_Cuota_Tipos/Update/' . $data['id'] . '/' . $companyCode;
            $response = $this->makeApiCall($url, 'PUT', $tipoCuotaData);
            
            if ($response['isCorrect']) {
                $this->sendSuccess($response['data'], 'Tipo de cuota actualizado exitosamente');
            } else {
                $this->sendError('Error al actualizar tipo de cuota: ' . ($response['message'] ?? 'Error desconocido'), 500);
            }
        } catch (Exception $e) {
            $this->sendError('Error al actualizar tipo de cuota: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Obtener condiciones desde la API
     */
    private function getCondiciones() {
        try {
            global $companyCode;
            $url = $this->baseUrl . 'Condiciones/GetAll/' . $companyCode;
            $response = $this->makeApiCall($url);
            
            if ($response['isCorrect']) {
                // Transformar datos al formato esperado por el grid
                $condiciones = [];
                foreach ($response['data'] as $item) {
                    $condiciones[] = [
                        'id' => isset($item['id']) ? (int)$item['id'] : 0,
                        'nombre' => isset($item['descripcion']) ? (string)$item['descripcion'] : '',
                        'activo' => isset($item['status']) ? (bool)$item['status'] : true
                    ];
                }
                
                $this->sendSuccess($condiciones, 'Condiciones obtenidas exitosamente');
            } else {
                $this->sendError('Error al obtener condiciones: ' . ($response['message'] ?? 'Error desconocido'), 500);
            }
        } catch (Exception $e) {
            $this->sendError('Error al obtener condiciones: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Crear nueva condición
     */
    private function createCondicion() {
        global $companyCode;
        $data = $this->getRequestData();
        
        if (empty($data['nombre'])) {
            $this->sendError('La descripción de la condición es requerida', 400);
            return;
        }
        
        // Preparar datos para la API externa
        $condicionData = [
            'company_id' => (int)$companyCode,
            'descripcion' => (string)$data['nombre'],
            'status' => isset($data['activo']) ? (bool)$data['activo'] : true
        ];
        
        try {
            $url = $this->baseUrl . 'Condiciones/Add';
            $response = $this->makeApiCall($url, 'POST', $condicionData);
            
            if ($response['isCorrect']) {
                $this->sendSuccess($response['data'], 'Condición creada exitosamente');
            } else {
                $this->sendError('Error al crear condición: ' . ($response['message'] ?? 'Error desconocido'), 500);
            }
        } catch (Exception $e) {
            $this->sendError('Error al crear condición: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Actualizar condición
     */
    private function updateCondicion() {
        global $companyCode;
        $data = $this->getRequestData();
        
        if (empty($data['id'])) {
            $this->sendError('El ID de la condición es requerido', 400);
            return;
        }
        
        if (empty($data['nombre'])) {
            $this->sendError('La descripción de la condición es requerida', 400);
            return;
        }
        
        // Preparar datos para la API externa
        $condicionData = [
            'descripcion' => (string)$data['nombre'],
            'status' => isset($data['activo']) ? (bool)$data['activo'] : true
        ];
        
        try {
            // Endpoint recibe id y company como parámetros de ruta
            $url = $this->baseUrl . 'Condiciones/Update/' . $data['id'] . '/' . $companyCode;
            $response = $this->makeApiCall($url, 'PUT', $condicionData);
            
            if ($response['isCorrect']) {
                $this->sendSuccess($response['data'], 'Condición actualizada exitosamente');
            } else {
                $this->sendError('Error al actualizar condición: ' . ($response['message'] ?? 'Error desconocido'), 500);
            }
        } catch (Exception $e) {
            $this->sendError('Error al actualizar condición: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Obtener cuentas bancarias SAP
     */
    private function getSapCuentasBancarias() {
        try {
            $url = $this->baseUrl . 'SapMaestroCuentasBancarias/GetCuentasXOdata';
            $response = $this->makeApiCall($url);
            
            if ($response['isCorrect']) {
                // Transformar datos: solo usar internalID como value y text
                $cuentas = [];
                foreach ($response['data'] as $item) {
                    if (isset($item['internalID'])) {
                        $cuentas[] = [
                            'value' => (string)$item['internalID'],
                            'text' => (string)$item['internalID']
                        ];
                    }
                }
                
                $this->sendSuccess($cuentas, 'Cuentas bancarias SAP obtenidas exitosamente');
            } else {
                $this->sendError('Error al obtener cuentas bancarias SAP: ' . ($response['message'] ?? 'Error desconocido'), 500);
            }
        } catch (Exception $e) {
            $this->sendError('Error al obtener cuentas bancarias SAP: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Obtener datos de la petición
     */
    private function getRequestData() {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            // Si no es JSON, intentar con POST
            $data = $_POST;
        }
        
        return $data ?: [];
    }

    /**
     * Realizar llamada a API externa
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
        
        if ($method === 'POST' && $data) {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        } elseif ($method === 'PUT' && $data) {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        
        curl_close($ch);
        
        if ($error) {
            throw new Exception('Error de conexión: ' . $error);
        }
        
        if ($httpCode !== 200) {
            throw new Exception('Error HTTP: ' . $httpCode . ' - Response: ' . $response);
        }
        
        $decoded = json_decode($response, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new Exception('Error al decodificar JSON: ' . json_last_error_msg());
        }
        
        return $decoded;
    }
    

    
    /**
     * Enviar respuesta de éxito
     */
    private function sendSuccess($data, $message = 'Operación exitosa') {
        echo json_encode([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'timestamp' => date('Y-m-d H:i:s')
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

// Inicializar la clase
new ConfiguracionEndpoints();
?>
