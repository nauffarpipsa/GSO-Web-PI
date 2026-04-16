<?php 
include("../../../Login/validar_sesion.php"); 
include("../../../config/syncfusion-config.php");

?>
<script src="../../../Login/sessionMonitor.js"></script>

<!DOCTYPE html>
<html lang="es">
<head>
    <base href="../../../" />
    <title>Configuración General - Préstamos</title>
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

                                    <!-- Primera fila: Bancos y Tipos de Cuota -->
                                    <div class="row g-5 g-xl-8 mb-5">
                                        <!-- Bancos -->
                                        <div class="col-xl-6">
                                            <div class="card card-xl-stretch mb-xl-8">
                                                <div class="card-header border-0 pt-5">
                                                    <h3 class="card-title align-items-start flex-column">
                                                        <span class="card-label fw-bold fs-3 mb-1">Bancos</span>
                                                        <span class="text-muted mt-1 fw-semibold fs-7">Gestión de entidades bancarias</span>
                                                    </h3>
                                                    <div class="card-toolbar">
                                                        <button type="button" class="btn btn-sm btn-light-primary" id="btnAgregarBanco" onclick="configuracionGeneral.agregarBanco()">
                                                            <i class="ki-duotone ki-plus fs-2"></i>Agregar
                                                        </button>
                                                    </div>
                                                </div>
                                                <div class="card-body py-3">
                                                    <div id="bancosGrid"></div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Tipos de Cuota -->
                                        <div class="col-xl-6">
                                            <div class="card card-xl-stretch mb-xl-8">
                                                <div class="card-header border-0 pt-5">
                                                    <h3 class="card-title align-items-start flex-column">
                                                        <span class="card-label fw-bold fs-3 mb-1">Tipos de Cuota</span>
                                                        <span class="text-muted mt-1 fw-semibold fs-7">Configuración de tipos de amortización</span>
                                                    </h3>
                                                    <div class="card-toolbar">
                                                        <button type="button" class="btn btn-sm btn-light-primary" id="btnAgregarTipoCuota" onclick="configuracionGeneral.agregarTipoCuota()">
                                                            <i class="ki-duotone ki-plus fs-2"></i>Agregar
                                                        </button>
                                                    </div>
                                                </div>
                                                <div class="card-body py-3">
                                                    <div id="tiposCuotaGrid"></div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Segunda fila: Líneas de Crédito y Condiciones -->
                                    <div class="row g-5 g-xl-8">
                                        <div class="col-xl-6">
                                            <div class="card card-xl-stretch mb-xl-8">
                                                <div class="card-header border-0 pt-5">
                                                    <h3 class="card-title align-items-start flex-column">
                                                        <span class="card-label fw-bold fs-3 mb-1">Líneas de Crédito</span>
                                                        <span class="text-muted mt-1 fw-semibold fs-7">Gestión de líneas de financiamiento</span>
                                                    </h3>
                                                    <div class="card-toolbar">
                                                        <button type="button" class="btn btn-sm btn-light-primary" id="btnAgregarLineaCredito" onclick="configuracionGeneral.agregarLineaCredito()">
                                                            <i class="ki-duotone ki-plus fs-2"></i>Agregar
                                                        </button>
                                                    </div>
                                                </div>
                                                <div class="card-body py-3">
                                                    <div id="lineasCreditoGrid"></div>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <!-- Condiciones -->
                                        <div class="col-xl-6">
                                            <div class="card card-xl-stretch mb-xl-8">
                                                <div class="card-header border-0 pt-5">
                                                    <h3 class="card-title align-items-start flex-column">
                                                        <span class="card-label fw-bold fs-3 mb-1">Condiciones</span>
                                                        <span class="text-muted mt-1 fw-semibold fs-7">Tipos de condiciones de préstamo</span>
                                                    </h3>
                                                    <div class="card-toolbar">
                                                        <button type="button" class="btn btn-sm btn-light-primary" id="btnAgregarCondicion" onclick="configuracionGeneral.agregarCondicion()">
                                                            <i class="ki-duotone ki-plus fs-2"></i>Agregar
                                                        </button>
                                                    </div>
                                                </div>
                                                <div class="card-body py-3">
                                                    <div id="condicionesGrid"></div>
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
    
    <!-- Modal Banco -->
    <div class="modal fade" id="modalBanco" tabindex="-1" aria-labelledby="modalBancoTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                                 <div class="modal-header">
                     <h5 class="modal-title" id="modalBancoTitle">Agregar Banco</h5>
                     <button type="button" class="btn-close" onclick="configuracionGeneral.cerrarModalBanco()" aria-label="Close"></button>
                 </div>
                <form id="formBanco">
                    <div class="modal-body">
                        <div class="mb-3">
                            <label for="bancoNombre" class="form-label">Nombre del Banco *</label>
                            <input type="text" class="form-control" id="bancoNombre" required>
                        </div>
                        <div class="mb-3">
                            <label for="bancoSapBankId" class="form-label">Cuenta SAP *</label>
                            <select class="form-control" id="bancoSapBankId" required>
                                <option value="">Seleccionar cuenta SAP</option>
                            </select>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="bancoActivo" checked>
                            <label class="form-check-label" for="bancoActivo">
                                Activo
                            </label>
                        </div>
                    </div>
                                         <div class="modal-footer">
                         <button type="button" class="btn btn-secondary" onclick="configuracionGeneral.cerrarModalBanco()">Cancelar</button>
                         <button type="button" class="btn btn-primary" id="btnGuardarBanco">Guardar</button>
                     </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Modal Tipo de Cuota -->
    <div class="modal fade" id="modalTipoCuota" tabindex="-1" aria-labelledby="modalTipoCuotaTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                                 <div class="modal-header">
                     <h5 class="modal-title" id="modalTipoCuotaTitle">Agregar Tipo de Cuota</h5>
                     <button type="button" class="btn-close" onclick="configuracionGeneral.cerrarModalTipoCuota()" aria-label="Close"></button>
                 </div>
                <form id="formTipoCuota">
                    <div class="modal-body">
                        <div class="mb-3">
                            <label for="tipoCuotaNombre" class="form-label">Nombre del Tipo *</label>
                            <input type="text" class="form-control" id="tipoCuotaNombre" required>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="tipoCuotaActivo" checked>
                            <label class="form-check-label" for="tipoCuotaActivo">
                                Activo
                            </label>
                        </div>
                    </div>
                                         <div class="modal-footer">
                         <button type="button" class="btn btn-secondary" onclick="configuracionGeneral.cerrarModalTipoCuota()">Cancelar</button>
                         <button type="button" class="btn btn-primary" id="btnGuardarTipoCuota">Guardar</button>
                     </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Modal Línea de Crédito -->
    <div class="modal fade" id="modalLineaCredito" tabindex="-1" aria-labelledby="modalLineaCreditoTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                                 <div class="modal-header">
                     <h5 class="modal-title" id="modalLineaCreditoTitle">Agregar Línea de Crédito</h5>
                     <button type="button" class="btn-close" onclick="configuracionGeneral.cerrarModalLineaCredito()" aria-label="Close"></button>
                 </div>
                <form id="formLineaCredito">
                    <div class="modal-body">
                        <div class="mb-3">
                            <label for="lineaCreditoNombre" class="form-label">Nombre de la Línea *</label>
                            <input type="text" class="form-control" id="lineaCreditoNombre" required>
                        </div>
                        <div class="mb-3">
                            <label for="lineaCreditoBanco" class="form-label">Banco *</label>
                            <select class="form-select" id="lineaCreditoBanco" required>
                                <option value="">Seleccionar banco</option>
                            </select>
                        </div>
                        <div class="mb-3">
                            <label for="lineaCreditoCredito" class="form-label">Crédito *</label>
                            <div class="input-group">
                                <span class="input-group-text">L.</span>
                                <input type="number" class="form-control" id="lineaCreditoCredito" step="0.01" min="0" required>
                            </div>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="lineaCreditoActivo" checked>
                            <label class="form-check-label" for="lineaCreditoActivo">
                                Activo
                            </label>
                        </div>
                    </div>
                                         <div class="modal-footer">
                         <button type="button" class="btn btn-secondary" onclick="configuracionGeneral.cerrarModalLineaCredito()">Cancelar</button>
                         <button type="button" class="btn btn-primary" id="btnGuardarLineaCredito">Guardar</button>
                     </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Modal Condición -->
    <div class="modal fade" id="modalCondicion" tabindex="-1" aria-labelledby="modalCondicionTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalCondicionTitle">Agregar Condición</h5>
                    <button type="button" class="btn-close" onclick="configuracionGeneral.cerrarModalCondicion()" aria-label="Close"></button>
                </div>
                <form id="formCondicion">
                    <div class="modal-body">
                        <div class="mb-3">
                            <label for="condicionNombre" class="form-label">Descripción de la Condición *</label>
                            <input type="text" class="form-control" id="condicionNombre" required>
                        </div>
                        <div class="form-check">
                            <input class="form-check-input" type="checkbox" id="condicionActivo" checked>
                            <label class="form-check-label" for="condicionActivo">
                                Activo
                            </label>
                        </div>
                    </div>
                    <div class="modal-footer">
                        <button type="button" class="btn btn-secondary" onclick="configuracionGeneral.cerrarModalCondicion()">Cancelar</button>
                        <button type="button" class="btn btn-primary" id="btnGuardarCondicion">Guardar</button>
                    </div>
                </form>
            </div>
        </div>
    </div>

    <!-- Modal de Notificación Unificado -->
    <div class="modal fade" id="modalNotificacion" tabindex="-1" aria-labelledby="modalNotificacionTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-sm">
            <div class="modal-content">
                <div class="modal-header" id="modalNotificacionHeader">
                    <h5 class="modal-title" id="modalNotificacionTitle">Notificación</h5>
                    <button type="button" class="btn-close" onclick="cerrarModalNotificacion()" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <div class="text-center mb-3">
                        <div id="modalNotificacionIcon" class="mb-3">
                            <!-- El ícono se insertará dinámicamente -->
                        </div>
                        <h6 id="modalNotificacionMensaje" class="mb-0">Mensaje de notificación</h6>
                    </div>
                </div>
                <div class="modal-footer justify-content-center">
                    <button type="button" class="btn btn-primary px-4" onclick="cerrarModalNotificacion()">Aceptar</button>
                </div>
            </div>
        </div>
    </div>



    <!-- Scripts -->
    <script src="assets/plugins/global/plugins.bundle.js"></script>
    <script src="assets/js/scripts.bundle.js"></script>
    
    <!-- Syncfusion JS -->
    <?php echo getSyncfusionJS(); ?>
    
    <!-- Configuración de locale para Syncfusion -->
    <script>
        // Configurar locale español para Syncfusion
        ej.base.setCulture('es-ES');
        ej.base.setCurrencyCode('HNL');
        
        // Configuración de fecha y números en español
        ej.base.L10n.load({
            'es-ES': {
                'grid': {
                    'EmptyRecord': 'No hay registros para mostrar',
                    'GroupDropArea': 'Arrastre una columna aquí para agrupar',
                    'UnGroup': 'Desagrupar',
                    'GroupDisable': 'Agrupación deshabilitada para esta columna',
                    'FilterbarTitle': 'Filtro de celda',
                    'EmptyDataSourceError': 'DataSource no puede estar vacío al cargar inicialmente ya que las columnas se generan a partir de dataSource en AutoGenerate Column Grid',
                    'Add': 'Agregar',
                    'Edit': 'Editar',
                    'Cancel': 'Cancelar',
                    'Update': 'Actualizar',
                    'Delete': 'Eliminar',
                    'Print': 'Imprimir',
                    'Pdfexport': 'Exportar PDF',
                    'Excelexport': 'Exportar Excel',
                    'Wordexport': 'Exportar Word',
                    'Csvexport': 'Exportar CSV',
                    'Search': 'Buscar',
                    'Columnchooser': 'Selector de columnas',
                    'Save': 'Guardar',
                    'Grid': 'Tabla',
                    'ConfirmDelete': '¿Está seguro de que desea eliminar este registro?',
                    'CancelEdit': '¿Está seguro de que desea cancelar los cambios?',
                    'ChooseColumns': 'Elegir columna',
                    'SearchColumns': 'Buscar columnas',
                    'Matchs': 'No se encontraron coincidencias',
                    'FilterButton': 'Filtro',
                    'ClearButton': 'Limpiar',
                    'StartsWith': 'Comienza con',
                    'EndsWith': 'Termina con',
                    'Contains': 'Contiene',
                    'Equal': 'Igual',
                    'NotEqual': 'No igual',
                    'LessThan': 'Menor que',
                    'LessThanOrEqual': 'Menor o igual que',
                    'GreaterThan': 'Mayor que',
                    'GreaterThanOrEqual': 'Mayor o igual que',
                    'ChooseDate': 'Elegir fecha',
                    'EnterValue': 'Ingrese el valor',
                    'Copy': 'Copiar',
                    'EditOperationAlert': 'No se seleccionaron registros para editar',
                    'DeleteOperationAlert': 'No se seleccionaron registros para eliminar',
                    'SaveButton': 'Guardar',
                    'OKButton': 'OK',
                    'CancelButton': 'Cancelar',
                    'Yes': 'Sí',
                    'No': 'No',
                    'Close': 'Cerrar',
                    'All': 'Todo',
                    'AllPage': 'Todas las páginas',
                    'CurrentPage': 'Página actual',
                    'Custom': 'Personalizado',
                    'CustomRange': 'Rango personalizado',
                    'Rows': 'Filas',
                    'Columns': 'Columnas',
                    'Page': 'Página',
                    'Of': 'de',
                    'Next': 'Siguiente',
                    'Previous': 'Anterior',
                    'First': 'Primero',
                    'Last': 'Último',
                    'GoToPage': 'Ir a página',
                    'PageSize': 'Tamaño de página',
                    'Items': 'Elementos',
                    'ItemsPerPage': 'Elementos por página',
                    'TotalItems': 'Total de elementos',
                    'TotalPages': 'Total de páginas',
                    'Loading': 'Cargando...',
                    'NoRecords': 'No se encontraron registros',
                    'FilterMenu': 'Menú de filtro',
                    'SortAscending': 'Ordenar ascendente',
                    'SortDescending': 'Ordenar descendente',
                    'ClearFilter': 'Limpiar filtro',
                    'ClearSort': 'Limpiar ordenamiento',
                    'True': 'Verdadero',
                    'False': 'Falso',
                    'SelectAll': 'Seleccionar todo',
                    'UnSelectAll': 'Deseleccionar todo',
                    'SelectRow': 'Seleccionar fila',
                    'UnSelectRow': 'Deseleccionar fila',
                    'SelectCell': 'Seleccionar celda',
                    'UnSelectCell': 'Deseleccionar celda',
                    'SelectColumn': 'Seleccionar columna',
                    'UnSelectColumn': 'Deseleccionar columna',
                    'SelectHeader': 'Seleccionar encabezado',
                    'UnSelectHeader': 'Deseleccionar encabezado',
                    'SelectAllCurrentPage': 'Seleccionar todo en página actual',
                    'UnSelectAllCurrentPage': 'Deseleccionar todo en página actual',
                    'SelectAllPages': 'Seleccionar todo en todas las páginas',
                    'UnSelectAllPages': 'Deseleccionar todo en todas las páginas',
                    'SelectRowRecCount': 'Seleccionar fila {0}',
                    'UnSelectRowRecCount': 'Deseleccionar fila {0}',
                    'SelectCellRecCount': 'Seleccionar celda {0}',
                    'UnSelectCellRecCount': 'Deseleccionar celda {0}',
                    'SelectColumnRecCount': 'Seleccionar columna {0}',
                    'UnSelectColumnRecCount': 'Deseleccionar columna {0}',
                    'SelectHeaderRecCount': 'Seleccionar encabezado {0}',
                    'UnSelectHeaderRecCount': 'Deseleccionar encabezado {0}',
                    'SelectAllCurrentPageRecCount': 'Seleccionar todo en página actual ({0} registros)',
                    'UnSelectAllCurrentPageRecCount': 'Deseleccionar todo en página actual ({0} registros)',
                    'SelectAllPagesRecCount': 'Seleccionar todo en todas las páginas ({0} registros)',
                    'UnSelectAllPagesRecCount': 'Deseleccionar todo en todas las páginas ({0} registros)'
                }
            }
        });
    </script>
    
    <!-- CSS específico del módulo Configuración General -->
    <link rel="stylesheet" href="apps/Prestamos/Configuracion_General/css/configuracion-general.css">
    
    <!-- PermissionHelper para verificar permisos -->
    <script src="utilities/permissionHelper.js"></script>
    
    <!-- Inicializar PermissionHelper globalmente -->
    <script>
        if (typeof PermissionHelper !== 'undefined') {
            window.permissionHelper = new PermissionHelper();
        }
    </script>
    
    <!-- Módulo específico de configuración -->
    <script src="apps/Prestamos/Configuracion_General/js/configuracion-general.js"></script>
</body>
</html>
