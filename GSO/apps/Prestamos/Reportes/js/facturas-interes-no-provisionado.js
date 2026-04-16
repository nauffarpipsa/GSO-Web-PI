/**
 * Reporte Facturas de Interés no Provisionado - Préstamos
 * API: GET /api/loans/reports/unprovisioned-invoices-by-month (company, mes, anio)
 */
(function() {
    'use strict';

    var mesSelect, anioSelect, btnBuscar, btnRefresh, btnExcel, searchInput;
    var gridContainer;
    var gridInstance = null;

    function getColumns() {
        return [
            { field: 'bank_name', headerText: 'Banco', width: 200 },
            { field: 'prestamo_id', headerText: '# Préstamo', width: 130 },
            { field: 'quota_number', headerText: 'Nº Cuota', width: 100, textAlign: 'Right' },
            {
                field: 'valor_factura',
                headerText: 'Valor factura',
                width: 140,
                textAlign: 'Right',
                template: function(data) {
                    var n = parseFloat(data.valor_factura);
                    return isNaN(n) ? '' : n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
            },
            { field: 'invoice_unpinterest', headerText: 'Factura interés no prov.', width: 180 }
        ];
    }

    function normalizeData(data) {
        if (!Array.isArray(data)) return [];
        return data.map(function(r) {
            return {
                bank_name: r.bank_name ?? r.bankName ?? '',
                prestamo_id: r.prestamo_id ?? r.prestamoId ?? '',
                quota_number: r.quota_number != null && r.quota_number !== '' ? Number(r.quota_number) : null,
                valor_factura: r.valor_factura != null ? Number(r.valor_factura) : (r.valorFactura != null ? Number(r.valorFactura) : null),
                invoice_unpinterest: r.invoice_unpinterest != null ? String(r.invoice_unpinterest) : (r.invoiceUnpinterest != null ? String(r.invoiceUnpinterest) : '')
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
            searchSettings: {
                operator: 'contains',
                fields: ['prestamo_id', 'bank_name', 'invoice_unpinterest'],
                key: ''
            },
            allowExcelExport: true,
            locale: 'es-ES',
            height: '100%',
            width: '100%',
            cssClass: 'e-keen-theme-grid'
        });

        gridInstance.appendTo('#reporteInteresNoProvisionadoGrid');

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
        gridContainer.innerHTML = '<div class="alert alert-info m-0">' + (message || 'No hay datos para el periodo seleccionado.') + '</div>';
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
        var mes = mesSelect && mesSelect.value;
        var anio = anioSelect && anioSelect.value;
        if (!mes || !anio) {
            if (typeof Swal !== 'undefined') {
                Swal.fire({ icon: 'warning', title: 'Filtros requeridos', text: 'Seleccione mes y año.' });
            } else {
                alert('Seleccione mes y año.');
            }
            return;
        }

        showLoading();

        var url = 'apps/Prestamos/Reportes/api/reportes-endpoints.php?action=facturasInteresNoProvisionado&mes=' + encodeURIComponent(mes) + '&anio=' + encodeURIComponent(anio);

        fetch(url)
            .then(function(res) { return res.json(); })
            .then(function(json) {
                if (json.success && Array.isArray(json.data)) {
                    renderGrid(json.data);
                } else {
                    showEmpty(json.message || 'No hay datos para el periodo seleccionado.');
                }
            })
            .catch(function(e) {
                showError('Error al cargar el reporte: ' + (e.message || 'Error de conexión'));
                console.error(e);
            });
    }

    function init() {
        mesSelect = document.getElementById('reporteInteresNoProvisionadoMes');
        anioSelect = document.getElementById('reporteInteresNoProvisionadoAnio');
        btnBuscar = document.getElementById('btnReporteInteresNoProvisionadoBuscar');
        btnRefresh = document.getElementById('btnReporteInteresNoProvisionadoRefresh');
        searchInput = document.getElementById('reporteInteresNoProvisionadoSearch');
        gridContainer = document.getElementById('reporteInteresNoProvisionadoGrid');

        if (!anioSelect) return;

        var anioActual = new Date().getFullYear();
        for (var i = anioActual - 5; i <= anioActual + 2; i++) {
            var opt = document.createElement('option');
            opt.value = i;
            opt.textContent = i;
            if (i === anioActual) opt.selected = true;
            anioSelect.appendChild(opt);
        }
        if (mesSelect) mesSelect.value = String(new Date().getMonth() + 1);

        if (btnBuscar) btnBuscar.addEventListener('click', cargarReporte);
        if (btnRefresh) btnRefresh.addEventListener('click', cargarReporte);
        btnExcel = document.getElementById('btnReporteInteresNoProvisionadoExcel');
        if (btnExcel) {
            btnExcel.addEventListener('click', function() {
                if (gridInstance) {
                    gridInstance.excelExport({
                        fileName: 'Facturas_Interes_No_Provisionado_' + (mesSelect ? mesSelect.value : '') + '_' + (anioSelect ? anioSelect.value : '') + '.xlsx'
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
