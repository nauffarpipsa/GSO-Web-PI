<?php 
include("../../../Login/validar_sesion.php"); 
include("../../../config/syncfusion-config.php");
include("../../Prestamos/config/catalogos-config.php");
?>
<script src="../../../Login/sessionMonitor.js"></script>
<!DOCTYPE html>
<html lang="es">
<head>
    <base href="../../../" />
    <title>Edición de Préstamo</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="shortcut icon" href="assets/media/logos/ico.ico" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Inter:300,400,500,600,700" />
    <link href="assets/plugins/global/plugins.bundle.css" rel="stylesheet" type="text/css" />
    <link href="assets/css/style.bundle.css" rel="stylesheet" type="text/css" />
    
    <!-- Syncfusion CSS -->
    <?php echo getSyncfusionCSS(); ?>
    <?php echo getDataGridCustomCSS(); ?>
    
    <!-- CSS estándar de modales -->
    <link rel="stylesheet" href="assets/css/modal-standard.css">
</head>
<body id="kt_app_body" data-kt-app-layout="light-sidebar" data-kt-app-header-fixed="true" data-kt-app-sidebar-enabled="true" data-kt-app-sidebar-fixed="true" data-kt-app-sidebar-hoverable="true" data-kt-app-sidebar-push-header="true" data-kt-app-sidebar-push-toolbar="true" data-kt-app-sidebar-push-footer="true" data-kt-app-toolbar-enabled="true" class="app-default">
    <!--begin::App-->
    <div class="d-flex flex-column flex-root app-root" id="kt_app_root">
        <!--begin::Page-->
        <div class="app-page flex-column flex-column-fluid" id="kt_app_page">
            <!--begin::Header-->
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
            <!--end::Header-->
            <!--begin::Wrapper-->
            <div class="app-wrapper flex-column flex-row-fluid" id="kt_app_wrapper">
                <!--begin::Sidebar-->
                <div id="kt_app_sidebar" class="app-sidebar flex-column" data-kt-drawer="true" data-kt-drawer-name="app-sidebar" data-kt-drawer-activate="{default: true, lg: false}" data-kt-drawer-overlay="true" data-kt-drawer-width="225px" data-kt-drawer-direction="start" data-kt-drawer-toggle="#kt_app_sidebar_mobile_toggle">
                    <div class="app-sidebar-logo px-6" id="kt_app_sidebar_logo">
                        <?php include("../../../Navigation/Logo.html"); ?>
                    </div>
                    <div class="app-sidebar-menu overflow-hidden flex-column-fluid">
                        <?php include("../../../Navigation/Menu.php"); ?>
                    </div>
                </div>
                <!--end::Sidebar-->
                <!--begin::Main-->
                <div class="app-main flex-column flex-row-fluid" id="kt_app_main">
                    <!--begin::Content wrapper-->
                    <div class="d-flex flex-column flex-column-fluid">
                        <!--begin::Content-->
                        <div id="kt_app_content" class="app-content flex-column-fluid">
                            <div id="kt_app_content_container" class="app-container container-xxl">
                                <!--begin::Card-->
                                <div class="card">
                                    <!--begin::Card header-->
                                    <div class="card-header border-0 pt-6">
                                        <div class="card-title">
                                            <h2 class="fw-bold">
                                                <i class="ki-duotone ki-edit fs-2 me-2">
                                                    <span class="path1"></span>
                                                    <span class="path2"></span>
                                                </i>
                                                Edición de Préstamo
                                            </h2>
                                        </div>
                                        <div class="card-toolbar">
                                            <div class="d-flex justify-content-end">
                                                <button type="button" class="btn btn-light me-3" onclick="window.history.back()">
                                                    <i class="ki-duotone ki-arrow-left fs-2 me-2">
                                                        <span class="path1"></span>
                                                        <span class="path2"></span>
                                                    </i>
                                                    Volver
                                                </button>
                                                <button type="button" class="btn btn-primary" id="btnGuardarEdicion">
                                                    <i class="ki-duotone ki-check fs-2 me-2">
                                                        <span class="path1"></span>
                                                        <span class="path2"></span>
                                                    </i>
                                                    Guardar Cambios
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <!--end::Card header-->
                                    <!--begin::Card body-->
                                    <div class="card-body py-4">
                                        <form id="formEdicionCompleta">
                                            <!-- Información General -->
                                            <div class="card mb-5">
                                                <div class="card-header">
                                                    <h3 class="card-title">Información General</h3>
                                                </div>
                                                <div class="card-body">
                                                    <div class="row">
                                                        <div class="col-md-4 mb-3">
                                                            <label for="editId" class="form-label fw-bold"># Préstamo</label>
                                                            <input type="text" class="form-control" id="editId" readonly>
                                                        </div>
                                                        <div class="col-md-4 mb-3">
                                                            <label for="editFacturaSAP" class="form-label fw-bold">N° Factura SAP BYD</label>
                                                            <input type="text" class="form-control" id="editFacturaSAP" placeholder="Ej: INV-2024-001">
                                                        </div>
                                                        <div class="col-md-4 mb-3">
                                                            <label for="editBanco" class="form-label fw-bold">Proveedor SAP</label>
                                                            <input type="text" class="form-control" id="editBanco" required>
                                                        </div>
                                                    </div>
                                                    <div class="row">
                                                        <div class="col-md-4 mb-3">
                                                            <label for="editTasa" class="form-label fw-bold">Tasa (%)</label>
                                                            <input type="number" class="form-control" id="editTasa" step="0.1" min="0" max="100" required>
                                                        </div>
                                                        <div class="col-md-4 mb-3">
                                                            <label for="editDiaPago" class="form-label fw-bold">Día de Pago</label>
                                                            <input type="number" class="form-control" id="editDiaPago" min="1" max="31" required>
                                                        </div>
                                                        <div class="col-md-4 mb-3">
                                                            <label for="editMesesGracia" class="form-label fw-bold">Meses de Gracia</label>
                                                            <input type="number" class="form-control" id="editMesesGracia" min="0" max="12" value="0">
                                                        </div>
                                                    </div>
                                                    <div class="row">
                                                                                                         <div class="col-md-4 mb-3">
                                                             <label for="editBanco" class="form-label fw-bold">Banco</label>
                                                             <select class="form-select" id="editBanco" required>
                                                                 <?php echo generarOpcionesSelect(obtenerBancos(), 'bankID', 'bank_Name'); ?>
                                                             </select>
                                                         </div>
                                                         <div class="col-md-4 mb-3">
                                                             <label for="editLineaCredito" class="form-label fw-bold">Línea de Crédito</label>
                                                             <select class="form-select" id="editLineaCredito" required>
                                                                 <?php echo generarOpcionesSelect(obtenerLineasCredito(), 'id', 'line_Description'); ?>
                                                             </select>
                                                         </div>
                                                         <div class="col-md-4 mb-3">
                                                             <label for="editCondicion" class="form-label fw-bold">Condición</label>
                                                             <select class="form-select" id="editCondicion" required>
                                                                 <?php echo generarOpcionesSelect(obtenerCondiciones(), 'id', 'descripcion'); ?>
                                                             </select>
                                                         </div>
                                                         <div class="col-md-4 mb-3">
                                                             <label for="editTipoCuota" class="form-label fw-bold">Tipo de Cuota</label>
                                                             <select class="form-select" id="editTipoCuota" required>
                                                                 <?php echo generarOpcionesSelect(obtenerTiposCuota(), 'id', 'description'); ?>
                                                             </select>
                                                         </div>
                                                    </div>
                                                    <div class="row">
                                                        <div class="col-md-4 mb-3">
                                                            <label for="editPlazoMeses" class="form-label fw-bold">Plazo Total (Meses)</label>
                                                            <input type="number" class="form-control" id="editPlazoMeses" min="1" max="120" value="12" readonly>
                                                            <small class="form-text text-muted">Calculado automáticamente: 12 meses normales + meses de gracia</small>
                                                        </div>
                                                        <div class="col-md-4 mb-3">
                                                            <label for="editFechaInicial" class="form-label fw-bold">Fecha Inicial</label>
                                                            <input type="date" class="form-control" id="editFechaInicial" required>
                                                        </div>
                                                        <div class="col-md-4 mb-3">
                                                            <label for="editFechaFinal" class="form-label fw-bold">Fecha Final</label>
                                                            <input type="date" class="form-control" id="editFechaFinal" required>
                                                        </div>
                                                    </div>
                                                    <div class="row">
                                                        <div class="col-12 mb-3">
                                                            <label for="editObservaciones" class="form-label fw-bold">Observaciones</label>
                                                            <textarea class="form-control" id="editObservaciones" rows="2" placeholder="Agregar observaciones adicionales..."></textarea>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>

                                                                                         <!-- Información Financiera -->
                                             <div class="card mb-5">
                                                 <div class="card-header">
                                                     <h3 class="card-title">Información Financiera</h3>
                                                 </div>
                                                 <div class="card-body">
                                                     <div class="row">
                                                         <div class="col-md-6 mb-3">
                                                             <label for="editMontoTotal" class="form-label fw-bold">Monto Total</label>
                                                             <div class="input-group">
                                                                 <span class="input-group-text">L.</span>
                                                                 <input type="number" class="form-control" id="editMontoTotal" step="0.01" min="0" readonly>
                                                             </div>
                                                         </div>
                                                     </div>
                                                 </div>
                                             </div>

                                            <!-- Detalle de Pagos -->
                                            <div class="card">
                                                <div class="card-header">
                                                    <h3 class="card-title">Detalle de Pagos</h3>
                                                </div>
                                                <div class="card-body">
                                                    <div id="pagosGrid"></div>
                                                </div>
                                            </div>
                                        </form>
                                    </div>
                                    <!--end::Card body-->
                                </div>
                                <!--end::Card-->
                            </div>
                        </div>
                        <!--end::Content-->
                    </div>
                    <!--end::Content wrapper-->
                </div>
                <!--end:::Main-->
            </div>
            <!--end::Wrapper-->
        </div>
        <!--end::Page-->
    </div>
    <!--end::App-->

    <!--begin::Javascript-->
    <script src="assets/plugins/global/plugins.bundle.js"></script>
    <script src="assets/js/scripts.bundle.js"></script>
    
    <!-- Syncfusion JS -->
    <?php echo getSyncfusionJS(); ?>
    
    <!-- CSS específico del módulo Edición de Préstamo -->
    <link rel="stylesheet" href="apps/Prestamos/Edicion_Prestamo/css/edicion-prestamo.css">
    
    <!-- Módulo específico de edición -->
    <script src="apps/Prestamos/Edicion_Prestamo/js/edicion-prestamo.js"></script>
</body>
</html>
