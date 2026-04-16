# 🔌 Integración WebSocket - Sistema de Sesiones Remotas

## 📋 Descripción

Este sistema permite monitorear y cerrar sesiones de usuarios en tiempo real usando WebSockets con Docker y Redis, sin necesidad de que el usuario recargue la página.

## 🎯 Funcionalidades

- ✅ **Monitoreo en tiempo real** de sesiones activas
- ✅ **Cierre remoto de sesiones** desde panel de administración
- ✅ **Notificación automática** al usuario cuando su sesión es cerrada
- ✅ **Lista de usuarios conectados** en tiempo real
- ✅ **Sistema de anuncios** para comunicar mensajes a usuarios
- ✅ **Cierre automático de sesiones** con tiempo de gracia
- ✅ **Compatible** con el sistema de sesiones PHP existente
- ✅ **Escalable** con Redis y Docker
- ✅ **Validación estricta** de usuarios (no permite guests)

## 📁 Archivos Integrados

### Nuevos Archivos:
- `assets/js/websocket-client.js` - Cliente JavaScript para WebSocket
- `utilities/WebSocketHelper.php` - Helper PHP para comunicarse con el servidor
- `admin/sesiones-activas.php` - Panel de administración de sesiones

### Archivos Modificados:
- `index.php` - Incluye conexión automática al WebSocket
- `Login/Logout.php` - Cierra sesión en WebSocket al hacer logout

## 🚀 Uso

### 1. Iniciar el Servidor WebSocket

Abre una terminal en `C:\wamp64\www\WebSocketJS` y ejecuta:

```bash
cd C:\wamp64\www\WebSocketJS

# Construir y levantar servicios (primera vez)
docker-compose up -d

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

El servidor se iniciará en `http://192.168.10.80:4002` con Redis en el contenedor

### 2. Verificar que el Servidor está Corriendo

Abre en el navegador:
```
http://192.168.10.80:4002/health
```

Deberías ver:
```json
{
  "status": "ok",
  "activeConnections": 0,
  "activeSessions": 0
}
```

### 3. Usar en tu Aplicación

#### La conexión ya está integrada en `index.php`:
- Al iniciar sesión, automáticamente se conecta al WebSocket
- La sesión se registra en el servidor
- Si un admin cierra la sesión, el usuario es redirigido automáticamente

#### Para acceder al panel de administración:
```
http://localhost/Corporativo/GSO/admin/sesiones-activas.php
```

Desde ahí podrás:
- Ver todas las sesiones activas
- Ver información de cada usuario conectado
- Cerrar sesiones remotamente

## 📝 Ejemplo de Uso en Otro Módulo

Si quieres conectar otro módulo al WebSocket:

```php
<?php include '../Login/validar_sesion.php'; ?>
<!DOCTYPE html>
<html>
<head>
    <title>Mi Módulo</title>
    <!-- Socket.IO -->
    <script src="https://cdn.socket.io/4.7.2/socket.io.min.js"></script>
    <!-- Cliente WebSocket -->
    <script src="../assets/js/websocket-client.js"></script>
</head>
<body>
    <!-- Tu contenido -->
    
    <script>
        document.addEventListener('DOMContentLoaded', function() {
            const sessionId = '<?php echo session_id(); ?>';
            const userId = '<?php echo $_SESSION['employeeCode'] ?? ''; ?>';
            const username = '<?php echo htmlspecialchars($_SESSION['userName'] ?? 'Usuario', ENT_QUOTES); ?>';
            
            if (sessionId && userId) {
                const wsMonitor = new SessionMonitor('http://192.168.10.80:4002');
                wsMonitor.connect(sessionId, userId, {
                    username: username,
                    page: 'mi-modulo'
                });
                
                // Manejar cierre remoto
                wsMonitor.onSessionClosed = function(data) {
                    window.location.href = '../Login/Logout.php';
                };
                
                window.wsMonitor = wsMonitor;
            }
        });
    </script>
</body>
</html>
```

## 🔧 Cerrar Sesiones desde PHP

### Cerrar una sesión específica:

```php
<?php
require_once '../utilities/WebSocketHelper.php';

$wsHelper = new WebSocketSessionHelper('http://192.168.10.80:4002');

// Cerrar sesión por ID
$sessionId = 'abc123...';
if ($wsHelper->closeSession($sessionId, 'Cerrado por administrador')) {
    echo 'Sesión cerrada exitosamente';
}
?>
```

### Cerrar todas las sesiones de un usuario:

```php
<?php
$userId = '2258'; // employeeCode del usuario
$numCerradas = $wsHelper->closeUserSessions($userId, 'Sesiones duplicadas');
echo "Se cerraron $numCerradas sesiones";
?>
```

### Cerrar todas las sesiones:

```php
<?php
$result = $wsHelper->closeAllSessions('Mantenimiento programado');
if ($result && $result['success']) {
    echo "Se cerraron " . $result['totalClosed'] . " sesiones";
}
?>
```

### Obtener sesiones activas:

```php
<?php
$sesiones = $wsHelper->getActiveSessions();
foreach ($sesiones as $sesion) {
    echo "Usuario: " . $sesion['userData']['username'];
    echo "Conectado: " . $sesion['connectedAt'];
}
?>
```

## 📢 Sistema de Anuncios

El sistema de anuncios permite enviar mensajes a usuarios conectados en tiempo real. Los anuncios se muestran automáticamente cuando se reciben.

### Crear un Anuncio

