<?php
/**

 * Uso desde PHP:
 *   require_once __DIR__ . '/../config/api.php';     // desde GSO/Login
 *   require_once __DIR__ . '/../../config/api.php';   // desde GSO/apps/...
 *   $baseUrl = api_base('prestamos_sap');
 *
 */

if (!function_exists('api_base')) {
    /**
     * Devuelve la URL base de un servicio de API.
     * @param string $key Clave del servicio (ej: 'auth', 'prestamos_sap')
     * @return string URL base con trailing slash cuando aplica
     */
    function api_base($key) {
        $config = api_config();
        return isset($config[$key]) ? $config[$key] : '';
    }
}

if (!function_exists('api_config')) {
    /**
     * Devuelve el array completo de configuración de APIs.
     * @return array
     */
    function api_config() {
        static $config = null;
        if ($config === null) {
            $config = [ 
                // --- Autenticación y usuarios (puerto 8021)
                'auth'              => 'http://192.168.10.81:8021/api/',
                'pagos_sap'         => 'http://192.168.10.81:8022/api/',   // Facturas, pagos, Invoice, Payment

                // --- Préstamos SAP (puerto 8031)
                'prestamos_sap'     => 'http://192.168.10.81:8030/api/',   // Maestro préstamos, bancos, catálogos

                // --- Combinaciones (puerto 8022)
                'combinaciones_sap' => 'http://192.168.10.81:8022/api/Combination/',   // GetProductCategory, GetInventory, CreateCombination

                // --- Reports (puerto 8021)--Test
                'report-viewer'          => 'http://192.168.10.81:8022/api',    // Módulo de créditos, reportes, etc.

                // --- Catálogos y maestros compartidos (puerto 8030)
                'catalogos_bancos'  => 'http://192.168.10.81:8030/api/',   // CatalogoCredito, SAP_Maestro_Bancos, etc.

                // --- Amortización (puerto 4003)
                'amortizacion'      => 'http://192.168.10.81:4005/api/',   // loans/amortization, invoice-ipm, etc.

                // --- Procesos manuales (puerto 4004)
                'proceso_manual'    => 'http://192.168.10.81:4006/api/',   // loans/execute

                // --- Reportes (puerto 4005)
                'reportes'          => 'http://192.168.10.81:4005/api/',   // loans/reports/*

                // --- Documentos y etiquetas (puerto 8002)
                'documentos'        => 'http://192.168.10.81:8002',       // document/*, label/* (sin /api)

                // --- WebSocket sesiones (localhost)
                'websocket'         => 'http://192.168.10.81:4002',

                // --- OData / Corporativo (puerto 3002)
                'corporativo_odata' => 'http://192.168.10.81:3002/Corporativo',

                // --- Tareas / Automatización (puerto 8021)
                'tasks'             => 'http://192.168.10.81:8021/api',   // TbTask, StatementTask, WhatsAppTask, etc.
            ];
        }
        return $config;
    }
}

// Constantes opcionales para migración gradual (evitar strings mágicos)
defined('API_AUTH')           or define('API_AUTH',           api_config()['auth']);
defined('API_PAGOS_SAP')       or define('API_PAGOS_SAP',      api_config()['pagos_sap']);
defined('API_PRESTAMOS_SAP')   or define('API_PRESTAMOS_SAP',  api_config()['prestamos_sap']);
defined('API_COMBINACIONES_SAP') or define('API_COMBINACIONES_SAP', api_config()['combinaciones_sap']);
defined('API_REPORT_VIEWER')        or define('API_REPORT_VIEWER',       api_config()['report-viewer']);
defined('API_CATALOGOS_BANCOS') or define('API_CATALOGOS_BANCOS', api_config()['catalogos_bancos']);
defined('API_AMORTIZACION')    or define('API_AMORTIZACION',   api_config()['amortizacion']);
defined('API_PROCESO_MANUAL')  or define('API_PROCESO_MANUAL', api_config()['proceso_manual']);
defined('API_REPORTES')        or define('API_REPORTES',       api_config()['reportes']);
defined('API_DOCUMENTOS')      or define('API_DOCUMENTOS',     api_config()['documentos']);
defined('API_TASKS')           or define('API_TASKS',          api_config()['tasks']);
defined('API_WEBSOCKET')       or define('API_WEBSOCKET',      api_config()['websocket']);
defined('API_CORPORATIVO_ODATA') or define('API_CORPORATIVO_ODATA', api_config()['corporativo_odata']);

return api_config();
