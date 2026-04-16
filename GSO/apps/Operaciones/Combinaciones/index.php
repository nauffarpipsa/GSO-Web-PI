<?php 
include("../../../Login/validar_sesion.php"); 
include("../../../config/syncfusion-config.php");

?>
<script src="../../../Login/sessionMonitor.js"></script>

<!DOCTYPE html>
<html lang="es">
<head>
    <base href="../../../" />
    <title>Combinaciones de Artículos</title>
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
    
    <!-- CSS específico del módulo -->
    <link rel="stylesheet" href="apps/Operaciones/Combinaciones/css/combinaciones.css">

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
                                                <h3 class="fw-bold m-0">
                                                    <i class="ki-duotone ki-box fs-2 me-2">
                                                        <span class="path1"></span>
                                                        <span class="path2"></span>
                                                    </i>
                                                    Combinaciones de Lotes
                                                </h3>
                                            </div>
                                            <div class="card-toolbar">
                                                <button type="button" class="btn btn-sm btn-light-primary" id="btnRefrescar">
                                                    <i class="ki-duotone ki-arrows-square fs-2">
                                                        <span class="path1"></span>
                                                        <span class="path2"></span>
                                                    </i>
                                                    Refrescar
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <!-- Layout principal: Lista de Lotes | Área de Combinación -->
                                    <div class="row g-5">
                                        <!-- Columna Izquierda: Lista de Lotes Disponibles -->
                                        <div class="col-xl-7">
                                            <div class="card h-100">
                                                <div class="card-header border-0 pt-5">
                                                    <h3 class="card-title align-items-start flex-column">
                                                        <span class="card-label fw-bold fs-3 mb-1">Lotes Disponibles</span>
                                                        <span class="text-muted mt-1 fw-semibold fs-7">Seleccione los lotes para combinar</span>
                                                    </h3>
                                                    <div class="card-toolbar">
                                                        <div class="d-flex align-items-center gap-3 flex-wrap">
                                                            <!-- Filtro por Categoría (se llena desde API) -->
                                                            <div class="w-225px">
                                                                <select id="cmbCategoriaProducto" class="form-select form-select-solid" data-control="select2" data-hide-search="false" data-placeholder="Categoría">
                                                                    <option value="">Todas las categorías</option>
                                                                </select>
                                                            </div>

                                                            <!-- Búsqueda -->
                                                            <div class="d-flex align-items-center position-relative">
                                                                <i class="ki-duotone ki-magnifier fs-3 position-absolute ms-4">
                                                                    <span class="path1"></span>
                                                                    <span class="path2"></span>
                                                                </i>
                                                                <input type="text" id="searchLotes" class="form-control form-control-solid w-250px ps-12" placeholder="Buscar por lote o artículo..." />
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div class="card-body py-4">
                                                    <!-- Loading indicator -->
                                                    <div id="loadingLotes" class="text-center py-10" style="display: none;">
                                                        <div class="spinner-border text-primary" role="status">
                                                            <span class="visually-hidden">Cargando...</span>
                                                        </div>
                                                        <p class="text-muted fw-semibold mt-3">Cargando lotes...</p>
                                                    </div>
                                                    
                                                    <!-- Grid de Lotes (se cargará dinámicamente) -->
                                                    <div id="lotesGrid" class="lotes-grid">
                                                        <p class="text-muted fw-semibold">Seleccione una categoría para ver los lotes disponibles</p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <!-- Columna Derecha: Área de Combinación -->
                                        <div class="col-xl-5">
                                            <div class="card h-100">
                                                <div class="card-header border-0 pt-5">
                                                    <h3 class="card-title align-items-start flex-column">
                                                        <span class="card-label fw-bold fs-3 mb-1">Área de Combinación</span>
                                                        <span class="text-muted mt-1 fw-semibold fs-7">Configure la combinación de lotes</span>
                                                    </h3>
                                                </div>
                                                <div class="card-body py-4 d-flex flex-column">
                                                    <!-- Lote Padre -->
                                                    <div class="mb-6">
                                                        <label class="form-label fw-bold mb-3">
                                                            <i class="ki-duotone ki-star fs-4 me-2 text-primary">
                                                                <span class="path1"></span>
                                                                <span class="path2"></span>
                                                            </i>
                                                            Lote Padre
                                                        </label>
                                                        <div id="lotePadreArea" class="combinacion-slot combinacion-slot-empty">
                                                            <div class="text-center py-10">
                                                                <i class="ki-duotone ki-information-5 fs-3x text-gray-400 mb-3">
                                                                    <span class="path1"></span>
                                                                    <span class="path2"></span>
                                                                    <span class="path3"></span>
                                                                </i>
                                                                <p class="text-muted fw-semibold">Seleccione un lote como padre</p>
                                                                <small class="text-muted">Haga clic en un lote y seleccione "Asignar como Padre"</small>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <!-- Icono de Combinación -->
                                                    <div class="text-center my-4">
                                                        <i class="ki-duotone ki-arrow-up fs-2x text-primary">
                                                            <span class="path1"></span>
                                                            <span class="path2"></span>
                                                        </i>
                                                    </div>

                                                    <!-- Lote a Combinar -->
                                                    <div class="mb-6">
                                                        <label class="form-label fw-bold mb-3">
                                                            <i class="ki-duotone ki-arrow-down fs-4 me-2 text-warning">
                                                                <span class="path1"></span>
                                                                <span class="path2"></span>
                                                            </i>
                                                            Lote a Combinar
                                                        </label>
                                                        <div id="loteHijoArea" class="combinacion-slot combinacion-slot-empty">
                                                            <div class="text-center py-10">
                                                                <i class="ki-duotone ki-information-5 fs-3x text-gray-400 mb-3">
                                                                    <span class="path1"></span>
                                                                    <span class="path2"></span>
                                                                    <span class="path3"></span>
                                                                </i>
                                                                <p class="text-muted fw-semibold">Seleccione un lote para combinar</p>
                                                                <small class="text-muted">Haga clic en un lote y seleccione "Asignar como Hijo"</small>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <!-- Preview del Resultado -->
                                                    <div id="previewResultado" class="mt-auto" style="display: none;">
                                                        <div class="separator separator-dashed my-5"></div>
                                                        <label class="form-label fw-bold mb-3">
                                                            <i class="ki-duotone ki-eye fs-4 me-2 text-success">
                                                                <span class="path1"></span>
                                                                <span class="path2"></span>
                                                            </i>
                                                            Vista Previa de la Combinación
                                                        </label>
                                                        <div class="card bg-light-success p-4">
                                                            <div class="d-flex flex-column">
                                                                <div class="mb-2">
                                                                    <span class="text-muted fs-7 fw-semibold">Cantidad Total:</span>
                                                                    <span id="previewCantidadTotal" class="fw-bold fs-4 text-primary ms-2">0</span>
                                                                </div>
                                                                <div class="mb-2">
                                                                    <span class="text-muted fs-7 fw-semibold">Lote Resultante:</span>
                                                                    <span id="previewLoteResultante" class="fw-bold fs-6 text-gray-800 ms-2">-</span>
                                                                </div>
                                                                <div>
                                                                    <span class="text-muted fs-7 fw-semibold">Artículo:</span>
                                                                    <span id="previewArticulo" class="fw-semibold fs-7 text-gray-600 ms-2">-</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <!-- Botones de Acción -->
                                                    <div class="d-flex gap-2 mt-5">
                                                        <button type="button" class="btn btn-light flex-grow-1" id="btnLimpiarSeleccion">
                                                            <i class="ki-duotone ki-cross fs-2">
                                                                <span class="path1"></span>
                                                                <span class="path2"></span>
                                                            </i>
                                                            Limpiar
                                                        </button>
                                                        <button type="button" class="btn btn-primary flex-grow-1" id="btnCombinarLotes" disabled>
                                                            <i class="ki-duotone ki-check fs-2">
                                                                <span class="path1"></span>
                                                                <span class="path2"></span>
                                                            </i>
                                                            Combinar Lotes
                                                        </button>
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

    <!-- Modal de Confirmación -->
    <div class="modal fade" id="modalConfirmarCombinacion" tabindex="-1" aria-labelledby="modalConfirmarCombinacionTitle" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content">
                <div class="modal-header">
                    <h5 class="modal-title" id="modalConfirmarCombinacionTitle">
                        <i class="ki-duotone ki-question fs-2 me-2">
                            <span class="path1"></span>
                            <span class="path2"></span>
                        </i>
                        Confirmar Combinación
                    </h5>
                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                </div>
                <div class="modal-body">
                    <p class="mb-3">¿Está seguro de que desea combinar estos lotes?</p>
                    <div id="modalDetallesCombinacion"></div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancelar</button>
                    <button type="button" class="btn btn-primary" id="btnConfirmarCombinacion">
                        <i class="ki-duotone ki-check fs-2">
                            <span class="path1"></span>
                            <span class="path2"></span>
                        </i>
                        Confirmar y Combinar
                    </button>
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
    
    <!-- PermissionHelper para verificar permisos -->
    <script src="utilities/permissionHelper.js"></script>
    
    <!-- Inicializar PermissionHelper globalmente -->
    <script>
        if (typeof PermissionHelper !== 'undefined') {
            window.permissionHelper = new PermissionHelper();
        }
    </script>

    <!-- Módulo específico de combinaciones -->
    <script src="apps/Operaciones/Combinaciones/js/combinaciones.js"></script>
</body>
</html>
