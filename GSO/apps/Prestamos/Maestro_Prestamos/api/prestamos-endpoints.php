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
 * Clase para manejar endpoints de préstamos
 */
class PrestamosEndpoints {
    
    // URLs base de las APIs (se asignan desde GSO/config/api.php)
    private $baseUrlSapPrestamos;
    private $baseUrlAmortizacion;
    private $baseUrlProceso;
    private $timeout = 30;
    
    public function __construct() {
        $this->baseUrlSapPrestamos = api_base('prestamos_sap');
        $this->baseUrlAmortizacion = api_base('amortizacion');
        $this->baseUrlProceso = api_base('proceso_manual');
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
                case 'ejecutarProceso':
                    $this->ejecutarProceso();
                    break;
                case 'updatePrestamo':
                    $this->updatePrestamo();
                    break;
                case 'calcularAmortizacion':
                    $this->calcularAmortizacion();
                    break;
                case 'obtenerAmortizacion':
                    $this->obtenerAmortizacion();
                    break;
                case 'uploadAmortizacion':
                    $this->uploadAmortizacion();
                    break;
                case 'verificarPrestamo':
                    $this->verificarPrestamo();
                    break;
                case 'validarPrestamoVerificado':
                    $this->validarPrestamoVerificado();
                    break;
                case 'getCatalogos':
                    $this->getCatalogos();
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
            global $companyCode;
            $url = $this->baseUrlSapPrestamos . 'SAPMaestroPrestamos/GetALl?company_id=' . $companyCode;
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
                        'diasDesembolso' => $prestamo['dias_de_desembolso'] ?? 0,
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
                        'fModificacion' => $prestamo['f_modificacion'] ?? '',
                        // Nuevos campos del JSON actualizado
                        'verified' => $prestamo['verified'] ?? false,
                        'idCuenta' => $prestamo['id_cuenta'] ?? '',
                        'banco' => $prestamo['banco'] ?? '',
                        'codigo' => $prestamo['codigo'] ?? '',
                        // Campos de descripción para comboboxes
                        'bancoName' => $prestamo['banco_name'] ?? '',
                        'lineaCreditoDescription' => $prestamo['liniea_credito_desciption'] ?? '',
                        'cuotaName' => $prestamo['cuata_name'] ?? '',
                        'condicionName' => $prestamo['condicion_name'] ?? '',
                        // Campos bancarios del proveedor (solo lectura)
                        'codeBankProveedor' => $prestamo['code_bank_proveedor'] ?? '',
                        'nameBankProveedor' => $prestamo['name_bank_proveedor'] ?? '',
                        'numberBankAccount' => $prestamo['number_bank_acount'] ?? '',
                        'sapBankId' => $prestamo['sap_bank_id'] ?? '',
                        // Método de redondeo
                        'metodoRedondeo' => $prestamo['metodo_redondeo'] ?? 100
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
            global $companyCode;
            $url = $this->baseUrlSapPrestamos . 'SAP_Maestro_Bancos/GetAll/' . $companyCode;
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
     * Ejecutar proceso de obtención de préstamos
     * Endpoint: POST /api/loans/execute
     * Documentación: Ejecuta el job manual fetch-sap-loans-manual de forma síncrona
     */
    private function ejecutarProceso() {
        try {
            $url = $this->baseUrlProceso . 'loans/execute';
            
            $ch = curl_init();
            curl_setopt_array($ch, [
                CURLOPT_URL => $url,
                CURLOPT_RETURNTRANSFER => true,
                CURLOPT_TIMEOUT => 300, // 5 minutos como máximo según documentación
                CURLOPT_CONNECTTIMEOUT => 10, // Timeout de conexión
                CURLOPT_POST => true,
                CURLOPT_POSTFIELDS => json_encode([]), // Body vacío pero necesario para POST
                CURLOPT_HTTPHEADER => [
                    'Content-Type: application/json',
                    'Accept: application/json'
                ]
            ]);
            
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            unset($ch);
            
            if ($error) {
                throw new Exception('Error de conexión: ' . $error);
            }
            
            // Verificar que haya respuesta
            if ($response === false || empty($response)) {
                throw new Exception('No se recibió respuesta del servidor. HTTP Code: ' . $httpCode);
            }
            
            // Decodificar respuesta JSON
            $decoded = json_decode($response, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                // Loggear la respuesta cruda para debugging
                throw new Exception('Error al decodificar JSON: ' . json_last_error_msg() . ' - HTTP Code: ' . $httpCode . ' - Respuesta: ' . substr($response, 0, 500));
            }
            
            // Manejar diferentes códigos HTTP según documentación
            switch ($httpCode) {
                case 200:
                    // Job ejecutado exitosamente
                    if (isset($decoded['success']) && $decoded['success'] === true) {
                        // Construir mensaje con información detallada del resultado
                        $message = 'Proceso ejecutado exitosamente';
                        
                        // IMPORTANTE: El resultado está en $decoded['result']['result']
                        // NO existe el campo 'saved', solo 'processed', 'updated', 'inserted'
                        if (isset($decoded['result']['result']) && is_array($decoded['result']['result'])) {
                            $result = $decoded['result']['result'];
                            $processed = $result['processed'] ?? 0;
                            $inserted = $result['inserted'] ?? 0;
                            $updated = $result['updated'] ?? 0;
                            
                            if ($processed > 0) {
                                $message = sprintf(
                                    'Job completado: %d préstamos procesados (%d insertados, %d actualizados)',
                                    $processed,
                                    $inserted,
                                    $updated
                                );
                            } else {
                                $message = $result['message'] ?? 'Job completado sin préstamos para procesar';
                            }
                        }
                        
                        $this->sendSuccess($decoded, $message);
                    } else {
                        $errorMsg = $decoded['error'] ?? $decoded['message'] ?? 'Error desconocido';
                        $this->sendError('Error al ejecutar el proceso: ' . $errorMsg, 500);
                    }
                    break;
                    
                case 400:
                    // Bad Request - Job no válido o desactivado
                    $errorMsg = $decoded['error'] ?? $decoded['message'] ?? 'Job no válido o desactivado';
                    $this->sendError('Error al ejecutar el proceso: ' . $errorMsg, 400);
                    break;
                    
                case 404:
                    // Not Found - Job no encontrado
                    $errorMsg = $decoded['error'] ?? $decoded['message'] ?? 'Job no encontrado';
                    $this->sendError('Error al ejecutar el proceso: ' . $errorMsg, 404);
                    break;
                    
                case 500:
                    // Internal Server Error - Job falló durante ejecución
                    $errorMsg = $decoded['error'] ?? $decoded['message'] ?? 'El job falló durante la ejecución';
                    $this->sendError('Error al ejecutar el proceso: ' . $errorMsg, 500);
                    break;
                    
                case 504:
                    // Gateway Timeout - Job timeout después de 5 minutos
                    $errorMsg = $decoded['error'] ?? $decoded['message'] ?? 'Job timeout después de 5 minutos';
                    $this->sendError('Error al ejecutar el proceso: ' . $errorMsg, 504);
                    break;
                    
                default:
                    // Otros códigos HTTP
                    $errorMsg = $decoded['error'] ?? $decoded['message'] ?? 'Error desconocido';
                    $this->sendError('Error al ejecutar el proceso (HTTP ' . $httpCode . '): ' . $errorMsg, $httpCode);
            }
        } catch (Exception $e) {
            $this->sendError('Error al ejecutar proceso: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Actualizar préstamo
     */
    private function updatePrestamo() {
        try {
            global $companyCode;
            
            // Obtener datos del POST
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (!$data) {
                $this->sendError('Datos JSON inválidos', 400);
                return;
            }
            
            // Validar que se proporcione el prestamo_id
            if (!isset($data['prestamo_id']) || empty($data['prestamo_id'])) {
                $this->sendError('prestamo_id es requerido', 400);
                return;
            }
            
            $prestamoId = $data['prestamo_id'];
            
            // Preparar datos para la API externa
            $apiData = [
                'tasa' => $data['tasa'] ?? 0,
                'dia_pago' => $data['dia_pago'] ?? 0,
                'meses_gracia' => $data['meses_gracia'] ?? 0,
                'plazo' => $data['plazo'] ?? 0,
                'commets' => $data['commets'] ?? '',
                'bank_id' => $data['bank_id'] ?? 0,
                'creditline_id' => $data['creditline_id'] ?? 0,
                'cuotatipo_id' => $data['cuotatipo_id'] ?? 0,
                'condicion_id' => $data['condicion_id'] ?? 0,
                'dias_de_desembolso' => $data['dias_de_desembolso'] ?? 0,
                'metodo_redondeo' => $data['metodo_redondeo'] ?? 100
            ];
            
            // URL del endpoint externo con prestamo_id y company_id
            $url = $this->baseUrlSapPrestamos . "SAPMaestroPrestamos/Update?prestamo_id={$prestamoId}&company_id={$companyCode}";
            
            // Realizar llamada PUT a la API externa
            $response = $this->makeApiCall($url, 'PUT', $apiData);
            
            // La API externa solo devuelve status 200, sin JSON de respuesta
            // Si llegamos aquí sin excepción, la operación fue exitosa
            $this->sendSuccess(['message' => 'Préstamo actualizado exitosamente'], 'Préstamo actualizado exitosamente');
        } catch (Exception $e) {
            $this->sendError('Error al actualizar préstamo: ' . $e->getMessage(), 500);
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
        
        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
            if (!empty($data)) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            }
        } elseif ($method === 'PUT') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
            if (!empty($data)) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
            }
        }
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        
        unset($ch);
        
        if ($error) {
            throw new Exception('Error de conexión: ' . $error);
        }
        
        if ($httpCode !== 200) {
            throw new Exception('Error HTTP: ' . $httpCode . ' - Response: ' . $response);
        }
        
        // Si la respuesta está vacía, devolver un array vacío
        if (empty($response)) {
            return [];
        }
        
        $decoded = json_decode($response, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            // Si no se puede decodificar JSON pero el HTTP code es 200, devolver array vacío
            if ($httpCode === 200) {
                return [];
            }
            throw new Exception('Error al decodificar JSON: ' . json_last_error_msg());
        }
        
        return $decoded;
    }

    /**
     * Realizar llamada a API externa con archivo (multipart/form-data)
     */
    private function makeApiCallWithFile($url, $postData) {
        $ch = curl_init();
        
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 60, // Timeout más largo para archivos
            CURLOPT_POST => true,
            CURLOPT_POSTFIELDS => $postData,
            CURLOPT_HTTPHEADER => [
                'Accept: application/json'
                // No especificar Content-Type, cURL lo establece automáticamente para multipart/form-data
            ]
        ]);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        
        unset($ch);
        
