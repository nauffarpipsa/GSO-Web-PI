<?php
/**
 * Configuración segura de sesiones PHP
 * Establece cookies HttpOnly, Secure (si HTTPS) y SameSite
 */

if (session_status() === PHP_SESSION_NONE) {
    // Configurar parámetros de cookies de sesión antes de iniciar
    $cookieParams = [
        'lifetime' => 0, // Sesión expira al cerrar el navegador
        'path' => '/',
        'domain' => '', // Dominio actual
        'secure' => isset($_SERVER['HTTPS']) && $_SERVER['HTTPS'] === 'on', // Solo HTTPS si está disponible
        'httponly' => true, // HttpOnly: no accesible desde JavaScript
        'samesite' => 'Lax' // Protección CSRF: Lax permite navegación normal pero bloquea cross-site POST
    ];
    
    session_set_cookie_params($cookieParams);
    session_start();
}
