<?php
include("../../../Login/validar_sesion.php");
include("../../../config/syncfusion-config.php");
?>
<script src="../../../Login/sessionMonitor.js"></script>
<!DOCTYPE html>
<html lang="es">
<head>
    <base href="../../../" />
    <title>Detalle de Pagos - Préstamos</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="shortcut icon" href="assets/media/logos/ico.ico" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Inter:300,400,500,600,700" />
    <link href="assets/plugins/global/plugins.bundle.css" rel="stylesheet" type="text/css" />
    <link href="assets/css/style.bundle.css" rel="stylesheet" type="text/css" />
    <?php echo getSyncfusionCSS(); ?>
    <link rel="stylesheet" href="<?php echo SYNCFUSION_CDN_BASE; ?>/tailwind3.css" />
    <link rel="stylesheet" href="<?php echo SYNCFUSION_CDN_BASE; ?>/grid/tailwind3.css" />
    <link href="apps/Prestamos/Reportes/css/reportes-grid.css" rel="stylesheet" type="text/css" />
    <style>
        #tablaReportePagos { min-height: 75vh; display: flex; flex-direction: column; }
        #tablaReportePagos .card { display: flex; flex-direction: column; flex: 1; min-height: 0; }
        #tablaReportePagos .card-body { flex: 1 1 0; min-height: 0; display: flex; flex-direction: column; }
        .reporte-pagos-grid-container {
            flex: 1 1 0;
            min-height: 380px;
            position: relative;
        }
        .reporte-pagos-grid-container #reportePagosGrid { height: 100%; width: 100%; }
    </style>
</head>
<body id="kt_app_body" data-kt-app-layout="light-sidebar" data-kt-app-header-fixed="true" data-kt-app-sidebar-enabled="true" data-kt-app-sidebar-fixed="true" data-kt-app-sidebar-hoverable="true" data-kt-app-sidebar-push-header="true" data-kt-app-sidebar-push-toolbar="true" data-kt-app-sidebar-push-footer="true" data-kt-app-toolbar-enabled="true" class="app-default">
    <div class="d-flex flex-column flex-root app-root" id="kt_app_root">
        <div class="app-page flex-column flex-column-fluid" id="kt_app_page">
            <div id="kt_app_header" class="app-header">
                <div class="app-container container-fluid d-flex align-items-stretch justify-content-between" id="kt_app_header_container">
                    <div class="d-flex align-items-center d-lg-none ms-n3 me-2" title="Show sidebar menu">
                        <div class="btn btn-icon btn-active-color-primary w-35px h-35px" id="kt_app_sidebar_mobile_toggle">
                            <i class="ki-duotone ki-abstract-14 fs-1"><span class="path1"></span><span class="path2"></span></i>
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
                                <div id="tablaReportePagos" class="tabla-container">
                                    <div class="card h-100 w-100">
                                        <div class="card-header border-0 pt-6">
                                            <div class="card-title">
                                                <div class="d-flex align-items-center position-relative my-1">
                                                    <select class="form-select form-select-sm form-select-solid w-100px" id="reportePagosMes" title="Mes">
                                                        <option value="">Mes...</option>
                                                        <option value="1">Ene</option>
                                                        <option value="2">Feb</option>
                                                        <option value="3">Mar</option>
                                                        <option value="4">Abr</option>
                                                        <option value="5">May</option>
                                                        <option value="6">Jun</option>
                                                        <option value="7">Jul</option>
                                                        <option value="8">Ago</option>
                                                        <option value="9">Sep</option>
                                                        <option value="10">Oct</option>
                                                        <option value="11">Nov</option>
                                                        <option value="12">Dic</option>
                                                    </select>
                                                    <select class="form-select form-select-sm form-select-solid w-80px ms-2" id="reportePagosAnio" title="Año">
                                                        <option value="">Año...</option>
                                                    </select>
                                                    <button type="button" class="btn btn-sm btn-light-primary ms-2" id="btnReportePagosBuscar">
                                                        <i class="ki-duotone ki-magnifier fs-2"><span class="path1"></span><span class="path2"></span></i>
                                                        Buscar
                                                    </button>
                                                    <input type="text" id="reportePagosSearch" class="form-control form-control-solid form-control-sm w-250px ms-3" placeholder="Buscar en el reporte..." />
                                                </div>
                                            </div>
                                            <div class="card-toolbar">
                                                <div class="d-flex justify-content-end" data-kt-user-table-toolbar="base">
                                                    <button type="button" class="btn btn-sm btn-success me-2" id="btnReportePagosExcel" title="Exportar a Excel">
                                                        <i class="ki-duotone ki-file-down fs-2"><span class="path1"></span><span class="path2"></span></i>
                                                        Exportar Excel
                                                    </button>
                                                    <button type="button" class="btn btn-sm btn-light-primary" id="btnReportePagosRefresh" title="Refrescar">
                                                        <i class="ki-duotone ki-arrows-square fs-2"><span class="path1"></span><span class="path2"></span></i>
                                                        Refrescar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <div class="card-body py-4">
                                            <div class="reporte-pagos-grid-container">
                                                <div id="reportePagosGrid"></div>
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

    <script src="assets/plugins/global/plugins.bundle.js"></script>
    <script src="assets/js/scripts.bundle.js"></script>
    <?php echo getSyncfusionJS(); ?>
    <script src="apps/Prestamos/Reportes/js/detalle-pagos.js"></script>
</body>
</html>
