<?php
/**
 * Endpoints de Reimpresión de Documentos
 * Versión: 1.0.0
 * 
 * Este archivo maneja las operaciones para el módulo de reimpresión de documentos
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Usar configuración segura de sesión (HttpOnly cookies)
if (session_status() === PHP_SESSION_NONE) {
    require_once __DIR__ . '/../../../../Login/session_config.php';
}

// Verificar si el usuario está logueado
if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode([
        'success' => false,
        'message' => 'No hay sesión activa'
    ]);
    exit;
}

// Variable global para companyCode
$companyCode = $_SESSION['companyCode'] ?? '';

// Configuración de timezone
date_default_timezone_set('America/Tegucigalpa');

/**
 * Clase para manejar endpoints de reimpresión
 */
class ReimpresionEndpoints {
    
    private $timeout = 30;
    
    public function __construct() {
        // Obtener datos del request
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);
        
        $action = $data['action'] ?? $_GET['action'] ?? '';
        
        try {
            switch ($action) {
                case 'reimprimir':
                    $this->reimprimirDocumento($data);
                    break;
                case 'validarDocumento':
                    $this->validarDocumento($data);
                    break;
                default:
                    $this->sendError('Acción no válida', 400);
            }
        } catch (Exception $e) {
            $this->sendError('Error interno del servidor: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Reimprimir un documento
     */
    private function reimprimirDocumento($data) {
        try {
            // Validar datos requeridos
            $documentoId = $data['documentoId'] ?? '';
            $tipoDocumento = $data['tipoDocumento'] ?? '';
            
            if (empty($documentoId)) {
                $this->sendError('El ID del documento es requerido', 400);
                return;
            }
            
            if (empty($tipoDocumento)) {
                $this->sendError('El tipo de documento es requerido', 400);
                return;
            }
            
            // Validar tipo de documento
            if (!in_array($tipoDocumento, ['1', '2'])) {
                $this->sendError('Tipo de documento no válido. Use 1 para Factura o 2 para Entrega Saliente', 400);
                return;
            }
            
            // Aquí se implementaría la lógica de reimpresión
            // Por ahora, simulamos una respuesta exitosa
            
            // TODO: Implementar la lógica real de reimpresión
            // - Validar que el documento existe
            // - Obtener los datos del documento según el tipo
            // - Enviar a impresión
            
            $tipoNombre = $tipoDocumento == '1' ? 'Factura' : 'Entrega Saliente';
            
            // Simular procesamiento
            $this->sendSuccess([
                'documentoId' => $documentoId,
                'tipoDocumento' => $tipoDocumento,
                'tipoNombre' => $tipoNombre,
                'fecha' => date('Y-m-d H:i:s')
            ], 'Documento enviado para reimpresión exitosamente');
            
        } catch (Exception $e) {
            $this->sendError('Error al procesar la reimpresión: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Validar que un documento existe
     */
    private function validarDocumento($data) {
        try {
            $documentoId = $data['documentoId'] ?? '';
            $tipoDocumento = $data['tipoDocumento'] ?? '';
            
            if (empty($documentoId) || empty($tipoDocumento)) {
                $this->sendError('Datos incompletos para validar el documento', 400);
                return;
            }
            
            // TODO: Implementar validación real del documento
            // - Consultar en la base de datos o API externa
            // - Verificar que el documento existe y pertenece al tipo especificado
            
            // Por ahora, simulamos una validación exitosa
            $this->sendSuccess([
                'existe' => true,
                'documentoId' => $documentoId,
                'tipoDocumento' => $tipoDocumento
            ], 'Documento válido');
            
        } catch (Exception $e) {
            $this->sendError('Error al validar el documento: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Enviar respuesta de éxito
     */
    private function sendSuccess($data = [], $message = 'Operación exitosa') {
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
    private function sendError($message, $code = 400) {
        http_response_code($code);
        echo json_encode([
            'success' => false,
            'message' => $message
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// Inicializar endpoints
new ReimpresionEndpoints();
?>