        if ($error) {
            throw new Exception('Error de conexión al subir archivo: ' . $error);
        }
        
        if ($httpCode !== 200 && $httpCode !== 201) {
            throw new Exception('Error HTTP al subir archivo: ' . $httpCode . ' - Response: ' . $response);
        }
        
        // Si la respuesta está vacía, devolver un array de éxito
        if (empty($response)) {
            return ['success' => true, 'message' => 'Archivo subido exitosamente'];
        }
        
        $decoded = json_decode($response, true);
        
        if (json_last_error() !== JSON_ERROR_NONE) {
            // Si no se puede decodificar JSON pero el HTTP code es 200/201, devolver éxito
            if ($httpCode === 200 || $httpCode === 201) {
                return ['success' => true, 'message' => 'Archivo subido exitosamente'];
            }
            throw new Exception('Error al decodificar JSON de respuesta: ' . json_last_error_msg());
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
     * Calcular amortización de préstamo
     */
    private function calcularAmortizacion() {
        try {
            global $companyCode;
            
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (!$data) {
                $this->sendError('Datos JSON inválidos', 400);
                return;
            }
            
            // Si company no viene en los datos o está vacío, usar el de la sesión
            if (empty($data['company'])) {
                $data['company'] = $companyCode;
            }
            
            // Validar datos requeridos (incluyendo startDate y endDate)
            $requiredFields = ['loanNumber', 'principal', 'interestRate', 'totalPeriods', 'startDate', 'endDate', 'company'];
            foreach ($requiredFields as $field) {
                if (!isset($data[$field]) || $data[$field] === '' || $data[$field] === null) {
                    $this->sendError("Campo requerido faltante o vacío: $field", 400);
                    return;
                }
            }
            
            // Asegurar que los campos opcionales tengan valores por defecto
            $data['gracePeriod'] = $data['gracePeriod'] ?? 0;
            $data['paymentType'] = $data['paymentType'] ?? 1;
            $data['days'] = $data['days'] ?? 0;
            $data['disbursementDays'] = $data['disbursementDays'] ?? 0;
            $data['roundingModeCode'] = $data['roundingModeCode'] ?? 100;
            
            $url = $this->baseUrlAmortizacion . 'loans/amortization';
            $response = $this->makeApiCall($url, 'POST', $data);
            
            $this->sendSuccess($response, 'Amortización calculada exitosamente');
            
        } catch (Exception $e) {
            $this->sendError('Error al calcular amortización: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Obtener amortización de préstamo
     */
    private function obtenerAmortizacion() {
        try {
            global $companyCode;
            $loanNumber = $_GET['loanNumber'] ?? '';
            
            if (empty($loanNumber)) {
                $this->sendError('Número de préstamo requerido', 400);
                return;
            }
            
            $url = $this->baseUrlAmortizacion . "loans/amortization/{$loanNumber}/all?company={$companyCode}";
            $response = $this->makeApiCall($url, 'GET');
            
            // La API externa ya devuelve la estructura completa con success, paidInstallments, etc.
            // No necesitamos envolverla nuevamente, solo retornar tal cual
            echo json_encode($response, JSON_UNESCAPED_UNICODE);
            exit;
            
        } catch (Exception $e) {
            $this->sendError('Error al obtener amortización: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Subir amortización desde archivo Excel/CSV
     */
    private function uploadAmortizacion() {
        try {
            // Validar que se haya recibido el archivo
            if (!isset($_FILES['file'])) {
                $this->sendError('No se recibió archivo', 400);
                return;
            }
            
            // Validar que se haya recibido el prestamo_id
            if (!isset($_POST['prestamo_id']) || empty($_POST['prestamo_id'])) {
                $this->sendError('prestamo_id es requerido', 400);
                return;
            }
            
            $prestamoId = $_POST['prestamo_id'];
            global $companyCode;
            $file = $_FILES['file'];
            
            // Validar extensión del archivo
            $allowedExtensions = ['csv', 'xlsx', 'xls'];
            $fileExtension = strtolower(pathinfo($file['name'], PATHINFO_EXTENSION));
            
            if (!in_array($fileExtension, $allowedExtensions)) {
                $this->sendError('Formato de archivo no válido. Solo se permiten: CSV, XLSX, XLS', 400);
                return;
            }
            
            // Validar que el archivo no tenga errores
            if ($file['error'] !== UPLOAD_ERR_OK) {
                $this->sendError('Error al subir el archivo', 500);
                return;
            }
            
            // Preparar el archivo para enviar a la API externa usando cURL con multipart/form-data
            $url = $this->baseUrlAmortizacion . 'loans/amortization/upload';
            
            // Crear CURLFile para el archivo
            $cfile = new CURLFile($file['tmp_name'], $file['type'], $file['name']);
            
            // Preparar datos del formulario
            // Nota: La API externa espera el campo como 'excelFile' según documentación
            $postData = [
                'excelFile' => $cfile,  // Nombre correcto según documentación
                'loanNumber' => $prestamoId,
                'company' => $companyCode
            ];
            
            // Realizar llamada a la API externa con multipart/form-data
            $response = $this->makeApiCallWithFile($url, $postData);
            
            $this->sendSuccess($response, 'Amortización cargada exitosamente desde Excel');
            
        } catch (Exception $e) {
            $this->sendError('Error al cargar amortización: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Verificar/Desverificar préstamo
     */
    private function verificarPrestamo() {
        try {
            global $companyCode;
            
            // Obtener prestamo_id y verified desde POST o GET
            $prestamoId = $_POST['prestamo_id'] ?? $_GET['prestamo_id'] ?? null;
            $verified = $_POST['verified'] ?? $_GET['verified'] ?? 'true'; // Por defecto true
            
            // Convertir string "true"/"false" a boolean
            $verifiedBool = filter_var($verified, FILTER_VALIDATE_BOOLEAN);
            
            if (!$prestamoId) {
                $this->sendError('prestamo_id es requerido', 400);
                return;
            }
            
            if (!$companyCode) {
                $this->sendError('company_id es requerido', 400);
                return;
            }
            
            // URL del endpoint externo con prestamo_id y company_id
            $url = $this->baseUrlSapPrestamos . "SAPMaestroPrestamos/UpdateVerified?prestamo_id={$prestamoId}&company_id={$companyCode}";
            
            // Preparar body con {"verified": true/false} según documentación de Swagger
            $bodyData = ['verified' => $verifiedBool];
            
            // Realizar llamada PUT a la API externa
            $response = $this->makeApiCall($url, 'PUT', $bodyData);
            
            // La API responde con HTTP 200 y body vacío (content-length: 0) cuando es exitoso
            // Si llegamos aquí sin excepción, la operación fue exitosa
            $mensaje = $verifiedBool ? 'Préstamo verificado exitosamente' : 'Préstamo desverificado exitosamente';
            $this->sendSuccess(['verified' => $verifiedBool], $mensaje);
            
        } catch (Exception $e) {
            $this->sendError('Error al verificar/desverificar préstamo: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Obtener catálogos desde API externa
     */
    private function getCatalogos() {
        try {
            global $companyCode;
            $url = $this->baseUrlSapPrestamos . 'CatalogoCredito/GetAll/' . $companyCode;
            $response = $this->makeApiCall($url);
            
            if ($response['isCorrect']) {
                $this->sendSuccess($response['data'], 'Catálogos obtenidos exitosamente');
            } else {
                $this->sendError('Error al obtener catálogos: ' . ($response['message'] ?? 'Error desconocido'), 500);
            }
        } catch (Exception $e) {
            $this->sendError('Error al obtener catálogos: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Validar si un préstamo está verificado consultando la API externa
     */
    private function validarPrestamoVerificado() {
        try {
            global $companyCode;
            
            $prestamoId = $_GET['prestamo_id'] ?? $_POST['prestamo_id'] ?? null;
            
            if (!$prestamoId) {
                $this->sendError('prestamo_id es requerido', 400);
                return;
            }
            
            if (!$companyCode) {
                $this->sendError('company_id no disponible en sesión', 400);
                return;
            }

            // Endpoint especializado para validar verificación del préstamo
            $url = $this->baseUrlSapPrestamos . 'SAPMaestroPrestamos/GetPrestamoVerified'
                . '?company_id=' . urlencode($companyCode)
                . '&prestamo_id=' . urlencode($prestamoId);

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

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            $error = curl_error($ch);
            unset($ch);

            if ($error) {
                throw new Exception('Error de conexión: ' . $error);
            }

            // Si no hay respuesta, tratamos como no verificado
            if (empty($response)) {
                $this->sendSuccess(
                    [
                        'prestamo_id' => $prestamoId,
                        'verified' => false
                    ],
                    'Sin respuesta de la API, se asume no verificado'
                );
                return;
            }

            $decoded = json_decode($response, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                throw new Exception('Error al decodificar JSON: ' . json_last_error_msg());
            }

            // Manejo explícito de 200 y 404 según contrato del endpoint externo
            if ($httpCode === 200 && isset($decoded['isCorrect']) && $decoded['isCorrect'] === true) {
                $verified = $decoded['data']['verified'] ?? false;

                $this->sendSuccess(
                    [
                        'prestamo_id' => $prestamoId,
                        'verified' => (bool)$verified
                    ],
                    'Estado de verificación obtenido exitosamente'
                );
                return;
            }

            if ($httpCode === 404) {
                // El servicio devuelve 404 + isCorrect=false cuando no encuentra el préstamo
                $this->sendSuccess(
                    [
                        'prestamo_id' => $prestamoId,
                        'verified' => false
                    ],
                    $decoded['message'] ?? 'Préstamo no encontrado.'
                );
                return;
            }

            // Cualquier otro código lo tratamos como error real
            $message = $decoded['message'] ?? 'Error desconocido al validar préstamo';
            $this->sendError(
                "Error al validar estado de préstamo (HTTP {$httpCode}): " . $message,
                500
            );
        } catch (Exception $e) {
            $this->sendError('Error al validar estado de préstamo: ' . $e->getMessage(), 500);
        }
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
