<?php 
include("../../Login/validar_sesion.php"); 
include("../../config/syncfusion-config.php");
include("../../config/api.php");
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <base href="../../" />
    <?php
        $reportName = isset($_GET['report']) ? $_GET['report'] : '';
        $reportTitle = isset($_GET['title']) ? $_GET['title'] : '';
    ?>
    <title>Visor: <?php echo htmlspecialchars($reportTitle); ?></title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="shortcut icon" href="assets/media/logos/ico.ico" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Inter:300,400,500,600,700" />
    <link href="assets/plugins/global/plugins.bundle.css" rel="stylesheet" type="text/css" />
    <link href="assets/css/style.bundle.css" rel="stylesheet" type="text/css" />
    
    <!-- Estilos de Bold Reports -->
    <link href="https://cdn.boldreports.com/6.3.16/content/material/bold.reports.all.min.css" rel="stylesheet" />
    <link href="utilities/report-viewer/css/report-viewer.css" rel="stylesheet" type="text/css" />
</head>
<?php include '../../utilities/websocket-init.php'; ?>
<body id="kt_app_body" data-kt-app-layout="light-sidebar" data-kt-app-header-fixed="true" data-kt-app-sidebar-enabled="true" data-kt-app-sidebar-fixed="true" data-kt-app-sidebar-hoverable="true" data-kt-app-sidebar-push-header="true" data-kt-app-sidebar-push-toolbar="true" data-kt-app-sidebar-push-footer="true" data-kt-app-toolbar-enabled="true" class="app-default">
    <div class="d-flex flex-column flex-root app-root" id="kt_app_root">
        <div class="app-page flex-column flex-column-fluid" id="kt_app_page">
            <!-- Header -->
            <div id="kt_app_header" class="app-header">
                <div class="app-container container-fluid d-flex align-items-stretch justify-content-between" id="kt_app_header_container">
                    <div class="d-flex align-items-center d-lg-none ms-n3 me-2" title="Show sidebar menu">
                        <div class="btn btn-icon btn-active-color-primary w-35px h-35px" id="kt_app_sidebar_mobile_toggle">
                            <i class="ki-duotone ki-abstract-14 fs-1">
                                <span class="path1"></span><span class="path2"></span>
                            </i>
                        </div>
                    </div>
                    <div class="d-flex align-items-center flex-grow-1 flex-lg-grow-0">
                        <?php include("../../Navigation/MobileLogo.php"); ?>
                    </div>
                    <div class="d-flex align-items-stretch justify-content-between flex-lg-grow-1" id="kt_app_header_wrapper">
                        <?php include("../../Navigation/MenuHeader.php"); ?>
                        <div class="app-navbar flex-shrink-0">
                            <?php include("../../Navigation/LoginHeader.php"); ?>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="app-wrapper flex-column flex-row-fluid" id="kt_app_wrapper">
                <!-- Sidebar -->
                <div id="kt_app_sidebar" class="app-sidebar flex-column" data-kt-drawer="true" data-kt-drawer-name="app-sidebar" data-kt-drawer-activate="{default: true, lg: false}" data-kt-drawer-overlay="true" data-kt-drawer-width="225px" data-kt-drawer-direction="start" data-kt-drawer-toggle="#kt_app_sidebar_mobile_toggle">
                    <div class="app-sidebar-logo px-6" id="kt_app_sidebar_logo">
                        <?php include("../../Navigation/Logo.html"); ?>
                    </div>
                    <div class="app-sidebar-menu overflow-hidden flex-column-fluid">
                        <?php include("../../Navigation/Menu.php"); ?>
                    </div>
                </div>
                
                <!-- Main -->
                <div class="app-main flex-column flex-row-fluid" id="kt_app_main">
                    <div class="d-flex flex-column flex-column-fluid">
                        <div id="kt_app_content" class="app-content flex-column-fluid">
                            <div id="kt_app_content_container" class="app-container container-fluid mt-5">
                                <div class="card card-flush h-100">
                                    <div class="card-header border-0 pt-5">
                                        <h3 class="card-title align-items-start flex-column">
                                            <span class="card-label fw-bold text-gray-900"><?php echo htmlspecialchars($reportTitle); ?></span>
                                        </h3>
                                    </div>
                                    <div class="card-body py-3">
                                        <div id="viewer"></div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    <div id="kt_app_footer" class="app-footer">
                        <div class="app-container container-fluid d-flex flex-column flex-md-row flex-center flex-md-stack py-3">
                            <div class="text-gray-900 order-2 order-md-1">
                                <span class="text-muted fw-semibold me-1">2026&copy;</span>
                                <a href="#" class="text-gray-800 text-hover-primary">Corporativo</a>
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
    
    <!-- Bold Reports Scripts -->
    <script src="https://cdn.boldreports.com/6.3.16/scripts/common/bold.reports.common.min.js"></script>
    <script src="https://cdn.boldreports.com/6.3.16/scripts/common/bold.reports.widgets.min.js"></script>
    <script src="https://cdn.boldreports.com/6.3.16/scripts/bold.report-viewer.min.js"></script>

    <script type="module">

        $(document).ready(function () {
            try {
                const serviceUrl = "<?php echo API_REPORT_VIEWER; ?>/ReportViewer";
                const reportPath = "<?php echo $reportName; ?>";

                $("#viewer").boldReportViewer({
                    reportServiceUrl: serviceUrl,
                    reportPath: reportPath,
                    renderMode: 0,
                    isResponsive: true,
                    toolbarRenderMode: "Default",
                    parameterSettings: {
                        position: "right"
                    },
                    create: function (args) {
                    },
                    error: function (args) {
                        console.error("Error en el Visor:", args);
                        alert("Error al cargar el reporte. Revise la consola.");
                    }
                });
            } catch (err) {
                console.error("Error crítico en inicialización:", err);
            }
        });
    </script>
</body>
</html>
