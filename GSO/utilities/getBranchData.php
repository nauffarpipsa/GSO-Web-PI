<?php
// Headers CORS para permitir acceso desde cualquier origen
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, PUT, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization, X-Requested-With');

// Manejar preflight OPTIONS requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Verificar si el usuario está autenticado
if (!isset($_SESSION['user'])) {
    http_response_code(401);
    echo json_encode(['error' => 'No autorizado']);
    exit;
}

// Configurar headers para JSON
header('Content-Type: application/json');

// Función para obtener datos de sucursales
function getBranchData() {
    $response = [
        'success' => true,
        'data' => []
    ];
    
    if (isset($_SESSION['branchs']) && is_array($_SESSION['branchs'])) {
        $response['data']['branchs'] = $_SESSION['branchs'];
    }
    
    if (isset($_SESSION['allLocations']) && is_array($_SESSION['allLocations'])) {
        $response['data']['locations'] = $_SESSION['allLocations'];
    }
    
    return $response;
}

// Función para obtener solo sucursales (para combobox de Sede)
function getBranchesOnly() {
    $response = [
        'success' => true,
        'data' => []
    ];
    
    if (isset($_SESSION['branchs']) && is_array($_SESSION['branchs'])) {
        $branches = [];
        foreach ($_SESSION['branchs'] as $branch) {
            $branches[] = [
                'value' => $branch['branch_code'],           // Valor: branch_code
                'text' => $branch['branch_description']      // Texto: branch_description
            ];
        }
        $response['data']['branchs'] = $branches;
    }
    
    return $response;
}

// Función para obtener ubicaciones de una sucursal específica
function getLocationsByBranch($branchCode) {
    $response = [
        'success' => true,
        'data' => []
    ];
    
    if (isset($_SESSION['branchs']) && is_array($_SESSION['branchs'])) {
        foreach ($_SESSION['branchs'] as $branch) {
            if ($branch['branch_code'] === $branchCode && isset($branch['locations'])) {
                $locations = [];
                foreach ($branch['locations'] as $location) {
                    $locations[] = [
                        'value' => $location['path'],        // Valor: path
                        'text' => $location['description']   // Texto: description
                    ];
                }
                $response['data']['locations'] = $locations;
                break;
            }
        }
    }
    
    return $response;
}

// Función para obtener solo ubicaciones (para combobox de Impresoras)
function getLocationsOnly() {
    $response = [
        'success' => true,
        'data' => []
    ];
    
    if (isset($_SESSION['allLocations']) && is_array($_SESSION['allLocations'])) {
        $locations = [];
        foreach ($_SESSION['allLocations'] as $location) {
            $locations[] = [
                'value' => $location['path'],        // Valor: path
                'text' => $location['description']   // Texto: description
            ];
        }
        $response['data']['locations'] = $locations;
    }
    
    return $response;
}

// Manejar diferentes tipos de solicitudes
$type = $_GET['type'] ?? 'all';

switch ($type) {
    case 'branchs':
        echo json_encode(getBranchesOnly());
        break;
    case 'locations':
        echo json_encode(getLocationsOnly());
        break;
    case 'branch_locations':
        $branchCode = $_GET['branch_code'] ?? '';
        if (empty($branchCode)) {
            http_response_code(400);
            echo json_encode(['error' => 'branch_code es requerido']);
            exit;
        }
        echo json_encode(getLocationsByBranch($branchCode));
        break;
    case 'all':
    default:
        echo json_encode(getBranchData());
        break;
}
?> 