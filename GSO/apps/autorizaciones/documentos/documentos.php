<?php include("../../../Login/validar_sesion.php"); ?>
<script src="../../../Login/sessionMonitor.js"></script>
<!DOCTYPE html>
<html lang="es">
<head>
    <base href="../../../" />
    <title>Autorizaciones - Nauffar Germany</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="shortcut icon" href="assets/media/logos/ico.ico" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Inter:300,400,500,600,700" />
    <link href="assets/plugins/custom/datatables/datatables.bundle.css" rel="stylesheet" type="text/css" />
    <link href="assets/plugins/global/plugins.bundle.css" rel="stylesheet" type="text/css" />
    <link href="assets/css/style.bundle.css" rel="stylesheet" type="text/css" />
    <!-- DataTables Responsive CSS -->
    <link href="https://cdn.datatables.net/responsive/2.5.0/css/responsive.dataTables.min.css" rel="stylesheet" type="text/css" />
    <!-- Custom CSS -->
    <link href="apps/autorizaciones/documentos/css/documentos.css" rel="stylesheet" type="text/css" />
    <!--begin::Vendors Javascript(used for this page only)-->
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <!--end::Vendors Javascript-->
    <!-- Integración WebSocket -->
<?php include '../../../utilities/websocket-init.php'; ?>
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
                                            <div class="d-flex align-items-center position-relative my-1">
                                                <i class="ki-duotone ki-magnifier fs-3 position-absolute ms-4">
                                                    <span class="path1"></span>
                                                    <span class="path2"></span>
                                                </i>
                                                <input type="text" id="DocSearch" class="form-control form-control-solid w-250px ps-12" placeholder="Buscar Documento..." />
                                            </div>
                                        </div>
                                        <div class="card-toolbar">
                                            <div class="d-flex justify-content-end align-items-center" data-kt-user-table-toolbar="base">
                                                <div class="me-3">
                                                    <input type="date" id="fecha_inicial" class="form-control form-control-solid" />
                                                </div>
                                                <div class="me-3">
                                                    <input type="date" id="fecha_final" class="form-control form-control-solid" />
                                                </div>
                                                <div class="me-3">
                                                    <div class="form-check form-check-custom form-check-solid">
                                                        <input class="form-check-input" type="checkbox" id="solo_pendientes" value="SoloPendientes"/>
                                                        <label class="form-check-label" for="solo_pendientes">
                                                            Solo Pendientes
                                                        </label>
                                                    </div>
                                                </div>
                                                <div class="me-3">
                                                    <div class="d-flex align-items-center">
                                                        <label class="me-2">Registros:</label>
                                                        <input type="number" id="registros_por_pagina" class="form-control form-control-solid" style="width: 80px;" value="1000" min="1" max="2000"/>
                                                    </div>
                                                </div>
                                                <button type="button" id="btn_buscar" class="btn btn-light-primary">
                                                    <i class="ki-duotone ki-magnifier fs-2">
                                                        <span class="path1"></span>
                                                        <span class="path2"></span>
                                                    </i>
                                                    Buscar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <!--end::Card header-->
                                    <!--begin::Card body-->
                                    <div class="card-body py-4">
                                        <!--begin::Table container-->
                                        <div class="table-responsive">
                                            <table id="tablaDocumentos" class="table align-middle table-row-dashed fs-6 gy-5">
                                                <thead>
                                                    <tr class="text-start text-muted fw-bold fs-7 text-uppercase gs-0">
                                                        <th class="min-w-100px">Número Doc</th>
                                                        <th class="min-w-100px">Fecha</th>
                                                        <th class="min-w-150px">Solicitante</th>
                                                        <th class="min-w-100px">Sede</th>
                                                        <th class="min-w-100px">Tipo Autorización</th>
                                                        <th class="min-w-100px">Estado</th>
                                                        <th class="min-w-100px">Acciones</th>
                                                    </tr>
                                                </thead>
                                                <tbody class="text-gray-600 fw-semibold">
                                                    <!-- Los datos se cargarán dinámicamente aquí -->
                                                </tbody>
                                            </table>
                                        </div>
                                        <!--end::Table container-->
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

    <!--begin::Modal - Detalle Documento-->
    <div class="modal fade" id="kt_modal_detalle_documento" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-xl">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="fw-bold">Detalle del Documento</h2>
                    <div class="btn btn-icon btn-sm btn-active-light-primary ms-2" data-bs-dismiss="modal" aria-label="Close">
                        <i class="ki-duotone ki-cross fs-2">
                            <span class="path1"></span>
                            <span class="path2"></span>
                        </i>
                    </div>
                </div>
                <div class="modal-body">
                    <!--begin::Encabezado-->
                    <div class="card mb-5">
                        <div class="card-body">
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label class="form-label fw-bold">Número Documento:</label>
                                        <span id="modal_numero_doc" class="form-control-plaintext"></span>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label class="form-label fw-bold">Código Cliente:</label>
                                        <span id="modal_codigo_cliente" class="form-control-plaintext"></span>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label class="form-label fw-bold">Cliente:</label>
                                        <span id="modal_nombre_cliente" class="form-control-plaintext"></span>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label class="form-label fw-bold">Fecha:</label>
                                        <span id="modal_fecha" class="form-control-plaintext"></span>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label class="form-label fw-bold">Solicitante:</label>
                                        <span id="modal_solicitante" class="form-control-plaintext"></span>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label class="form-label fw-bold">Sede:</label>
                                        <span id="modal_sede" class="form-control-plaintext"></span>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label class="form-label fw-bold">SubTotal:</label>
                                        <span id="modal_subtotal" class="form-control-plaintext"></span>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label class="form-label fw-bold">Flete:</label>
                                        <span id="modal_flete" class="form-control-plaintext"></span>
                                    </div>
                                </div>
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label class="form-label fw-bold">ISV:</label>
                                        <span id="modal_isv" class="form-control-plaintext"></span>
                                    </div>
                                </div>
                            </div>
                            <div class="row">
                                <div class="col-md-4">
                                    <div class="mb-3">
                                        <label class="form-label fw-bold">Monto Total:</label>
                                        <span id="modal_monto_total" class="form-control-plaintext"></span>
                                    </div>
                                </div>
                                <div class="col-md-6" id="modal_contribucion_total_container">
                                    <div class="mb-3">
                                        <label class="form-label fw-bold">Contribución Total:</label>
                                        <span id="modal_contribucion_total" class="form-control-plaintext"></span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                    <!--end::Encabezado-->

                    <!--begin::Detalle-->
                    <div class="card">
                        <div class="card-header">
                            <h3 class="card-title">Detalle de Autorizaciones</h3>
                        </div>
                        <div class="card-body">
                            <!--begin::Tabs-->
                            <div class="d-flex flex-column">
                                <!--begin::Tabs wrapper-->
                                <div id="kt_tabs_detalle" class="nav nav-stretch nav-line-tabs nav-line-tabs-2x border-transparent fs-5 fw-bold">
                                    <!-- Las pestañas se generarán dinámicamente -->
                                </div>
                                <!--end::Tabs wrapper-->

                                <!--begin::Tab content-->
                                <div id="kt_tabs_content" class="tab-content">
                                    <!-- El contenido de las pestañas se generará dinámicamente -->
                                </div>
                                <!--end::Tab content-->
                            </div>
                            <!--end::Tabs-->
                        </div>
                    </div>
                    <!--end::Detalle-->
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    </div>
    <!--end::Modal - Detalle Documento-->

    <!--begin::Modal - Comentario Autorización-->
    <div class="modal fade" id="kt_modal_comentario_autorizacion" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="fw-bold">Autorizar Documento</h2>
                    <div class="btn btn-icon btn-sm btn-active-light-primary ms-2" data-bs-dismiss="modal" aria-label="Close">
                        <i class="ki-duotone ki-cross fs-2">
                            <span class="path1"></span>
                            <span class="path2"></span>
                        </i>
                    </div>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label class="form-label fw-bold">Comentario de autorización:</label>
                        <textarea id="comentario_autorizacion" class="form-control" rows="3"></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-success" id="btn_confirmar_autorizacion">Autorizar</button>
                </div>
            </div>
        </div>
    </div>
    <!--end::Modal - Comentario Autorización-->

    <!--begin::Modal - Comentario Rechazo-->
    <div class="modal fade" id="kt_modal_comentario_rechazo" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h2 class="fw-bold">Rechazar Documento</h2>
                    <div class="btn btn-icon btn-sm btn-active-light-primary ms-2" data-bs-dismiss="modal" aria-label="Close">
                        <i class="ki-duotone ki-cross fs-2">
                            <span class="path1"></span>
                            <span class="path2"></span>
                        </i>
                    </div>
                </div>
                <div class="modal-body">
                    <div class="mb-3">
                        <label for="comentario_rechazo" class="form-label required">Comentario</label>
                        <textarea class="form-control" id="comentario_rechazo" rows="4" placeholder="Ingrese su comentario..."></textarea>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-danger" id="btn_confirmar_rechazo">Rechazar</button>
                </div>
            </div>
        </div>
    </div>
    <!--end::Modal - Comentario Rechazo-->

    <!--begin::Javascript-->
    <script src="assets/plugins/global/plugins.bundle.js"></script>
    <script src="assets/js/scripts.bundle.js"></script>
    <script src="https://code.jquery.com/jquery-3.6.0.min.js"></script>
    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.1.3/dist/js/bootstrap.bundle.min.js"></script>
    <script src="assets/plugins/custom/datatables/datatables.bundle.js"></script>
    <script src="https://cdnjs.cloudflare.com/ajax/libs/moment.js/2.29.1/moment.min.js"></script>
    <script src="apps/autorizaciones/documentos/js/helpers.js"></script>
</body>
</html> 