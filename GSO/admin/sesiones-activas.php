<?php 
include("../Login/validar_sesion.php"); 
require_once("../utilities/WebSocketHelper.php");
require_once("../utilities/PermissionHelper.php");

// Verificar que el usuario esté autenticado
// TODO: Ajustar validación de permisos según tus necesidades
// Por ejemplo: if (!hasAccess('Administracion de Sesiones')) { ... }

// Por ahora, solo verificar que esté logueado (validar_sesion.php ya hace esto)
// Puedes agregar validaciones adicionales aquí si necesitas restringir el acceso

$wsHelper = new WebSocketSessionHelper('http://192.168.10.80:4002');

// Procesar cierre de sesión
$successMessage = '';
$errorMessage = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['close_session'])) {
    $sessionId = $_POST['session_id'] ?? '';
    if ($wsHelper->closeSession($sessionId, 'Cerrado por administrador')) {
        $successMessage = 'Sesión cerrada exitosamente';
    } else {
        $errorMessage = 'Error al cerrar sesión';
    }
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['close_all_sessions'])) {
    $result = $wsHelper->closeAllSessions('Todas las sesiones cerradas por administrador');
    if ($result && isset($result['success']) && $result['success']) {
        $successMessage = 'Se cerraron ' . ($result['totalClosed'] ?? 0) . ' sesión(es) exitosamente';
    } else {
        $errorMessage = 'Error al cerrar todas las sesiones';
    }
}

// Obtener todas las sesiones activas
$activeSessions = $wsHelper->getActiveSessions();
$serverStatus = $wsHelper->getServerStatus();
?>
<script src="../Login/sessionMonitor.js"></script>
<!DOCTYPE html>
<html lang="es">
<head>
    <base href="../" />
    <title>Gestión de Sesiones Activas</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="shortcut icon" href="assets/media/logos/ico.ico" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Inter:300,400,500,600,700" />
    <link href="assets/plugins/global/plugins.bundle.css" rel="stylesheet" type="text/css" />
    <link href="assets/css/style.bundle.css" rel="stylesheet" type="text/css" />
    
    <!-- Integración WebSocket -->
    <?php include("../utilities/websocket-init.php"); ?>
