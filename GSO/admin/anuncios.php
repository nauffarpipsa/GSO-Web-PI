<?php 
include("../Login/validar_sesion.php"); 
require_once("../utilities/WebSocketHelper.php");
require_once("../utilities/PermissionHelper.php");

// Verificar que el usuario esté autenticado
$wsHelper = new WebSocketSessionHelper('http://192.168.10.80:4002');

// Obtener anuncios activos primero (necesario para el reenvío)
$activeAnnouncements = $wsHelper->getActiveAnnouncements();
if ($activeAnnouncements === false || !is_array($activeAnnouncements)) {
    $activeAnnouncements = [];
}

// Procesar creación de anuncio
$successMessage = '';
$errorMessage = '';

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['create_announcement'])) {
    $type = $_POST['type'] ?? 'info';
    $title = $_POST['title'] ?? '';
    $message = $_POST['message'] ?? '';
    $gracePeriod = !empty($_POST['gracePeriod']) ? (int)$_POST['gracePeriod'] : null;
    // Capturar closeSessionsAfter: el checkbox solo se envía si está marcado (value="1")
    // Si no está marcado, no se envía en el POST, así que verificamos si existe y es '1'
    $closeSessionsAfter = isset($_POST['closeSessionsAfter']) && ($_POST['closeSessionsAfter'] === '1' || $_POST['closeSessionsAfter'] === 1 || $_POST['closeSessionsAfter'] === true);
    $targetUserId = !empty($_POST['targetUserId']) ? $_POST['targetUserId'] : null;
    
    if (empty($title) || empty($message)) {
        $errorMessage = 'El título y el mensaje son requeridos';
    } else {
        // Debug: Verificar valores antes de enviar
        error_log("DEBUG Anuncio - type: $type, closeSessionsAfter: " . ($closeSessionsAfter ? 'true' : 'false') . ", gracePeriod: " . ($gracePeriod ?? 'null'));
        
        $result = $wsHelper->createAnnouncement($type, $title, $message, $gracePeriod, $closeSessionsAfter, $targetUserId);
        if ($result && isset($result['success']) && $result['success']) {
            $successMessage = 'Anuncio creado y enviado exitosamente';
            // Actualizar la lista de anuncios activos después de crear uno nuevo
            $activeAnnouncements = $wsHelper->getActiveAnnouncements();
            if ($activeAnnouncements === false || !is_array($activeAnnouncements)) {
                $activeAnnouncements = [];
            }
        } else {
            // Obtener más detalles del error
            $errorDetails = '';
            if ($result === false) {
                $errorDetails = ': No se pudo conectar con el servidor WebSocket. Verifica que el servidor esté corriendo en http://192.168.10.80:4002';
            } elseif (is_array($result)) {
                if (isset($result['error'])) {
                    $errorDetails = ': ' . $result['error'];
                } elseif (isset($result['message'])) {
                    $errorDetails = ': ' . $result['message'];
                } else {
                    $errorDetails = ': Respuesta inesperada del servidor';
                }
            } else {
                $errorDetails = ': Error desconocido';
            }
            $errorMessage = 'Error al crear el anuncio' . $errorDetails;
            error_log("ERROR anuncios.php - Resultado: " . json_encode($result));
        }
    }
}

