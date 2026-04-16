<?php
/**
 * Configuración de catálogos para el módulo de Préstamos
 * Versión: 1.0.0
 * 
 * Este archivo maneja la configuración del endpoint único de catálogos
 */
require_once __DIR__ . '/../../../config/api.php';

// Configuración del endpoint de catálogos (base en GSO/config/api.php)
define('CATALOGOS_ENDPOINT', rtrim(api_base('catalogos_bancos'), '/') . '/CatalogoCredito/GetAll');

/**
 * Obtener todos los catálogos desde el endpoint único
 * @return array Array con todos los catálogos o false si hay error
 */
function obtenerCatalogosCompletos() {
    try {
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, CATALOGOS_ENDPOINT);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 30);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Accept: application/json'
        ]);

        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        unset($ch);

        if ($error) {
            return false;
        }

        if ($httpCode !== 200) {
            return false;
        }

        $data = json_decode($response, true);
        
        if (!$data || !isset($data['isCorrect']) || !$data['isCorrect']) {
            return false;
        }

        return $data['data'];

    } catch (Exception $e) {
        return false;
    }
}

/**
 * Obtener solo los bancos
 * @return array Array de bancos o array vacío si hay error
 */
function obtenerBancos() {
    $catalogos = obtenerCatalogosCompletos();
    return $catalogos && isset($catalogos['bancos']) ? $catalogos['bancos'] : [];
}

/**
 * Obtener solo las líneas de crédito
 * @return array Array de líneas de crédito o array vacío si hay error
 */
function obtenerLineasCredito() {
    $catalogos = obtenerCatalogosCompletos();
    return $catalogos && isset($catalogos['lineasCredito']) ? $catalogos['lineasCredito'] : [];
}

/**
 * Obtener solo los tipos de cuota
 * @return array Array de tipos de cuota o array vacío si hay error
 */
function obtenerTiposCuota() {
    $catalogos = obtenerCatalogosCompletos();
    return $catalogos && isset($catalogos['tiposCuota']) ? $catalogos['tiposCuota'] : [];
}

/**
 * Obtener solo las condiciones
 * @return array Array de condiciones o array vacío si hay error
 */
function obtenerCondiciones() {
    $catalogos = obtenerCatalogosCompletos();
    return $catalogos && isset($catalogos['condiciones']) ? $catalogos['condiciones'] : [];
}

/**
 * Generar opciones HTML para un select
 * @param array $items Array de elementos
 * @param string $valueField Campo a usar como valor
 * @param string $textField Campo a usar como texto
 * @param string $selectedValue Valor seleccionado por defecto
 * @return string HTML de las opciones
 */
function generarOpcionesSelect($items, $valueField, $textField, $selectedValue = '') {
    $html = '';
    
    foreach ($items as $item) {
        $value = $item[$valueField] ?? '';
        $text = $item[$textField] ?? '';
        $selected = ($value == $selectedValue) ? 'selected' : '';
        
        $html .= "<option value=\"{$value}\" {$selected}>{$text}</option>";
    }
    
    return $html;
}

/**
 * Obtener líneas de crédito filtradas por banco
 * @param int $bankId ID del banco
 * @return array Array de líneas de crédito filtradas o array vacío si hay error
 */
function obtenerLineasCreditoPorBanco($bankId) {
    $catalogos = obtenerCatalogosCompletos();
    if (!$catalogos || !isset($catalogos['lineasCredito'])) {
        return [];
    }
    
    return array_filter($catalogos['lineasCredito'], function($linea) use ($bankId) {
        return isset($linea['bank_id']) && $linea['bank_id'] == $bankId;
    });
}
?>
