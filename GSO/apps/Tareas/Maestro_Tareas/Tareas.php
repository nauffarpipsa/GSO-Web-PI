<?php 
include("../../../Login/validar_sesion.php"); 
include("../../../config/syncfusion-config.php");
require_once '../../../utilities/PermissionHelper.php';
?>
<script src="../../../Login/sessionMonitor.js"></script>
<!DOCTYPE html>
<html lang="es">
<head>
    <base href="../../../" />
    <title>Mantenimiento de Tareas</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="shortcut icon" href="assets/media/logos/ico.ico" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Inter:300,400,500,600,700" />
    <link href="assets/plugins/global/plugins.bundle.css" rel="stylesheet" type="text/css" />
    <link href="assets/css/style.bundle.css" rel="stylesheet" type="text/css" />
    
    <!-- Syncfusion CSS -->
    <?php echo getSyncfusionCSS(); ?>
    <?php echo getDataGridCustomCSS(); ?>
    
    <!-- Integración WebSocket -->
    <?php include '../../../utilities/websocket-init.php'; ?>
    <style>
        .tabla-container {
            height: 100%;
            display: flex;
            flex-direction: column;
        }
        #tareasGrid {
            flex-grow: 1;
        }
    </style>
</head>
<body id="kt_app_body" data-kt-app-layout="light-sidebar" data-kt-app-header-fixed="true" data-kt-app-sidebar-enabled="true" data-kt-app-sidebar-fixed="true" data-kt-app-sidebar-hoverable="true" data-kt-app-sidebar-push-header="true" data-kt-app-sidebar-push-toolbar="true" data-kt-app-sidebar-push-footer="true" data-kt-app-toolbar-enabled="true" class="app-default">
    <div class="d-flex flex-column flex-root app-root" id="kt_app_root">
        <div class="app-page flex-column flex-column-fluid" id="kt_app_page">
            <div id="kt_app_header" class="app-header">
                <div class="app-container container-fluid d-flex align-items-stretch justify-content-between" id="kt_app_header_container">
                    <div class="d-flex align-items-center flex-grow-1 flex-lg-grow-0">
                        <?php include("../../../Navigation/MobileLogo.php"); ?>
                    </div>
                    <div class="d-flex align-items-stretch justify-content-between flex-lg-grow-1" id="kt_app_header_wrapper">
                        <?php include("../../../Navigation/MenuHeader.php"); ?>
                        <div class="app-navbar flex-shrink-0">
                            <?php include("../../../Navigation/LoginHeader.php"); ?>
                        </div>
                    </div>
                </div>
            </div>
            <div class="app-wrapper flex-column flex-row-fluid" id="kt_app_wrapper">
                <div id="kt_app_sidebar" class="app-sidebar flex-column" data-kt-drawer="true" data-kt-drawer-name="app-sidebar" data-kt-drawer-activate="{default: true, lg: false}" data-kt-drawer-overlay="true" data-kt-drawer-width="225px" data-kt-drawer-direction="start" data-kt-drawer-toggle="#kt_app_sidebar_mobile_toggle">
                    <div class="app-sidebar-logo px-6" id="kt_app_sidebar_logo">
                        <?php include("../../../Navigation/Logo.html"); ?>
                    </div>
                    <div class="app-sidebar-menu overflow-hidden flex-column-fluid">
                        <?php include("../../../Navigation/Menu.php"); ?>
                    </div>
                </div>
                <div class="app-main flex-column flex-row-fluid" id="kt_app_main">
                    <div class="d-flex flex-column flex-column-fluid">
                        <div id="kt_app_content" class="app-content flex-column-fluid">
                            <div id="kt_app_content_container" class="app-container container-xxl">
                                <div class="card h-100 w-100 tabla-container">
                                    <div class="card-header border-0 pt-6">
                                        <div class="card-title">
                                            <h2>Mantenimiento de Tareas</h2>
                                        </div>
                                        <div class="card-toolbar">
                                            <button type="button" class="btn btn-light-primary me-3" id="btnRefresh">
                                                <i class="ki-duotone ki-arrows-square fs-2"></i> Refrescar
                                            </button>
                                            <?php if (canCreate('Tareas')): ?>
                                            <button type="button" class="btn btn-primary" id="btnNuevaTarea">
                                                <i class="ki-duotone ki-plus fs-2"></i> Nueva Tarea
                                            </button>
                                            <?php endif; ?>
                                        </div>
                                    </div>
                                    <div class="card-body py-4 d-flex flex-column flex-grow-1">
                                        <div id="tareasGrid"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>
    
    <!-- Templates for Syncfusion Grid -->
    <script id="statusTemplate" type="text/x-template">
        <div class="form-check form-switch form-check-custom form-check-solid">
            <input class="form-check-input task-status-toggle" type="checkbox" data-id="${id}" ${is_Active ? 'checked' : ''} ${!canChangeStatusTarea ? 'disabled' : ''} />
        </div>
    </script>
    
    <script id="actionsTemplate" type="text/x-template">
        <div class="d-flex justify-content-center gap-2">
            <button class="btn btn-icon btn-light-success btn-sm btn-execute" data-id="${id}" title="Ejecutar Ahora">
                <i class="ki-duotone ki-rocket fs-4"><span class="path1"></span><span class="path2"></span></i>
            </button>
            ${if(canEditTarea)}
            <button class="btn btn-icon btn-light-primary btn-sm btn-edit" data-id="${id}" title="Editar">
                <i class="ki-duotone ki-pencil fs-4"><span class="path1"></span><span class="path2"></span></i>
            </button>
            ${/if}
            ${if(canDeleteTarea)}
            <button class="btn btn-icon btn-light-danger btn-sm btn-delete" data-id="${id}" title="Eliminar">
                <i class="ki-duotone ki-trash fs-4"><span class="path1"></span><span class="path2"></span><span class="path3"></span><span class="path4"></span><span class="path5"></span></i>
            </button>
            ${/if}
        </div>
    </script>

    <!-- Modal Edit Tarea -->
    <div class="modal fade" id="modalEditarTarea" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered mw-650px">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="fw-bold">Editar Tarea</h2>
                    <div class="btn btn-icon btn-sm btn-active-icon-primary" data-bs-dismiss="modal">
                        <i class="ki-duotone ki-cross fs-1"><span class="path1"></span><span class="path2"></span></i>
                    </div>
                </div>
                <div class="modal-body scroll-y mx-5 mx-xl-15 my-7">
                    <form id="formEditarTarea" class="form">
                        <input type="hidden" id="edit_id" name="id">
                        
                        <div class="d-flex flex-column mb-7 fv-row">
                            <label class="d-flex align-items-center fs-6 fw-semibold form-label mb-2">
                                <span class="required">Descripción</span>
                            </label>
                            <input type="text" class="form-control form-control-solid" id="edit_description" name="description" required>
                        </div>
                        
                        <div class="d-flex flex-column mb-7 fv-row">
                            <label class="d-flex align-items-center fs-6 fw-semibold form-label mb-2">
                                <span class="required">Compañía</span>
                            </label>
                            <select class="form-select form-select-solid" id="edit_company_id" name="company_Id" data-control="select2" required>
                                <option value="">Cargando compañías...</option>
                            </select>
                        </div>

                        <div class="d-flex flex-column mb-7 fv-row">
                            <label class="d-flex align-items-center fs-6 fw-semibold form-label mb-2">
                                <span class="required">ID de Enlace OData</span>
                            </label>
                            <select class="form-select form-select-solid" id="edit_odata_link_id" name="odata_Link_Id" data-control="select2" required>
                                <option value="">Cargando enlaces...</option>
                            </select>
                        </div>
                        
                        <div class="d-flex flex-column mb-7 fv-row">
                            <label class="required fs-6 fw-semibold form-label mb-2">Tipo de Acción</label>
                            <select class="form-select form-select-solid" id="edit_action_type" name="action_Type" data-control="select2" data-hide-search="true">
                                <option value="EnviarCorreo">MAIL</option>
                                <option value="EnviarWhatsapp">WHATSAPP</option>
                            </select>
                        </div>
                        
                        <div class="d-flex flex-column mb-7 fv-row">
                            <label class="required fs-6 fw-semibold form-label mb-2">Frecuencia de Ejecución</label>
                            
                            <select class="form-select form-select-solid mb-4" id="edit_cron_preset" name="cron_preset">
                                <option value="0 6 * * *">Todos los días a las 6:00 AM</option>
                                <option value="0 6 * * 1">Semanal (Lunes) a las 6:00 AM</option>
                                <option value="0 6 1 * *">Mensual (Día 1) a las 6:00 AM</option>
                                <option value="custom">Personalizado...</option>
                            </select>

                            <!-- Constructor de Cron (Oculto por defecto) -->
                            <div id="custom_cron_builder" style="display:none;" class="p-4 bg-light rounded border border-secondary border-dashed">
                                <h6 class="mb-3 text-muted">Configuración Personalizada</h6>
                                <div class="row g-3">
                                    <div class="col-md-4">
                                        <label class="form-label fs-7">Se repite:</label>
                                        <select class="form-select form-select-sm form-select-solid" id="custom_cron_type">
                                            <option value="daily">Diariamente</option>
                                            <option value="weekly">Semanalmente</option>
                                            <option value="monthly">Mensualmente</option>
                                        </select>
                                    </div>
                                    <div class="col-md-4" id="custom_cron_day_container" style="display:none;">
                                        <label class="form-label fs-7" id="custom_cron_day_label">Día:</label>
                                        <div id="wrapper_day_weekly">
                                            <select class="form-select form-select-sm form-select-solid" id="custom_cron_dow">
                                                <option value="1">Lunes</option>
                                                <option value="2">Martes</option>
                                                <option value="3">Miércoles</option>
                                                <option value="4">Jueves</option>
                                                <option value="5">Viernes</option>
                                                <option value="6">Sábado</option>
                                                <option value="0">Domingo</option>
                                            </select>
                                        </div>
                                        <div id="wrapper_day_monthly" style="display:none;">
                                            <input type="number" class="form-control form-control-sm form-control-solid" id="custom_cron_dom" min="1" max="31" value="1">
                                        </div>
                                    </div>
                                    <div class="col-md-4">
                                        <label class="form-label fs-7">Hora:</label>
                                        <input type="time" class="form-control form-control-sm form-control-solid" id="custom_cron_time" value="06:00">
                                    </div>
                                </div>
                            </div>
                            
                            <!-- Este hidden guarda el valor real del cron -->
                            <input type="hidden" id="edit_frequency_cron" name="frequency_Cron">
                        </div>

                        <div class="text-center pt-15">
                            <button type="reset" class="btn btn-light me-3" data-bs-dismiss="modal">Cancelar</button>
                            <button type="button" class="btn btn-primary" id="btnGuardarTarea">
                                <span class="indicator-label">Guardar Cambios</span>
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Scripts -->
    <script src="assets/plugins/global/plugins.bundle.js"></script>
    <script src="assets/js/scripts.bundle.js"></script>
    
    <!-- Syncfusion JS -->
    <?php echo getSyncfusionJS(); ?>
    <script src="utilities/permissionHelper.js"></script>
    
    <script>
        var hostUrl = "assets/";
        // Permisos forzados a true para pruebas de desarrollo
        var canEditTarea = true; 
        var canDeleteTarea = true; 
        var canChangeStatusTarea = true; 
        var canExecuteTarea = true; 
    </script>
    
    <script src="apps/Tareas/Maestro_Tareas/js/tareas.js"></script>
</body>
</html>
