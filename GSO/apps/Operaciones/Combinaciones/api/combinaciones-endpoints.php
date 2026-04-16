<?php
/**
 * Endpoints de Combinaciones - Operaciones
 * Versión: 1.0.0
 *
 * Este archivo expone endpoints internos (PHP) que actúan como proxy hacia APIs externas,
 * siguiendo el mismo patrón utilizado en el módulo de Préstamos.
 *
 * Acciones disponibles:
 * - action=getProductCategory  (GET)
 * - action=getInventory        (GET) - Requiere: cloaId, ccatcpUuid
 * - action=createCombination   (POST) - Crear combinación de lotes
 */

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE');
header('Access-Control-Allow-Headers: Content-Type');

// Configuración de timezone
date_default_timezone_set('America/Tegucigalpa');

// Validación de sesión (reutilizamos el mismo mecanismo global)
include("../../../../Login/validar_sesion.php");
require_once __DIR__ . '/../../../../config/api.php';

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Clase para manejar endpoints de combinaciones
 */
class CombinacionesEndpoints {

    // API externa de combinaciones
    private $baseUrl = '';
    private $timeout = 30;

    public function __construct() {
        $this->baseUrl = rtrim((string)api_base('combinaciones_sap'), '/') . '/';
        if ($this->baseUrl === '/') {
            throw new Exception('No se encontró la configuración de API para "combinaciones_sap".');
        }

        $action = $_GET['action'] ?? '';

        try {
            switch ($action) {
                case 'getProductCategory':
                    $this->getProductCategory();
                    break;
                case 'getInventory':
                    $this->getInventory();
                    break;
                case 'createCombination':
                    $this->createCombination();
                    break;
                default:
                    $this->sendError('Acción no válida', 400);
            }
        } catch (Exception $e) {
            $this->sendError('Error interno del servidor: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Obtener categorías de producto desde API externa
     *
     * API externa:
     * GET http://192.168.10.81:8022/api/Combination/GetProductCategory
     *
     * Ejemplo de respuesta externa:
     * {
     *   "statusResult": true,
     *   "dataRecords": 189,
     *   "dataResult": [
     *     { "CINTERNAL_ID": "-FLETE", "TINTERNAL_ID": "-FLETE" }
     *   ],
     *   "messageResult": "¡La solicitud ha tenido éxito!"
     * }
     */
    private function getProductCategory() {
        $url = $this->baseUrl . 'GetProductCategory';

        try {
            $response = $this->makeApiCall($url, 'GET');

            $status = (bool)($response['statusResult'] ?? false);
            if (!$status) {
                $msg = (string)($response['messageResult'] ?? 'Error desconocido');
                $this->sendError('Error al obtener categorías: ' . $msg, 502);
                return;
            }

            $data = $this->extractCategoryItems($response);
            $dataRecords = (int)($response['dataRecords'] ?? count($data));

            // Normalizamos al formato "value/text" (útil para <select>)
            $categories = [];
            foreach ($data as $item) {
                if (!is_array($item)) {
                    continue;
                }

                $value = (string)$this->getByNormalizedKey($item, ['CINTERNAL_ID', 'CINTERNALID', 'INTERNAL_ID']);
                $text = (string)$this->getByNormalizedKey($item, ['TINTERNAL_ID', 'TINTERNALID', 'INTERNAL_TEXT', 'INTERNAL_DESC']);

                if ($text === '') {
                    $text = $value;
                }

                if ($value === '') continue;

                $categories[] = [
                    'value' => $value,
                    'text' => $text,
                ];
            }

            // Log de diagnóstico para validar estructura real en servidor
            error_log('[Combinaciones][GetProductCategory] dataRecords=' . $dataRecords . ' | categoriasNormalizadas=' . count($categories));
            if (!empty($data)) {
                $firstItemKeys = is_array($data[0]) ? implode(',', array_keys($data[0])) : 'N/A';
                error_log('[Combinaciones][GetProductCategory] firstItemKeys=' . $firstItemKeys);
            }

            $message = (string)($response['messageResult'] ?? 'Categorías obtenidas exitosamente');
            $this->sendSuccess($categories, $message, [
                'dataRecords' => $dataRecords,
            ]);
        } catch (Exception $e) {
            $this->sendError('Error al obtener categorías: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Normaliza dataResult para soportar variaciones de estructura del API.
     * Puede venir como arreglo, objeto único, o string JSON serializado.
     */
    private function normalizeDataResult($dataResult) {
        // Si viene como string JSON, intentar decodificarlo
        if (is_string($dataResult)) {
            $decoded = json_decode($dataResult, true);
            if (json_last_error() === JSON_ERROR_NONE) {
                $dataResult = $decoded;
            } else {
                return [];
            }
        }

        if (!is_array($dataResult)) {
            return [];
        }

        // Caso normal: ya es una lista
        if (array_is_list($dataResult)) {
            return $dataResult;
        }

        // Si es un objeto único con llaves del item, envolverlo como lista
        if (
            isset($dataResult['CINTERNAL_ID']) ||
            isset($dataResult['cinternal_id']) ||
            isset($dataResult['CInternalId'])
        ) {
            return [$dataResult];
        }

        // Si viene anidado, extraer lista conocida
        foreach (['dataResult', 'DataResult', 'items', 'Items'] as $key) {
            if (isset($dataResult[$key]) && is_array($dataResult[$key])) {
                return array_is_list($dataResult[$key]) ? $dataResult[$key] : [];
            }
        }

        return [];
    }

    /**
     * Extrae items de categorías desde cualquier estructura de respuesta.
     */
    private function extractCategoryItems($response) {
        if (!is_array($response)) {
            return [];
        }

        // 1) Ruta esperada directa
        $direct = $this->normalizeDataResult($response['dataResult'] ?? []);
        if (!empty($direct)) {
            return $direct;
        }

        // 2) Variaciones comunes de llave
        foreach (['DataResult', 'result', 'Result', 'data', 'Data'] as $key) {
            if (!isset($response[$key])) {
                continue;
            }
            $items = $this->normalizeDataResult($response[$key]);
            if (!empty($items)) {
                return $items;
            }
        }

        // 3) Búsqueda profunda: encontrar primer arreglo de objetos con llaves CINTERNAL/TINTERNAL
        $found = $this->findCategoryItemsRecursively($response);
        if (!empty($found)) {
            return $found;
        }

        return [];
    }

    /**
     * Recorre recursivamente arreglos/objetos para encontrar lista de categorías.
     */
    private function findCategoryItemsRecursively($node) {
        if (!is_array($node)) {
            return [];
        }

        // Si es lista, validar si contiene objetos con llaves de categoría
        if (array_is_list($node) && !empty($node)) {
            $first = $node[0];
            if (is_array($first)) {
                if ($this->hasAnyNormalizedKey($first, ['CINTERNAL_ID', 'CINTERNALID', 'TINTERNAL_ID', 'TINTERNALID'])) {
                    return $node;
                }
            }
        }

        // Recorrido DFS
        foreach ($node as $value) {
            if (!is_array($value)) {
                continue;
            }
            $result = $this->findCategoryItemsRecursively($value);
            if (!empty($result)) {
                return $result;
            }
        }

        return [];
    }

    /**
     * Obtiene un valor de arreglo por coincidencia de llave normalizada.
     */
    private function getByNormalizedKey($item, $expectedKeys) {
        if (!is_array($item)) {
            return '';
        }

        $normalizedMap = [];
        foreach ($item as $key => $value) {
            $normalizedMap[$this->normalizeKey($key)] = $value;
        }

        foreach ($expectedKeys as $expectedKey) {
            $normalizedExpected = $this->normalizeKey($expectedKey);
            if (array_key_exists($normalizedExpected, $normalizedMap)) {
                return $normalizedMap[$normalizedExpected];
            }
        }

        return '';
    }

    /**
     * Valida si existe alguna llave esperada usando comparación normalizada.
     */
    private function hasAnyNormalizedKey($item, $expectedKeys) {
        if (!is_array($item)) {
            return false;
        }

        $normalizedKeys = [];
        foreach (array_keys($item) as $key) {
            $normalizedKeys[] = $this->normalizeKey($key);
        }

        foreach ($expectedKeys as $expectedKey) {
            if (in_array($this->normalizeKey($expectedKey), $normalizedKeys, true)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Normaliza nombre de llave para comparación flexible.
     */
    private function normalizeKey($key) {
        return strtoupper(preg_replace('/[^A-Z0-9]/i', '', (string)$key));
    }

    /**
     * Obtener inventario (lotes) desde API externa
     *
     * API externa:
     * GET http://192.168.10.81:8022/api/Combination/GetInventory/{CLOA_ID}/{CCATCP_UUID}
     *
     * Parámetros:
     * - cloaId: "RECUPERADOS-1" (quemado por ahora)
     * - ccatcpUuid: CINTERNAL_ID de la categoría seleccionada
     *
     * Ejemplo de respuesta externa:
     * {
     *   "statusResult": true,
     *   "dataRecords": 5,
     *   "dataResult": [
     *     {
     *       "CISTOCK_ID": "REC-0012024",
     *       "CMATERIAL_UUID_01": "REC-0012024",
     *       "KCINV_QUAN_NORM": "166.04000000000000",
     *       "CINV_UNIT": "KGM",
     *       "TLOCATION_UUID": "RECUPERADOS",
     *       "TPINVALPC": "Promedio variable",
     *       ...
     *     }
     *   ],
     *   "messageResult": "¡La solicitud ha tenido éxito!"
     * }
     */
    private function getInventory() {
        // CLOA_ID quemado por ahora
        $cloaId = 'RECUPERADOS-1';
        
        // CCATCP_UUID viene del parámetro GET
        $ccatcpUuid = $_GET['ccatcpUuid'] ?? '';
        
        if (empty($ccatcpUuid)) {
            $this->sendError('El parámetro ccatcpUuid es requerido', 400);
            return;
        }

        // Construir URL: GetInventory/{CLOA_ID}/{CCATCP_UUID}
        $url = $this->baseUrl . 'GetInventory/' . urlencode($cloaId) . '/' . urlencode($ccatcpUuid);

        try {
            $response = $this->makeApiCall($url, 'GET');

            $status = (bool)($response['statusResult'] ?? false);
            if (!$status) {
                $msg = (string)($response['messageResult'] ?? 'Error desconocido');
                $this->sendError('Error al obtener inventario: ' . $msg, 502);
                return;
            }

            $data = $this->extractInventoryItems($response);
            $dataRecords = (int)($response['dataRecords'] ?? count($data));

            // Normalizar datos al formato esperado por el frontend
            $lotes = [];
            foreach ($data as $item) {
                if (!is_array($item)) {
                    continue;
                }

                $tipoLoteId = (string)$this->getByNormalizedKey($item, ['CPINVALPC', 'PINVALPC']);
                $cantidad = (float)$this->getByNormalizedKey($item, ['KCINV_QUAN_NORM', 'CINV_QUAN_NORM', 'QUANTITY', 'QTY']);
                
                $lotes[] = [
                    // Campos principales para mostrar en cards
                    'codigo' => (string)$this->getByNormalizedKey($item, ['CISTOCK_ID', 'ISTOCK_ID', 'STOCK_ID', 'LOTE']),
                    'articulo' => (string)$this->getByNormalizedKey($item, ['CMATERIAL_UUID_01', 'MATERIAL_UUID_01', 'MATERIAL_ID']),
                    'nombreArticulo' => (string)$this->getByNormalizedKey($item, ['TMATERIAL_UUID_01', 'MATERIAL_NAME', 'ARTICLE_NAME']), // Nombre del artículo para búsqueda
                    'cantidad' => $cantidad,
                    'unidad' => (string)$this->getByNormalizedKey($item, ['CINV_UNIT', 'INV_UNIT', 'UNIT']),
                    'ubicacion' => (string)$this->getByNormalizedKey($item, ['TLOCATION_UUID', 'LOCATION_UUID', 'LOCATION']),
                    'tipoLote' => (string)$this->getByNormalizedKey($item, ['TPINVALPC', 'PINVALPC_TEXT', 'TIPO_LOTE']),
                    'tipoLoteId' => $tipoLoteId, // ID del tipo de lote (1 o 2)
                    'puedeCombinar' => in_array($tipoLoteId, ['1', '2']), // Validar si puede combinar
                    
                    // Campos adicionales guardados para uso futuro
                    'rawData' => $item, // Guardar todos los campos originales
                ];
            }

            error_log('[Combinaciones][GetInventory] dataRecords=' . $dataRecords . ' | lotesNormalizados=' . count($lotes));
            if (!empty($data) && is_array($data[0])) {
                error_log('[Combinaciones][GetInventory] firstItemKeys=' . implode(',', array_keys($data[0])));
            }

            $message = (string)($response['messageResult'] ?? 'Inventario obtenido exitosamente');
            $this->sendSuccess($lotes, $message, [
                'dataRecords' => $dataRecords,
            ]);
        } catch (Exception $e) {
            $this->sendError('Error al obtener inventario: ' . $e->getMessage(), 500);
        }
    }

    /**
     * Extrae items del inventario desde cualquier estructura de respuesta.
     */
    private function extractInventoryItems($response) {
        if (!is_array($response)) {
            return [];
        }

        $direct = $this->normalizeDataResult($response['dataResult'] ?? []);
        if (!empty($direct)) {
            return $direct;
        }

        foreach (['DataResult', 'result', 'Result', 'data', 'Data', 'items', 'Items'] as $key) {
            if (!isset($response[$key])) {
                continue;
            }
            $items = $this->normalizeDataResult($response[$key]);
            if (!empty($items)) {
                return $items;
            }
        }

        return $this->findInventoryItemsRecursively($response);
    }

    /**
     * Recorre recursivamente arreglos/objetos para encontrar lista de lotes.
     */
    private function findInventoryItemsRecursively($node) {
        if (!is_array($node)) {
            return [];
        }

        if (array_is_list($node) && !empty($node) && is_array($node[0])) {
            if ($this->hasAnyNormalizedKey($node[0], ['CISTOCK_ID', 'CMATERIAL_UUID_01', 'KCINV_QUAN_NORM', 'CPINVALPC'])) {
                return $node;
            }
        }

        foreach ($node as $value) {
            if (!is_array($value)) {
                continue;
            }
            $result = $this->findInventoryItemsRecursively($value);
            if (!empty($result)) {
                return $result;
            }
        }

        return [];
    }

    /**
     * Crear combinación de lotes
     *
     * API externa:
     * POST http://192.168.10.81:8022/api/Combination/CreateCombination
     *
     * Body esperado:
     * {
     *   "idMaterial": "CMATERIAL_UUID_01 del hijo",
     *   "idMaterialDestino": "CMATERIAL_UUID_01 del padre",
     *   "idLoteOrigen": "CISTOCK_ID del hijo",
     *   "idLoteDestino": "CISTOCK_ID del padre",
     *   "idSedeOrigen": "CSITE_UUID del hijo",
     *   "idSedeDestino": "CSITE_UUID del padre",
     *   "idAlmacenOrigen": "CLOCATION_UUID del hijo",
     *   "idAlmacenDestino": "CLOCATION_UUID del padre",
     *   "idAreaLogisticaOrigen": "CLOA_ID del hijo",
     *   "idAreaLogisticaDestino": "CLOA_ID del padre",
     *   "tipo": "C",
     *   "cantidad": {
     *     "unitCode": "CINV_UNIT del hijo",
     *     "value": "KCINV_QUAN_NORM del hijo"
     *   }
     * }
     */
    private function createCombination() {
        $input = file_get_contents('php://input');
        $data = json_decode($input, true);

        if (json_last_error() !== JSON_ERROR_NONE) {
            $this->sendError('Error al decodificar JSON: ' . json_last_error_msg(), 400);
            return;
        }

        // Validar datos requeridos
        $required = [
            'idMaterial', 'idMaterialDestino', 'idLoteOrigen', 'idLoteDestino',
            'idSedeOrigen', 'idSedeDestino', 'idAlmacenOrigen', 'idAlmacenDestino',
            'idAreaLogisticaOrigen', 'idAreaLogisticaDestino', 'cantidad'
        ];

        foreach ($required as $field) {
            if (!isset($data[$field])) {
                $this->sendError("El campo '$field' es requerido", 400);
                return;
            }
        }

        // Validar estructura de cantidad
        if (!isset($data['cantidad']['unitCode']) || !isset($data['cantidad']['value'])) {
            $this->sendError('El campo cantidad debe tener unitCode y value', 400);
            return;
        }

        // Construir body para la API externa (todos los campos como string)
        $payload = [
            'idMaterial' => (string)$data['idMaterial'],
            'idMaterialDestino' => (string)$data['idMaterialDestino'],
            'idLoteOrigen' => (string)$data['idLoteOrigen'],
            'idLoteDestino' => (string)$data['idLoteDestino'],
            'idSedeOrigen' => (string)$data['idSedeOrigen'],
            'idSedeDestino' => (string)$data['idSedeDestino'],
            'idAlmacenOrigen' => (string)$data['idAlmacenOrigen'],
            'idAlmacenDestino' => (string)$data['idAlmacenDestino'],
            'idAreaLogisticaOrigen' => (string)$data['idAreaLogisticaOrigen'],
            'idAreaLogisticaDestino' => (string)$data['idAreaLogisticaDestino'],
            'tipo' => 'C',
            'cantidad' => [
                'unitCode' => (string)$data['cantidad']['unitCode'],
                'value' => (string)$data['cantidad']['value']
            ]
        ];

        // Registrar JSON en error_log para debugging
        $jsonPayload = json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
        error_log('=== CREATE COMBINATION REQUEST ===');
        error_log('URL: ' . $this->baseUrl . 'CreateCombination');
        error_log('Payload JSON:');
        error_log($jsonPayload);
        error_log('===================================');

        try {
            $url = $this->baseUrl . 'CreateCombination';
            $response = $this->makeApiCall($url, 'POST', $payload);

            $statusCode = (int)($response['statusCode'] ?? 200);
            $status = (bool)($response['statusResult'] ?? false);

            // Manejar diferentes códigos de respuesta
            if ($statusCode === 200 && $status) {
                // Éxito
                $message = (string)($response['messageResult'] ?? 'Combinación creada exitosamente');
                $dataResult = $response['dataResult'] ?? null;
                $this->sendSuccess($dataResult, $message);
            } elseif ($statusCode === 400) {
                // Bad Request
                $msg = (string)($response['messageResult'] ?? 'Error en la solicitud');
                $dataResult = $response['dataResult'] ?? null;
                $this->sendError($msg, 400, $dataResult);
            } elseif ($statusCode === 409) {
                // Conflict - Error de SAP ByDesign
                $msg = (string)($response['messageResult'] ?? 'Conflicto al crear la combinación');
                $dataResult = $response['dataResult'] ?? null;
                
                // Si hay detalles de conflictos, agregarlos al mensaje
                if (is_array($dataResult) && !empty($dataResult)) {
                    $conflictos = [];
                    foreach ($dataResult as $conflicto) {
                        if (isset($conflicto['note'])) {
                            $conflictos[] = $conflicto['note'];
                        }
                    }
                    if (!empty($conflictos)) {
                        $msg .= ': ' . implode('; ', $conflictos);
                    }
                }
                
                $this->sendError($msg, 409, $dataResult);
            } elseif ($statusCode === 500) {
                // Internal Server Error
                $msg = (string)($response['messageResult'] ?? 'Error interno del servidor');
                $this->sendError($msg, 500);
            } else {
                // Otro error
                $msg = (string)($response['messageResult'] ?? 'Error al crear combinación');
                $this->sendError($msg, $statusCode);
            }
        } catch (Exception $e) {
            $this->sendError('Error al crear combinación: ' . $e->getMessage(), 500);
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
                'Accept: application/json',
            ],
        ]);

        if ($method === 'POST' && $data) {
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data, JSON_UNESCAPED_UNICODE));
        } elseif ($method === 'PUT' && $data) {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'PUT');
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data, JSON_UNESCAPED_UNICODE));
        } elseif ($method !== 'GET') {
            curl_setopt($ch, CURLOPT_CUSTOMREQUEST, $method);
            if ($data) {
                curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data, JSON_UNESCAPED_UNICODE));
            }
        }

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);