</head>
<body id="kt_app_body" data-kt-app-layout="light-sidebar" data-kt-app-header-fixed="true" data-kt-app-sidebar-enabled="true" data-kt-app-sidebar-fixed="true" data-kt-app-sidebar-hoverable="true" data-kt-app-sidebar-push-header="true" data-kt-app-sidebar-push-toolbar="true" data-kt-app-sidebar-push-footer="true" data-kt-app-toolbar-enabled="true" class="app-default">
    <div class="d-flex flex-column flex-root app-root" id="kt_app_root">
        <div class="app-page flex-column flex-column-fluid" id="kt_app_page">
            <!-- Header -->
            <div id="kt_app_header" class="app-header">
                <div class="app-container container-fluid d-flex align-items-stretch justify-content-between" id="kt_app_header_container">
                    <div class="d-flex align-items-center d-lg-none ms-n3 me-2" title="Show sidebar menu">
                        <div class="btn btn-icon btn-active-color-primary w-35px h-35px" id="kt_app_sidebar_mobile_toggle">
                            <i class="ki-duotone ki-abstract-14 fs-1">
                                <span class="path1"></span>
                                <span class="path2"></span>
                            </i>
                        </div>
                    </div>
                    <div class="d-flex align-items-center flex-grow-1 flex-lg-grow-0">
                        <?php include("../Navigation/MobileLogo.php"); ?>
                    </div>
                    <div class="d-flex align-items-stretch justify-content-between flex-lg-grow-1" id="kt_app_header_wrapper">
                        <?php include("../Navigation/MenuHeader.php"); ?>
                        <div class="app-navbar flex-shrink-0">
                            <?php include("../Navigation/LoginHeader.php"); ?>
                        </div>
                    </div>
                </div>
            </div>
            
            <!-- Content -->
            <div class="app-wrapper flex-column flex-row-fluid" id="kt_app_wrapper">
                <!-- Sidebar -->
                <div id="kt_app_sidebar" class="app-sidebar flex-column" data-kt-drawer="true" data-kt-drawer-name="app-sidebar" data-kt-drawer-activate="{default: true, lg: false}" data-kt-drawer-overlay="true" data-kt-drawer-width="225px" data-kt-drawer-direction="start" data-kt-drawer-toggle="#kt_app_sidebar_mobile_toggle">
                    <div class="app-sidebar-logo px-6" id="kt_app_sidebar_logo">
                        <?php include("../Navigation/Logo.html"); ?>
                    </div>
                    <div class="app-sidebar-menu overflow-hidden flex-column-fluid">
                        <?php include("../Navigation/Menu.php"); ?>
                    </div>
                </div>
                
                <!-- Main -->
                <div class="app-main flex-column flex-row-fluid" id="kt_app_main">
                    <div class="d-flex flex-column flex-column-fluid">
                        <!-- Toolbar -->
                        <div id="kt_app_toolbar" class="app-toolbar py-3 py-lg-6">
                            <div id="kt_app_toolbar_container" class="app-container container-xxl d-flex flex-stack">
                                <div class="page-title d-flex flex-column justify-content-center flex-wrap me-3">
                                    <h1 class="page-heading d-flex text-dark fw-bold fs-3 flex-column justify-content-center my-0">
                                        Sesiones Activas
                                    </h1>
                                    <ul class="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0 pt-1">
                                        <li class="breadcrumb-item text-muted">
                                            <a href="index.php" class="text-muted text-hover-primary">Inicio</a>
                                        </li>
                                        <li class="breadcrumb-item">
                                            <span class="bullet bg-gray-400 w-5px h-2px"></span>
                                        </li>
                                        <li class="breadcrumb-item text-muted">Administración</li>
                                        <li class="breadcrumb-item">
                                            <span class="bullet bg-gray-400 w-5px h-2px"></span>
                                        </li>
                                        <li class="breadcrumb-item text-muted">Sesiones Activas</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Content wrapper -->
                        <div id="kt_app_content" class="app-content flex-column-fluid">
                            <div id="kt_app_content_container" class="app-container container-xxl">
                                
                                <!-- Estado del Servidor -->
                                <div class="card mb-5">
                                    <div class="card-header">
                                        <h3 class="card-title">Estado del Servidor WebSocket</h3>
                                    </div>
                                    <div class="card-body">
                                        <?php if ($serverStatus): ?>
                                            <div class="alert alert-success">
                                                <strong>Servidor en línea</strong><br>
                                                Conexiones activas: <?php echo $serverStatus['activeConnections'] ?? 0; ?><br>
                                                Sesiones activas: <?php echo $serverStatus['activeSessions'] ?? 0; ?>
                                            </div>
                                        <?php else: ?>
                                            <div class="alert alert-warning">
                                                <strong>Servidor WebSocket no disponible</strong><br>
                                                El servidor WebSocket no está respondiendo. Las funciones de monitoreo remoto no estarán disponibles.
                                            </div>
                                        <?php endif; ?>
                                    </div>
                                </div>
                                
                                <!-- Mensajes -->
                                <?php if ($successMessage): ?>
                                    <div class="alert alert-success alert-dismissible fade show">
                                        <strong>Éxito:</strong> <?php echo $successMessage; ?>
                                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                                    </div>
                                <?php endif; ?>
                                
                                <?php if ($errorMessage): ?>
                                    <div class="alert alert-danger alert-dismissible fade show">
                                        <strong>Error:</strong> <?php echo $errorMessage; ?>
                                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                                    </div>
                                <?php endif; ?>
                                
                                <!-- Tabla de Sesiones -->
                                <div class="card">
                                    <div class="card-header">
                                        <h3 class="card-title">Sesiones Activas (<?php echo count($activeSessions); ?>)</h3>
                                        <div class="card-toolbar d-flex align-items-center gap-2">
                                            <button type="button" class="btn btn-sm btn-light-primary" onclick="location.reload();">
                                                <i class="ki-duotone ki-arrows-circle fs-3">
                                                    <span class="path1"></span>
                                                    <span class="path2"></span>
                                                </i>
                                                Actualizar
                                            </button>
                                            <?php if (count($activeSessions) > 0): ?>
                                                <form method="POST" id="closeAllSessionsForm" style="display: inline-block; margin: 0;">
                                                    <input type="hidden" name="close_all_sessions" value="1">
                                                    <button type="button" class="btn btn-sm btn-light-danger" onclick="confirmarCerrarTodasSesiones()">
                                                        <i class="ki-duotone ki-cross-circle fs-3">
                                                            <span class="path1"></span>
                                                            <span class="path2"></span>
                                                        </i>
                                                        Cerrar Todas
                                                    </button>
                                                </form>
                                            <?php endif; ?>
                                        </div>
                                    </div>
                                    <div class="card-body p-0" style="overflow-x: auto;">
                                        <?php if (count($activeSessions) > 0): ?>
                                            <div class="table-responsive">
                                                <table class="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3">
                                                    <thead>
                                                        <tr class="fw-bold text-muted bg-light">
                                                            <th class="min-w-250px ps-4 py-4">Usuario</th>
                                                            <th class="min-w-120px py-4">Navegador</th>
                                                            <th class="min-w-120px py-4">Dirección IP</th>
                                                            <th class="min-w-120px py-4">ID Sesión</th>
                                                            <th class="min-w-140px py-4">Conectado desde</th>
                                                            <th class="min-w-120px py-4">Página</th>
                                                            <th class="min-w-100px text-end pe-4 py-4">Acciones</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        <?php 
                                                        $currentSessionId = session_id();
                                                        $currentUserId = $_SESSION['employeeCode'] ?? '';
                                                        foreach ($activeSessions as $session): 
                                                            $userData = $session['userData'] ?? [];
                                                            $username = $userData['username'] ?? $userData['userName'] ?? 'Usuario';
                                                            $employeeCode = $userData['employeeCode'] ?? $session['userId'] ?? 'N/A';
                                                            $userId = $session['userId'] ?? $employeeCode ?? 'N/A';
                                                            $email = $userData['email'] ?? '';
                                                            $department = $userData['department'] ?? '';
                                                            $page = $userData['page'] ?? $userData['pageName'] ?? 'N/A';
                                                            $company = $userData['company'] ?? '';
                                                            $country = $userData['country'] ?? '';
                                                            
                                                            $isCurrentSession = ($session['sessionId'] === $currentSessionId) || ($userId === $currentUserId);
                                                            $rowClass = $isCurrentSession ? 'table-active' : '';
                                                        ?>
                                                            <tr class="<?php echo $rowClass; ?>">
                                                                <td class="ps-4 py-4">
                                                                    <div class="d-flex align-items-center">
                                                                        <div class="symbol symbol-45px me-4">
                                                                            <span class="symbol-label bg-light-primary text-primary fw-bold fs-4">
                                                                                <?php echo strtoupper(substr($username, 0, 1)); ?>
                                                                            </span>
                                                                        </div>
                                                                        <div class="d-flex justify-content-start flex-column">
                                                                            <span class="text-dark fw-bold text-hover-primary fs-6">
                                                                                <?php echo htmlspecialchars($username); ?>
                                                                                <?php if ($isCurrentSession): ?>
                                                                                    <span class="badge badge-success ms-2 fs-8">Tú</span>
                                                                                <?php endif; ?>
                                                                            </span>
                                                                            <span class="text-muted fw-semibold d-block fs-7">
                                                                                ID: <?php echo htmlspecialchars($userId); ?>
                                                                            </span>
                                                                            <?php if ($email): ?>
                                                                                <small class="text-muted d-block mt-1">
                                                                                    <i class="ki-duotone ki-sms fs-7 me-1"><span class="path1"></span><span class="path2"></span></i>
                                                                                    <?php echo htmlspecialchars($email); ?>
                                                                                </small>
                                                                            <?php endif; ?>
                                                                            <?php if ($department): ?>
                                                                                <small class="text-muted d-block">
                                                                                    <i class="ki-duotone ki-briefcase fs-7 me-1"><span class="path1"></span><span class="path2"></span></i>
                                                                                    <?php echo htmlspecialchars($department); ?>
                                                                                </small>
                                                                            <?php endif; ?>
                                                                            <?php if ($company && $country): ?>
                                                                                <small class="text-muted d-block">
                                                                                    <i class="ki-duotone ki-flag fs-7 me-1"><span class="path1"></span><span class="path2"></span></i>
                                                                                    <?php echo htmlspecialchars($company . ' - ' . $country); ?>
                                                                                </small>
                                                                            <?php elseif ($company): ?>
                                                                                <small class="text-muted d-block">
                                                                                    <i class="ki-duotone ki-bank fs-7 me-1"><span class="path1"></span><span class="path2"></span></i>
                                                                                    <?php echo htmlspecialchars($company); ?>
                                                                                </small>
                                                                            <?php elseif ($country): ?>
                                                                                <small class="text-muted d-block">
                                                                                    <i class="ki-duotone ki-geolocation-home fs-7 me-1"><span class="path1"></span><span class="path2"></span></i>
                                                                                    <?php echo htmlspecialchars($country); ?>
                                                                                </small>
                                                                            <?php endif; ?>
                                                                        </div>
                                                                    </div>
                                                                </td>
                                                                <td class="py-4">
                                                                    <?php 
                                                                    $browser = $session['browser'] ?? 'Desconocido';
                                                                    $browserIcon = 'ki-abstract-26';
                                                                    $browserColor = 'secondary';
                                                                    
                                                                    if (strpos($browser, 'Brave') !== false) {
                                                                        $browserIcon = 'ki-rocket';
                                                                        $browserColor = 'danger';
                                                                    } elseif (strpos($browser, 'Chrome') !== false) {
                                                                        $browserIcon = 'ki-google';
                                                                        $browserColor = 'success';
                                                                    } elseif (strpos($browser, 'Firefox') !== false) {
                                                                        $browserIcon = 'ki-fire';
                                                                        $browserColor = 'warning';
                                                                    } elseif (strpos($browser, 'Edge') !== false) {
                                                                        $browserIcon = 'ki-microsoft';
                                                                        $browserColor = 'info';
                                                                    } elseif (strpos($browser, 'Safari') !== false) {
                                                                        $browserIcon = 'ki-apple';
                                                                        $browserColor = 'dark';
                                                                    }
                                                                    ?>
                                                                    <div class="d-flex align-items-center">
                                                                        <i class="ki-duotone <?php echo $browserIcon; ?> fs-2 text-<?php echo $browserColor; ?> me-2">
                                                                            <span class="path1"></span>
                                                                            <span class="path2"></span>
                                                                        </i>
                                                                        <span class="text-gray-800 fw-semibold fs-7"><?php echo htmlspecialchars($browser); ?></span>
                                                                    </div>
                                                                </td>
                                                                <td class="py-4">
                                                                    <?php 
                                                                    $ip = $session['ip'] ?? 'Desconocido';
                                                                    $ipClean = str_replace(['::ffff:', '::1'], ['', 'localhost'], $ip);
                                                                    ?>
                                                                    <div class="d-flex align-items-center">
                                                                        <i class="ki-duotone ki-geolocation fs-2 text-primary me-2">
                                                                            <span class="path1"></span>
                                                                            <span class="path2"></span>
                                                                        </i>
                                                                        <span class="text-gray-800 fw-semibold fs-7 font-monospace" title="<?php echo htmlspecialchars($ip); ?>">
                                                                            <?php echo htmlspecialchars($ipClean); ?>
                                                                        </span>
                                                                    </div>
                                                                </td>
                                                                <td class="py-4">
                                                                    <span class="text-muted fw-semibold d-block fs-8 font-monospace" title="<?php echo htmlspecialchars($session['sessionId'] ?? ''); ?>">
                                                                        <?php 
                                                                        $sessionIdShort = isset($session['sessionId']) ? substr($session['sessionId'], 0, 12) : 'N/A';
                                                                        echo htmlspecialchars($sessionIdShort);
                                                                        if (isset($session['sessionId']) && strlen($session['sessionId']) > 12) {
                                                                            echo '...';
                                                                        }
                                                                        ?>
                                                                    </span>
                                                                </td>
                                                                <td class="py-4">
                                                                    <span class="text-gray-800 fw-semibold d-block fs-7">
                                                                        <?php 
                                                                        if (isset($session['connectedAt'])) {
                                                                            try {
                                                                                echo date('d/m/Y', strtotime($session['connectedAt']));
                                                                                echo '<br><small class="text-muted">' . date('H:i:s', strtotime($session['connectedAt'])) . '</small>';
                                                                            } catch (Exception $e) {
                                                                                echo htmlspecialchars($session['connectedAt']);
                                                                            }
                                                                        } else {
                                                                            echo 'N/A';
                                                                        }
                                                                        ?>
                                                                    </span>
                                                                </td>
                                                                <td class="py-4">
                                                                    <span class="badge badge-light-info fs-8" title="<?php echo htmlspecialchars($page); ?>">
                                                                        <i class="ki-duotone ki-file fs-6 me-1">
                                                                            <span class="path1"></span>
                                                                            <span class="path2"></span>
                                                                        </i>
                                                                        <?php 
                                                                        $pageDisplay = strlen($page) > 25 ? substr($page, 0, 25) . '...' : $page;
                                                                        echo htmlspecialchars($pageDisplay);
                                                                        ?>
                                                                    </span>
                                                                </td>
                                                                <td class="text-end pe-4 py-4">
                                                                    <?php if ($isCurrentSession): ?>
                                                                        <span class="badge badge-light-success px-4 py-3">
                                                                            <i class="ki-duotone ki-shield-tick fs-5 me-1">
                                                                                <span class="path1"></span>
                                                                                <span class="path2"></span>
                                                                            </i>
                                                                            Sesión actual
                                                                        </span>
                                                                    <?php else: ?>
                                                                        <form method="POST" style="display: inline;" class="closeSessionForm">
                                                                            <input type="hidden" name="session_id" value="<?php echo htmlspecialchars($session['sessionId']); ?>">
                                                                            <button type="button" name="close_session" class="btn btn-sm btn-danger"
                                                                                    onclick="confirmarCerrarSesion(this)">
                                                                                <i class="ki-duotone ki-cross fs-5">
                                                                                    <span class="path1"></span>
                                                                                    <span class="path2"></span>
                                                                                </i>
                                                                                Cerrar
                                                                            </button>
                                                                        </form>
                                                                    <?php endif; ?>
                                                                </td>
                                                            </tr>
                                                        <?php endforeach; ?>
                                                    </tbody>
                                                </table>
                                            </div>
                                        <?php else: ?>
                                            <div class="p-10 text-center">
                                                <div class="text-gray-600 fs-3 fw-bold mb-3">No hay sesiones activas</div>
                                                <div class="text-gray-400">Las sesiones activas aparecerán aquí cuando los usuarios se conecten</div>
                                            </div>
                                        <?php endif; ?>
                                    </div>
                                </div>
                                
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="assets/plugins/global/plugins.bundle.js"></script>
    <script src="assets/js/scripts.bundle.js"></script>
    
    <script>
        // Funcionalidad adicional para el panel de admin
        document.addEventListener('DOMContentLoaded', function() {
            // Actualizar tabla cuando hay cambios
            if (window.wsMonitor && window.wsMonitor.socket) {
                window.wsMonitor.socket.on('session:new', function(data) {
                    actualizarTablaSesiones();
                });
                
                window.wsMonitor.socket.on('session:closed', function(data) {
                    actualizarTablaSesiones();
                });
            }
        });
        
        // Función para actualizar la tabla de sesiones sin recargar la página
        function actualizarTablaSesiones() {
            fetch('utilities/getActiveSessions.php')
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        renderizarTablaSesiones(data.sessions, data.serverStatus);
                    }
                })
                .catch(error => {
                    console.error('Error al actualizar sesiones:', error);
                });
        }
        
        // Función para renderizar la tabla de sesiones
        function renderizarTablaSesiones(sessions, serverStatus) {
            // Actualizar contador de sesiones en el título
            const cardTitle = document.querySelector('.card-title');
            if (cardTitle) {
                cardTitle.innerHTML = 'Sesiones Activas (' + sessions.length + ')';
            }
            
            // Actualizar estado del servidor
            if (serverStatus) {
                const serverStatusDiv = document.querySelector('.card-body .alert');
                if (serverStatusDiv) {
                    serverStatusDiv.className = 'alert alert-success';
                    serverStatusDiv.innerHTML = '<strong>Servidor en línea</strong><br>' +
                        'Conexiones activas: ' + (serverStatus.activeConnections || 0) + '<br>' +
                        'Sesiones activas: ' + (serverStatus.activeSessions || 0);
                }
            }
            
            // Actualizar tabla
            const tableBody = document.querySelector('tbody');
            const noSessionsDiv = document.querySelector('.p-10.text-center');
            
            if (sessions.length > 0) {
                // Ocultar mensaje "No hay sesiones"
                if (noSessionsDiv) {
                    noSessionsDiv.style.display = 'none';
                }
                
                // Mostrar tabla
                if (tableBody) {
                    tableBody.innerHTML = '';
                    const currentSessionId = '<?php echo session_id(); ?>';
                    const currentUserId = '<?php echo $_SESSION['employeeCode'] ?? ''; ?>';
                    
                    sessions.forEach(session => {
                        const tr = document.createElement('tr');
                        
                        // Obtener datos del usuario con fallbacks
                        const userData = session.userData || {};
                        const username = userData.username || userData.userName || 'Usuario';
                        const employeeCode = userData.employeeCode || session.userId || 'N/A';
                        const userId = session.userId || employeeCode || 'N/A';
                        const email = userData.email || '';
                        const department = userData.department || '';
                        const page = userData.page || userData.pageName || window.location.pathname || 'N/A';
                        const browser = session.browser || 'Desconocido';
                        const ip = session.ip || 'Desconocido';
                        const ipClean = ip.replace('::ffff:', '').replace('::1', 'localhost');
                        
                        const sessionIdShort = session.sessionId ? session.sessionId.substring(0, 12) : 'N/A';
                        let connectedAtDate = 'N/A';
                        let connectedAtTime = '';
                        try {
                            if (session.connectedAt) {
                                const date = new Date(session.connectedAt);
                                connectedAtDate = date.toLocaleDateString('es-HN', {
                                    year: 'numeric',
                                    month: '2-digit',
                                    day: '2-digit'
                                });
                                connectedAtTime = date.toLocaleTimeString('es-HN', {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                    second: '2-digit'
                                });
                            }
                        } catch (e) {
                            connectedAtDate = session.connectedAt || 'N/A';
                        }
                        
                        // Verificar si es la sesión actual
                        const isCurrentSession = session.sessionId === currentSessionId || userId === currentUserId;
                        const rowClass = isCurrentSession ? 'table-active' : '';
                        
                        // Determinar icono y color del navegador
                        let browserIcon = 'ki-abstract-26';
                        let browserColor = 'secondary';
                        if (browser.indexOf('Brave') !== -1) {
                            browserIcon = 'ki-rocket';
                            browserColor = 'danger';
                        } else if (browser.indexOf('Chrome') !== -1) {
                            browserIcon = 'ki-google';
                            browserColor = 'success';
                        } else if (browser.indexOf('Firefox') !== -1) {
                            browserIcon = 'ki-fire';
                            browserColor = 'warning';
                        } else if (browser.indexOf('Edge') !== -1) {
                            browserIcon = 'ki-microsoft';
                            browserColor = 'info';
                        } else if (browser.indexOf('Safari') !== -1) {
                            browserIcon = 'ki-apple';
                            browserColor = 'dark';
                        }
                        
                        const company = userData.company || '';
                        const country = userData.country || '';
                        
                        tr.className = rowClass;
                        tr.innerHTML = `
                            <td class="ps-4 py-4">
                                <div class="d-flex align-items-center">
                                    <div class="symbol symbol-45px me-4">
                                        <span class="symbol-label bg-light-primary text-primary fw-bold fs-4">
                                            ${username.charAt(0).toUpperCase()}
                                        </span>
                                    </div>
                                    <div class="d-flex justify-content-start flex-column">
                                        <span class="text-dark fw-bold text-hover-primary fs-6">
                                            ${escapeHtml(username)}
                                            ${isCurrentSession ? '<span class="badge badge-success ms-2 fs-8">Tú</span>' : ''}
                                        </span>
                                        <span class="text-muted fw-semibold d-block fs-7">
                                            ID: ${escapeHtml(userId)}
                                        </span>
                                        ${email ? `<small class="text-muted d-block mt-1"><i class="ki-duotone ki-sms fs-7 me-1"><span class="path1"></span><span class="path2"></span></i>${escapeHtml(email)}</small>` : ''}
                                        ${department ? `<small class="text-muted d-block"><i class="ki-duotone ki-briefcase fs-7 me-1"><span class="path1"></span><span class="path2"></span></i>${escapeHtml(department)}</small>` : ''}
                                        ${company && country ? `<small class="text-muted d-block"><i class="ki-duotone ki-flag fs-7 me-1"><span class="path1"></span><span class="path2"></span></i>${escapeHtml(company)} - ${escapeHtml(country)}</small>` : ''}
                                        ${!company && !country ? '' : company && !country ? `<small class="text-muted d-block"><i class="ki-duotone ki-bank fs-7 me-1"><span class="path1"></span><span class="path2"></span></i>${escapeHtml(company)}</small>` : ''}
                                        ${!company && country ? `<small class="text-muted d-block"><i class="ki-duotone ki-geolocation-home fs-7 me-1"><span class="path1"></span><span class="path2"></span></i>${escapeHtml(country)}</small>` : ''}
                                    </div>
                                </div>
                            </td>
                            <td class="py-4">
                                <div class="d-flex align-items-center">
                                    <i class="ki-duotone ${browserIcon} fs-2 text-${browserColor} me-2">
                                        <span class="path1"></span>
                                        <span class="path2"></span>
                                    </i>
                                    <span class="text-gray-800 fw-semibold fs-7">${escapeHtml(browser)}</span>
                                </div>
                            </td>
                            <td class="py-4">
                                <div class="d-flex align-items-center">
                                    <i class="ki-duotone ki-geolocation fs-2 text-primary me-2">
                                        <span class="path1"></span>
                                        <span class="path2"></span>
                                    </i>
                                    <span class="text-gray-800 fw-semibold fs-7 font-monospace" title="${escapeHtml(ip)}">
                                        ${escapeHtml(ipClean)}
                                    </span>
                                </div>
                            </td>
                            <td class="py-4">
                                <span class="text-muted fw-semibold d-block fs-8 font-monospace" title="${escapeHtml(session.sessionId || '')}">
                                    ${escapeHtml(sessionIdShort)}${session.sessionId && session.sessionId.length > 12 ? '...' : ''}
                                </span>
                            </td>
                            <td class="py-4">
                                <span class="text-gray-800 fw-semibold d-block fs-7">
                                    ${escapeHtml(connectedAtDate)}
                                    ${connectedAtTime ? '<br><small class="text-muted">' + escapeHtml(connectedAtTime) + '</small>' : ''}
                                </span>
                            </td>
                            <td class="py-4">
                                <span class="badge badge-light-info fs-8" title="${escapeHtml(page)}">
                                    <i class="ki-duotone ki-file fs-6 me-1">
                                        <span class="path1"></span>
                                        <span class="path2"></span>
                                    </i>
                                    ${escapeHtml(page.length > 25 ? page.substring(0, 25) + '...' : page)}
                                </span>
                            </td>
                            <td class="text-end pe-4 py-4">
                                ${isCurrentSession ? 
                                    '<span class="badge badge-light-success px-4 py-3"><i class="ki-duotone ki-shield-tick fs-5 me-1"><span class="path1"></span><span class="path2"></span></i>Sesión actual</span>' :
                                    `<form method="POST" style="display: inline;" class="closeSessionForm">
                                        <input type="hidden" name="session_id" value="${escapeHtml(session.sessionId)}">
                                        <button type="button" name="close_session" class="btn btn-sm btn-danger"
                                                onclick="confirmarCerrarSesion(this)">
                                            <i class="ki-duotone ki-cross fs-5">
                                                <span class="path1"></span>
                                                <span class="path2"></span>
                                            </i>
                                            Cerrar
                                        </button>
                                    </form>`
                                }
                            </td>
                        `;
                        tableBody.appendChild(tr);
                    });
                    
                    // Mostrar tabla si estaba oculta
                    const tableWrapper = tableBody.closest('.table-responsive');
                    if (tableWrapper) {
                        tableWrapper.style.display = '';
                    }
                }
            } else {
                // Mostrar mensaje "No hay sesiones"
                if (noSessionsDiv) {
                    noSessionsDiv.style.display = '';
                }
                // Ocultar tabla
                if (tableBody) {
                    const tableWrapper = tableBody.closest('.table-responsive');
                    if (tableWrapper) {
                        tableWrapper.style.display = 'none';
                    }
                }
            }
        }
        
        // Función helper para escapar HTML
        function escapeHtml(text) {
            const div = document.createElement('div');
            div.textContent = text;
            return div.innerHTML;
        }
        
        // Función para confirmar cierre de todas las sesiones
        function confirmarCerrarTodasSesiones() {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'warning',
                    title: '¿Cerrar todas las sesiones?',
                    text: '¿Está seguro de que desea cerrar TODAS las sesiones activas? Esta acción no se puede deshacer.',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, cerrar todas',
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6'
                }).then((result) => {
                    if (result.isConfirmed) {
                        document.getElementById('closeAllSessionsForm').submit();
                    }
                });
            } else {
                if (confirm('¿Está seguro de que desea cerrar TODAS las sesiones activas? Esta acción no se puede deshacer.')) {
                    document.getElementById('closeAllSessionsForm').submit();
                }
            }
        }
        
        // Función para confirmar cierre de una sesión individual
        function confirmarCerrarSesion(button) {
            const form = button.closest('form');
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'question',
                    title: '¿Cerrar esta sesión?',
                    text: '¿Está seguro de que desea cerrar esta sesión?',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, cerrar',
                    cancelButtonText: 'Cancelar',
                    confirmButtonColor: '#d33',
                    cancelButtonColor: '#3085d6'
                }).then((result) => {
                    if (result.isConfirmed) {
                        form.submit();
                    }
                });
            } else {
                if (confirm('¿Cerrar esta sesión?')) {
                    form.submit();
                }
            }
        }
    </script>
</body>
</html>


