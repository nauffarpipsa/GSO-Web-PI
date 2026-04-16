<?php
/**
 * Helper PHP para integrar con el servidor WebSocket
 * Proporciona funciones para gestionar sesiones y comunicarse con el servidor WebSocket
 */

class WebSocketSessionHelper {
    private $websocketUrl;
    
    public function __construct($websocketUrl = 'http://192.168.10.80:4002') {
        $this->websocketUrl = $websocketUrl;
    }

    /**
     * Obtiene todas las sesiones activas desde el servidor WebSocket
     * @return array Lista de sesiones activas
     */
    public function getActiveSessions() {
        $ch = curl_init($this->websocketUrl . '/api/sessions');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        unset($ch);
        
        if ($httpCode === 200 && $response) {
            $data = json_decode($response, true);
            return $data['sessions'] ?? [];
        }
        
        return [];
    }

    /**
     * Cierra una sesión específica en el servidor WebSocket
     * @param string $sessionId ID de la sesión a cerrar
     * @param string $reason Razón del cierre
     * @return bool True si se cerró exitosamente
     */
    public function closeSession($sessionId, $reason = 'Cerrado desde PHP') {
        $url = $this->websocketUrl . '/api/sessions/' . urlencode($sessionId) . '/close';
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['reason' => $reason]));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        unset($ch);
        
        if ($httpCode === 200 && $response) {
            $data = json_decode($response, true);
            return $data['success'] ?? false;
        }
        
        return false;
    }

    /**
     * Cierra todas las sesiones de un usuario específico
     * @param string $userId ID del usuario
     * @return int Número de sesiones cerradas
     */
    public function closeUserSessions($userId) {
        $sessions = $this->getActiveSessions();
        $closed = 0;
        
        foreach ($sessions as $session) {
            if ($session['userId'] === $userId) {
                if ($this->closeSession($session['sessionId'], 'Cerradas todas las sesiones del usuario')) {
                    $closed++;
                }
            }
        }
        
        return $closed;
    }

    /**
     * Verifica el estado del servidor WebSocket
     * @return array|false Estado del servidor o false si no está disponible
     */
    public function getServerStatus() {
        $ch = curl_init($this->websocketUrl . '/health');
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 3);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        unset($ch);
        
        if ($httpCode === 200 && $response) {
            return json_decode($response, true);
        }
        
        return false;
    }
    
    /**
     * Verifica si el servidor WebSocket está disponible
     * @return bool True si está disponible
     */
    public function isServerAvailable() {
        return $this->getServerStatus() !== false;
    }

    /**
     * Cierra todas las sesiones activas en el servidor WebSocket
     * @param string $reason Razón del cierre masivo
     * @return array|false Array con información del resultado o false si falla
     */
    public function closeAllSessions($reason = 'Todas las sesiones cerradas por administrador') {
        $url = $this->websocketUrl . '/api/sessions/close-all';
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_CUSTOMREQUEST, 'POST');
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode(['reason' => $reason]));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json'
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        unset($ch);
        
        if ($httpCode === 200 && $response) {
            $data = json_decode($response, true);
            return $data;
        }
        
        return false;
    }

    /**
     * Crea y envía un anuncio a los usuarios conectados
     * @param string $type Tipo de anuncio: 'info', 'warning', 'error', 'maintenance', 'success'
     * @param string $title Título del anuncio
     * @param string $message Mensaje del anuncio
     * @param int|null $gracePeriod Tiempo de gracia en minutos antes de cerrar sesiones (opcional)
     * @param bool $closeSessionsAfter Si cerrar sesiones después del tiempo de gracia (opcional)
     * @param string|null $targetUserId ID del usuario específico (null para todos los usuarios)
     * @return array|false Array con información del resultado o false si falla
     */
    public function createAnnouncement($type, $title, $message, $gracePeriod = null, $closeSessionsAfter = false, $targetUserId = null) {
        $url = $this->websocketUrl . '/api/announcements';
        
        $data = [
            'type' => $type,
            'title' => $title,
            'message' => $message
        ];
        
        if ($gracePeriod !== null) {
            $data['gracePeriod'] = $gracePeriod;
        }
        
        // Siempre enviar closeSessionsAfter como booleano explícito
        $data['closeSessionsAfter'] = (bool)$closeSessionsAfter;
        
        if ($targetUserId !== null) {
            $data['targetUserId'] = $targetUserId;
        }
        
        // Debug: Log de datos que se envían
        error_log("DEBUG WebSocketHelper - Datos enviados: " . json_encode($data));
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode($data));
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Content-Type: application/json',
            'Accept: application/json'
        ]);
        curl_setopt($ch, CURLOPT_TIMEOUT, 10);
        curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, false);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $curlError = curl_error($ch);
        
        // Debug: Log de respuesta
        error_log("DEBUG WebSocketHelper - Respuesta HTTP: $httpCode, Body: " . substr($response, 0, 200));
        if ($curlError) {
            error_log("DEBUG WebSocketHelper - Error cURL: " . $curlError);
        }
        
        unset($ch);
        
        if ($curlError) {
            error_log("ERROR WebSocketHelper - Error de conexión: " . $curlError);
            return ['success' => false, 'error' => 'Error de conexión: ' . $curlError];
        }
        
        if ($httpCode === 200 && $response) {
            $result = json_decode($response, true);
            if (json_last_error() !== JSON_ERROR_NONE) {
                error_log("ERROR WebSocketHelper - Error al decodificar JSON: " . json_last_error_msg());
                error_log("ERROR WebSocketHelper - Respuesta recibida: " . substr($response, 0, 500));
                return ['success' => false, 'error' => 'Error al decodificar respuesta del servidor: ' . json_last_error_msg()];
            }
            return $result;
        }
        
        // Si no es 200, intentar decodificar el error
        $errorResponse = null;
        if ($response) {
            $errorResponse = json_decode($response, true);
        }
        
        $errorMsg = 'Error HTTP ' . $httpCode;
        if ($errorResponse && isset($errorResponse['error'])) {
            $errorMsg = $errorResponse['error'];
        } elseif ($response) {
            $errorMsg = substr($response, 0, 200);
        }
        
        error_log("ERROR WebSocketHelper - HTTP Code: $httpCode, Response: " . substr($response, 0, 500));
        return ['success' => false, 'error' => $errorMsg, 'httpCode' => $httpCode];
    }

    /**
     * Obtiene todos los anuncios activos
     * @return array|false Array de anuncios activos o false si falla
     */
    public function getActiveAnnouncements() {
        $url = $this->websocketUrl . '/api/announcements';
        
        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_TIMEOUT, 5);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        unset($ch);
        
        if ($httpCode === 200 && $response) {
            $data = json_decode($response, true);
            return $data['announcements'] ?? [];
        }
        
        return false;
    }
}

// Crear alias para retrocompatibilidad
class_alias('WebSocketSessionHelper', 'WebSocketHelper');
?>