```php
<?php
require_once '../utilities/WebSocketHelper.php';

$wsHelper = new WebSocketSessionHelper('http://192.168.10.80:4002');

// Anuncio simple de información
$result = $wsHelper->createAnnouncement(
    'info',                              // Tipo: info, warning, error, maintenance, success
    'Nueva actualización disponible',    // Título
    'Se ha publicado una nueva versión del sistema' // Mensaje
);

// Anuncio de mantenimiento con tiempo de gracia
$result = $wsHelper->createAnnouncement(
    'maintenance',
    'Mantenimiento programado',
    'El sistema se cerrará en 10 minutos para mantenimiento',
    10,      // Tiempo de gracia en minutos
    true     // Cerrar sesiones después del tiempo de gracia
);

// Anuncio para un usuario específico
$result = $wsHelper->createAnnouncement(
    'warning',
    'Atención requerida',
    'Tienes documentos pendientes de revisar',
    null,
    false,
    '2258'   // ID del usuario específico (employeeCode)
);
?>
```

### Tipos de Anuncios

- **`info`**: Información general (azul)
- **`success`**: Mensaje de éxito (verde)
- **`warning`**: Advertencia (amarillo)
- **`error`**: Error (rojo)
- **`maintenance`**: Mantenimiento (amarillo/naranja)

### Parámetros de `createAnnouncement()`

```php
createAnnouncement(
    string $type,              // Tipo de anuncio (requerido)
    string $title,              // Título del anuncio (requerido)
    string $message,           // Mensaje del anuncio (requerido)
    int|null $gracePeriod,     // Tiempo de gracia en minutos (opcional)
    bool $closeSessionsAfter,  // Cerrar sesiones después del tiempo de gracia (opcional)
    string|null $targetUserId   // ID de usuario específico, null para todos (opcional)
)
```

### Obtener Anuncios Activos

```php
<?php
$announcements = $wsHelper->getActiveAnnouncements();
foreach ($announcements as $announcement) {
    echo "Título: " . $announcement['title'];
    echo "Mensaje: " . $announcement['message'];
    echo "Tipo: " . $announcement['type'];
}
?>
```

### Comportamiento de los Anuncios

1. **Anuncios globales**: Se envían a todos los usuarios conectados
2. **Anuncios específicos**: Solo se envían al usuario con `targetUserId`
3. **Tiempo de gracia**: Si se especifica, se muestra un contador regresivo
4. **Cierre automático**: Si `closeSessionsAfter` es `true`, todas las sesiones se cierran automáticamente después del tiempo de gracia

### Ejemplo: Anuncio de Mantenimiento

```php
<?php
// Notificar a todos los usuarios que el sistema se cerrará en 15 minutos
$result = $wsHelper->createAnnouncement(
    'maintenance',
    'Mantenimiento Programado',
    'El sistema se cerrará en 15 minutos para realizar actualizaciones. Por favor, guarde su trabajo.',
    15,  // 15 minutos de gracia
    true // Cerrar todas las sesiones después de 15 minutos
);

if ($result && $result['success']) {
    echo "Anuncio enviado. Las sesiones se cerrarán automáticamente en 15 minutos.";
}
?>
```

Los usuarios verán:
- Un modal con el anuncio
- Un contador regresivo mostrando el tiempo restante
- Sus sesiones se cerrarán automáticamente cuando termine el tiempo de gracia

## 🎨 Personalizar el Cliente WebSocket

### Cambiar la URL del servidor:

En `index.php` (o donde inicialices el cliente):
```javascript
const wsMonitor = new SessionMonitor('http://tu-servidor:4002');
```

### Agregar datos personalizados:

```javascript
wsMonitor.connect(sessionId, userId, {
    username: username,
    page: 'dashboard',
    company: 'Mi Empresa',
    rol: 'Administrador',
    // Cualquier otro dato que necesites
});
```

## ⚠️ Consideraciones Importantes

### Desarrollo Local
- El servidor WebSocket debe estar corriendo en `192.168.10.80:4002`
- Las páginas deben incluir Socket.IO desde CDN
- Las URL en el código deben apuntar a `http://192.168.10.80:4002`

### Producción
- Cambiar la URL a tu servidor de producción
- Configurar CORS en el servidor WebSocket
- Usar HTTPS si tu aplicación principal lo usa
- Considerar usar Nginx como proxy inverso

## 🐛 Troubleshooting

### El cliente no se conecta
1. Verifica que el servidor WebSocket esté corriendo
2. Revisa la consola del navegador (F12)
3. Verifica que la URL sea correcta

### Las sesiones no se registran
1. Verifica que `sessionId` y `userId` no estén vacíos
2. Revisa la consola del servidor WebSocket
3. Verifica que Socket.IO se haya cargado correctamente

### No puedo cerrar sesiones desde PHP
1. Verifica que el servidor WebSocket esté respondiendo: `curl http://192.168.10.80:4002/health`
2. Revisa los logs del servidor WebSocket
3. Verifica que la URL en `WebSocketHelper` sea correcta

## 📊 Logs

### Cliente (Consola del navegador):
```
✅ Conectado al servidor WebSocket
Sesión registrada: {success: true, sessionId: "..."}
```

### Servidor (Terminal):
```
Nueva conexión desde: ::ffff:127.0.0.1
Sesión registrada: abc123... para usuario 2258
Sesiones activas: 1
```

## 🎯 Próximos Pasos

1. ✅ Servidor WebSocket corriendo
2. ✅ Archivos copiados al proyecto
3. ✅ `index.php` integrado con WebSocket
4. ✅ `Logout.php` actualizado
5. ✅ Panel de administración creado
6. ⏳ Probar la funcionalidad

Para probar:
1. Inicia el servidor WebSocket
2. Haz login en la aplicación
3. Abre el panel de administración
4. Cierra tu sesión remotamente
5. Deberías ser redirigido automáticamente al login

