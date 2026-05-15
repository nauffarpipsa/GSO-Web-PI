<?php
/**
 * Endpoints de Tareas - Maestro de Tareas
 * Versión: 1.0.0
 * 
 * Este archivo maneja las operaciones de tareas siguiendo el estándar arquitectura-new-modulo
 */

if (session_status() === PHP_SESSION_NONE) {
    require_once '../../../../Login/session_config.php';
}

// Permite acceso sólo a logueados
if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['isSuccess' => false, 'message' => 'No autorizado']);
    exit;
}

require_once '../../../../config/api.php';

class TareasEndpoints {
    public $baseUrl;

    public function __construct() {
        // URL centralizada desde config/api.php
        $this->baseUrl = rtrim(api_base('tasks'), '/');

        $method = $_SERVER['REQUEST_METHOD'];
        $action = $_GET['action'] ?? '';

        try {
            switch ($action) {
                case 'getAll':
                    if ($method !== 'GET') {
                        $this->sendError('Método no permitido', 405);
                        return;
                    }
                    $this->getAll();
                    break;
                case 'toggleStatus':
                    if ($method !== 'PUT' && $method !== 'POST') {
                        $this->sendError('Método no permitido', 405);
                        return;
                    }
                    $this->toggleStatus();
                    break;
                case 'save':
                    if ($method !== 'POST' && $method !== 'PUT') {
                        $this->sendError('Método no permitido', 405);
                        return;
                    }
                    $this->save();
                    break;
                case 'getCompanies':
                    if ($method !== 'GET') {
                        $this->sendError('Método no permitido', 405);
                        return;
                    }
                    $this->getCompanies();
                    break;
                case 'getODataLinks':
                    if ($method !== 'GET') {
                        $this->sendError('Método no permitido', 405);
                        return;
                    }
                    $this->getODataLinks();
                    break;
                case 'executeTask':
                    if ($method !== 'GET' && $method !== 'POST') {
                        $this->sendError('Método no permitido', 405);
                        return;
                    }
                    $this->executeTask();
                    break;
                case 'getById':
                    if ($method !== 'GET') {
                        $this->sendError('Método no permitido', 405);
                        return;
                    }
                    $this->getById();
                    break;
                default:
                    echo json_encode(['isSuccess' => false, 'message' => 'Acción no válida']);
                    break;
            }
        } catch (Exception $e) {
            $this->sendError('Error interno del servidor: ' . $e->getMessage(), 500);
        }
    }