// Procesar reenvío de anuncio
if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_POST['resend_announcement'])) {
    $announcementId = $_POST['announcement_id'] ?? '';
    
    // Buscar el anuncio en la lista de activos
    $announcementToResend = null;
    if (is_array($activeAnnouncements) && count($activeAnnouncements) > 0) {
        foreach ($activeAnnouncements as $ann) {
            if (isset($ann['id']) && $ann['id'] === $announcementId) {
                $announcementToResend = $ann;
                break;
            }
        }
    }
    
    if ($announcementToResend) {
        // Asegurar que closeSessionsAfter sea un booleano
        $closeSessionsAfter = false;
        if (isset($announcementToResend['closeSessionsAfter'])) {
            $closeSessionsAfter = $announcementToResend['closeSessionsAfter'] === true || 
                                 $announcementToResend['closeSessionsAfter'] === 'true' || 
                                 $announcementToResend['closeSessionsAfter'] === 1 || 
                                 $announcementToResend['closeSessionsAfter'] === '1';
        }
        
        $result = $wsHelper->createAnnouncement(
            $announcementToResend['type'] ?? 'info',
            $announcementToResend['title'] ?? '',
            $announcementToResend['message'] ?? '',
            $announcementToResend['gracePeriod'] ?? null,
            $closeSessionsAfter, // Pasar como booleano explícito
            $announcementToResend['targetUserId'] ?? null
        );
        
        if ($result && isset($result['success']) && $result['success']) {
            $successMessage = 'Anuncio reenviado exitosamente (nota: se crea una nueva copia del anuncio)';
            // Actualizar la lista de anuncios activos después de reenviar
            $activeAnnouncements = $wsHelper->getActiveAnnouncements();
            if ($activeAnnouncements === false || !is_array($activeAnnouncements)) {
                $activeAnnouncements = [];
            }
        } else {
            $errorMessage = 'Error al reenviar el anuncio';
        }
    } else {
        $errorMessage = 'Anuncio no encontrado';
    }
}

