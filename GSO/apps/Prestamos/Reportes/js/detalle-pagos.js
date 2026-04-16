/**
 * Reporte Detalle de Pagos por Mes - Préstamos
 * API: GET /api/loans/reports/payments-detail-by-month (company, mes, anio)
 */
(function() {
    'use strict';

    var mesSelect, anioSelect, btnBuscar, btnRefresh, btnExcel, searchInput;
    var gridContainer;
    var gridInstance = null;

    function getColumns() {
        return [
            { field: 'prestamo_id', headerText: '# Préstamo', width: 120 },
            { field: 'quota_number', headerText: 'Nº Cuota', width: 100, textAlign: 'Right' },
            { field: 'pay_date', headerText: 'Fecha pago', width: 120 },
            { field: 'bank_name', headerText: 'Banco', width: 180 },
            {
                field: 'capital_pagado',
                headerText: 'Capital pagado',
                width: 120,
                textAlign: 'Right',
                template: function(data) {
                    var n = parseFloat(data.capital_pagado);
                    return isNaN(n) ? '' : n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
            },
            {
                field: 'interes_pagado',
                headerText: 'Interés pagado',
                width: 120,
                textAlign: 'Right',
                template: function(data) {
                    var n = parseFloat(data.interes_pagado);
                    return isNaN(n) ? '' : n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
            },
            {
                field: 'unprovisioned_interest',
                headerText: 'Interés no provisionado',
                width: 140,
                textAlign: 'Right',
                template: function(data) {
                    var n = parseFloat(data.unprovisioned_interest);
                    return isNaN(n) ? '' : n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
            },
            {
                field: 'saldo_capital',
                headerText: 'Saldo capital',
                width: 120,
                textAlign: 'Right',
                template: function(data) {
                    var n = parseFloat(data.saldo_capital);
                    return isNaN(n) ? '' : n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
            },
            {
                field: 'saldo_interes',
                headerText: 'Saldo interés',
                width: 120,
                textAlign: 'Right',
                template: function(data) {
                    var n = parseFloat(data.saldo_interes);
                    return isNaN(n) ? '' : n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
            }
        ];
    }

    function formatDateOnly(value) {
        if (value == null || value === '') return '';
        var d = new Date(value);
        return isNaN(d.getTime()) ? value : d.toLocaleDateString('es-HN', { day: '2-digit', month: '2-digit', year: 'numeric' });
    }

    function normalizeData(data) {
        if (!Array.isArray(data)) return [];
        return data.map(function(r) {
            return {
                prestamo_id: r.prestamo_id ?? r.prestamoId ?? '',
                quota_number: r.quota_number != null && r.quota_number !== '' ? Number(r.quota_number) : null,
                pay_date: formatDateOnly(r.pay_date ?? r.payDate),
                bank_name: r.bank_name ?? r.bankName ?? '',
                capital_pagado: r.capital_pagado != null ? Number(r.capital_pagado) : null,
                interes_pagado: r.interes_pagado != null ? Number(r.interes_pagado) : null,
                unprovisioned_interest: r.unprovisioned_interest != null ? Number(r.unprovisioned_interest) : (r.unprovisionedInterest != null ? Number(r.unprovisionedInterest) : null),
                saldo_capital: r.saldo_capital != null ? Number(r.saldo_capital) : null,
                saldo_interes: r.saldo_interes != null ? Number(r.saldo_interes) : null
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
            searchSettings: { operator: 'contains', fields: ['prestamo_id', 'bank_name'], key: '' },
            allowExcelExport: true,
            locale: 'es-ES',
            height: '100%',
            width: '100%',
            cssClass: 'e-keen-theme-grid'
        });

        gridInstance.appendTo('#reportePagosGrid');

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

        var url = 'apps/Prestamos/Reportes/api/reportes-endpoints.php?action=pagosDetallePorMes&mes=' + encodeURIComponent(mes) + '&anio=' + encodeURIComponent(anio);

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
        mesSelect = document.getElementById('reportePagosMes');
        anioSelect = document.getElementById('reportePagosAnio');
        btnBuscar = document.getElementById('btnReportePagosBuscar');
        btnRefresh = document.getElementById('btnReportePagosRefresh');
        searchInput = document.getElementById('reportePagosSearch');
        gridContainer = document.getElementById('reportePagosGrid');

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
        btnExcel = document.getElementById('btnReportePagosExcel');
        if (btnExcel) {
            btnExcel.addEventListener('click', function() {
                if (gridInstance) {
                    gridInstance.excelExport({
                        fileName: 'Detalle_Pagos_' + (mesSelect ? mesSelect.value : '') + '_' + (anioSelect ? anioSelect.value : '') + '.xlsx'
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