    private function getAll() {
        try {
            // Obtener el sapCode de la sesión (companyCode seleccionado en el login)
            $sapCode = $_SESSION['companyCode'] ?? '';
            if (empty($sapCode)) {
                echo json_encode(['Items' => [], 'Count' => 0, 'message' => 'No se encontró el código de compañía en sesión']);
                return;
            }

            $url = $this->baseUrl . '/TbTask/GetAll?sapCode=' . urlencode($sapCode);
            $fullResponse = $this->makeApiCall($url, 'GET');
            
            $httpCode = $fullResponse['httpCode'];
            $response = $fullResponse['response'];

            if ($httpCode >= 200 && $httpCode < 300 && $response) {
                if (isset($response['statusResult']) && $response['statusResult'] === true && isset($response['dataResult'])) {
                    // Para Syncfusion WebApiAdaptor
                    $items = is_array($response['dataResult']) ? $response['dataResult'] : [];
                    echo json_encode([
                        'Items' => $items,
                        'Count' => count($items)
                    ]);
                } else {
                    echo json_encode(['Items' => [], 'Count' => 0]);
                }
            } else {
                http_response_code($httpCode);
                echo json_encode($response ?: ['message' => 'Error al obtener los datos']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Error interno: ' . $e->getMessage()]);
        }
    }

    private function getById() {
        try {
            $id = $_GET['id'] ?? null;
            if (!$id) {
                http_response_code(400);
                echo json_encode(['statusResult' => false, 'message' => 'ID no proporcionado']);
                return;
            }

            $url = $this->baseUrl . '/TbTask/GetById/' . urlencode($id);
            $fullResponse = $this->makeApiCall($url, 'GET');
            
            http_response_code($fullResponse['httpCode']);
            if ($fullResponse['response']) {
                echo json_encode($fullResponse['response']);
            } else {
                echo json_encode(['statusResult' => false, 'message' => 'Error al obtener tarea en el servidor']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['statusResult' => false, 'message' => 'Error interno: ' . $e->getMessage()]);
        }
    }

    private function toggleStatus() {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $id = isset($input['id']) ? (int)$input['id'] : 0;
            $actionType = $input['actionType'] ?? null;
            
            if ($id <= 0) {
                http_response_code(400);
                echo json_encode(['statusResult' => false, 'messageResult' => 'ID no proporcionado o inválido']);
                return;
            }
            
            if ($actionType === 'MAIL' || $actionType === 'EnviarCorreo') {
                $url = $this->baseUrl . '/StatementTask/MailTask/toggle/' . $id;
            } else {
                $url = $this->baseUrl . '/WhatsAppTask/toggle/' . $id;
            }
            
            $fullResponse = $this->makeApiCall($url, 'PUT');
            
            http_response_code($fullResponse['httpCode']);
            if ($fullResponse['response']) {
                echo json_encode($fullResponse['response']);
            } else {
                echo json_encode(['message' => 'Error en el servidor API', 'statusCode' => $fullResponse['httpCode']]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Error interno: ' . $e->getMessage()]);
        }
    }

    private function save() {
        try {
            $input = json_decode(file_get_contents('php://input'), true);
            $id = isset($input['id']) ? (int)$input['id'] : 0;
            
            // Inyectar datos de sesión obligatorios que la base de datos exige
            if (empty($input['sapCode'])) {
                $input['sapCode'] = $_SESSION['companyCode'] ?? '';
            }
            
            if ($id > 0) {
                $url = $this->baseUrl . '/TbTask/Update';
                $method = 'PUT';
                $input['userUpdate'] = $_SESSION['userName'] ?? '';
            } else {
                $url = $this->baseUrl . '/TbTask/Create';
                $method = 'POST';
                $input['userCreate'] = $_SESSION['userName'] ?? '';
            }
            
            $input['is_Active'] = false; // Forzar estado inactivo siempre al guardar (nueva o editada)
            
            $fullResponse = $this->makeApiCall($url, $method, $input, true);
            
            http_response_code($fullResponse['httpCode']);
            if ($fullResponse['response']) {
                echo json_encode($fullResponse['response']);
            } else {
                echo json_encode(['message' => 'Error al guardar en el servidor', 'statusCode' => $fullResponse['httpCode']]);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['message' => 'Error interno: ' . $e->getMessage()]);
        }
    }

    private function getCompanies() {
        try {
            $url = $this->baseUrl . '/Company/Get';
            $fullResponse = $this->makeApiCall($url, 'GET');
            
            http_response_code($fullResponse['httpCode']);
            if ($fullResponse['response']) {
                echo json_encode($fullResponse['response']);
            } else {
                echo json_encode(['statusResult' => false, 'message' => 'Error en el servidor API']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['statusResult' => false, 'message' => 'Error interno: ' . $e->getMessage()]);
        }
    }

    private function getODataLinks() {
        try {
            $url = $this->baseUrl . '/TbOdataLink/GetAll';
            $fullResponse = $this->makeApiCall($url, 'GET');
            
            http_response_code($fullResponse['httpCode']);
            if ($fullResponse['response']) {
                echo json_encode($fullResponse['response']);
            } else {
                echo json_encode(['statusResult' => false, 'message' => 'Error en el servidor API']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['statusResult' => false, 'message' => 'Error interno: ' . $e->getMessage()]);
        }
    }

    private function executeTask() {
        try {
            $id = $_GET['id'] ?? null;
            if (!$id) {
                http_response_code(400);
                echo json_encode(['statusResult' => false, 'message' => 'ID no proporcionado']);
                return;
            }
            $url = $this->baseUrl . '/TbTask/Execute/' . urlencode($id);
            $fullResponse = $this->makeApiCall($url, 'POST');
            
            http_response_code($fullResponse['httpCode']);
            if ($fullResponse['response']) {
                echo json_encode($fullResponse['response']);
            } else {
                echo json_encode(['statusResult' => false, 'message' => 'Error al ejecutar tarea en el servidor']);
            }
        } catch (Exception $e) {
            http_response_code(500);
            echo json_encode(['statusResult' => false, 'message' => 'Error interno: ' . $e->getMessage()]);
        }
    }

    /**
     * Utilidad para realizar llamadas API con cURL
     */
    private function makeApiCall($url, $method = 'GET', $data = null, $isJson = true) {
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        if ($method === 'POST') {
            curl_setopt($ch, CURLOPT_POST, true);
        } elseif ($method === 'PUT') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, "PUT");
        } elseif ($method !== 'GET') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
        }
        
        $headers = [];
        if ($data !== null) {
            if ($isJson) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
                $headers[] = 'Content-Type: application/json';
                $headers[] = 'Accept: application/json';
            } else {
                curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
            }
        }
        
        if (!empty($headers)) {
            curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        }
        
        $responseRaw = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        // Intentar parsear JSON
        $responseDecoded = json_decode($responseRaw, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            $responseDecoded = $responseRaw; 
        }
        
        return [
            'httpCode' => $httpCode,
            'response' => $responseDecoded
        ];
    }

    /**
     * Respuestas estandarizadas
     */
    private function sendSuccess($data, $message = 'Operación exitosa') {
        echo json_encode([
            'isSuccess' => true,
            'message' => $message,
            'data' => $data
        ]);
        exit;
    }

    private function sendError($message, $httpCode = 400) {
        http_response_code($httpCode);
        echo json_encode([
            'isSuccess' => false,
            'message' => is_array($message) ? ($message['message'] ?? 'Error desconocido') : $message,
            'details' => is_array($message) ? $message : null,
            'statusCode' => $httpCode
        ]);
        exit;
    }
}

// Instanciar la clase para que se ejecute el constructor y el enrutamiento
new TareasEndpoints();
