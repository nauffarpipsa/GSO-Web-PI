<?php
/**
 * Configuración central de Syncfusion Essential JS 2
 * Versión: 30.1.37
 * Licencia: Community License
 * 
 * Este archivo centraliza toda la configuración de Syncfusion para el proyecto GSO
 */

// Configuración de la licencia Syncfusion
define('SYNCFUSION_LICENSE_KEY', 'Ngo9BigBOggjHTQxAR8/V1JGaF5cXGpCf1FpRmJGdld5fUVHYVZUTXxaS00DNHVRdkdmWH1ccnVVQmFeWEF0WEBWYEs=');

// Configuración de versiones
define('SYNCFUSION_VERSION', '32.1.19');
define('SYNCFUSION_CDN_BASE', 'https://cdn.syncfusion.com/ej2/' . SYNCFUSION_VERSION);

// Configuración de estilos
define('SYNCFUSION_THEME', 'material'); // material | material-dark

/**
 * Función para obtener los enlaces CSS de Syncfusion
 * @return string HTML con los enlaces CSS
 */
function getSyncfusionCSS() {
    $theme = SYNCFUSION_THEME; // tema inicial; se actualizará dinámicamente vía JS
    $cdnBase = SYNCFUSION_CDN_BASE;
    
    return "
    <!-- Syncfusion Essential JS 2 CSS (dinámico por tema) -->
    <link id=\"syncfusion-theme\" href=\"{$cdnBase}/{$theme}.css\" rel=\"stylesheet\" />
    <!-- Syncfusion DataGrid CSS específico (dinámico por tema) -->
    <link id=\"syncfusion-grid-theme\" href=\"{$cdnBase}/grid/{$theme}.css\" rel=\"stylesheet\" />
    ";
}

/**
 * Función para obtener los scripts JS de Syncfusion
 * @return string HTML con los scripts JS
 */
