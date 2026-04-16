<?php
/**
 * Endpoints de Préstamos - Maestro de Préstamos
 * Versión: 1.0.0
 * 
 * Este archivo maneja las operaciones para el módulo de préstamos
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Configuración de errores
error_reporting(E_ALL);
ini_set('display_errors', 1);

// Configuración de timezone
date_default_timezone_set('America/Tegucigalpa');

/**
 * Clase para manejar endpoints de préstamos
 */
class PrestamosEndpoints {
    
    private $baseUrl = 'http://192.168.10.80:8030/api/';
    private $timeout = 30;
    
    public function __construct() {
        // Validar método HTTP
        $method = $_SERVER['REQUEST_METHOD'];
        $action = $_GET['action'] ?? '';
        
        try {
            switch ($action) {
                case 'getPrestamos':
                    $this->getPrestamos();
                    break;
                case 'getBancos':
                    $this->getBancos();
                    break;
                default:
                    $this->sendError('Acción no válida', 400);
            }
        } catch (Exception $e) {
            $this->sendError('Error interno del servidor: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Obtener lista de préstamos desde API externa
     */
    private function getPrestamos() {
        try {
            $url = $this->baseUrl . 'SAPMaestroPrestamos/GetALl';
            $response = $this->makeApiCall($url);
            
            if ($response['isCorrect']) {
                // Transformar datos al formato esperado por el grid
                $prestamos = [];
                foreach ($response['data'] as $prestamo) {
                    $prestamos[] = [
                        'id' => $prestamo['id'] ?? 0,
                        'prestamoId' => $prestamo['prestamo_id'] ?? '',
                        'proveedor' => $prestamo['n_proveedor'] ?? '',
                        'fechaFactura' => $prestamo['f_invoice'] ?? '',
                        'fechaInicial' => $prestamo['f_inicial'] ?? '',
                        'fechaFinal' => $prestamo['f_final'] ?? '',
                        'tasa' => $prestamo['tasa'] ?? 0,
                        'plazo' => $prestamo['plazo'] ?? 0,
                        'montoNeto' => $prestamo['monto_neto'] ?? 0,
                        // Campos adicionales para el modal de edición rápida
                        'bancoId' => $prestamo['bank_id'] ?? 0,
                        'lineaCreditoId' => $prestamo['creditline_id'] ?? 0,
                        'tipoCuotaId' => $prestamo['cuotatipo_id'] ?? 0,
                        'condicionId' => $prestamo['condicion_id'] ?? 0,
                        'diaPago' => $prestamo['dia_pago'] ?? 0,
                        'mesesGracia' => $prestamo['meses_gracia'] ?? 0,
                        'montoBruto' => $prestamo['monto_bruto'] ?? 0,
                        'comentarios' => $prestamo['commets'] ?? '',
                        'categoriaId' => $prestamo['category_id'] ?? 0,
                        'categoriaTexto' => $prestamo['category_text'] ?? '',
                        'tipoPrestamoId' => $prestamo['prestamo_type_id'] ?? 0,
                        'tipoPrestamoTexto' => $prestamo['prestamo_type_text'] ?? '',
                        'empresa' => $prestamo['company'] ?? '',
                        'facturaId' => $prestamo['factura_id'] ?? '',
                        'cProveedor' => $prestamo['c_proveedor'] ?? '',
                        'fCreacion' => $prestamo['f_creacion'] ?? '',
                        'fModificacion' => $prestamo['f_modificacion'] ?? ''
                    ];
                }
                
                $this->sendSuccess($prestamos, 'Préstamos obtenidos exitosamente');
            } else {
                $this->sendError('Error al obtener préstamos: ' . ($response['message'] ?? 'Error desconocido'), 500);
            }
        } catch (Exception $e) {
            $this->sendError('Error al obtener préstamos: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Obtener lista de bancos desde API externa
     */
    private function getBancos() {
        try {
            $url = $this->baseUrl . 'SAP_Maestro_Bancos/GetAll';
            $response = $this->makeApiCall($url);
            
            if ($response['isCorrect']) {
                // Transformar datos al formato esperado por el combobox
                $bancos = [];
                foreach ($response['data'] as $banco) {
                    $bancos[] = [
                        'id' => $banco['bankID'] ?? 0,
                        'nombre' => $banco['bank_Name'] ?? '',
                        'activo' => $banco['status'] ?? true
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
new PrestamosEndpoints();
?>
