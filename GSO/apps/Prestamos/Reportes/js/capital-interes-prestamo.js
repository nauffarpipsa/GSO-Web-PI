/**
 * Reporte por condicion de Prestamo (capital e interés por préstamo acumulado)
 * API: GET /api/loans/reports/loans-capital-interest
 * Parámetros: company, f_invoice_desde (Y-m-d), f_invoice_hasta (Y-m-d)
 */
(function() {
    'use strict';

    var inputDesde, inputHasta, btnBuscar, btnRefresh, btnExcel, searchInput;
    var gridContainer;
    var gridInstance = null;

    function getColumns() {
        return [
            { field: 'prestamo_id', headerText: '# Préstamo', width: 120 },
            { field: 'bank_name', headerText: 'Banco', width: 180 },
            {
                field: 'capital',
                headerText: 'Capital',
                width: 120,
                textAlign: 'Right',
                template: function(data) {
                    var n = parseFloat(data.capital);
                    return isNaN(n) ? '' : n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
            },
            {
                field: 'interes',
                headerText: 'Interés',
                width: 120,
                textAlign: 'Right',
                template: function(data) {
                    var n = parseFloat(data.interes);
                    return isNaN(n) ? '' : n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
            },
            {
                field: 'capital_pagado',
                headerText: 'Capital pagado',
                width: 130,
                textAlign: 'Right',
                template: function(data) {
                    var n = parseFloat(data.capital_pagado);
                    return isNaN(n) ? '' : n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
            },
            {
                field: 'interes_pagado',
                headerText: 'Interés pagado',
                width: 130,
                textAlign: 'Right',
                template: function(data) {
                    var n = parseFloat(data.interes_pagado);
                    return isNaN(n) ? '' : n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
            },
            { field: 'condicion_prestamo', headerText: 'Condición préstamo', width: 150 }
        ];
    }

    function normalizeData(data) {
        if (!Array.isArray(data)) return [];
        return data.map(function(r) {
            return {
                prestamo_id: r.prestamo_id ?? r.prestamoId ?? '',
                bank_name: r.bank_name ?? r.bankName ?? '',
                capital: r.capital != null ? Number(r.capital) : null,
                interes: r.interes != null ? Number(r.interes) : null,
                capital_pagado: r.capital_pagado != null ? Number(r.capital_pagado) : null,
                interes_pagado: r.interes_pagado != null ? Number(r.interes_pagado) : null,
                condicion_prestamo: r.condicion_prestamo ?? r.condicionPrestamo ?? ''
            };
        });
    }

    function showLoading() {
        if (!gridContainer) return;
        if (gridInstance) {
            gridInstance.destroy();
            gridInstance = null;
        }
        gridContainer.innerHTML = '<div class="text-center p-4"><div class="spinner-border text-primary" role="status"></div><p class="mt-2">Cargando reporte...</p></div>';
    }

    function renderGrid(data) {
        if (!gridContainer) return;
        gridContainer.innerHTML = '';

        if (typeof ej === 'undefined' || !ej.grids || !ej.grids.Grid) {
            gridContainer.innerHTML = '<div class="alert alert-danger">Syncfusion Grid no está disponible.</div>';
            return;
        }

        var dataSource = normalizeData(data);

        gridInstance = new ej.grids.Grid({
            dataSource: dataSource,
            columns: getColumns(),
            allowPaging: true,
            allowSorting: true,
            allowFiltering: true,
            allowGrouping: false,
            allowReordering: true,
            allowResizing: true,
            allowTextWrap: true,
            showColumnChooser: true,
            pageSettings: { pageSize: 10, pageSizes: [5, 10, 20, 50, 100] },
            filterSettings: { type: 'Menu' },
            searchSettings: { operator: 'contains', fields: ['prestamo_id', 'bank_name', 'condicion_prestamo'], key: '' },
            allowExcelExport: true,
            locale: 'es-ES',
            height: '100%',
            width: '100%',
            cssClass: 'e-keen-theme-grid'
        });

        gridInstance.appendTo('#reporteCapitalInteresGrid');

        if (searchInput && searchInput.value) {
            gridInstance.search(searchInput.value);
        }
    }

    function showEmpty(message) {
        if (!gridContainer) return;
        if (gridInstance) {
            gridInstance.destroy();
            gridInstance = null;
        }
        gridContainer.innerHTML = '<div class="alert alert-info m-0">' + (message || 'No hay datos para el rango seleccionado.') + '</div>';
    }

    function showError(message) {
        if (!gridContainer) return;
        if (gridInstance) {
            gridInstance.destroy();
            gridInstance = null;
        }
        gridContainer.innerHTML = '<div class="alert alert-danger m-0">' + (message || 'Error al cargar el reporte.') + '</div>';
    }

    function cargarReporte() {
        var desde = inputDesde && inputDesde.value ? inputDesde.value.trim() : '';
        var hasta = inputHasta && inputHasta.value ? inputHasta.value.trim() : '';
        if (!desde || !hasta) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({ icon: 'warning', title: 'Filtros requeridos', text: 'Seleccione fecha desde y fecha hasta.' });
            } else {
                alert('Seleccione fecha desde y fecha hasta.');
            }
            return;
        }
        if (desde > hasta) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({ icon: 'warning', title: 'Fechas inválidas', text: 'La fecha desde no puede ser mayor que la fecha hasta.' });
            } else {
                alert('La fecha desde no puede ser mayor que la fecha hasta.');
            }
            return;
        }

        showLoading();

        var url = 'apps/Prestamos/Reportes/api/reportes-endpoints.php?action=capitalInteresPrestamo&f_invoice_desde=' + encodeURIComponent(desde) + '&f_invoice_hasta=' + encodeURIComponent(hasta);

        fetch(url)
            .then(function(res) { return res.json(); })
            .then(function(json) {
                if (json.success && Array.isArray(json.data)) {
                    renderGrid(json.data);
                } else {
                    showEmpty(json.message || 'No hay datos para el rango seleccionado.');
                }
            })
            .catch(function(e) {
                showError('Error al cargar el reporte: ' + (e.message || 'Error de conexión'));
                console.error(e);
            });
    }

    function init() {
        inputDesde = document.getElementById('reporteCapitalInteresDesde');
        inputHasta = document.getElementById('reporteCapitalInteresHasta');
        btnBuscar = document.getElementById('btnReporteCapitalInteresBuscar');
        btnRefresh = document.getElementById('btnReporteCapitalInteresRefresh');
        searchInput = document.getElementById('reporteCapitalInteresSearch');
        gridContainer = document.getElementById('reporteCapitalInteresGrid');

        var hoy = new Date();
        var y = hoy.getFullYear();
        var m = String(hoy.getMonth() + 1).padStart(2, '0');
        var d = String(hoy.getDate()).padStart(2, '0');
        var hoyStr = y + '-' + m + '-' + d;
        var inicioAnio = y + '-01-01';
        if (inputDesde) inputDesde.value = inicioAnio;
        if (inputHasta) inputHasta.value = hoyStr;

        if (btnBuscar) btnBuscar.addEventListener('click', cargarReporte);
        if (btnRefresh) btnRefresh.addEventListener('click', cargarReporte);
        btnExcel = document.getElementById('btnReporteCapitalInteresExcel');
        if (btnExcel) {
            btnExcel.addEventListener('click', function() {
                if (gridInstance) {
                    gridInstance.excelExport({
                        fileName: 'Reporte_condicion_prestamo_' + (inputDesde ? inputDesde.value : '') + '_' + (inputHasta ? inputHasta.value : '') + '.xlsx'
                    });
                } else if (typeof Swal !== 'undefined') {
                    Swal.fire({ icon: 'info', title: 'Sin datos', text: 'Ejecute Buscar primero para exportar.' });
                } else {
                    alert('Ejecute Buscar primero para exportar.');
                }
            });
        }

        if (searchInput) {
            searchInput.addEventListener('keyup', function(e) {
                if (e.key === 'Enter' && gridInstance) gridInstance.search(searchInput.value);
            });
            searchInput.addEventListener('input', function() {
                if (gridInstance) gridInstance.search(searchInput.value);
            });
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
})();