function getSyncfusionJS() {
    $cdnBase = SYNCFUSION_CDN_BASE;
    $licenseKey = SYNCFUSION_LICENSE_KEY;
    
    return "
    <!-- Syncfusion Essential JS 2 -->
    <script src=\"{$cdnBase}/dist/ej2.min.js\"></script>
    <script>
        // Registrar licencia de Syncfusion
        ej.base.registerLicense('{$licenseKey}');
        ej.base.setCulture('es-ES');
        ej.base.setCurrencyCode('HNL');
        
        // Configurar locale para español
        ej.base.L10n.load({
            'es-ES': {
                'grid': {
                    'EmptyRecord': 'No hay registros para mostrar',
                    'EmptyDataSourceError': 'No hay datos disponibles',
                    'GroupDropArea': 'Arrastra una columna aquí para agrupar',
                    'Group': 'Agrupar',
                    'Ungroup': 'Desagrupar',
                    'GroupBy': 'Agrupar por',
                    'Filter': 'Filtrar',
                    'Clear': 'Limpiar',
                    'Search': 'Buscar',
                    'Add': 'Agregar',
                    'Edit': 'Editar',
                    'Cancel': 'Cancelar',
                    'Update': 'Actualizar',
                    'Delete': 'Eliminar',
                    'Save': 'Guardar',
                    'Close': 'Cerrar',
                    'Yes': 'Sí',
                    'No': 'No',
                    'ConfirmDelete': '¿Está seguro de que desea eliminar este registro?',
                    'OK': 'Aceptar',
                    'Cancel': 'Cancelar',
                    'Loading': 'Cargando...',
                    'NoRecords': 'No se encontraron registros',
                    'Page': 'Página',
                    'Of': 'de',
                    'FirstPage': 'Primera página',
                    'LastPage': 'Última página',
                    'NextPage': 'Página siguiente',
                    'PreviousPage': 'Página anterior',
                    'Rows': 'Filas',
                    'Items': 'Elementos',
                    'All': 'Todos',
                    'Selected': 'Seleccionados',
                    'FilterButton': 'Filtrar',
                    'ClearButton': 'Limpiar',
                    'SearchButton': 'Buscar',
                    'AddButton': 'Agregar',
                    'EditButton': 'Editar',
                    'DeleteButton': 'Eliminar',
                    'UpdateButton': 'Actualizar',
                    'SaveButton': 'Guardar',
                    'CancelButton': 'Cancelar',
                    'CloseButton': 'Cerrar'
                }
            }
        });

        // Determinar tema actual de KeenTheme
        function detectKeenThemeMode() {
            // Bootstrap 5.3 usa data-bs-theme, Keen puede usar data-kt-app-theme
            const body = document.body;
            const html = document.documentElement;
            const bsTheme = html.getAttribute('data-bs-theme') || body.getAttribute('data-bs-theme');
            const ktTheme = body.getAttribute('data-kt-app-theme');
            const hasDarkClass = html.classList.contains('dark') || body.classList.contains('dark');
            const isDark = (bsTheme === 'dark') || (ktTheme === 'dark') || hasDarkClass;
            return isDark ? 'material-dark' : 'material';
        }

        // Actualizar CSS de Syncfusion según tema
        function applySyncfusionThemeCss(themeName) {
            const cdnBase = '{$cdnBase}';
            const linkCore = document.getElementById('syncfusion-theme');
            const linkGrid = document.getElementById('syncfusion-grid-theme');
            if (linkCore) linkCore.setAttribute('href', cdnBase + '/' + themeName + '.css');
            if (linkGrid) linkGrid.setAttribute('href', cdnBase + '/grid/' + themeName + '.css');
        }

        // Refrescar grids visibles para evitar glitches tras cambiar CSS
        function refreshVisibleSyncfusionGrids() {
            // Ejemplo: prestamosGrid definido en el módulo actual
            try {
                if (window.prestamosGrid && window.prestamosGrid.grid && typeof window.prestamosGrid.grid.refresh === 'function') {
                    window.prestamosGrid.grid.refresh();
                }
            } catch (e) { /* noop */ }
            // Si usan más grids, pueden agregarlos aquí
        }

        // Aplicación inicial del tema
        (function initSyncfusionTheme() {
            const theme = detectKeenThemeMode();
            applySyncfusionThemeCss(theme);
            // No existe API oficial runtime para cambiar tema en EJ2, se hace swap CSS
            // Forzar un refresh después de que el CSS cargue
            const linkGrid = document.getElementById('syncfusion-grid-theme');
            if (linkGrid) {
                linkGrid.addEventListener('load', function onLoadOnce() {
                    linkGrid.removeEventListener('load', onLoadOnce);
                    refreshVisibleSyncfusionGrids();
                });
            }
        })();

        // Observar cambios de tema en Keen/Bootstrap
        const themeObserver = new MutationObserver(function(mutations) {
            let shouldReapply = false;
            for (const m of mutations) {
                if (m.type === 'attributes' && (m.attributeName === 'data-bs-theme' || m.attributeName === 'data-kt-app-theme' || m.attributeName === 'class')) {
                    shouldReapply = true;
                    break;
                }
            }
            if (shouldReapply) {
                const theme = detectKeenThemeMode();
                applySyncfusionThemeCss(theme);
                const linkGrid = document.getElementById('syncfusion-grid-theme');
                if (linkGrid) {
                    linkGrid.addEventListener('load', function onLoadOnce() {
                        linkGrid.removeEventListener('load', onLoadOnce);
                        refreshVisibleSyncfusionGrids();
                    });
                } else {
                    refreshVisibleSyncfusionGrids();
                }
            }
        });

        themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-bs-theme', 'class'] });
        themeObserver.observe(document.body, { attributes: true, attributeFilter: ['data-bs-theme', 'data-kt-app-theme', 'class'] });

        // Inyectar módulos del Grid que se usan globalmente
        ej.grids.Grid.Inject(
            ej.grids.Page,
            ej.grids.Sort,
            ej.grids.Filter,
            ej.grids.Group,
            ej.grids.Edit,
            ej.grids.Toolbar,
            ej.grids.Search,
            ej.grids.Resize,
            ej.grids.Reorder,
            ej.grids.ColumnChooser,
            ej.grids.ExcelExport,
            ej.grids.PdfExport
        );
    </script>
    ";
}

/**
 * Función para obtener la configuración base del DataGrid
 * @param array $dataSource Datos para el grid
 * @param array $columns Configuración de columnas
 * @param array $options Opciones adicionales
 * @return array Configuración completa del DataGrid
 */
function getDataGridConfig($dataSource = [], $columns = [], $options = []) {
    $defaultConfig = [
        'allowPaging' => true,
        'allowSorting' => true,
        'allowFiltering' => true,
        'allowGrouping' => true,
        'allowReordering' => true,
        'allowResizing' => true,
        'allowTextWrap' => true,
        'showColumnChooser' => true,
        'toolbar' => ['Search', 'Add', 'Edit', 'Delete', 'Update', 'Cancel', 'ExcelExport', 'PdfExport'],
        'editSettings' => [
            'allowAdding' => true,
            'allowEditing' => true,
            'allowDeleting' => true,
            'mode' => 'Dialog'
        ],
        'pageSettings' => [
            'pageSize' => 10,
            'pageSizes' => [5, 10, 20, 50, 100]
        ],
        'filterSettings' => [
            'type' => 'Menu'
        ],
        'locale' => 'es-ES',
        'height' => '400px',
        'width' => '100%',
        'cssClass' => 'e-keen-theme-grid'
    ];
    
    $config = array_merge($defaultConfig, $options);
    $config['dataSource'] = $dataSource;
    $config['columns'] = $columns;
    return $config;
}

