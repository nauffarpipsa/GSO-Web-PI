<?php
include("../../../Login/validar_sesion.php");
include("../../../config/syncfusion-config.php");
?>
<!DOCTYPE html>
<html lang="es">

<head>
    <base href="../../../" />
    <title>Configuración General - Configuraciones</title>
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
                            <!-- Contenido principal -->
                            <div class="content d-flex flex-column flex-column-fluid" id="kt_content">
                                <div class="container-xxl" id="kt_content_container">
                                    <!-- Título de la página -->
                                    <div class="card mb-5 mb-xl-10">
                                        <div class="card-header border-0">
                                            <div class="card-title m-0">
                                                <h3 class="fw-bold m-0">Configuración General</h3>
                                            </div>
                                        </div>
                                    </div>

                                    <div class="row g-5 g-xl-8 mb-5">

                                        <!-- Tarjeta para Acciones -->
                                        <div class="col-xl-6">
                                            <div class="card card-xl-stretch mb-xl-8">
                                                <div class="card-header border-0 pt-5">
                                                    <h3 class="card-title align-items-start flex-column">
                                                        <span class="card-label fw-bold fs-3 mb-1">Acciones</span>
                                                        <span class="text-muted mt-1 fw-semibold fs-7">Configuración de
                                                            acciones del sistema</span>
                                                    </h3>
                                                    <div class="card-toolbar">
                                                        <button type="button" class="btn btn-sm btn-light-primary"
                                                            id="btnAgregarAccion">
                                                            <i class="ki-duotone ki-plus fs-2"></i>Agregar
                                                        </button>
                                                    </div>
                                                </div>
                                                <div class="card-body py-3">
                                                    <div id="accionesGridContainer">
                                                        <div id="accionesGrid"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Tarjeta para Accesos -->
                                        <div class="col-xl-6">
                                            <div class="card card-xl-stretch mb-xl-8">
                                                <div class="card-header border-0 pt-5">
                                                    <h3 class="card-title align-items-start flex-column">
                                                        <span class="card-label fw-bold fs-3 mb-1">Accesos</span>
                                                        <span class="text-muted mt-1 fw-semibold fs-7">Configuración de
                                                            accesos de la aplicación</span>
                                                    </h3>
                                                    <div class="card-toolbar">
                                                        <button type="button" class="btn btn-sm btn-light-primary"
                                                            id="btnAgregarAcceso">
                                                            <i class="ki-duotone ki-plus fs-2"></i>Agregar
                                                        </button>
                                                    </div>
                                                </div>
                                                <div class="card-body py-3">
                                                    <div id="accesosGridContainer">

                                                        <div id="accesosGrid"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Tipos de Autorización -->
                                        <div class="col-xl-6">
                                            <div class="card card-xl-stretch mb-xl-8">
                                                <div class="card-header border-0 pt-5">
                                                    <h3 class="card-title align-items-start flex-column">
                                                        <span class="card-label fw-bold fs-3 mb-1">Tipos de
                                                            Autorización</span>
                                                        <span class="text-muted mt-1 fw-semibold fs-7">Configuración de
                                                            tipos de Autorización</span>
                                                    </h3>
                                                    <div class="card-toolbar">
                                                        <button type="button" class="btn btn-sm btn-light-primary"
                                                            id="btnAgregarTipoAutorizacion">
                                                            <i class="ki-duotone ki-plus fs-2"></i>Agregar
                                                        </button>
                                                    </div>
                                                </div>
                                                <div class="card-body py-3">
                                                    <div id="tipoAutorizacionesGridContainer">
                                                        <div id="tipoAutorizacionesGrid"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                        <!-- <div class="col-xl-6">
                                            <div class="card card-xl-stretch mb-xl-8">
                                                <div class="card-header border-0 pt-5">
                                                    <h3 class="card-title align-items-start flex-column">
                                                        <span class="card-label fw-bold fs-3 mb-1">Tipos de
                                                            Transaccion</span>
                                                        <span class="text-muted mt-1 fw-semibold fs-7">Configuración de
                                                            tipos de Transaccion</span>
                                                    </h3>
                                                    <div class="card-toolbar">
                                                        <button type="button" class="btn btn-sm btn-light-primary"
                                                            id="btnAgregarTipoTransaccion">
                                                            <i class="ki-duotone ki-plus fs-2"></i>Agregar
                                                        </button>
                                                    </div>
                                                </div>
                                                <div class="card-body py-3">
                                                    <div id="tiposTransaccionGrid"></div>
                                                </div>
                                            </div>
                                        </div> -->
                                        <!-- Tarjeta para Unidades de Venta -->
                                        <!-- <div class="col-xl-6">
                                            <div class="card card-xl-stretch mb-xl-8">
                                                <div class="card-header border-0 pt-5">
                                                    <h3 class="card-title align-items-start flex-column">
                                                        <span class="card-label fw-bold fs-3 mb-1">Unidades de
                                                            Venta</span>
                                                        <span class="text-muted mt-1 fw-semibold fs-7">Configuración de
                                                            unidades de venta</span>
                                                    </h3>
                                                    <div class="card-toolbar">
                                                        <button type="button" class="btn btn-sm btn-light-primary"
                                                            id="btnAgregarUnidadVenta">
                                                            <i class="ki-duotone ki-plus fs-2"></i>Agregar
                                                        </button>
                                                    </div>
                                                </div>
                                                <div class="card-body py-3">
                                                    <div id="unidadesVentaGrid"></div>
                                                </div>
                                            </div>
                                        </div> -->
                                        <!-- Tarjeta para Unidades de Inventario -->
                                        <!-- <div class="col-xl-6">
                                            <div class="card card-xl-stretch mb-xl-8">
                                                <div class="card-header border-0 pt-5">
                                                    <h3 class="card-title align-items-start flex-column">
                                                        <span class="card-label fw-bold fs-3 mb-1">Unidades de
                                                            Inventario</span>
                                                        <span class="text-muted mt-1 fw-semibold fs-7">Configuración de
                                                            unidades de inventario</span>
                                                    </h3>
                                                    <div class="card-toolbar">
                                                        <button type="button" class="btn btn-sm btn-light-primary"
                                                            id="btnAgregarUnidadInventario">
                                                            <i class="ki-duotone ki-plus fs-2"></i>Agregar
                                                        </button>
                                                    </div>
                                                </div>
                                                <div class="card-body py-3">
                                                    <div id="unidadesInventarioGrid"></div>
                                                </div>
                                            </div>
                                        </div> -->
                                        <!-- Tarjeta para Tipos de Módulos Operativos -->
                                        <!-- <div class="col-xl-6">
                                            <div class="card card-xl-stretch mb-xl-8">
                                                <div class="card-header border-0 pt-5">
                                                    <h3 class="card-title align-items-start flex-column">
                                                        <span class="card-label fw-bold fs-3 mb-1">Tipos de Módulos
                                                            Operativos</span>
                                                        <span class="text-muted mt-1 fw-semibold fs-7">Configuración de
                                                            módulos operativos</span>
                                                    </h3>
                                                    <div class="card-toolbar">
                                                        <button type="button" class="btn btn-sm btn-light-primary"
                                                            id="btnAgregarTipoModuloOperativo">
                                                            <i class="ki-duotone ki-plus fs-2"></i>Agregar
                                                        </button>
                                                    </div>
                                                </div>
                                                <div class="card-body py-3">
                                                    <div id="tiposModulosOperativosGrid"></div>
                                                </div>
                                            </div>
                                        </div> -->
                                        <div class="col-xl-6">
                                            <div class="card card-xl-stretch mb-xl-8">
                                                <div class="card-header border-0 pt-5">
                                                    <h3 class="card-title align-items-start flex-column">
                                                        <span class="card-label fw-bold fs-3 mb-1">Tipo de Cambio
                                                        </span>
                                                        <span class="text-muted mt-1 fw-semibold fs-7">Configuración de
                                                            Tipo de Cabio</span>
                                                    </h3>
                                                    <div class="card-toolbar">
                                                        <button type="button" class="btn btn-sm btn-light-primary"
                                                            id="btnAgregarTipoCambio">
                                                            <i class="ki-duotone ki-plus fs-2"></i>Agregar
                                                        </button>
                                                    </div>
                                                </div>
                                                <div class="card-body py-3">
                                                    <div id="tipoCambioGridContainer">
                                                        <div id="tiposCambioGrid"></div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                </div>
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
    <!-- Modal Tipo de Autorización -->

    <?php include("modalAcceso.php"); ?>
    <?php include("modalAcciones.php"); ?>
    <?php include("modalTipoAutorizacionModal.php"); ?>
    <?php #include("modalTipoTransaccionModal.php"); 
    ?>
    <?php #include("modalUnidadVenta.php"); 
    ?>
    <?php #include("modalUnidadInventario.php"); 
    ?>
    <?php #include("modalTipoModuloOperativo.php"); 
    ?>
    <?php include("modalTipoCambio.php"); ?>

    <!-- Scripts -->
    <script src="assets/plugins/global/plugins.bundle.js"></script>
    <script src="assets/js/scripts.bundle.js"></script>

    <!-- Syncfusion JS -->
    <?php echo getSyncfusionJS(); ?>


    <script src="utilities/permissionHelper.js"></script>

    <!-- Configuración de locale para Syncfusion -->
    <script type="module" src="apps\configuraciones\helper\helper.js"></script>

    <!-- CSS específico del módulo Configuración General -->
    <link rel="stylesheet" href="apps\configuraciones\configuracion_general\css\configuraciones_generales.css">

    <script type="module"
        src="https://cdn.jsdelivr.net/npm/just-validate@latest/dist/just-validate.production.min.js"></script>

    <!-- Módulo específico de configuración -->
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <script type="module" src="apps\configuraciones\configuracion_general\js\configuracion-general.js"></script>
    <script src="Login/sessionMonitor.js"></script>

</body>

</html>