<?php
include("../../../Login/validar_sesion.php");
include("../../../config/syncfusion-config.php");
?>
<script src="../../../Login/sessionMonitor.js"></script>

<!DOCTYPE html>
<html lang="es">

<head>
    <base href="../../../" />
    <title>Autorizaciones</title>
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

<body id="kt_app_body" data-kt-app-layout="light-sidebar" data-kt-app-header-fixed="true"
    data-kt-app-sidebar-enabled="true" data-kt-app-sidebar-fixed="true" data-kt-app-sidebar-hoverable="true"
    data-kt-app-sidebar-push-header="true" data-kt-app-sidebar-push-toolbar="true"
    data-kt-app-sidebar-push-footer="true" data-kt-app-toolbar-enabled="true" class="app-default">
    <!--begin::App-->
    <div class="d-flex flex-column flex-root app-root" id="kt_app_root">
        <!--begin::Page-->
        <div class="app-page flex-column flex-column-fluid" id="kt_app_page">
            <!--begin::Header-->
            <div id="kt_app_header" class="app-header">
                <div class="app-container container-fluid d-flex align-items-stretch justify-content-between"
                    id="kt_app_header_container">
                    <div class="d-flex align-items-center d-lg-none ms-n3 me-2" title="Show sidebar menu">
                        <div class="btn btn-icon btn-active-color-primary w-35px h-35px"
                            id="kt_app_sidebar_mobile_toggle">
                            <i class="ki-duotone ki-abstract-14 fs-1">
                                <span class="path1"></span>
                                <span class="path2"></span>
                            </i>
                        </div>
                    </div>
                    <div class="d-flex align-items-center flex-grow-1 flex-lg-grow-0">
                        <?php include("../../../Navigation/MobileLogo.php"); ?>
                    </div>
                    <div class="d-flex align-items-stretch justify-content-between flex-lg-grow-1"
                        id="kt_app_header_wrapper">
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
                <div id="kt_app_sidebar" class="app-sidebar flex-column" data-kt-drawer="true"
                    data-kt-drawer-name="app-sidebar" data-kt-drawer-activate="{default: true, lg: false}"
                    data-kt-drawer-overlay="true" data-kt-drawer-width="225px" data-kt-drawer-direction="start"
                    data-kt-drawer-toggle="#kt_app_sidebar_mobile_toggle">
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
                                                Creación de Modelo de Autorización
                                            </h2>
                                        </div>
                                        <div class="card-toolbar">
                                            <div class="d-flex justify-content-end">
                                                <a href="apps/configuraciones/autorizaciones/autorizaciones.php" class="btn btn-light me-3">
                                                    <i class="ki-duotone ki-arrow-left fs-2 me-2">
                                                        <span class="path1"></span>
                                                        <span class="path2"></span>
                                                    </i>
                                                    Volver
                                                </a>
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
                                    <form id="formEdicionCompleta">
                                        <div class="card-body">
                                            <div class="row">

                                                <div class="col-md-6 mb-3">
                                                    <label for="authorizationModelDescription"
                                                        class="form-label fw-bold">Descripción</label>
                                                    <input type="text" class="form-control"
                                                        id="authorizationModelDescription" name="description">
                                                </div>
                                                <div class="col-md-6 mb-3">
                                                    <label for="tipoAutorizacionSelect" class="form-label fw-bold">Tipo
                                                        autorización</label>
                                                    <select class="form-select" id="tipoAutorizacionSelect"
                                                        name="authorizationTypeId"></select>
                                                </div>
                                            </div>
                                            <div class="row">

                                                <div class="col-md-6 mb-3">
                                                    <label for="sociedadSelect"
                                                        class="form-label fw-bold">Sociedad</label>
                                                    <select class="form-select" id="sociedadSelect" on
                                                        name="companyId"></select>
                                                </div>

                                                <div class="col-md-6 mb-3">
                                                    <br>
                                                    <br>
                                                    <label class="form-check-label" for="status">Activo</label>
                                                    <input class="form-check-input" type="checkbox" id="status" checked>
                                                </div>

                                            </div>
                                            <div class="row">
                                                <div class="col-md-12 mb-3">
                                                    <label class="form-label fw-bold">Usuarios Autorizadores</label>
                                                    <div class="dual-list-wrapper row">
                                                        <div class="dual-list-group col-md-6">
                                                            <h5>Usuarios Disponibles</h5>
                                                            <div id="listBoxDisponibles"></div>
                                                        </div>
                                                        <div class="dual-list-group col-md-6">
                                                            <h5>Usuarios Asignados</h5>
                                                            <div id="listBoxAsignados"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </form>
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

    <!-- Modales -->

    <!-- Scripts -->
    <script src="assets/plugins/global/plugins.bundle.js"></script>
    <script src="assets/js/scripts.bundle.js"></script>

    <!-- Syncfusion JS -->
    <?php echo getSyncfusionJS(); ?>

    <!-- Configuración de locale para Syncfusion -->
    <script type="module" src="apps\configuraciones\helper\helper.js"></script>
    <script type="module"
        src="https://cdn.jsdelivr.net/npm/just-validate@4.2.0/dist/just-validate.production.min.js"></script>


    <!-- CSS específico del módulo Configuración General -->
    <link rel="stylesheet" href="apps\configuraciones\autorizaciones\css\autorizaciones.css">

    <!-- Módulo específico de configuración -->
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <script type="module" src="apps\configuraciones\autorizaciones\js\autorizaciones-crear.js"></script>
    <script src="Login/sessionMonitor.js"></script>

</body>

</html>