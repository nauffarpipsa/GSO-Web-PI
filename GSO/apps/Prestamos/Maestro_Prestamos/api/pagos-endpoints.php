<?php
/**
 * Endpoints de Pagos - Maestro de Préstamos
 * Versión: 1.0.0
 * 
 * Este archivo maneja las operaciones de pagos para el módulo de préstamos
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
 * Clase para manejar endpoints de pagos
 */
class PagosEndpoints {
    
    // URLs base de las APIs (se asignan desde GSO/config/api.php)
    private $baseUrlSapPagos;
    private $baseUrlAmortizacion;
    private $timeout = 200; // Timeout aumentado a 200 segundos para operaciones que pueden tardar más (crear facturas, pagos)
    
    public function __construct() {
        $this->baseUrlSapPagos = api_base('pagos_sap');
        $this->baseUrlAmortizacion = api_base('amortizacion');
        // Validar método HTTP
        $method = $_SERVER['REQUEST_METHOD'];
        $action = $_GET['action'] ?? '';
        
        try {
            switch ($action) {
                case 'crearFacturaInteres':
                    if ($method !== 'POST') {
                        $this->sendError('Método no permitido', 405);
                        return;
                    }
                    $this->crearFacturaInteres();
                    break;
                case 'crearFacturaInteresNoProvisionado':
                    if ($method !== 'POST') {
                        $this->sendError('Método no permitido', 405);
                        return;
                    }
                    $this->crearFacturaInteresNoProvisionado();
                    break;
                case 'crearPago':
                    if ($method !== 'POST') {
                        $this->sendError('Método no permitido', 405);
                        return;
                    }
                    $this->crearPago();
                    break;
                case 'guardarPagoDB':
                    if ($method !== 'POST') {
                        $this->sendError('Método no permitido', 405);
                        return;
                    }
                    $this->guardarPagoDB();
                    break;
                case 'marcarCuotaPagada':
                    if ($method !== 'POST') {
                        $this->sendError('Método no permitido', 405);
                        return;
                    }
                    $this->marcarCuotaPagada();
                    break;
                case 'actualizarPagoFallido':
                    if ($method !== 'PUT' && $method !== 'POST') { // Permitir POST también por compatibilidad
                        $this->sendError('Método no permitido', 405);
                        return;
                    }
                    $this->actualizarPagoFallido();
                    break;
                case 'obtenerFacturaIPM':
                    if ($method !== 'GET') {
                        $this->sendError('Método no permitido', 405);
                        return;
                    }
                    $this->obtenerFacturaIPM();
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
     * Crear factura por interés (Endpoint 1)
     */
    private function crearFacturaInteres() {
        try {
            global $companyCode;
            
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (!$data) {
                $this->sendError('Datos JSON inválidos', 400);
                return;
            }
            
            // Validar campos requeridos
            $requiredFields = ['loanNumber', 'fechaPago', 'montoInteres', 'fechaInicial', 'fechaFinal'];
            foreach ($requiredFields as $field) {
                if (!isset($data[$field]) || $data[$field] === '' || $data[$field] === null) {
                    $this->sendError("Campo requerido faltante: $field", 400);
                    return;
                }
            }
            
            // Formatear fechas a formato ISO
            $fechaPago = date('c', strtotime($data['fechaPago']));
            $fechaInicial = date('c', strtotime($data['fechaInicial']));
            $fechaFinal = date('c', strtotime($data['fechaFinal']));
            
            // Obtener mediumName (prestamoId + numero de cuota + numero de pago) o usar loanNumber como fallback
            $mediumName = $data['mediumName'] ?? $data['loanNumber'];
            
            // Preparar datos para la API externa
            $apiData = [
                'businessTransactionDocumentTypeCode' => '004',
                'mediumName' => $data['loanNumber'],
                'date' => $fechaPago,
                'receiptDate' => $fechaPago,
                'transactionDate' => $fechaPago,
                'invoicingPeriodStart' => $fechaInicial,
                'invoicingPeriodEnd' => $fechaFinal,
                'documentItemGrossAmountIndicator' => false,
                'grossAmount' => floatval($data['montoInteres']),
                'currencyCode' => 'HNL',
                'customerInvoiceId' => $mediumName,
                'buyerPartyId' => $companyCode,
                'sellerPartyId' => $data['sellerPartyId'],
                'responsibleEmployeeId' => '1236',
                'categorizacion' => '103',
                'items' => [
                    [
                        'itemDescription' => $data['loanNumber'],
                        'itemNetUnitPrice' => floatval($data['montoInteres']),
                        'quantity' => 1,
                        'costCentreId' => '1014100',
                        'productTaxCode' => '1',
                        'generalLedgerAccountAliasCode' => 'Z106'
                    ]
                ]
            ];
            
            $url = $this->baseUrlSapPagos . 'Invoice/CreateInvoice';
            $fullResponse = $this->makeApiCall($url, 'POST', $apiData, true);
            
            $httpCode = $fullResponse['httpCode'];
            $response = $fullResponse['response'];
            
            // Manejar según código HTTP
            switch ($httpCode) {
                case 200:
                    // HTTP 200: Éxito - dataResult es un string con el número de factura
                    $dataResult = $response['dataResult'] ?? null;
                    $messageResult = $response['messageResult'] ?? 'Factura creada exitosamente';
                    $statusResult = $response['statusResult'] ?? false;
                    
                    // Si statusResult es true y dataResult es un string (número de factura), es éxito
                    if ($statusResult === true && is_string($dataResult) && !empty($dataResult)) {
                        $this->sendSuccess([
                            'invoiceId' => $dataResult,
                            'dataResult' => $dataResult,
                            'message' => $messageResult,
                            'statusCode' => $httpCode,
                            'severityCode' => 1
                        ], 'Factura de interés creada exitosamente');
                    } 
                    // Si statusResult es false pero hay dataResult string, puede ser éxito parcial
                    elseif (is_string($dataResult) && !empty($dataResult)) {
                        $this->sendSuccess([
                            'invoiceId' => $dataResult,
                            'dataResult' => $dataResult,
                            'message' => $messageResult,
                            'statusCode' => $httpCode,
                            'severityCode' => 1
                        ], 'Factura de interés creada exitosamente');
                    } 
                    // Si no hay dataResult o statusResult es false sin dataResult, error
                    else {
                        $this->sendError([
                            'message' => $messageResult ?: 'Error al crear factura de interés',
                            'dataResult' => $dataResult,
                            'statusCode' => $httpCode,
                            'type' => 'invoice_error'
                        ], 500);
                    }
                    break;
                    
                case 400:
                    // Bad Request - Error en la solicitud
                    $errorMessage = $response['messageResult'] ?? 'Error en la solicitud';
                    $errorData = $response['dataResult'] ?? null;
                    $this->sendError([
                        'message' => $errorMessage,
                        'dataResult' => $errorData,
                        'statusCode' => 400,
                        'type' => 'bad_request'
                    ], 400);
                    break;
                    
                case 409:
                    // Conflict - Error de SAP ByDesign
                    $errorMessage = $response['messageResult'] ?? 'SAP ByDesign error';
                    $this->sendError([
                        'message' => $errorMessage,
                        'statusCode' => 409,
                        'type' => 'sap_conflict'
                    ], 409);
                    break;
                    
                case 500:
                    // Internal Server Error
                    $errorMessage = $response['messageResult'] ?? 'Excepción interna';
                    $this->sendError([
                        'message' => $errorMessage,
                        'statusCode' => 500,
                        'type' => 'internal_error'
                    ], 500);
                    break;
                    
                default:
                    // Otros códigos de error
                    $errorMessage = $response['messageResult'] ?? "Error HTTP: $httpCode";
                    $this->sendError([
                        'message' => $errorMessage,
                        'statusCode' => $httpCode,
                        'type' => 'unknown_error'
                    ], $httpCode >= 400 && $httpCode < 500 ? $httpCode : 500);
                    break;
            }
            
        } catch (Exception $e) {
            $this->sendError('Error al crear factura de interés: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Crear factura por interés no provisionado (similar a crearFacturaInteres)
     */
    private function crearFacturaInteresNoProvisionado() {
        try {
            global $companyCode;
            
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (!$data) {
                $this->sendError('Datos JSON inválidos', 400);
                return;
            }
            
            // Validar campos requeridos
            $requiredFields = ['loanNumber', 'fechaPago', 'montoInteres', 'fechaInicial', 'fechaFinal'];
            foreach ($requiredFields as $field) {
                if (!isset($data[$field]) || $data[$field] === '' || $data[$field] === null) {
                    $this->sendError("Campo requerido faltante: $field", 400);
                    return;
                }
            }
            
            // Formatear fechas a formato ISO
            $fechaPago = date('c', strtotime($data['fechaPago']));
            $fechaInicial = date('c', strtotime($data['fechaInicial']));
            $fechaFinal = date('c', strtotime($data['fechaFinal']));
            
            // Obtener mediumName (prestamoId + numero de cuota + numero de pago) o usar loanNumber como fallback
            // El frontend ya envía el mediumName con el sufijo '-INP' si es necesario
            $mediumName = $data['mediumName'] ?? $data['loanNumber'];
            
            // Preparar datos para la API externa (igual que crearFacturaInteres)
            $apiData = [
                'businessTransactionDocumentTypeCode' => '004',
                'mediumName' => $data['loanNumber'],
                'date' => $fechaPago,
                'receiptDate' => $fechaPago,
                'transactionDate' => $fechaPago,
                'invoicingPeriodStart' => $fechaInicial,
                'invoicingPeriodEnd' => $fechaFinal,
                'documentItemGrossAmountIndicator' => false,
                'grossAmount' => floatval($data['montoInteres']),
                'currencyCode' => 'HNL',
                'customerInvoiceId' => $mediumName,
                'buyerPartyId' => $companyCode,
                'sellerPartyId' => $data['sellerPartyId'],
                'responsibleEmployeeId' => '1236',
                'categorizacion' => '104',
                'items' => [
                    [
                        'itemDescription' => $data['loanNumber'],
                        'itemNetUnitPrice' => floatval($data['montoInteres']),
                        'quantity' => 1,
                        'costCentreId' => '1014100',
                        'productTaxCode' => '1',
                        'generalLedgerAccountAliasCode' => 'Z267'
                    ]
                ]
            ];
            
            $url = $this->baseUrlSapPagos . 'Invoice/CreateInvoice';
            $fullResponse = $this->makeApiCall($url, 'POST', $apiData, true);
            
            $httpCode = $fullResponse['httpCode'];
            $response = $fullResponse['response'];
            
            // Manejar según código HTTP (similar a crearFacturaInteres)
            switch ($httpCode) {
                case 200:
                    // HTTP 200: Éxito - dataResult es un string con el número de factura
                    $dataResult = $response['dataResult'] ?? null;
                    $messageResult = $response['messageResult'] ?? 'Factura creada exitosamente';
                    $statusResult = $response['statusResult'] ?? false;
                    
                    // Si statusResult es true y dataResult es un string (número de factura), es éxito
                    if ($statusResult === true && is_string($dataResult) && !empty($dataResult)) {
                        $this->sendSuccess([
                            'invoiceId' => $dataResult,
                            'dataResult' => $dataResult,
                            'message' => $messageResult,
                            'statusCode' => $httpCode,
                            'severityCode' => 1
                        ], 'Factura de interés no provisionado creada exitosamente');
                    } 
                    // Si statusResult es false pero hay dataResult string, puede ser éxito parcial
                    elseif (is_string($dataResult) && !empty($dataResult)) {
                        $this->sendSuccess([
                            'invoiceId' => $dataResult,
                            'dataResult' => $dataResult,
                            'message' => $messageResult,
                            'statusCode' => $httpCode,
                            'severityCode' => 1
                        ], 'Factura de interés no provisionado creada exitosamente');
                    } 
                    // Si no hay dataResult o statusResult es false sin dataResult, error
                    else {
                        $this->sendError([
                            'message' => $messageResult ?: 'Error al crear factura de interés no provisionado',
                            'dataResult' => $dataResult,
                            'statusCode' => $httpCode,
                            'type' => 'invoice_error'
                        ], 500);
                    }
                    break;
                    
                case 400:
                    // Bad Request - Error en la solicitud
                    $errorMessage = $response['messageResult'] ?? 'Error en la solicitud';
                    $errorData = $response['dataResult'] ?? null;
                    $this->sendError([
                        'message' => $errorMessage,
                        'dataResult' => $errorData,
                        'statusCode' => 400,
                        'type' => 'bad_request'
                    ], 400);
                    break;
                    
                case 409:
                    // Conflict - Error de SAP ByDesign con severityCode
                    // En este caso dataResult es un array con severityCode
                    $dataResult = $response['dataResult'] ?? [];
                    $messageResult = $response['messageResult'] ?? 'SAP ByDesign error';
                    
                    // Analizar severityCode solo en conflictos (409)
                    $severityAnalysis = $this->analizarSeverityCode($dataResult);
                    
                    // SeverityCode 2 = creado con errores/excepciones (puede haberse creado)
                    if ($severityAnalysis['severityCode'] === 2) {
                        $this->sendError([
                            'message' => $messageResult,
                            'dataResult' => $dataResult,
                            'statusCode' => 409,
                            'severityCode' => 2,
                            'mayHaveCreated' => true, // Se creó pero con problemas
                            'type' => 'invoice_exception',
                            'messages' => $severityAnalysis['messages'] ?? []
                        ], 409);
                    } 
                    // SeverityCode 3 = no se creó
                    else {
                        $errorMessage = $messageResult;
                        if (!empty($severityAnalysis['messages'])) {
                            $errorMessage .= ': ' . implode('; ', $severityAnalysis['messages']);
                        }
                        $this->sendError([
                            'message' => $errorMessage,
                            'dataResult' => $dataResult,
                            'statusCode' => 409,
                            'severityCode' => $severityAnalysis['severityCode'] ?? 3,
                            'mayHaveCreated' => false,
                            'type' => 'sap_conflict',
                            'messages' => $severityAnalysis['messages'] ?? []
                        ], 409);
                    }
                    break;
                    
                case 500:
                    // Internal Server Error
                    $errorMessage = $response['messageResult'] ?? 'Excepción interna';
                    $this->sendError([
                        'message' => $errorMessage,
                        'statusCode' => 500,
                        'type' => 'internal_error'
                    ], 500);
                    break;
                    
                default:
                    // Otros códigos de error
                    $errorMessage = $response['messageResult'] ?? "Error HTTP: $httpCode";
                    $this->sendError([
                        'message' => $errorMessage,
                        'statusCode' => $httpCode,
                        'type' => 'unknown_error'
                    ], $httpCode >= 400 && $httpCode < 500 ? $httpCode : 500);
                    break;
            }
        } catch (Exception $e) {
            $this->sendError('Error al crear factura de interés no provisionado: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Crear pago (Endpoint 2)
     */
    private function crearPago() {
        try {
            global $companyCode;
            
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (!$data) {
                $this->sendError('Datos JSON inválidos', 400);
                return;
            }
            
            // Validar campos básicos requeridos
            $requiredFields = ['paymentID', 'fechaPago', 'descripcion', 'montoCapital', 'montoInteres', 
                              'facturaDesembolso', 'cProveedor', 'codeBankProveedor', 
                              'numberBankAccount', 'sapBankId', 'nameBankProveedor'];
            $missingFields = [];
            foreach ($requiredFields as $field) {
                if (!isset($data[$field]) || $data[$field] === '' || $data[$field] === null) {
                    $missingFields[] = $field;
                }
            }
            
            if (!empty($missingFields)) {
                $this->sendError("Campos requeridos faltantes: " . implode(', ', $missingFields) . ". Datos recibidos: " . json_encode($data), 400);
                return;
            }
            
            $montoCapital = floatval($data['montoCapital']);
            $montoInteres = floatval($data['montoInteres']);
            $montoInteresNoProvisionado = isset($data['montoInteresNoProvisionado']) ? floatval($data['montoInteresNoProvisionado']) : 0;
            $montoTotal = round($montoCapital + $montoInteres + $montoInteresNoProvisionado, 2);
            
            // Validar que al menos uno de los montos sea mayor a 0
            if ($montoTotal <= 0) {
                $this->sendError("Debe proporcionar un monto mayor a 0 en capital o interés", 400);
                return;
            }
            
            // Determinar tipo de pago
            $tipoPago = isset($data['tipoPago']) ? $data['tipoPago'] : 'mixto';
            
            // Construir array de Items según el tipo de pago
            $items = [];
            
            if ($tipoPago === 'capital' || $montoCapital > 0) {
                // Agregar item de capital (factura de desembolso)
                $items[] = [
                    'DocumentID' => $data['facturaDesembolso'],
                    'AmountToPay' => $montoCapital
                ];
            }
            
            if ($tipoPago === 'interes' || $montoInteres > 0) {
                // Agregar item de interés (factura de interés)
                if (!isset($data['facturaInteres']) || $data['facturaInteres'] === '' || $data['facturaInteres'] === null) {
                    $this->sendError("Para pagos con interés se requiere el campo 'facturaInteres'", 400);
                    return;
                }
                $items[] = [
                    'DocumentID' => $data['facturaInteres'],
                    'AmountToPay' => $montoInteres
                ];
            }
            
            // Agregar item de interés no provisionado si existe
            $montoInteresNoProvisionado = isset($data['montoInteresNoProvisionado']) ? floatval($data['montoInteresNoProvisionado']) : 0;
            if ($montoInteresNoProvisionado > 0) {
                if (!isset($data['facturaInteresNoProvisionado']) || $data['facturaInteresNoProvisionado'] === '' || $data['facturaInteresNoProvisionado'] === null) {
                    $this->sendError("Para pagos con interés no provisionado se requiere el campo 'facturaInteresNoProvisionado'", 400);
                    return;
                }
                $items[] = [
                    'DocumentID' => $data['facturaInteresNoProvisionado'],
                    'AmountToPay' => $montoInteresNoProvisionado
                ];
            }
            
            // Validar que al menos tengamos un item para pagar
            if (empty($items)) {
                $this->sendError("No se generaron items de pago. Verifique los montos.", 400);
                return;
            }
            
            // Validar que la descripción no esté vacía antes de enviar a SAP
            $descripcion = isset($data['descripcion']) ? trim($data['descripcion']) : '';
            if (empty($descripcion)) {
                error_log('ERROR CRÍTICO: descripcion está vacía antes de enviar a SAP');
                $this->sendError('La descripción del pago no puede estar vacía', 400);
                return;
            }
            
            // Preparar datos para la API externa
            $apiData = [
                'PaymentID' => $data['paymentID'],
                'Company' => $companyCode,
                'PaymentDate' => date('Y-m-d', strtotime($data['fechaPago'])),
                'PostingDate' => date('Y-m-d', strtotime($data['fechaPago'])),
                'Description' => $descripcion, // Usar la variable validada
                'PaymenMethod' => 'Domiciliación bancaria',
                'Amount' => $montoTotal,
                'CurrencyCode' => 'HNL',
                'PayerID' => $data['cProveedor'],
                'PayerBankCode' => $data['codeBankProveedor'],
                'PayerAccountID' => $data['numberBankAccount'],
                'ReceiverBankID' => $data['sapBankId'],
                'ReceiverBankName' => $data['nameBankProveedor'],
                'ExternalReferencee' => $data['paymentID'],
                'Items' => $items
            ];
            
            // Log del JSON que se enviará a SAP
            error_log('JSON enviado a SAP (CreatePayment): ' . json_encode($apiData, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
            error_log('=== VALIDACIÓN Description en apiData ===');
            error_log('Description en apiData: ' . $apiData['Description']);
            error_log('Longitud: ' . strlen($apiData['Description']));
            error_log('¿Está vacío?: ' . (empty($apiData['Description']) ? 'SÍ' : 'NO'));
            
            $url = $this->baseUrlSapPagos . 'Payment/CreatePayment';
            
            try {
                // Usar returnFullResponse para obtener el código HTTP
                $fullResponse = $this->makeApiCall($url, 'POST', $apiData, true);
                
                $httpCode = $fullResponse['httpCode'];
                $response = $fullResponse['response'];
                
                // Log de la respuesta de SAP
                error_log('Respuesta de SAP (CreatePayment): ' . json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
                error_log('HTTP Code: ' . $httpCode);
                
                // Manejar según código HTTP (igual que facturas)
                switch ($httpCode) {
                    case 200:
                        // HTTP 200: Éxito - dataResult es un string con el número de pago
                        $dataResult = $response['dataResult'] ?? null;
                        $messageResult = $response['messageResult'] ?? 'Pago creado exitosamente';
                        $statusResult = $response['statusResult'] ?? false;
                        
                        // Si statusResult es true y dataResult es un string (número de pago), es éxito
                        if ($statusResult === true && is_string($dataResult) && !empty($dataResult)) {
                            $successData = [
                                'message' => $messageResult,
                                'dataResult' => $dataResult,
                                'severityCode' => 1
                            ];
                            error_log('Datos que se enviarán al frontend: ' . json_encode($successData, JSON_UNESCAPED_UNICODE));
                            $this->sendSuccess($successData, 'Pago creado exitosamente');
                        } 
                        // Si statusResult es false pero hay dataResult string, puede ser éxito parcial
                        elseif (is_string($dataResult) && !empty($dataResult)) {
                            $successData = [
                                'message' => $messageResult,
                                'dataResult' => $dataResult,
                                'severityCode' => 1
                            ];
                            error_log('Datos que se enviarán al frontend: ' . json_encode($successData, JSON_UNESCAPED_UNICODE));
                            $this->sendSuccess($successData, 'Pago creado exitosamente');
                        } 
                        // Si no hay dataResult o statusResult es false sin dataResult, error
                        else {
                            $this->sendError([
                                'message' => $messageResult ?: 'Error al crear pago',
                                'dataResult' => $dataResult,
                                'statusCode' => $httpCode,
                                'type' => 'payment_error'
                            ], 500);
                        }
                        break;
                        
                    case 400:
                        // Bad Request
                        $errorMessage = $response['messageResult'] ?? 'Error en la solicitud';
                        $errorData = $response['dataResult'] ?? null;
                        $this->sendError([
                            'message' => $errorMessage,
                            'dataResult' => $errorData,
                            'statusCode' => 400,
                            'type' => 'bad_request'
                        ], 400);
                        break;
                        
                    case 409:
                        // Conflict - Error de SAP ByDesign con severityCode
                        // En este caso dataResult es un array con severityCode
                        $dataResult = $response['dataResult'] ?? [];
                        $messageResult = $response['messageResult'] ?? 'SAP ByDesign error';
                        
                        // Analizar severityCode solo en conflictos (409)
                        $severityAnalysis = $this->analizarSeverityCode($dataResult);
                        
                        // SeverityCode 2 = creado con errores/excepciones (puede haberse creado)
                        if ($severityAnalysis['severityCode'] === 2) {
                            $this->sendError([
                                'message' => $messageResult,
                                'dataResult' => $dataResult,
                                'statusCode' => 409,
                                'severityCode' => 2,
                                'mayHaveCreated' => true, // Se creó pero con problemas
                                'type' => 'payment_exception',
                                'messages' => $severityAnalysis['messages'] ?? []
                            ], 409);
                        } 
                        // SeverityCode 3 = no se creó
                        else {
                            $errorMessage = $messageResult;
                            if (!empty($severityAnalysis['messages'])) {
                                $errorMessage .= ': ' . implode('; ', $severityAnalysis['messages']);
                            }
                            $this->sendError([
                                'message' => $errorMessage,
                                'dataResult' => $dataResult,
                                'statusCode' => 409,
                                'severityCode' => $severityAnalysis['severityCode'] ?? 3,
                                'mayHaveCreated' => false,
                                'type' => 'sap_conflict',
                                'messages' => $severityAnalysis['messages'] ?? []
                            ], 409);
                        }
                        break;
                        
                    case 500:
                        // Internal Server Error
                        $errorMessage = $response['messageResult'] ?? 'Excepción interna';
                        $this->sendError([
                            'message' => $errorMessage,
                            'statusCode' => 500,
                            'type' => 'internal_error'
                        ], 500);
                        break;
                        
                    default:
                        // Otros códigos de error
                        $errorMessage = $response['messageResult'] ?? "Error HTTP: $httpCode";
                        $this->sendError([
                            'message' => $errorMessage,
                            'statusCode' => $httpCode,
                            'type' => 'unknown_error'
                        ], $httpCode >= 400 && $httpCode < 500 ? $httpCode : 500);
                        break;
                }
            } catch (Exception $e) {
                // Error en la llamada HTTP o en el procesamiento
                $errorMessage = $e->getMessage();
                
                // Si el error contiene información de HTTP, puede ser que el pago se haya creado con excepciones
                $errorData = [
                    'message' => $errorMessage,
                    'mayHaveCreated' => strpos($errorMessage, 'Error HTTP') !== false, // Si hay código HTTP, puede haberse creado
                    'type' => 'payment_error'
                ];
                $this->sendError($errorData, 500);
            }
            
        } catch (Exception $e) {
            $this->sendError('Error al crear pago: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Guardar pago en API externa (Endpoint 3)
     */
    private function guardarPagoDB() {
        try {
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (!$data) {
                $this->sendError('Datos JSON inválidos', 400);
                return;
            }
            
            // Validar campos requeridos (invoiceResult es opcional para pagos solo de capital)
            $requiredFields = ['prestamoId', 'quotaNumber', 'fechaPago', 'capital', 'interest', 'company'];
            foreach ($requiredFields as $field) {
                if (!isset($data[$field]) || $data[$field] === '' || $data[$field] === null) {
                    $this->sendError("Campo requerido faltante: $field", 400);
                    return;
                }
            }
            
            // Formatear fecha a formato ISO
            $payDate = date('c', strtotime($data['fechaPago']));
            
            // Serializar invoiceResult si es un array/objeto (puede estar vacío para pagos solo de capital)
            $invoiceResult = isset($data['invoiceResult']) ? $data['invoiceResult'] : '';
            if (is_array($invoiceResult) || is_object($invoiceResult)) {
                $invoiceResult = json_encode($invoiceResult, JSON_UNESCAPED_UNICODE);
            }
            
            // Obtener failed (por defecto false si no se envía)
            $failed = isset($data['failed']) ? (bool)$data['failed'] : false;
            
            // Obtener payNumber (requerido)
            if (!isset($data['payNumber']) || $data['payNumber'] === '' || $data['payNumber'] === null) {
                $this->sendError("Campo requerido faltante: payNumber", 400);
                return;
            }
            
            // Preparar datos para la API externa
            $apiData = [
                'id' => 0,
                'payDate' => $payDate,
                'prestamoId' => $data['prestamoId'],
                'quotaNumber' => intval($data['quotaNumber']),
                'capital' => floatval($data['capital']),
                'interest' => floatval($data['interest']),
                'valid' => true,
                'invoiceResult' => $invoiceResult,
                'company' => $data['company'],
                'failed' => $failed,
                'payNumber' => intval($data['payNumber']),
                'paymentIdSapByD' => isset($data['paymentIdSapByD']) ? $data['paymentIdSapByD'] : null,
                'invoiceUnpinterest' => isset($data['invoiceUnpinterest']) && $data['invoiceUnpinterest'] !== null && $data['invoiceUnpinterest'] !== '' ? $data['invoiceUnpinterest'] : null,
                'unprovisionedInterest' => isset($data['unprovisionedInterest']) ? floatval($data['unprovisionedInterest']) : 0
            ];
            
            $url = $this->baseUrlSapPagos . 'MaestroPaymentLoans/Create';
            $response = $this->makeApiCall($url, 'POST', $apiData);
            
            // La API puede devolver diferentes formatos, verificar éxito
            if (isset($response['isCorrect']) && $response['isCorrect'] === true) {
                $this->sendSuccess($response['data'] ?? $response, 'Pago guardado exitosamente');
            } elseif (isset($response['success']) && $response['success'] === true) {
                $this->sendSuccess($response['data'] ?? $response, 'Pago guardado exitosamente');
            } else {
                // Si no tiene formato estándar, asumir éxito si no hay error
                $this->sendSuccess($response, 'Pago guardado exitosamente');
            }
            
        } catch (Exception $e) {
            $this->sendError('Error al guardar pago: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Marcar cuota como pagada (Endpoint mark-paid)
     */
    private function marcarCuotaPagada() {
        try {
            global $companyCode;
            
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (!$data) {
                $this->sendError('Datos JSON inválidos', 400);
                return;
            }
            
            // Validar campos requeridos
            $requiredFields = ['prestamo_number', 'quota_number', 'company'];
            foreach ($requiredFields as $field) {
                if (!isset($data[$field]) || $data[$field] === '' || $data[$field] === null) {
                    $this->sendError("Campo requerido faltante: $field", 400);
                    return;
                }
            }
            
            // Preparar datos para la API externa
            $apiData = [
                'prestamo_number' => $data['prestamo_number'],
                'quota_number' => intval($data['quota_number']),
                'company' => $data['company'] ?: $companyCode
            ];
            
            // URL del endpoint de amortización
            $url = $this->baseUrlAmortizacion . 'loans/amortization/mark-paid';
            $response = $this->makeApiCall($url, 'POST', $apiData);
            
            // La API puede devolver diferentes formatos
            if (isset($response['success']) && $response['success'] === true) {
                $this->sendSuccess($response['data'] ?? $response, 'Cuota marcada como pagada exitosamente');
            } elseif (isset($response['isCorrect']) && $response['isCorrect'] === true) {
                $this->sendSuccess($response['data'] ?? $response, 'Cuota marcada como pagada exitosamente');
            } else {
                // Si no tiene formato estándar, asumir éxito si no hay error
                $this->sendSuccess($response, 'Cuota marcada como pagada exitosamente');
            }
            
        } catch (Exception $e) {
            $this->sendError('Error al marcar cuota como pagada: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Actualizar estado de pago fallido a exitoso
     */
    private function actualizarPagoFallido() {
        try {
            global $companyCode;
            
            $input = file_get_contents('php://input');
            $data = json_decode($input, true);
            
            if (!$data) {
                $this->sendError('Datos JSON inválidos', 400);
                return;
            }
            
            // Validar campos requeridos
            $requiredFields = ['prestamoId', 'quotaNumber', 'company', 'payNumber'];
            foreach ($requiredFields as $field) {
                if (!isset($data[$field]) || $data[$field] === '' || $data[$field] === null) {
                    $this->sendError("Campo requerido faltante: $field", 400);
                    return;
                }
            }
            
            // Validar que paymentIdSapByD esté presente cuando se agrega manualmente
            if (!isset($data['paymentIdSapByD']) || $data['paymentIdSapByD'] === '' || $data['paymentIdSapByD'] === null) {
                $this->sendError("El campo 'paymentIdSapByD' es requerido para agregar pago manualmente", 400);
                return;
            }
            
            // Preparar datos para la API externa
            // NOTA: invoiceUnpinterest y unprovisionedInterest NO se envían en actualizarPagoFallido
            // Solo se guardan en la base de datos cuando se crea el pago inicialmente
            $apiData = [
                'prestamoId' => $data['prestamoId'],
                'quotaNumber' => intval($data['quotaNumber']),
                'company' => $data['company'],
                'payNumber' => intval($data['payNumber']),
                'paymentIdSapByD' => trim($data['paymentIdSapByD']) // Asegurar que no tenga espacios
            ];
            
            // Logs para depuración
            error_log('Datos recibidos en actualizarPagoFallido: ' . json_encode($data, JSON_UNESCAPED_UNICODE));
            error_log('Datos enviados al PUT (MaestroPaymentLoans/Update): ' . json_encode($apiData, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));
            
            // URL del endpoint PUT
            $url = $this->baseUrlSapPagos . 'MaestroPaymentLoans/Update';
            $response = $this->makeApiCall($url, 'PUT', $apiData);
            
            // La API puede devolver diferentes formatos
            if (isset($response['statusResult']) && $response['statusResult'] === true) {
                $this->sendSuccess([
                    'message' => $response['messageResult'] ?? 'Pago actualizado exitosamente',
                    'dataResult' => $response['dataResult'] ?? ''
                ], 'Pago actualizado exitosamente');
            } elseif (isset($response['success']) && $response['success'] === true) {
                $this->sendSuccess($response['data'] ?? $response, 'Pago actualizado exitosamente');
            } elseif (isset($response['isCorrect']) && $response['isCorrect'] === true) {
                $this->sendSuccess($response['data'] ?? $response, 'Pago actualizado exitosamente');
            } else {
                $this->sendError('Error al actualizar pago: ' . ($response['messageResult'] ?? 'Error desconocido'), 500);
            }
            
        } catch (Exception $e) {
            $this->sendError('Error al actualizar pago fallido: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Analizar severityCode en la respuesta de SAP
     * Retorna array con información sobre el estado de la operación
     * severityCode: 1 = éxito, 2 = creado con errores/excepciones, 3 = no se creó
     */
    private function analizarSeverityCode($dataResult) {
        if (!is_array($dataResult) || empty($dataResult)) {
            return [
                'severityCode' => null,
                'success' => false,
                'mayHaveCreated' => false,
                'messages' => []
            ];
        }
        
        $severityCodes = [];
        $messages = [];
        
        foreach ($dataResult as $item) {
            if (isset($item['severityCode'])) {
                $severityCodes[] = intval($item['severityCode']);
            }
            if (isset($item['note'])) {
                $messages[] = $item['note'];
            }
        }
        
        if (empty($severityCodes)) {
            return [
                'severityCode' => null,
                'success' => false,
                'mayHaveCreated' => false,
                'messages' => $messages
            ];
        }
        
        // El severityCode más bajo determina el resultado final
        // 1 = éxito, 2 = creado con errores, 3 = no se creó
        $minSeverityCode = min($severityCodes);
        $hasSeverity1 = in_array(1, $severityCodes);
        $hasSeverity2 = in_array(2, $severityCodes);
        $hasSeverity3 = in_array(3, $severityCodes);
        
        // Si hay severityCode 1, se creó exitosamente (aunque pueda haber warnings)
        if ($hasSeverity1) {
            return [
                'severityCode' => 1,
                'success' => true,
                'mayHaveCreated' => false,
                'messages' => $messages,
                'hasWarnings' => $hasSeverity3 || $hasSeverity2
            ];
        }
        
        // Si hay severityCode 2 pero no 1, se creó con errores/excepciones
        if ($hasSeverity2 && !$hasSeverity1) {
            return [
                'severityCode' => 2,
                'success' => false,
                'mayHaveCreated' => true, // Se creó pero con problemas
                'messages' => $messages
            ];
        }
        
        // Si solo hay severityCode 3, no se creó
        if ($hasSeverity3 && !$hasSeverity1 && !$hasSeverity2) {
            return [
                'severityCode' => 3,
                'success' => false,
                'mayHaveCreated' => false,
                'messages' => $messages
            ];
        }
        
        // Fallback: usar el código mínimo encontrado
        return [
            'severityCode' => $minSeverityCode,
            'success' => $minSeverityCode === 1,
            'mayHaveCreated' => $minSeverityCode === 2,
            'messages' => $messages
        ];
    }

    /**
     * Realizar llamada a API externa
     * Retorna array con 'httpCode', 'response', 'error' para manejo detallado de errores
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
     * Enviar respuesta de éxito
     */
    private function sendSuccess($data, $message = 'Operación exitosa') {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'timestamp' => date('Y-m-d H:i:s')
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    /**
     * Obtener factura IPM pendiente
     */
    private function obtenerFacturaIPM() {
        try {
            global $companyCode;
            
            // Validar que tengamos companyCode
            if (empty($companyCode)) {
                $this->sendError('No se encontró el código de compañía en la sesión', 400);
                return;
            }
            
            // Obtener parámetros
            $prestamo = $_GET['prestamo'] ?? '';
            $cuota = $_GET['cuota'] ?? '';
            
            // Validar parámetros
            if (empty($prestamo) || empty($cuota)) {
                $this->sendError('Los parámetros prestamo y cuota son requeridos', 400);
                return;
            }
            
            // Llamar al endpoint externo
            $url = $this->baseUrlAmortizacion . "loans/invoice-ipm?prestamo={$prestamo}&cuota={$cuota}&company={$companyCode}";
            
            $fullResponse = $this->makeApiCall($url, 'GET', null, true);
            
            $httpCode = $fullResponse['httpCode'];
            $response = $fullResponse['response'];
            
            // Manejar respuesta
            if ($httpCode === 200) {
                // Si success es false, significa que no hay factura pendiente
                if (isset($response['success']) && $response['success'] === false) {
                    $this->sendSuccess(null, 'No hay factura IPM pendiente para esta cuota');
                } else {
                    $this->sendSuccess($response['data'] ?? $response, 'Factura IPM obtenida exitosamente');
                }
            } else if ($httpCode === 404) {
                // Si el endpoint externo devuelve 404, significa que no hay factura IPM
                // Devolver éxito con null en lugar de error para evitar confusión
                $this->sendSuccess(null, 'No hay factura IPM pendiente para esta cuota');
            } else {
                // Para otros errores, devolver siempre 200 con success: false en el cuerpo
                $errorMessage = $response['message'] ?? "Error HTTP: $httpCode";
                http_response_code(200);
                echo json_encode([
                    'success' => false,
                    'message' => $errorMessage,
                    'error_code' => $httpCode,
                    'data' => null,
                    'timestamp' => date('Y-m-d H:i:s')
                ], JSON_UNESCAPED_UNICODE);
                exit;
            }
            
        } catch (Exception $e) {
            $this->sendError('Error al obtener factura IPM: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Enviar respuesta de error
     * Acepta string o array con información detallada del error
     */
    private function sendError($message, $code = 500) {
        http_response_code($code);
        
        // Si es un array, usarlo directamente; si es string, convertirlo a formato estándar
        if (is_array($message)) {
            echo json_encode([
                'success' => false,
                'message' => $message['message'] ?? 'Error desconocido',
                'error_code' => $code,
                'error_data' => $message,
                'timestamp' => date('Y-m-d H:i:s')
            ], JSON_UNESCAPED_UNICODE);
        } else {
            echo json_encode([
                'success' => false,
                'message' => $message,
                'error_code' => $code,
                'timestamp' => date('Y-m-d H:i:s')
            ], JSON_UNESCAPED_UNICODE);
        }
        exit;
    }
}

// Inicializar la clase
new PagosEndpoints();
?>

