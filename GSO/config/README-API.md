# Configuración centralizada de APIs (`api.php`)

Todas las URLs base de los servicios externos se definen en **`GSO/config/api.php`**, al estilo Laravel. Así se evita tener IPs y puertos repartidos por el proyecto.

## Uso desde PHP

1. Incluir el config una sola vez al inicio del script o de la clase. La carpeta **config está dentro de GSO** (`GSO/config/`), así que la ruta depende de dónde esté tu archivo:

```php
// Desde GSO/Login/*.php
require_once __DIR__ . '/../config/api.php';

// Desde GSO/apps/... (ej. GSO/apps/Prestamos/.../api/*.php)
require_once __DIR__ . '/../../../../config/api.php';

// Desde GSO/utilities/*.php o GSO/admin/*.php
require_once __DIR__ . '/../config/api.php';
```

2. Obtener la URL base por clave:

```php
$baseUrl = api_base('prestamos_sap');  // http://192.168.10.80:8031/api/
$authUrl = api_base('auth');           // http://192.168.10.80:8021/api
```

3. Opcional: usar constantes ya definidas por `api.php`:

```php
$url = API_AUTH . '/Auth';
$url = API_PRESTAMOS_SAP . 'SAPMaestroPrestamos/GetALl';
```

## Claves disponibles en `api.php`

| Clave | Uso principal |
|-------|----------------|
| `auth` | Login, Auth |
| `pagos_sap` | Facturas, pagos (8021) |
| `prestamos_sap` | Maestro préstamos SAP (8031) |
| `catalogos_bancos` | Catálogos, bancos (8030) |
| `amortizacion` | Amortización (4003) |
| `proceso_manual` | Procesos manuales (4004) |
| `reportes` | Reportes préstamos (4005) |
| `documentos` | Documentos, etiquetas (8002, sin /api) |
| `websocket` | Sesiones WebSocket (4002) |
| `corporativo_odata` | OData Corporativo (3002) |

## Mapa de migración

### Ya migrado (PHP)
- `GSO/Login/Login.php` → `api_base('auth')`
- `GSO/apps/autorizaciones/documentos/update_refused.php` → `api_base('documentos')`
- `GSO/apps/autorizaciones/documentos/load_documentos.php` → `api_base('documentos')`
- `GSO/apps/autorizaciones/documentos/update_autorized.php` → `api_base('documentos')`
- `GSO/apps/autorizaciones/documentos/upload_pdf.php` → `api_base('documentos')`
- `GSO/apps/Impresiones/Etiquetas/load_etiquetas.php` → `api_base('documentos')`
- `GSO/apps/Impresiones/Etiquetas/print_etiquetas.php` → `api_base('documentos')`
- `GSO/apps/Prestamos/config/catalogos-config.php` → `api_base('catalogos_bancos')`
- `GSO/apps/Prestamos/Maestro_Prestamos/api/prestamos-endpoints.php` → prestamos_sap, amortizacion, proceso_manual
- `GSO/apps/Prestamos/Maestro_Prestamos/api/pagos-endpoints.php` → pagos_sap, amortizacion
- `GSO/apps/Prestamos/Maestro_Prestamos/api/cuotas-pendientes-endpoints.php` → amortizacion, pagos_sap
- `GSO/apps/Prestamos/Configuracion_General/api/configuracion-endpoints.php` → catalogos_bancos
- `GSO/apps/Prestamos/Reportes/api/reportes-endpoints.php` → reportes, catalogos_bancos
- `GSO/apps/configuraciones/Sociedades/api/prestamos-endpoints.php` → catalogos_bancos
- `GSO/apps/configuraciones/sedes/api/prestamos-endpoints.php` → catalogos_bancos
- `GSO/utilities/WebSocketHelper.php` → websocket (constructor sin argumentos usa `api_base('websocket')`)
- `GSO/utilities/getActiveSessions.php` → `WebSocketSessionHelper()` sin URL
- `GSO/utilities/websocket-init.php` → URL inyectada desde `api_base('websocket')`
- `GSO/admin/anuncios.php` → `WebSocketSessionHelper()` sin URL
- `GSO/admin/sesiones-activas.php` → `WebSocketSessionHelper()` sin URL

### Frontend (JS)
Para que el frontend use la misma configuración puedes:
- Exponer las URLs vía un endpoint PHP que devuelva `api_config()` en JSON, o
- Mantener `GSO/apps/configuraciones/helper/env.js` como punto único para JS y que ese archivo (o un build) tome la base desde un único origen (por ejemplo un `config/apis.json` generado desde `api.php` o leído por PHP y servido como script).

Cuando cambies un archivo, reemplaza la URL fija por `api_base('clave')` o la constante correspondiente y añade el `require_once` a `GSO/config/api.php` si aún no está.
