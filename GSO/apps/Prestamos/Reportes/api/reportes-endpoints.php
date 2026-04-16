<?php
/**
 * Endpoints de Reportes - Préstamos
 * URLs base en GSO/config/api.php (reportes, catalogos_bancos)
 */
header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET');
header('Access-Control-Allow-Headers: Content-Type');

if (session_status() === PHP_SESSION_NONE) {
    require_once __DIR__ . '/../../../../Login/session_config.php';
}
require_once __DIR__ . '/../../../../config/api.php';

$companyCode = $_SESSION['companyCode'] ?? '';
$companyId = $_SESSION['company_id'] ?? $companyCode ?? '';
date_default_timezone_set('America/Tegucigalpa');

class ReportesEndpoints {
    private $baseUrl;
    private $baseUrlBancos;
    private $timeout = 60;

    public function __construct() {
        $this->baseUrl = api_base('reportes');
        $this->baseUrlBancos = api_base('catalogos_bancos');
        $action = $_GET['action'] ?? '';
        try {
            switch ($action) {
                case 'getBancos':
                    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
                        $this->sendError('Método no permitido', 405);
                        return;
                    }
                    $this->getBancos();
                    break;
                case 'saldosPorMes':
                    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
                        $this->sendError('Método no permitido', 405);
                        return;
                    }
                    $this->saldosPorMes();
                    break;
                case 'pagosDetallePorMes':
                    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
                        $this->sendError('Método no permitido', 405);
                        return;
                    }
                    $this->pagosDetallePorMes();
                    break;
                case 'saldosLineasCredito':
                    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
                        $this->sendError('Método no permitido', 405);
                        return;
                    }
                    $this->saldosLineasCredito();
                    break;
                case 'capitalInteresPrestamo':
                    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
                        $this->sendError('Método no permitido', 405);
                        return;
                    }
                    $this->capitalInteresPrestamo();
                    break;
                case 'cuotasPorMes':
                    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
                        $this->sendError('Método no permitido', 405);
                        return;
                    }
                    $this->cuotasPorMes();
                    break;
                case 'facturasPendientesPago':
                    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
                        $this->sendError('Método no permitido', 405);
                        return;
                    }
                    $this->facturasPendientesPago();
                    break;
                case 'facturasPendientesPorMes':
                    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
                        $this->sendError('Método no permitido', 405);
                        return;
                    }
                    $this->facturasPendientesPorMes();
                    break;
                case 'facturasInteresNoProvisionado':
                    if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
                        $this->sendError('Método no permitido', 405);
                        return;
                    }
                    $this->facturasInteresNoProvisionado();
                    break;
                default:
                    $this->sendError('Acción no válida', 400);
                    break;
            }
        } catch (Exception $e) {
            $this->sendError('Error: ' . $e->getMessage(), 500);
        }
    }

    /**
     * GET /api/loans/reports/balances-by-month
     * Parámetros: company (sesión), mes, anio
     */
    private function saldosPorMes() {
        global $companyCode;
        if (empty($companyCode)) {
            $this->sendError('No se encontró el código de compañía en la sesión', 400);
            return;
        }
        $mes = isset($_GET['mes']) ? (int) $_GET['mes'] : 0;
        $anio = isset($_GET['anio']) ? (int) $_GET['anio'] : 0;
        if ($mes < 1 || $mes > 12) {
            $this->sendError('El mes debe ser entre 1 y 12', 400);
            return;
        }
        if ($anio < 2000 || $anio > 2100) {
            $this->sendError('El año debe ser válido', 400);
            return;
        }
        $url = $this->baseUrl . 'loans/reports/balances-by-month?company=' . urlencode($companyCode)
            . '&mes=' . $mes . '&anio=' . $anio;
        $full = $this->makeApiCall($url, 'GET', null, true);
        $httpCode = $full['httpCode'];
        $response = $full['response'];
        if ($httpCode === 200 && isset($response['success']) && $response['success'] === true) {
            $this->sendSuccess(isset($response['data']) ? $response['data'] : [], $response['message'] ?? 'Reporte obtenido');
            return;
        }
        $this->sendError($response['message'] ?? "Error HTTP: $httpCode", $httpCode >= 400 ? $httpCode : 500);
    }

    /**
     * GET /api/loans/reports/payments-detail-by-month
     * Parámetros: company (sesión), mes, anio
     */
    private function pagosDetallePorMes() {
        global $companyCode;
        if (empty($companyCode)) {
            $this->sendError('No se encontró el código de compañía en la sesión', 400);
            return;
        }
        $mes = isset($_GET['mes']) ? (int) $_GET['mes'] : 0;
        $anio = isset($_GET['anio']) ? (int) $_GET['anio'] : 0;
        if ($mes < 1 || $mes > 12) {
            $this->sendError('El mes debe ser entre 1 y 12', 400);
            return;
        }
        if ($anio < 2000 || $anio > 2100) {
            $this->sendError('El año debe ser válido', 400);
            return;
        }
        $url = $this->baseUrl . 'loans/reports/payments-detail-by-month?company=' . urlencode($companyCode)
            . '&mes=' . $mes . '&anio=' . $anio;
        $full = $this->makeApiCall($url, 'GET', null, true);
        $httpCode = $full['httpCode'];
        $response = $full['response'];
        if ($httpCode === 200 && isset($response['success']) && $response['success'] === true) {
            $this->sendSuccess(isset($response['data']) ? $response['data'] : [], $response['message'] ?? 'Reporte obtenido');
            return;
        }
        $this->sendError($response['message'] ?? "Error HTTP: $httpCode", $httpCode >= 400 ? $httpCode : 500);
    }

    /**
     * GET /api/SAP_Maestro_Bancos/GetAll/{company_id} (API 8030)
     * Devuelve lista de bancos para el dropdown del reporte Saldos líneas de crédito.
     */
    private function getBancos() {
        global $companyId;
        if ($companyId === '' && isset($_GET['company_id'])) {
            $companyId = $_GET['company_id'];
        }
        if ($companyId === '') {
            $this->sendError('No se encontró company_id en la sesión. Indique company_id en la URL o en sesión.', 400);
            return;
        }
        $url = $this->baseUrlBancos . 'SAP_Maestro_Bancos/GetAll/' . urlencode((string) $companyId);
        $full = $this->makeApiCall($url, 'GET', null, true);
        $httpCode = $full['httpCode'];
        $response = $full['response'];
        if ($httpCode === 200 && !empty($response['isCorrect']) && isset($response['data'])) {
            $list = is_array($response['data']) ? $response['data'] : [];
            $this->sendSuccess($list, $response['message'] ?? 'Bancos obtenidos');
            return;
        }
        $this->sendError($response['message'] ?? "Error HTTP: $httpCode", $httpCode >= 400 ? $httpCode : 500);
    }

    /**
     * GET /api/loans/reports/credit-lines-balance (API 4005)
     * Parámetro opcional: bank_id (si no se envía, se devuelven todos).
     */
    private function saldosLineasCredito() {
        global $companyCode;
        if (empty($companyCode)) {
            $this->sendError('No se encontró el código de compañía en la sesión', 400);
            return;
        }
        $url = $this->baseUrl . 'loans/reports/credit-lines-balance?company=' . urlencode($companyCode);
        $bankId = isset($_GET['bank_id']) ? trim((string) $_GET['bank_id']) : '';
        if ($bankId !== '') {
            $url .= '&bank_id=' . urlencode($bankId);
        }
        $full = $this->makeApiCall($url, 'GET', null, true);
        $httpCode = $full['httpCode'];
        $response = $full['response'];
        if ($httpCode === 200 && isset($response['success']) && $response['success'] === true) {
            $this->sendSuccess(isset($response['data']) ? $response['data'] : [], $response['message'] ?? 'Reporte obtenido');
            return;
        }
        $this->sendError($response['message'] ?? "Error HTTP: $httpCode", $httpCode >= 400 ? $httpCode : 500);
    }

    /**
     * GET /api/loans/reports/loans-capital-interest
     * Parámetros: company (sesión), f_invoice_desde (Y-m-d), f_invoice_hasta (Y-m-d)
     */
    private function capitalInteresPrestamo() {
        global $companyCode;
        if (empty($companyCode)) {
            $this->sendError('No se encontró el código de compañía en la sesión', 400);
            return;
        }
        $desde = isset($_GET['f_invoice_desde']) ? trim((string) $_GET['f_invoice_desde']) : '';
        $hasta = isset($_GET['f_invoice_hasta']) ? trim((string) $_GET['f_invoice_hasta']) : '';
        if ($desde === '' || $hasta === '') {
            $this->sendError('Se requieren f_invoice_desde y f_invoice_hasta (formato Y-m-d).', 400);
            return;
        }
        $url = $this->baseUrl . 'loans/reports/loans-capital-interest?company=' . urlencode($companyCode)
            . '&f_invoice_desde=' . urlencode($desde) . '&f_invoice_hasta=' . urlencode($hasta);
        $full = $this->makeApiCall($url, 'GET', null, true);
        $httpCode = $full['httpCode'];
        $response = $full['response'];
        if ($httpCode === 200 && isset($response['success']) && $response['success'] === true) {
            $this->sendSuccess(isset($response['data']) ? $response['data'] : [], $response['message'] ?? 'Reporte obtenido');
            return;
        }
        $this->sendError($response['message'] ?? "Error HTTP: $httpCode", $httpCode >= 400 ? $httpCode : 500);
    }

    /**
     * GET /api/loans/reports/installments-by-month
     * Parámetros: company (sesión), mes, anio
     */
    private function cuotasPorMes() {
        global $companyCode;
        if (empty($companyCode)) {
            $this->sendError('No se encontró el código de compañía en la sesión', 400);
            return;
        }
        $mes = isset($_GET['mes']) ? (int) $_GET['mes'] : 0;
        $anio = isset($_GET['anio']) ? (int) $_GET['anio'] : 0;
        if ($mes < 1 || $mes > 12) {
            $this->sendError('El mes debe ser entre 1 y 12', 400);
            return;
        }
        if ($anio < 2000 || $anio > 2100) {
            $this->sendError('El año debe ser válido', 400);
            return;
        }
        $url = $this->baseUrl . 'loans/reports/installments-by-month?company=' . urlencode($companyCode)
            . '&mes=' . $mes . '&anio=' . $anio;
        $full = $this->makeApiCall($url, 'GET', null, true);
        $httpCode = $full['httpCode'];
        $response = $full['response'];
        if ($httpCode === 200 && isset($response['success']) && $response['success'] === true) {
            $this->sendSuccess(isset($response['data']) ? $response['data'] : [], $response['message'] ?? 'Reporte obtenido');
            return;
        }
        $this->sendError($response['message'] ?? "Error HTTP: $httpCode", $httpCode >= 400 ? $httpCode : 500);
    }

    /**
     * GET /api/loans/reports/pending-installments
     * Parámetros: company (sesión), mes, anio
     */
    private function facturasPendientesPago() {
        global $companyCode;
        if (empty($companyCode)) {
            $this->sendError('No se encontró el código de compañía en la sesión', 400);
            return;
        }
        $mes = isset($_GET['mes']) ? (int) $_GET['mes'] : 0;
        $anio = isset($_GET['anio']) ? (int) $_GET['anio'] : 0;
        if ($mes < 1 || $mes > 12) {
            $this->sendError('El mes debe ser entre 1 y 12', 400);
            return;
        }
        if ($anio < 2000 || $anio > 2100) {
            $this->sendError('El año debe ser válido', 400);
            return;
        }
        $url = $this->baseUrl . 'loans/reports/pending-installments?company=' . urlencode($companyCode)
            . '&mes=' . $mes . '&anio=' . $anio;
        $full = $this->makeApiCall($url, 'GET', null, true);
        $httpCode = $full['httpCode'];
        $response = $full['response'];
        if ($httpCode === 200 && isset($response['success']) && $response['success'] === true) {
            $this->sendSuccess(isset($response['data']) ? $response['data'] : [], $response['message'] ?? 'Reporte obtenido');
            return;
        }
        $this->sendError($response['message'] ?? "Error HTTP: $httpCode", $httpCode >= 400 ? $httpCode : 500);
    }

    /**
     * GET /api/loans/reports/pending-invoices-by-month
     * Parámetros: company (sesión), mes, anio
     */
    private function facturasPendientesPorMes() {
        global $companyCode;
        if (empty($companyCode)) {
            $this->sendError('No se encontró el código de compañía en la sesión', 400);
            return;
        }
        $mes = isset($_GET['mes']) ? (int) $_GET['mes'] : 0;
        $anio = isset($_GET['anio']) ? (int) $_GET['anio'] : 0;
        if ($mes < 1 || $mes > 12) {
            $this->sendError('El mes debe ser entre 1 y 12', 400);
            return;
        }
        if ($anio < 2000 || $anio > 2100) {
            $this->sendError('El año debe ser válido', 400);
            return;
        }
        $url = $this->baseUrl . 'loans/reports/pending-invoices-by-month?company=' . urlencode($companyCode)
            . '&mes=' . $mes . '&anio=' . $anio;
        $full = $this->makeApiCall($url, 'GET', null, true);
        $httpCode = $full['httpCode'];
        $response = $full['response'];
        if ($httpCode === 200 && isset($response['success']) && $response['success'] === true) {
            $this->sendSuccess(isset($response['data']) ? $response['data'] : [], $response['message'] ?? 'Reporte obtenido');
            return;
        }
        $this->sendError($response['message'] ?? "Error HTTP: $httpCode", $httpCode >= 400 ? $httpCode : 500);
    }

    /**
     * GET /api/loans/reports/unprovisioned-invoices-by-month
     * Parámetros: company (sesión), mes, anio
     */
    private function facturasInteresNoProvisionado() {
        global $companyCode;
        if (empty($companyCode)) {
            $this->sendError('No se encontró el código de compañía en la sesión', 400);
            return;
        }
        $mes = isset($_GET['mes']) ? (int) $_GET['mes'] : 0;
        $anio = isset($_GET['anio']) ? (int) $_GET['anio'] : 0;
        if ($mes < 1 || $mes > 12) {
            $this->sendError('El mes debe ser entre 1 y 12', 400);
            return;
        }
        if ($anio < 2000 || $anio > 2100) {
            $this->sendError('El año debe ser válido', 400);
            return;
        }
        $url = $this->baseUrl . 'loans/reports/unprovisioned-invoices-by-month?company=' . urlencode($companyCode)
            . '&mes=' . $mes . '&anio=' . $anio;
        $full = $this->makeApiCall($url, 'GET', null, true);
        $httpCode = $full['httpCode'];
        $response = $full['response'];
        if ($httpCode === 200 && isset($response['success']) && $response['success'] === true) {
            $this->sendSuccess(isset($response['data']) ? $response['data'] : [], $response['message'] ?? 'Reporte obtenido');
            return;
        }
        $this->sendError($response['message'] ?? "Error HTTP: $httpCode", $httpCode >= 400 ? $httpCode : 500);
    }

    private function sendSuccess($data, $message = 'OK') {
        http_response_code(200);
        echo json_encode([
            'success' => true,
            'message' => $message,
            'data' => $data,
            'timestamp' => date('Y-m-d H:i:s')
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    private function sendError($message, $code = 500) {
        http_response_code($code >= 400 && $code < 600 ? $code : 500);
        echo json_encode([
            'success' => false,
            'message' => $message,
            'timestamp' => date('Y-m-d H:i:s')
        ], JSON_UNESCAPED_UNICODE);
        exit;
    }

    private function makeApiCall($url, $method = 'GET', $data = null, $returnFullResponse = false) {
        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => $this->timeout,
            CURLOPT_CUSTOMREQUEST => $method,
            CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json']
        ]);
        if ($data !== null && ($method === 'POST' || $method === 'PUT')) {
            curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data, JSON_UNESCAPED_UNICODE));
        }
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        if ($error) {
            throw new Exception("cURL: $error");
        }
        $decoded = [];
        if ($response !== false && $response !== '') {
            $decoded = json_decode($response, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                $decoded = ['message' => 'Respuesta no JSON'];
            }
        }
        if ($returnFullResponse) {
            return ['httpCode' => $httpCode, 'response' => $decoded];
        }
        if ($httpCode < 200 || $httpCode >= 300) {
            throw new Exception(($decoded['message'] ?? "HTTP $httpCode"));
        }
        return $decoded;
    }
}

new ReportesEndpoints();