// Obtener sesiones activas para el selector de usuarios
$activeSessions = $wsHelper->getActiveSessions();
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <base href="../" />
    <title>Gestión de Anuncios</title>
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
                                        Gestión de Anuncios
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
                                        <li class="breadcrumb-item text-muted">Anuncios</li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                        
                        <!-- Content wrapper -->
                        <div id="kt_app_content" class="app-content flex-column-fluid">
                            <div id="kt_app_content_container" class="app-container container-xxl">
                                
                                <!-- Mensajes -->
                                <?php if ($successMessage): ?>
                                    <div class="alert alert-success alert-dismissible fade show">
                                        <strong>Éxito:</strong> <?php echo htmlspecialchars($successMessage); ?>
                                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                                    </div>
                                <?php endif; ?>
                                
                                <?php if ($errorMessage): ?>
                                    <div class="alert alert-danger alert-dismissible fade show">
                                        <strong>Error:</strong> <?php echo htmlspecialchars($errorMessage); ?>
                                        <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
                                    </div>
                                <?php endif; ?>
                                
                                <div class="row g-5 g-xl-8">
                                    <!-- Formulario de Crear Anuncio -->
                                    <div class="col-xl-6">
                                        <div class="card">
                                            <div class="card-header">
                                                <h3 class="card-title">Crear Nuevo Anuncio</h3>
                                            </div>
                                            <div class="card-body">
                                                <form method="POST" id="announcementForm">
                                                    <input type="hidden" name="create_announcement" value="1">
                                                    
                                                    <!-- Tipo de Anuncio -->
                                                    <div class="mb-5">
                                                        <label class="form-label required">Tipo de Anuncio</label>
                                                        <select class="form-select" name="type" id="announcementType" required>
                                                            <option value="info">Información</option>
                                                            <option value="success">Éxito</option>
                                                            <option value="warning">Advertencia</option>
                                                            <option value="error">Error</option>
                                                            <option value="maintenance">Mantenimiento</option>
                                                        </select>
                                                        <div class="form-text">Selecciona el tipo de anuncio que deseas enviar</div>
                                                    </div>
                                                    
                                                    <!-- Título -->
                                                    <div class="mb-5">
                                                        <label class="form-label required">Título</label>
                                                        <input type="text" class="form-control" name="title" id="announcementTitle" required placeholder="Ej: Mantenimiento Programado">
                                                    </div>
                                                    
                                                    <!-- Mensaje -->
                                                    <div class="mb-5">
                                                        <label class="form-label required">Mensaje</label>
                                                        <textarea class="form-control" name="message" id="announcementMessage" rows="4" required placeholder="Escribe el mensaje del anuncio..."></textarea>
                                                    </div>
                                                    
                                                    <!-- Usuario Específico -->
                                                    <div class="mb-5">
                                                        <label class="form-label">Usuario Específico (Opcional)</label>
                                                        <select class="form-select" name="targetUserId" id="targetUserId">
                                                            <option value="">Todos los usuarios</option>
                                                            <?php foreach ($activeSessions as $session): 
                                                                $userData = $session['userData'] ?? [];
                                                                $username = $userData['username'] ?? $userData['userName'] ?? 'Usuario';
                                                                $userId = $session['userId'] ?? '';
                                                                $employeeCode = $userData['employeeCode'] ?? $userId;
                                                            ?>
                                                                <option value="<?php echo htmlspecialchars($userId); ?>">
                                                                    <?php echo htmlspecialchars($username . ' (' . $employeeCode . ')'); ?>
                                                                </option>
                                                            <?php endforeach; ?>
                                                        </select>
                                                        <div class="form-text">Deja vacío para enviar a todos los usuarios conectados</div>
                                                    </div>
                                                    
                                                    <!-- Tiempo de Gracia -->
                                                    <div class="mb-5">
                                                        <label class="form-label">Tiempo de Gracia (Minutos)</label>
                                                        <input type="number" class="form-control" name="gracePeriod" id="gracePeriod" min="0" placeholder="Ej: 15">
                                                        <div class="form-text">Tiempo en minutos antes de cerrar sesiones (opcional)</div>
                                                    </div>
                                                    
                                                    <!-- Cerrar Sesiones Después -->
                                                    <div class="mb-5">
                                                        <div class="form-check form-switch form-check-custom form-check-solid">
                                                            <input class="form-check-input" type="checkbox" name="closeSessionsAfter" id="closeSessionsAfter" value="1">
                                                            <label class="form-check-label" for="closeSessionsAfter">
                                                                Cerrar todas las sesiones después del tiempo de gracia
                                                            </label>
                                                        </div>
                                                        <div class="form-text">Si está activado, todas las sesiones se cerrarán automáticamente cuando termine el tiempo de gracia</div>
                                                    </div>
                                                    
                                                    <!-- Botones -->
                                                    <div class="d-flex justify-content-end">
                                                        <button type="reset" class="btn btn-light me-3">Limpiar</button>
                                                        <button type="submit" class="btn btn-primary">
                                                            <i class="ki-duotone ki-send fs-2">
                                                                <span class="path1"></span>
                                                                <span class="path2"></span>
                                                            </i>
                                                            Enviar Anuncio
                                                        </button>
                                                    </div>
                                                </form>
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <!-- Lista de Anuncios Activos -->
                                    <div class="col-xl-6">
                                        <div class="card">
                                            <div class="card-header">
                                                <h3 class="card-title">Anuncios Activos (<?php echo count($activeAnnouncements); ?>)</h3>
                                            </div>
                                            <div class="card-body">
                                                <?php 
                                                // Nota: El servidor WebSocket no guarda anuncios en Redis permanentemente
                                                // Los anuncios se envían solo en tiempo real y se eliminan automáticamente después de ejecutarse
                                                if (count($activeAnnouncements) > 0): 
                                                ?>
                                                    <div class="table-responsive">
                                                        <table class="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3">
                                                            <thead>
                                                                <tr class="fw-bold text-muted bg-light">
                                                                    <th class="min-w-100px py-4">Tipo</th>
                                                                    <th class="min-w-200px py-4">Título</th>
                                                                    <th class="min-w-150px py-4">Creado</th>
                                                                    <th class="min-w-100px py-4">Tiempo Gracia</th>
                                                                    <th class="min-w-120px text-end pe-4 py-4">Acciones</th>
                                                                </tr>
                                                            </thead>
                                                            <tbody>
                                                                <?php foreach ($activeAnnouncements as $announcement): 
                                                                    $type = $announcement['type'] ?? 'info';
                                                                    $typeLabels = [
                                                                        'info' => 'Información',
                                                                        'success' => 'Éxito',
                                                                        'warning' => 'Advertencia',
                                                                        'error' => 'Error',
                                                                        'maintenance' => 'Mantenimiento'
                                                                    ];
                                                                    $typeLabel = $typeLabels[$type] ?? 'Info';
                                                                    $typeColors = [
                                                                        'info' => 'primary',
                                                                        'success' => 'success',
                                                                        'warning' => 'warning',
                                                                        'error' => 'danger',
                                                                        'maintenance' => 'warning'
                                                                    ];
                                                                    $typeColor = $typeColors[$type] ?? 'primary';
                                                                    
                                                                    $createdAt = $announcement['createdAt'] ?? '';
                                                                    $gracePeriod = $announcement['gracePeriod'] ?? null;
                                                                    $announcementId = $announcement['id'] ?? '';
                                                                    $announcementMessage = $announcement['message'] ?? '';
                                                                ?>
                                                                    <tr>
                                                                        <td class="py-4">
                                                                            <span class="badge badge-<?php echo $typeColor; ?>"><?php echo htmlspecialchars($typeLabel); ?></span>
                                                                        </td>
                                                                        <td class="py-4">
                                                                            <span class="text-gray-800 fw-semibold d-block fs-7" title="<?php echo htmlspecialchars($announcementMessage); ?>">
                                                                                <?php echo htmlspecialchars($announcement['title'] ?? ''); ?>
                                                                            </span>
                                                                        </td>
                                                                        <td class="py-4">
                                                                            <span class="text-muted fw-semibold d-block fs-8">
                                                                                <?php 
                                                                                if ($createdAt) {
                                                                                    try {
                                                                                        $date = new DateTime($createdAt);
                                                                                        echo $date->format('d/m/Y H:i');
                                                                                    } catch (Exception $e) {
                                                                                        echo htmlspecialchars($createdAt);
                                                                                    }
                                                                                } else {
                                                                                    echo 'N/A';
                                                                                }
                                                                                ?>
                                                                            </span>
                                                                        </td>
                                                                        <td class="py-4">
                                                                            <?php if ($gracePeriod): ?>
                                                                                <span class="text-gray-800 fw-semibold d-block fs-7"><?php echo $gracePeriod; ?> min</span>
                                                                            <?php else: ?>
                                                                                <span class="text-muted fs-8">N/A</span>
                                                                            <?php endif; ?>
                                                                        </td>
                                                                        <td class="text-end pe-4 py-4">
                                                                            <div class="d-flex justify-content-end gap-2">
                                                                                <!-- Botón Ver Detalles -->
                                                                                <button type="button" class="btn btn-sm btn-light-info" 
                                                                                    onclick="verDetallesAnuncio('<?php echo htmlspecialchars($announcement['title'] ?? '', ENT_QUOTES); ?>', '<?php echo htmlspecialchars($announcementMessage, ENT_QUOTES); ?>', '<?php echo htmlspecialchars($typeLabel); ?>')"
                                                                                    title="Ver detalles">
                                                                                    <i class="ki-duotone ki-eye fs-4">
                                                                                        <span class="path1"></span>
                                                                                        <span class="path2"></span>
                                                                                        <span class="path3"></span>
                                                                                    </i>
                                                                                </button>
                                                                                <!-- Botón Reenviar -->
                                                                                <form method="POST" style="display: inline-block;" 
                                                                                    onsubmit="return confirm('¿Está seguro de que desea reenviar este anuncio a todos los usuarios conectados?\n\nNota: Esto creará una nueva copia del anuncio.');">
                                                                                    <input type="hidden" name="resend_announcement" value="1">
                                                                                    <input type="hidden" name="announcement_id" value="<?php echo htmlspecialchars($announcementId); ?>">
                                                                                    <button type="submit" class="btn btn-sm btn-light-primary" title="Reenviar anuncio (crea una nueva copia)">
                                                                                        <i class="ki-duotone ki-send fs-4">
                                                                                            <span class="path1"></span>
                                                                                            <span class="path2"></span>
                                                                                        </i>
                                                                                    </button>
                                                                                </form>
                                                                            </div>
                                                                        </td>
                                                                    </tr>
                                                                <?php endforeach; ?>
                                                            </tbody>
                                                        </table>
                                                    </div>
                                                <?php else: ?>
                                                    <div class="text-center py-10">
                                                        <i class="ki-duotone ki-information-5 fs-3x text-muted mb-5">
                                                            <span class="path1"></span>
                                                            <span class="path2"></span>
                                                        </i>
                                                        <p class="text-muted mb-3">No hay anuncios activos</p>
                                                        <p class="text-muted fs-7">
                                                            <i class="ki-duotone ki-information-5 fs-6 me-1">
                                                                <span class="path1"></span>
                                                                <span class="path2"></span>
                                                            </i>
                                                            Los anuncios se envían en tiempo real y se eliminan automáticamente después de ejecutarse.
                                                        </p>
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
        </div>
    </div>
    
    <!-- Scripts -->
    <script src="assets/plugins/global/plugins.bundle.js"></script>
    <script src="assets/js/scripts.bundle.js"></script>
    
    <script>
        // Auto-marcar checkbox cuando se selecciona tipo "maintenance"
        const announcementType = document.getElementById('announcementType');
        const closeSessionsAfterCheckbox = document.getElementById('closeSessionsAfter');
        
        if (announcementType && closeSessionsAfterCheckbox) {
            announcementType.addEventListener('change', function() {
                if (this.value === 'maintenance') {
                    closeSessionsAfterCheckbox.checked = true;
                }
            });
        }
        
        // Validación del formulario
        document.getElementById('announcementForm').addEventListener('submit', function(e) {
            const gracePeriod = document.getElementById('gracePeriod').value;
            const closeSessionsAfter = document.getElementById('closeSessionsAfter').checked;
            
            // Debug: Verificar valores antes de enviar
            console.log('DEBUG Formulario - closeSessionsAfter checked:', closeSessionsAfter);
            console.log('DEBUG Formulario - gracePeriod:', gracePeriod);
            console.log('DEBUG Formulario - type:', document.getElementById('announcementType').value);
            
            if (closeSessionsAfter && (!gracePeriod || gracePeriod <= 0)) {
                e.preventDefault();
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Tiempo de Gracia Requerido',
                        text: 'Debes especificar un tiempo de gracia mayor a 0 cuando activas el cierre automático de sesiones',
                        confirmButtonText: 'Entendido'
                    });
                } else {
                    alert('Debes especificar un tiempo de gracia mayor a 0 cuando activas el cierre automático de sesiones');
                }
                return false;
            }
            
            const type = document.getElementById('announcementType').value;
            const title = document.getElementById('announcementTitle').value;
            const message = document.getElementById('announcementMessage').value;
            
            if (type === 'maintenance' && closeSessionsAfter && (!gracePeriod || gracePeriod <= 0)) {
                e.preventDefault();
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'warning',
                        title: 'Tiempo de Gracia Requerido',
                        text: 'Los anuncios de mantenimiento con cierre automático requieren un tiempo de gracia',
                        confirmButtonText: 'Entendido'
                    });
                } else {
                    alert('Los anuncios de mantenimiento con cierre automático requieren un tiempo de gracia');
                }
                return false;
            }
            
            return true;
        });
        
        // Función para ver detalles del anuncio
        function verDetallesAnuncio(title, message, type) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'info',
                    title: title,
                    html: '<div class="text-start">' +
                          '<p class="mb-3"><strong>Tipo:</strong> ' + type + '</p>' +
                          '<p class="mb-0"><strong>Mensaje:</strong></p>' +
                          '<p class="text-muted">' + message.replace(/\n/g, '<br>') + '</p>' +
                          '</div>',
                    confirmButtonText: 'Cerrar',
                    width: '600px'
                });
            } else {
                if (typeof Swal !== 'undefined') {
                    Swal.fire({
                        icon: 'info',
                        title: title,
                        html: '<div class="text-start">' +
                              '<p class="mb-3"><strong>Tipo:</strong> ' + type + '</p>' +
                              '<p class="mb-0"><strong>Mensaje:</strong></p>' +
                              '<p class="text-muted">' + message.replace(/\n/g, '<br>') + '</p>' +
                              '</div>',
                        confirmButtonText: 'Cerrar',
                        width: '600px'
                    });
                } else {
                    alert('Título: ' + title + '\n\nTipo: ' + type + '\n\nMensaje:\n' + message);
                }
            }
        }
    </script>
</body>
</html>

