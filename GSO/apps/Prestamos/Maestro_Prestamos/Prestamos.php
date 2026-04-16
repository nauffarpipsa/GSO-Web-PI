<?php 
include("../../../Login/validar_sesion.php"); 
include("../../../config/syncfusion-config.php");
include("../../Prestamos/config/catalogos-config.php");
require_once '../../../utilities/PermissionHelper.php';
?>
<script src="../../../Login/sessionMonitor.js"></script>
<!DOCTYPE html>
<html lang="es">
<head>
    <base href="../../../" />
    <title>Maestro de Préstamos</title>
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
                <div class="app-main flex-column flex-row-fluid" id="kt_app_main" >
                    <!--begin::Content wrapper-->
                    <div class="d-flex flex-column flex-column-fluid">
                        <!--begin::Content-->
                        <div id="kt_app_content" class="app-content flex-column-fluid">
                            <div id="kt_app_content_container" class="app-container container-xxl">
                                <!--begin::Tabla Principal-->
                                <div id="tablaPrestamos" class="tabla-container">
                                    <!--begin::Card-->
                                    <div class="card h-100 w-100">
                                        <!--begin::Card header-->
                                        <div class="card-header border-0 pt-6">
                                            <div class="card-title">
                                                <div class="d-flex align-items-center position-relative my-1">
                                                    <i class="ki-duotone ki-magnifier fs-3 position-absolute ms-4">
                                                        <span class="path1"></span>
                                                        <span class="path2"></span>
                                                    </i>
                                                    <input type="text" id="prestamoSearch" class="form-control form-control-solid w-250px ps-12" placeholder="Buscar préstamo..." />
                                                </div>
                                            </div>
                                            <div class="card-toolbar">
                                                <div class="d-flex justify-content-end" data-kt-user-table-toolbar="base">
                                                    <button type="button" class="btn btn-light-primary me-3" id="btnRefresh">
                                                        <i class="ki-duotone ki-arrows-square fs-2">
                                                            <span class="path1"></span>
                                                            <span class="path2"></span>
                                                        </i>
                                                        Refrescar
                                                    </button>
                                                    <?php if (canCreate('Maestro Prestamos')): ?>
                                                    <button type="button" class="btn btn-info me-3" id="btnCuotasPendientesInteres">
                                                        <i class="ki-duotone ki-calendar fs-2">
                                                            <span class="path1"></span>
                                                            <span class="path2"></span>
                                                        </i>
                                                        Cuotas Pendientes Interés
                                                    </button>
                                                    <?php endif; ?>
                                                    <button type="button" class="btn btn-primary" id="btnObtenerPrestamo">
                                                        <i class="ki-duotone ki-plus fs-2"></i>
                                                        Obtener Préstamos
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <!--end::Card header-->
                                        <!--begin::Card body-->
                                        <div class="card-body py-4 d-flex flex-column flex-grow-1">
                                            <!--begin::Syncfusion DataGrid Container-->
                                            <div id="prestamosGrid" class="flex-grow-1"></div>
                                            <!--end::Syncfusion DataGrid Container-->
                                        </div>
                                        <!--end::Card body-->
                                    </div>
                                    <!--end::Card-->
                                </div>
                                <!--end::Tabla Principal-->

                                <!--begin::Edición Completa (Oculta inicialmente)-->
                                <div id="edicionCompleta" class="edicion-container edicion-oculta">
                                    <!--begin::Card-->
                                    <div class="card h-100 w-100">
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
                                                    <button type="button" class="btn btn-light me-3" onclick="prestamosGrid.volverATabla()">
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
                                        <div class="card-body py-4 d-flex flex-column flex-grow-1">
                                            <!-- Formulario de edición completa -->
                                            <form id="formEdicionCompleta" class="flex-grow-1">
                                                <div class="card">
                                                    <div class="card-header">
                                                        <h3 class="card-title">Edición de Préstamo</h3>
                                                    </div>
                                                    <div class="card-body">
                                                        <!-- Switch compacto para Subir Plantilla Excel -->
                                                        <?php if (canImportFiles('Maestro Prestamos')): ?>
                                                        <div class="alert alert-info d-flex align-items-center justify-content-between mb-3 py-2 px-3">
                                                            <div class="d-flex align-items-center gap-3 flex-grow-1">
                                                                <div class="d-flex align-items-center gap-2">
                                                                    <i class="ki-duotone ki-file-up fs-3">
                                                                        <span class="path1"></span>
                                                                        <span class="path2"></span>
                                                                    </i>
                                                                    <span class="fw-bold">Subir Plantilla Excel</span>
                                                                </div>
                                                                <div class="form-check form-switch mb-0">
                                                                    <input class="form-check-input" type="checkbox" id="switchPlantillaExcel">
                                                                </div>
                                                                <div id="areaCargarExcel" style="display: none;" class="flex-grow-1">
                                                                    <input type="file" class="form-control form-control-sm" id="excelAmortizacion" accept=".csv,.xlsx,.xls" style="max-width: 400px;">
                                                                </div>
                                                            </div>
                                                            <small class="text-muted ms-2">Active para cargar amortización desde Excel (CSV)</small>
                                                        </div>
                                                        <?php endif; ?>
                                                        <!-- Switch para Verificar Préstamo --> 
                                                        <?php if (canApprove('Maestro Prestamos')): ?>
                                                        <div class="alert alert-success d-flex align-items-center justify-content-between mb-4 py-2 px-3" id="divVerificarPrestamo">
                                                            <div class="d-flex align-items-center gap-3">
                                                                <div class="d-flex align-items-center gap-2">
                                                                    <i class="ki-duotone ki-shield-tick fs-3">
                                                                        <span class="path1"></span>
                                                                        <span class="path2"></span>
                                                                    </i>
                                                                    <span class="fw-bold">Verificar Préstamo</span>
                                                                </div>
                                                                <div class="form-check form-switch mb-0">
                                                                    <input class="form-check-input" type="checkbox" id="switchVerificar">
                                                                </div>
                                                            </div>
                                                            <small class="text-muted ms-2">Active para marcar este préstamo como verificado</small>
                                                        </div>
                                                        <?php endif; ?>
                                                        <!-- Sección 1: Información General -->
                                                        <div class="mb-4">
                                                            <h5 class="mb-3">
                                                                <i class="ki-duotone ki-information-5 fs-3 me-2">
                                                                    <span class="path1"></span>
                                                                    <span class="path2"></span>
                                                                    <span class="path3"></span>
                                                                </i>
                                                                Información General
                                                            </h5>
                                                            
                                                            <!-- Primera fila: #Préstamo - Factura SAP BYD - Proveedor (centrados con offset) -->
                                                            <div class="row">
                                                                <div class="col-md-3 offset-md-1 mb-3">
                                                                    <label for="editId" class="form-label fw-bold"># Préstamo</label>
                                                                    <input type="text" class="form-control" id="editId" readonly>
                                                                </div>
                                                                <div class="col-md-3 mb-3">
                                                                    <label for="editFacturaSAP" class="form-label fw-bold">N° Factura SAP BYD</label>
                                                                    <input type="text" class="form-control" id="editFacturaSAP" readonly>
                                                                </div>
                                                                <div class="col-md-3 mb-3">
                                                                    <label for="editProveedor" class="form-label fw-bold">Proveedor</label>
                                                                    <input type="text" class="form-control" id="editProveedor" readonly>
                                                                </div>
                                                            </div>

                                                            <!-- Segunda fila: Tasa - Día de Pago - Meses de Gracia (centrados con offset) -->
                                                            <div class="row">
                                                                <div class="col-md-3 offset-md-1 mb-3">
                                                                    <label for="editTasa" class="form-label fw-bold">Tasa (%)</label>
                                                                    <input type="number" class="form-control" id="editTasa" step="0.01" min="0" max="100">
                                                                </div>
                                                                <div class="col-md-3 mb-3">
                                                                    <label for="editDiaPago" class="form-label fw-bold">Día de Pago</label>
                                                                    <input type="number" class="form-control" id="editDiaPago" value="0" min="0" >
                                                                </div>
                                                                <div class="col-md-3 mb-3">
                                                                    <label for="editMesesGracia" class="form-label fw-bold">Meses de Gracia</label>
                                                                    <input type="number" class="form-control" id="editMesesGracia" value="0" min="0" max="120">
                                                                </div>
                                                            </div>

                                                            <!-- Tercera fila: Plazo Total - Días Desembolso - Modo Redondeo (centrados con offset) -->
                                                            <div class="row">
                                                                <div class="col-md-3 offset-md-1 mb-3">
                                                                    <label for="editPlazoTotal" class="form-label fw-bold">Plazo Total (meses)</label>
                                                                    <input type="number" class="form-control" id="editPlazoTotal" readonly>
                                                                </div>
                                                                <div class="col-md-3 mb-3">
                                                                    <label for="editDiasDesembolso" class="form-label fw-bold">Días de Desembolso</label>
                                                                    <input type="number" class="form-control" id="editDiasDesembolso" value="0" min="0" placeholder="0 por defecto">
                                                                </div>
                                                                <div class="col-md-3 mb-3">
                                                                    <label for="editModoRedondeo" class="form-label fw-bold">Modo de Redondeo</label>
                                                                    <select class="form-select" id="editModoRedondeo">
                                                                        <option value="100" selected>Redondeo hacia abajo</option>
                                                                        <option value="200">Redondeo hacia arriba</option>
                                                                    </select>
                                                                </div>
                                                            </div>

                                                            <!-- Cuarta fila: Banco - Línea de Crédito - Condición - Tipo de Cuota (TODOS los comboboxes) -->
                                                            <div class="row">
                                                                <div class="col-md-3 mb-3">
                                                                    <label for="editBanco" class="form-label fw-bold">Banco</label>
                                                                    <select class="form-select" id="editBanco">
                                                                        <option value="">Seleccionar banco...</option>
                                                                        <?php echo generarOpcionesSelect(obtenerBancos(), 'bank_id', 'bank_name'); ?>
                                                                    </select>
                                                                </div>
                                                                <div class="col-md-3 mb-3">
                                                                    <label for="editLineaCredito" class="form-label fw-bold">Línea de Crédito</label>
                                                                    <select class="form-select" id="editLineaCredito" disabled>
                                                                        <option value="">Seleccione primero un banco...</option>
                                                                    </select>
                                                                </div>
                                                                <div class="col-md-3 mb-3">
                                                                    <label for="editCondicion" class="form-label fw-bold">Condición</label>
                                                                    <select class="form-select" id="editCondicion">
                                                                        <option value="">Seleccionar condición...</option>
                                                                        <?php echo generarOpcionesSelect(obtenerCondiciones(), 'id', 'descripcion'); ?>
                                                                    </select>
                                                                </div>
                                                                <div class="col-md-3 mb-3">
                                                                    <label for="editTipoCuota" class="form-label fw-bold">Tipo de Cuota</label>
                                                                    <select class="form-select" id="editTipoCuota">
                                                                        <option value="">Seleccionar tipo...</option>
                                                                        <?php echo generarOpcionesSelect(obtenerTiposCuota(), 'id', 'description'); ?>
                                                                    </select>
                                                                </div>
                                                            </div>

                                                            <!-- Quinta fila: Observaciones -->
                                                            <div class="row">
                                                                <div class="col-12 mb-3">
                                                                    <label for="editObservaciones" class="form-label fw-bold">Observaciones</label>
                                                                    <textarea class="form-control" id="editObservaciones" rows="3" placeholder="Ingrese observaciones..."></textarea>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <!-- Sección 2: Datos Financieros -->
                                                        <div class="mb-4">
                                                            <h5 class="mb-3">
                                                                <i class="ki-duotone ki-dollar fs-3 me-2">
                                                                    <span class="path1"></span>
                                                                    <span class="path2"></span>
                                                                </i>
                                                                Datos Financieros
                                                            </h5>
                                                            
                                                            <!-- Primera fila: Monto Total - Saldo - Fecha Inicial - Fecha Final -->
                                                            <div class="row">
                                                                <div class="col-md-3 mb-3">
                                                                    <label for="editMontoTotal" class="form-label fw-bold">Monto Total</label>
                                                                    <input type="text" class="form-control" id="editMontoTotal" readonly>
                                                                </div>
                                                                <div class="col-md-3 mb-3">
                                                                    <label for="editSaldo" class="form-label fw-bold">Saldo</label>
                                                                    <input type="text" class="form-control" id="editSaldo" readonly>
                                                                </div>
                                                                <div class="col-md-3 mb-3">
                                                                    <label for="editFechaInicial" class="form-label fw-bold">Fecha Inicial</label>
                                                                    <input type="date" class="form-control" id="editFechaInicial">
                                                                </div>
                                                                <div class="col-md-3 mb-3">
                                                                    <label for="editFechaFinal" class="form-label fw-bold">Fecha Final</label>
                                                                    <input type="date" class="form-control" id="editFechaFinal">
                                                                </div>
                                                            </div>

                                                            <!-- Segunda fila: Datos Bancarios del Proveedor (Solo Lectura) -->
                                                            <div class="row">
                                                                <div class="col-md-3 mb-3">
                                                                    <label for="editNumberBankAccount" class="form-label fw-bold">Codigo de Banco Proveedor</label>
                                                                    <input type="text" class="form-control" id="editNumberBankAccount" readonly>
                                                                </div>
                                                                <div class="col-md-3 mb-3">
                                                                    <label for="editNameBankProveedor" class="form-label fw-bold">Nombre Banco Proveedor</label>
                                                                    <input type="text" class="form-control" id="editNameBankProveedor" readonly>
                                                                </div>
                                                                <div class="col-md-3 mb-3">
                                                                    <label for="editCodeBankProveedor" class="form-label fw-bold">Número de Cuenta Proveedor</label>
                                                                    <input type="text" class="form-control" id="editCodeBankProveedor" readonly>
                                                                </div>
                                                                <div class="col-md-3 mb-3">
                                                                    <label for="editSapBankId" class="form-label fw-bold">ID Cuenta Pago SAP BYD</label>
                                                                    <input type="text" class="form-control" id="editSapBankId" readonly>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <!-- Sección 3: Pagos (Futuro) -->
                                                        <div class="mb-4">
                                                            <h5 class="mb-3">
                                                                <i class="ki-duotone ki-credit-cart fs-3 me-2">
                                                                    <span class="path1"></span>
                                                                    <span class="path2"></span>
                                                                </i>
                                                                Pagos y Amortización
                                                            </h5>
                                                            
                                                            <!-- Resumen de Amortización -->
                                                            <div id="resumenAmortizacion" style="display: none;">
                                                                <div style="display: flex; gap: 8px; margin-bottom: 1rem;">
                                                                    <div style="flex: 1;">
                                                                        <div class="card bg-light" style="height: 60px;">
                                                                            <div class="card-body text-center p-1 d-flex flex-column justify-content-center">
                                                                                <small class="text-muted mb-0" style="font-size: 0.7rem; line-height: 1;">Total Cuotas</small>
                                                                                <span class="text-primary fw-bold" id="totalCuotas" style="font-size: 1rem; line-height: 1;">0</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div style="flex: 1;">
                                                                        <div class="card bg-light" style="height: 60px;">
                                                                            <div class="card-body text-center p-1 d-flex flex-column justify-content-center">
                                                                                <small class="text-muted mb-0" style="font-size: 0.7rem; line-height: 1;">Pagadas</small>
                                                                                <span class="text-success fw-bold" id="cuotasPagadas" style="font-size: 1rem; line-height: 1;">0</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div style="flex: 1;">
                                                                        <div class="card bg-light" style="height: 60px;">
                                                                            <div class="card-body text-center p-1 d-flex flex-column justify-content-center">
                                                                                <small class="text-muted mb-0" style="font-size: 0.7rem; line-height: 1;">Pendientes</small>
                                                                                <span class="text-warning fw-bold" id="cuotasPendientes" style="font-size: 1rem; line-height: 1;">0</span>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            <!-- Tabla de Amortización con Syncfusion Grid -->
                                                            <div id="tablaAmortizacionUnificada" style="display: none;">
                                                                <div id="amortizacionGrid"></div>
                                                            </div>

                                                            <!-- Mensaje cuando no hay datos -->
                                                            <div class="alert alert-info" id="sinAmortizacion" role="alert">
                                                                <i class="ki-duotone ki-information fs-3 me-2">
                                                                    <span class="path1"></span>
                                                                    <span class="path2"></span>
                                                                    <span class="path3"></span>
                                                                </i>
                                                                <strong>Sin datos de amortización:</strong> No se encontraron cuotas para este préstamo. Modifique la tasa para calcular la amortización.
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </form>
                                        </div>
                                        <!--end::Card body-->
                                    </div>
                                    <!--end::Card-->
                                </div>
                                <!--end::Edición Completa-->
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

    <!-- Modal para Agregar Pago -->
    <div class="modal fade" id="modalAgregarPago" tabindex="-1" aria-labelledby="modalAgregarPagoLabel" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalAgregarPagoLabel">
                        <i class="ki-duotone ki-plus fs-2 me-2">
                            <span class="path1"></span>
                            <span class="path2"></span>
                        </i>
                        Agregar Pago
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <form id="formAgregarPago">
                        <input type="hidden" id="pagoCuotaId" name="cuotaId">
                        <input type="hidden" id="pagoPrestamoId" name="prestamoId">
                        
                        <div class="mb-3">
                            <label for="pagoFecha" class="form-label fw-bold">Fecha de Pago <span class="text-danger">*</span></label>
                            <input type="date" class="form-control" id="pagoFecha" name="fecha" required>
                        </div>
                        
                        <div class="row">
                            <div class="col-md-6 mb-3">
                                <label for="pagoCapital" class="form-label fw-bold">Capital <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="pagoCapital" name="capital" placeholder="0.00" required>
                                <small class="text-muted d-block" id="pagoCapitalMax">Máximo disponible: L. 0.00</small>
                                <small class="text-info d-block mt-1" id="pagoCapitalRestante" style="display: none;">
                                    <i class="ki-duotone ki-information fs-6 me-1">
                                        <span class="path1"></span>
                                        <span class="path2"></span>
                                        <span class="path3"></span>
                                    </i>
                                    Saldo pendiente: <strong>L. 0.00</strong>
                                </small>
                            </div>
                            
                            <div class="col-md-6 mb-3">
                                <label for="pagoInteres" class="form-label fw-bold">Interés <span class="text-danger">*</span></label>
                                <input type="text" class="form-control" id="pagoInteres" name="interes" placeholder="0.00" required>
                                <small class="text-muted d-block" id="pagoInteresMax">Máximo disponible: L. 0.00</small>
                                <small class="text-info d-block mt-1" id="pagoInteresRestante" style="display: none;">
                                    <i class="ki-duotone ki-information fs-6 me-1">
                                        <span class="path1"></span>
                                        <span class="path2"></span>
                                        <span class="path3"></span>
                                    </i>
                                    Saldo pendiente: <strong>L. 0.00</strong>
                                </small>
                            </div>
                        </div>
                        
                        <div class="alert alert-warning mb-3" id="pagoCuotaCompleta" style="display: none;">
                            <i class="ki-duotone ki-check-circle fs-4 me-2">
                                <span class="path1"></span>
                                <span class="path2"></span>
                            </i>
                            <strong>¡Cuota completa!</strong> Esta cuota quedará completamente pagada.
                        </div>
                        
                        <div class="mb-3">
                            <label for="pagoDescripcion" class="form-label fw-bold">Descripción del Pago <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" id="pagoDescripcion" name="descripcion" placeholder="Ej: Pago Préstamo LOAN-001 / NO01" required>
                        </div>
                        
                        <!-- Checkbox para Interés No Provisionado -->
                        <div class="mb-3">
                            <div class="form-check">
                                <input class="form-check-input" type="checkbox" id="pagoInteresNoProvisionado" name="interesNoProvisionado">
                                <label class="form-check-label fw-bold" for="pagoInteresNoProvisionado">
                                    Interés No Provisionado
                                </label>
                            </div>
                        </div>
                        
                        <!-- Input para monto de interés no provisionado (se muestra cuando el checkbox está activo) -->
                        <div class="mb-3" id="divInteresNoProvisionado" style="display: none;">
                            <label for="pagoInteresNoProvisionadoMonto" class="form-label fw-bold">Monto de Interés No Provisionado <span class="text-danger">*</span></label>
                            <input type="text" class="form-control" id="pagoInteresNoProvisionadoMonto" name="interesNoProvisionadoMonto" placeholder="0.00">
                        </div>
                        
                        <!-- Tabla de facturas IPM pendientes -->
                        <div class="mb-3" id="divFacturaIPM" style="display: none;">
                            <label class="form-label fw-bold small">Facturas IPM Pendientes</label>
                            <div class="table-responsive" style="max-height: 150px; overflow-y: auto; font-size: 0.85rem;">
                                <table class="table table-sm table-hover table-bordered mb-0">
                                    <thead class="table-light sticky-top" style="font-size: 0.8rem;">
                                        <tr>
                                            <th style="width: 40px; padding: 0.25rem;" class="text-center">✓</th>
                                            <th style="width: 120px; padding: 0.25rem;">Factura ID</th>
                                            <th style="width: 90px; padding: 0.25rem;" class="text-end">Total</th>
                                            <th style="width: 90px; padding: 0.25rem;" class="text-end">Pagado</th>
                                            <th style="width: 100px; padding: 0.25rem;" class="text-end">Pendiente</th>
                                        </tr>
                                    </thead>
                                    <tbody id="tablaFacturasIPM" style="font-size: 0.85rem;">
                                        <!-- Se llena dinámicamente -->
                                    </tbody>
                                </table>
                            </div>
                            <small class="text-muted d-block mt-1" style="font-size: 0.75rem;">
                                <i class="ki-duotone ki-information fs-7 me-1">
                                    <span class="path1"></span>
                                    <span class="path2"></span>
                                    <span class="path3"></span>
                                </i>
                                Si selecciona una factura pendiente, se usará esa factura en lugar de crear una nueva.
                            </small>
                        </div>
                        
                        <div class="alert alert-info mb-0">
                            <small>
                                <i class="ki-duotone ki-information fs-6 me-1">
                                    <span class="path1"></span>
                                    <span class="path2"></span>
                                    <span class="path3"></span>
                                </i>
                                <strong>Cuota:</strong> <span id="pagoCuotaInfo"></span>
                            </small>
                        </div>
                        
                        <!-- Campos ocultos para datos del préstamo -->
                        <input type="hidden" id="pagoCProveedor" name="cProveedor">
                        <input type="hidden" id="pagoCodeBankProveedor" name="codeBankProveedor">
                        <input type="hidden" id="pagoNumberBankAccount" name="numberBankAccount">
                        <input type="hidden" id="pagoSapBankId" name="sapBankId">
                        <input type="hidden" id="pagoNameBankProveedor" name="nameBankProveedor">
                        <input type="hidden" id="pagoFacturaDesembolso" name="facturaDesembolso">
                        <input type="hidden" id="pagoFechaInicial" name="fechaInicial">
                        <input type="hidden" id="pagoFechaFinal" name="fechaFinal">
                        <input type="hidden" id="pagoCompany" name="company">
                    </form>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary" id="btnGuardarPago">
                        <i class="ki-duotone ki-check fs-6 me-1">
                            <span class="path1"></span>
                            <span class="path2"></span>
                        </i>
                        Guardar Pago
                    </button>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal para Cuotas Pendientes de Interés -->
    <div class="modal fade" id="modalCuotasPendientesInteres" tabindex="-1" aria-labelledby="modalCuotasPendientesInteresLabel" aria-hidden="true">
        <div class="modal-dialog modal-xl modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalCuotasPendientesInteresLabel">
                        <i class="ki-duotone ki-calendar fs-2 me-2">
                            <span class="path1"></span>
                            <span class="path2"></span>
                        </i>
                        Cuotas Pendientes de Interés
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <!-- Filtros -->
                    <div class="row mb-4">
                        <div class="col-md-4">
                            <label for="filtroMes" class="form-label fw-bold">Mes <span class="text-danger">*</span></label>
                            <select class="form-select" id="filtroMes" required>
                                <option value="">Seleccionar mes...</option>
                                <option value="1">Enero</option>
                                <option value="2">Febrero</option>
                                <option value="3">Marzo</option>
                                <option value="4">Abril</option>
                                <option value="5">Mayo</option>
                                <option value="6">Junio</option>
                                <option value="7">Julio</option>
                                <option value="8">Agosto</option>
                                <option value="9">Septiembre</option>
                                <option value="10">Octubre</option>
                                <option value="11">Noviembre</option>
                                <option value="12">Diciembre</option>
                            </select>
                        </div>
                        <div class="col-md-4">
                            <label for="filtroAnio" class="form-label fw-bold">Año <span class="text-danger">*</span></label>
                            <select class="form-select" id="filtroAnio" required>
                                <option value="">Seleccionar año...</option>
                            </select>
                        </div>
                        <div class="col-md-4 d-flex align-items-end">
                            <button type="button" class="btn btn-primary w-100" id="btnBuscarCuotasPendientes">
                                <i class="ki-duotone ki-magnifier fs-2 me-2">
                                    <span class="path1"></span>
                                    <span class="path2"></span>
                                </i>
                                Buscar
                            </button>
                        </div>
                    </div>
                    <div class="row mb-3">
                        <div class="col-md-4">
                            <label for="fechaCreacionFacturasIPM" class="form-label fw-bold">Fecha de creación de facturas</label>
                            <input type="date" class="form-control" id="fechaCreacionFacturasIPM" title="Fecha que se usará al crear las facturas IPM en SAP">
                        </div>
                    </div>

                    <!-- Grid de cuotas pendientes -->
                    <div id="gridCuotasPendientesInteres"></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-secondary" data-bs-dismiss="modal">Cerrar</button>
                </div>
            </div>
        </div>
    </div>

    <!--begin::Javascript-->
    <script src="assets/plugins/global/plugins.bundle.js"></script>
    <script src="assets/js/scripts.bundle.js"></script>
    
    <!-- Syncfusion JS -->
    <?php echo getSyncfusionJS(); ?>

    <script src="utilities/permissionHelper.js"></script>
    
    <!-- Cargador de catálogos -->
    <script src="apps/Prestamos/js/catalogos-loader.js"></script>
    
    <!-- CSS personalizado para responsive -->
    <link rel="stylesheet" href="apps/Prestamos/Maestro_Prestamos/css/prestamos-responsive.css">
    
    <!-- CSS específico del módulo Maestro de Préstamos -->
    <link rel="stylesheet" href="apps/Prestamos/Maestro_Prestamos/css/prestamos-maestro.css">
    
    <!-- CSS estándar de modales -->
    <link rel="stylesheet" href="assets/css/modal-standard.css">
    
    <!-- Módulo específico de préstamos -->
    <script src="apps/Prestamos/Maestro_Prestamos/js/pagos.js"></script>
    <script src="apps/Prestamos/Maestro_Prestamos/js/cuotas-pendientes.js"></script>
    <script src="apps/Prestamos/Maestro_Prestamos/js/prestamos-grid.js"></script>

    <script>
				var hostUrl = "assets/";
			</script>
    <!--end::Javascript-->
</body>
</html>
