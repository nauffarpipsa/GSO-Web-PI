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
                                <form id="formEdicionCompleta">

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
                                                    Edición de Usuario
                                                </h2>
                                            </div>
                                            <div class="card-toolbar">
                                                <div class="d-flex justify-content-end">
                                                    <a href="apps\configuraciones\users\usuario.php" class="btn btn-light me-3">
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
                                        <div class="card-body">
                                            <div class="row">
                                                <div class="col-md-6 mb-3">
                                                    <label for="firstName" class="form-label fw-bold">Nombre</label>
                                                    <input type="text" class="form-control" id="firstName"
                                                        name="firstName" required />
                                                </div>
                                                <div class="col-md-6 mb-3">
                                                    <label for="lastName" class="form-label fw-bold">Apellido</label>
                                                    <input type="text" class="form-control" id="lastName"
                                                        name="lastName" required />
                                                </div>
                                            </div>

                                            <div class="row">
                                                <div class="col-md-6 mb-3">
                                                    <label for="phone" class="form-label fw-bold">Teléfono</label>
                                                    <input type="tel" class="form-control" id="phone" name="phone" />
                                                </div>
                                                <div class="col-md-6 mb-3">
                                                    <label for="email" class="form-label fw-bold">Correo
                                                        Electrónico</label>
                                                    <input type="email" class="form-control" id="email" name="email"
                                                        required />
                                                </div>
                                            </div>

                                            <div class="row">
                                                <div class="col-md-6 mb-3">
                                                    <label for="buyerCode" class="form-label fw-bold">Código
                                                        Comprador</label>
                                                    <input type="text" class="form-control" id="buyerCode"
                                                        name="buyerCode" />
                                                </div>
                                                <div class="col-md-6 mb-3">
                                                    <label for="supplierCode" class="form-label fw-bold">Código
                                                        Proveedor</label>
                                                    <input type="text" class="form-control" id="supplierCode"
                                                        name="supplierCode" />
                                                </div>
                                            </div>

                                            <div class="row">
                                                <div class="col-md-6 mb-3">
                                                    <label class="form-label fw-bold">Estado</label>
                                                    <div class="form-check form-switch">
                                                        <input class="form-check-input" type="checkbox" id="status"
                                                            checked>
                                                        <label class="form-check-label" for="status">Activo</label>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <br>
                                    <div class="card">
                                        <div class="card-body">

                                            <div class="row">
                                                <div class="col-md-12 mb-3">
                                                    <h2>Sucursales del Usuario</h2>
                                                    <hr>
                                                    <div class="dual-list-wrapper row">
                                                        <div class="dual-list-group col-md-6">
                                                            <h5>Sucursales Disponibles</h5>
                                                            <div id="listBoxSucursalesDisponibles"></div>
                                                        </div>
                                                        <div class="dual-list-group col-md-6">
                                                            <h5>Sucursales Asignadas</h5>
                                                            <div id="listBoxSucursalesAsignadas"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <br>
                                    <div class="card">
                                        <div class="card-body">

                                            <div class="row">
                                                <div class="col-md-12 mb-3">
                                                    <h2>Roles del Usuario</h2>
                                                    <hr>
                                                    <div class="dual-list-wrapper row">
                                                        <div class="dual-list-group col-md-6">
                                                            <h5>Roles Disponibles</h5>
                                                            <div id="listBoxRolesDisponibles"></div>
                                                        </div>
                                                        <div class="dual-list-group col-md-6">
                                                            <h5>Roles Asignados</h5>
                                                            <div id="listBoxRolesAsignados"></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </form>
                            </div>
                        </div>
                        <!-- Información General -->
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
    <script type="module" src="apps/configuraciones/helper/helper.js"></script>

    <!-- CSS específico del módulo Configuración General -->
    <link rel="stylesheet" href="apps/configuraciones/users/css/usuario.css">

    <!-- Módulo específico de configuración -->
    <script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
    <script type="module" src=" apps/configuraciones/users/js/usuario-crear.js"></script>
    <script src="Login/sessionMonitor.js"></script>

</body>

</html>