        curl_close($ch);

        if ($error) {
            throw new Exception('Error de conexión: ' . $error);
        }

        // Decodificar respuesta incluso si el código HTTP no es 200
        // La API puede devolver errores en formato JSON con códigos 400, 409, 500
        $decoded = json_decode($response, true);
        if (json_last_error() !== JSON_ERROR_NONE) {
            // Si no es JSON válido, lanzar excepción con el código HTTP
            throw new Exception('Error HTTP: ' . $httpCode . ' - Response: ' . $response);
        }

        // Agregar el código HTTP a la respuesta decodificada si no está presente
        if (!isset($decoded['statusCode'])) {
            $decoded['statusCode'] = $httpCode;
        }

        return $decoded;
    }

    /**
     * Enviar respuesta de éxito
     */
    private function sendSuccess($data, $message = 'Operación exitosa', $meta = null) {
        $payload = [
            'success' => true,
            'message' => $message,
            'data' => $data,
            'timestamp' => date('Y-m-d H:i:s'),
        ];

        // Meta opcional (por ejemplo, dataRecords)
        if (is_array($meta)) {
            $payload = array_merge($payload, $meta);
        }

        echo json_encode([
            ...$payload
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    /**
     * Enviar respuesta de error
     */
    private function sendError($message, $code = 500, $dataResult = null) {
        http_response_code($code);
        $response = [
            'success' => false,
            'message' => $message,
            'error_code' => $code,
            'timestamp' => date('Y-m-d H:i:s'),
        ];
        
        // Incluir dataResult si está presente (para errores 409 con detalles)
        if ($dataResult !== null) {
            $response['dataResult'] = $dataResult;
        }
        
        echo json_encode($response, JSON_UNESCAPED_UNICODE);
        exit;
    }
}

// Inicializar la clase
new CombinacionesEndpoints();
?>


