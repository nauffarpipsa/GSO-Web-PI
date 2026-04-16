<?php
// Procesar el logout en el servidor
// Usar configuración segura de sesión (HttpOnly cookies)
if (session_status() === PHP_SESSION_NONE) {
    require_once __DIR__ . '/session_config.php';
}

// Limpiar todas las variables de sesión
session_unset();

// Destruir la sesión solo si está activa
if (session_status() === PHP_SESSION_ACTIVE) {
    session_destroy();
}

// NOTA: NO eliminamos la cookie de "remember me" al hacer logout
// La cookie de "remember me" debe persistir para que el usuario pueda
// volver a iniciar sesión sin tener que escribir su username nuevamente.
// La cookie solo se elimina cuando:
// 1. El usuario desmarca "remember me" en el login
// 2. El usuario explícitamente quiere limpiar sus credenciales guardadas
// No redirigir aquí, dejar que JavaScript maneje la redirección
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Cerrando sesión...</title>
    <!-- Socket.IO para cerrar sesión en WebSocket -->
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
    <style>
        body {
            font-family: Arial, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
            margin: 0;
            background-color: #f5f5f5;
        }
        .logout-container {
            text-align: center;
            padding: 2rem;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        .spinner {
            border: 4px solid #f3f3f3;
            border-top: 4px solid #3498db;
            border-radius: 50%;
            width: 40px;
            height: 40px;
            animation: spin 1s linear infinite;
            margin: 0 auto 1rem;
        }
        @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
        }
    </style>
</head>
<body>
    <div class="logout-container">
        <div class="spinner"></div>
        <h3>Cerrando sesión...</h3>
        <p>Limpiando datos de sesión...</p>
    </div>

    <script>
        // Limpiar localStorage
        function limpiarLocalStorage() {
            try {
                // Limpiar páginas recientes
                localStorage.removeItem('paginasRecientes');
                
                // Limpiar cualquier otro dato de sesión que pueda estar en localStorage
                const keysToRemove = [];
                for (let i = 0; i < localStorage.length; i++) {
                    const key = localStorage.key(i);
                    if (key && (key.includes('session') || key.includes('user') || key.includes('auth'))) {
                        keysToRemove.push(key);
                    }
                }
                
                keysToRemove.forEach(key => {
                    localStorage.removeItem(key);
                });
                
                console.log('LocalStorage limpiado exitosamente');
            } catch (error) {
                console.error('Error al limpiar localStorage:', error);
            }
        }

        // Ejecutar limpieza y redirigir
        document.addEventListener('DOMContentLoaded', function() {
            // Cerrar sesión en WebSocket si existe
            if (window.wsMonitor && typeof window.wsMonitor.logout === 'function') {
                window.wsMonitor.logout('Logout manual');
            }
            
            // Limpiar localStorage
            limpiarLocalStorage();
            
            // Pequeña pausa para mostrar el mensaje de limpieza
            setTimeout(function() {
                // Redirigir a la página de login
                window.location.href = '/Corporativo/GSO/authentication/layouts/corporate/sign-in.html';
            }, 1000);
        });
    </script>
</body>
</html>