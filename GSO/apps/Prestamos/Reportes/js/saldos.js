/**
 * Reporte de Saldos por Mes - Préstamos
 * Syncfusion Grid según API oficial: https://ej2.syncfusion.com/javascript/documentation/grid/getting-started
 * Demo referencia: https://ej2.syncfusion.com/demos/#/tailwind3/grid/grid-overview.html
 */
(function() {
    'use strict';

    var mesSelect, anioSelect, btnBuscar, btnRefresh, btnExcel, searchInput;
    var gridContainer;
    var gridInstance = null;

    /**
     * Columnas del grid (API: field, headerText, width, textAlign, type, format, template)
     * @see https://ej2.syncfusion.com/javascript/documentation/api/grid/column/
     */
    /**
     * Columnas sin format para evitar INVALID FORMAT y toFixed; usamos template para mostrar.
     */
    function getColumns() {
        return [
            { field: 'prestamo_id', headerText: '# Préstamo', width: 120 },
            {
                field: 'quota_number',
                headerText: 'Nº Cuota',
                width: 100,
                textAlign: 'Right'
                // Sin template: el grid muestra el valor del campo; la API envía quota_number.
            },
            {
                field: 'fecha_vencimiento',
                headerText: 'Fecha vencimiento',
                width: 130
                // Valor ya viene como fecha solo (dd/MM/yyyy) desde normalizeData; export Excel igual.
            },
            { field: 'bank_name', headerText: 'Banco', width: 180 },
            {
                field: 'saldo_capital',
                headerText: 'Saldo capital',
                width: 130,
                textAlign: 'Right',
                template: function(data) {
                    var n = parseFloat(data.saldo_capital);
                    return isNaN(n) ? '' : n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
            }
        ];
    }

    /** Formatea fecha ISO a solo fecha (dd/MM/yyyy) para pantalla y export Excel. */
    function formatDateOnly(value) {
        if (value == null || value === '') return '';
        var d = new Date(value);
        return isNaN(d.getTime()) ? value : d.toLocaleDateString('es-HN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    /** Valor de cuota desde API (puede venir como quota_number, quotaNumber, numero_cuota, cuota, period, etc.) */
    function getQuotaNumber(r) {
        var v = r.quota_number;
        if (v === undefined || v === null || v === '') return null;
        var n = Number(v);
        return isNaN(n) ? v : n;
    }

    /** Convierte campos numéricos a number y fechas a solo fecha (sin hora) para grid y export. */
    function normalizeData(data) {
        if (!Array.isArray(data)) return [];
        return data.map(function(r) {
            return {
                prestamo_id: r.prestamo_id ?? r.prestamoId ?? r.loan_id ?? r.loanNumber,
                quota_number: getQuotaNumber(r),
                fecha_vencimiento: formatDateOnly(r.fecha_vencimiento ?? r.fechaVencimiento ?? r.due_date ?? r.dueDate),
                bank_name: r.bank_name ?? r.bankName ?? r.banco ?? '',
                saldo_capital: r.saldo_capital != null ? Number(r.saldo_capital) : (r.saldoCapital != null ? Number(r.saldoCapital) : null)
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

    /**
     * Renderiza el Grid según la API de Syncfusion (dataSource, columns, allowPaging, etc.)
     */
    function renderGrid(data) {
        if (!gridContainer) return;
        gridContainer.innerHTML = '';

        if (typeof ej === 'undefined' || !ej.grids || !ej.grids.Grid) {
            gridContainer.innerHTML = '<div class="alert alert-danger">Syncfusion Grid no está disponible. Compruebe que getSyncfusionJS() se cargue antes que este script.</div>';
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
            searchSettings: { operator: 'contains', fields: ['prestamo_id', 'bank_name'], key: '' },
            allowExcelExport: true,
            locale: 'es-ES',
            height: '100%',
            width: '100%',
            cssClass: 'e-keen-theme-grid'
        });

        gridInstance.appendTo('#reporteSaldosGrid');

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

        var url = 'apps/Prestamos/Reportes/api/reportes-endpoints.php?action=saldosPorMes&mes=' + encodeURIComponent(mes) + '&anio=' + encodeURIComponent(anio);

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
        mesSelect = document.getElementById('reporteSaldosMes');
        anioSelect = document.getElementById('reporteSaldosAnio');
        btnBuscar = document.getElementById('btnReporteSaldosBuscar');
        btnRefresh = document.getElementById('btnReporteSaldosRefresh');
        searchInput = document.getElementById('reporteSaldosSearch');
        gridContainer = document.getElementById('reporteSaldosGrid');

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
        btnExcel = document.getElementById('btnReporteSaldosExcel');
        if (btnExcel) {
            btnExcel.addEventListener('click', function() {
                if (gridInstance) {
                    gridInstance.excelExport({
                        fileName: 'Reporte_Saldos_' + (mesSelect ? mesSelect.value : '') + '_' + (anioSelect ? anioSelect.value : '') + '.xlsx'
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
