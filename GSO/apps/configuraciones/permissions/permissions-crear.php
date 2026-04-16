<?php
include("../../../Login/validar_sesion.php");
include("../../../config/syncfusion-config.php");
include("../../Prestamos/config/catalogos-config.php");
?>

<!DOCTYPE html>
<html lang="es">

<head>
    <base href="../../../" />
    <title>Permisos</title>
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
            <!--begin::Header-->f
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
                                <!--begin::Card body-->
                                <div class="card-body py-4">
                                    <form id="formEdicionCompleta">
                                        <div class="card mb-5">

                                            <div class="card">
                                                <!--begin::Card header-->
                                                <div class="card-header border-0 pt-6">
                                                    <div class="card-title">
                                                        <h2 class="fw-bold" id="formPermissionTitle">
                                                            Asignación de Permisos
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
                                                            <label for="userName" class="form-label fw-bold">Usuario</label>
                                                            <input type="text" class="form-control" id="userName" disabled>
                                                        </div>
                                                        <div class="col-md-6 mb-3">
                                                            <label for="contries" class="form-label fw-bold">Pais</label>
                                                            <select class="form-control" id="contries">
                                                                <option value="">Seleccionar país</option>
                                                            </select>
                                                        </div>
                                                        <div class="col-md-12 mb-3">
                                                            <label for="tree" class="form-label fw-bold">Accesos</label>
                                                            <div class="col-lg-12 control-section">
                                                                <div class="control_wrapper">
                                                                    <div id="tree"></div>
                                                                </div>
                                                            </div>
                                                            <div class="col-lg-12 property-section">
                                                                <div id="property" title="Properties">
                                                                    <table>
                                                                        <tbody>
                                                                            <tr>
                                                                                <td>
                                                                                    <!-- Propiedades adicionales si нужны -->
                                                                                </td>
                                                                            </tr>
                                                                        </tbody>
                                                                    </table>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <!--end::Card body-->
                                            </div>
                                    </form>
                                </div>
                                <!--end::Card body-->
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
    <script type="module" src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>


    <!-- Syncfusion JS -->
    <?php echo getSyncfusionJS(); ?>

    <!-- CSS específico del módulo Edición de Préstamo -->
    <link rel="stylesheet" href="apps/configuraciones/permissions/css/permissions-grid.css">

    <!-- Módulo específico de edición -->
    <script type="module" src="apps/configuraciones/permissions/js/permissions-crear.js"></script>
    <script src="Login/sessionMonitor.js"></script>

</body>

</html>