/**
 * Función para obtener estilos CSS personalizados para DataGrid
 * @return string CSS personalizado
 */
function getDataGridCustomCSS() {
    return "
    <style>
        /* Estilos personalizados para DataGrid con paleta KeenTheme */
        .e-grid {
            font-family: 'Inter', sans-serif;
            border-radius: 8px;
            overflow: hidden;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border: 1px solid #DBDFE9;
            width: 100% !important;
            max-width: 100% !important;
        }
        
        .e-grid .e-headercell {
            background-color: #F9F9F9;
            color: #252F4A;
            font-weight: 600;
            border-bottom: 2px solid #DBDFE9;
        }
        
        .e-grid .e-row:hover {
            background-color: #E9F3FF;
        }
        
        .e-grid .e-altrow {
            background-color: #F9F9F9;
        }
        
        .e-grid .e-toolbar {
            background-color: #ffffff;
            border-bottom: 1px solid #DBDFE9;
            padding: 8px 16px;
        }
        
        .e-grid .e-toolbar .e-tbar-btn {
            border-radius: 4px;
            margin-right: 4px;
            background-color: #1B84FF;
            color: #ffffff;
            border: 1px solid #1B84FF;
        }
        
        .e-grid .e-toolbar .e-tbar-btn:hover {
            background-color: #056EE9;
            border-color: #056EE9;
        }
        
        .e-grid .e-pager {
            background-color: #ffffff;
            border-top: 1px solid #DBDFE9;
        }
        
        .e-grid .e-pager .e-pagercontainer {
            padding: 8px 16px;
        }
        
        /* Badges de estado con colores KeenTheme */
        .e-grid .e-status-badge {
            padding: 4px 8px;
            border-radius: 12px;
            font-size: 11px;
            font-weight: 500;
            text-transform: uppercase;
        }
        
        .e-grid .e-status-revolvente {
            background-color: #DFFFEA;
            color: #17C653;
        }
        
        .e-grid .e-status-no-revolvente {
            background-color: #F8F5FF;
            color: #7239EA;
        }
        
        .e-grid .e-status-pagado {
            background-color: #E9F3FF;
            color: #1B84FF;
        }
        
        .e-grid .e-status-vencido {
            background-color: #FFF8DD;
            color: #F6C000;
        }
        
        .e-grid .e-status-moroso {
            background-color: #FFEEF3;
            color: #F8285A;
        }
        
        /* Botones de acción */
        .e-grid .e-actions .e-btn {
            border-radius: 4px;
            margin: 0 2px;
        }
        
        .e-grid .e-actions .e-btn.e-primary {
            background-color: #1B84FF;
            border-color: #1B84FF;
            color: #ffffff;
        }
        
        .e-grid .e-actions .e-btn.e-primary:hover {
            background-color: #056EE9;
            border-color: #056EE9;
        }
        
        .e-grid .e-actions .e-btn.e-info {
            background-color: #7239EA;
            border-color: #7239EA;
            color: #ffffff;
        }
        
        .e-grid .e-actions .e-btn.e-info:hover {
            background-color: #5A2BC4;
            border-color: #5A2BC4;
        }
        
        .e-grid .e-actions .e-btn.e-danger {
            background-color: #F8285A;
            border-color: #F8285A;
            color: #ffffff;
        }
        
        .e-grid .e-actions .e-btn.e-danger:hover {
            background-color: #D81A48;
            border-color: #D81A48;
        }
        
        /* MODO OSCURO */
        [data-bs-theme=dark] .e-grid,
        [data-kt-app-theme=dark] .e-grid,
        .dark .e-grid {
            border: 1px solid #363843;
            box-shadow: 0 2px 8px rgba(0,0,0,0.3);
        }
        
        [data-bs-theme=dark] .e-grid .e-headercell,
        [data-kt-app-theme=dark] .e-grid .e-headercell,
        .dark .e-grid .e-headercell {
            background-color: #1B1C22;
            color: #F5F5F5;
            border-bottom: 2px solid #363843;
        }
        
        [data-bs-theme=dark] .e-grid .e-row:hover,
        [data-kt-app-theme=dark] .e-grid .e-row:hover,
        .dark .e-grid .e-row:hover {
            background-color: #172331;
        }
        
        [data-bs-theme=dark] .e-grid .e-altrow,
        [data-kt-app-theme=dark] .e-grid .e-altrow,
        .dark .e-grid .e-altrow {
            background-color: #1B1C22;
        }
        
        [data-bs-theme=dark] .e-grid .e-toolbar,
        [data-kt-app-theme=dark] .e-grid .e-toolbar,
        .dark .e-grid .e-toolbar {
            background-color: #1C1D22;
            border-bottom: 1px solid #363843;
        }
        
        [data-bs-theme=dark] .e-grid .e-toolbar .e-tbar-btn,
        [data-kt-app-theme=dark] .e-grid .e-toolbar .e-tbar-btn,
        .dark .e-grid .e-toolbar .e-tbar-btn {
            background-color: #006AE6;
            border-color: #006AE6;
            color: #ffffff;
        }
        
        [data-bs-theme=dark] .e-grid .e-toolbar .e-tbar-btn:hover,
        [data-kt-app-theme=dark] .e-grid .e-toolbar .e-tbar-btn:hover,
        .dark .e-grid .e-toolbar .e-tbar-btn:hover {
            background-color: #107EFF;
            border-color: #107EFF;
        }
        
        [data-bs-theme=dark] .e-grid .e-pager,
        [data-kt-app-theme=dark] .e-grid .e-pager,
        .dark .e-grid .e-pager {
            background-color: #1C1D22;
            border-top: 1px solid #363843;
        }
        
        /* Badges de estado modo oscuro */
        [data-bs-theme=dark] .e-grid .e-status-revolvente,
        [data-kt-app-theme=dark] .e-grid .e-status-revolvente,
        .dark .e-grid .e-status-revolvente {
            background-color: #1F212A;
            color: #00A261;
        }
        
        [data-bs-theme=dark] .e-grid .e-status-no-revolvente,
        [data-kt-app-theme=dark] .e-grid .e-status-no-revolvente,
        .dark .e-grid .e-status-no-revolvente {
            background-color: #272134;
            color: #883FFF;
        }
        
        [data-bs-theme=dark] .e-grid .e-status-pagado,
        [data-kt-app-theme=dark] .e-grid .e-status-pagado,
        .dark .e-grid .e-status-pagado {
            background-color: #172331;
            color: #006AE6;
        }
        
        [data-bs-theme=dark] .e-grid .e-status-vencido,
        [data-kt-app-theme=dark] .e-grid .e-status-vencido,
        .dark .e-grid .e-status-vencido {
            background-color: #242320;
            color: #C59A00;
        }
        
        [data-bs-theme=dark] .e-grid .e-status-moroso,
        [data-kt-app-theme=dark] .e-grid .e-status-moroso,
        .dark .e-grid .e-status-moroso {
            background-color: #302024;
            color: #E42855;
        }
        
        /* Botones de acción modo oscuro */
        [data-bs-theme=dark] .e-grid .e-actions .e-btn.e-primary,
        [data-kt-app-theme=dark] .e-grid .e-actions .e-btn.e-primary,
        .dark .e-grid .e-actions .e-btn.e-primary {
            background-color: #006AE6;
            border-color: #006AE6;
            color: #ffffff;
        }
        
        [data-bs-theme=dark] .e-grid .e-actions .e-btn.e-primary:hover,
        [data-kt-app-theme=dark] .e-grid .e-actions .e-btn.e-primary:hover,
        .dark .e-grid .e-actions .e-btn.e-primary:hover {
            background-color: #107EFF;
            border-color: #107EFF;
        }
        
        [data-bs-theme=dark] .e-grid .e-actions .e-btn.e-info,
        [data-kt-app-theme=dark] .e-grid .e-actions .e-btn.e-info,
        .dark .e-grid .e-actions .e-btn.e-info {
            background-color: #883FFF;
            border-color: #883FFF;
            color: #ffffff;
        }
        
        [data-bs-theme=dark] .e-grid .e-actions .e-btn.e-info:hover,
        [data-kt-app-theme=dark] .e-grid .e-actions .e-btn.e-info:hover,
        .dark .e-grid .e-actions .e-btn.e-info:hover {
            background-color: #9B4FFF;
            border-color: #9B4FFF;
        }
        
        [data-bs-theme=dark] .e-grid .e-actions .e-btn.e-danger,
        [data-kt-app-theme=dark] .e-grid .e-actions .e-btn.e-danger,
        .dark .e-grid .e-actions .e-btn.e-danger {
            background-color: #E42855;
            border-color: #E42855;
            color: #ffffff;
        }
        
        [data-bs-theme=dark] .e-grid .e-actions .e-btn.e-danger:hover,
        [data-kt-app-theme=dark] .e-grid .e-actions .e-btn.e-danger:hover,
        .dark .e-grid .e-actions .e-btn.e-danger:hover {
            background-color: #FF3767;
            border-color: #FF3767;
        }
    </style>
    ";
}
?>
