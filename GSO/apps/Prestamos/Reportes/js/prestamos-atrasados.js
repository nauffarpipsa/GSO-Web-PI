/**
 * Reporte Préstamos Atrasados - Préstamos
 * API: GET /api/loans/reports/pending-installments (company, mes, anio)
 */
(function() {
    'use strict';

    var mesSelect, anioSelect, btnBuscar, btnRefresh, btnExcel, searchInput;
    var gridContainer;
    var gridInstance = null;

    function getColumns() {
        return [
            { field: 'bank_name', headerText: 'Banco', width: 160 },
            { field: 'line_description', headerText: 'Línea', width: 160 },
            { field: 'prestamo_id', headerText: '# Préstamo', width: 110 },
            {
                field: 'tasa',
                headerText: 'Tasa',
                width: 90,
                textAlign: 'Right',
                template: function(data) {
                    var n = parseFloat(data.tasa);
                    return isNaN(n) ? '' : n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
            },
            { field: 'quota_number', headerText: 'Nº Cuota', width: 90, textAlign: 'Right' },
            { field: 'fecha_vencimiento', headerText: 'Fecha vencimiento', width: 115 },
            { field: 'fecha_ultimo_pago', headerText: 'Último pago', width: 115 },
            {
                field: 'capital_a_pagar',
                headerText: 'Capital a pagar',
                width: 120,
                textAlign: 'Right',
                template: function(data) {
                    var n = parseFloat(data.capital_a_pagar);
                    return isNaN(n) ? '' : n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
            },
            {
                field: 'interest_a_pagar',
                headerText: 'Interés a pagar',
                width: 120,
                textAlign: 'Right',
                template: function(data) {
                    var n = parseFloat(data.interest_a_pagar);
                    return isNaN(n) ? '' : n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
            },
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
                field: 'interest_pagado',
                headerText: 'Interés pagado',
                width: 120,
                textAlign: 'Right',
                template: function(data) {
                    var n = parseFloat(data.interest_pagado);
                    return isNaN(n) ? '' : n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
            },
            {
                field: 'valor_pagado',
                headerText: 'Valor pagado',
                width: 120,
                textAlign: 'Right',
                template: function(data) {
                    var n = parseFloat(data.valor_pagado);
                    return isNaN(n) ? '' : n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
            },
            {
                field: 'atrasada',
                headerText: 'Atrasada',
                width: 95,
                template: function(data) {
                    var v = data.atrasada;
                    if (v === true || v === 'true' || v === 1 || v === '1') return 'Sí';
                    if (v === false || v === 'false' || v === 0 || v === '0') return 'No';
                    return v != null ? String(v) : '';
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
                bank_name: r.bank_name ?? r.bankName ?? '',
                line_description: r.line_description ?? r.lineDescription ?? '',
                prestamo_id: r.prestamo_id ?? r.prestamoId ?? '',
                tasa: r.tasa != null ? Number(r.tasa) : null,
                quota_number: r.quota_number != null && r.quota_number !== '' ? Number(r.quota_number) : null,
                fecha_vencimiento: formatDateOnly(r.fecha_vencimiento ?? r.fechaVencimiento ?? r.due_date ?? r.dueDate),
                fecha_ultimo_pago: formatDateOnly(r.fecha_ultimo_pago ?? r.fechaUltimoPago ?? r.last_payment_date ?? r.lastPaymentDate),
                capital_a_pagar: r.capital_a_pagar != null ? Number(r.capital_a_pagar) : (r.capitalAPagar != null ? Number(r.capitalAPagar) : null),
                interest_a_pagar: r.interest_a_pagar != null ? Number(r.interest_a_pagar) : (r.interestAPagar != null ? Number(r.interestAPagar) : null),
                capital_pagado: r.capital_pagado != null ? Number(r.capital_pagado) : (r.capitalPagado != null ? Number(r.capitalPagado) : null),
                interest_pagado: r.interest_pagado != null ? Number(r.interest_pagado) : (r.interestPagado != null ? Number(r.interestPagado) : null),
                valor_pagado: r.valor_pagado != null ? Number(r.valor_pagado) : (r.valorPagado != null ? Number(r.valorPagado) : null),
                atrasada: r.atrasada === true || r.atrasada === 'true' || r.atrasada === 1 || r.atrasada === '1'
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
                fields: ['prestamo_id', 'bank_name', 'line_description', 'atrasada'],
                key: ''
            },
            allowExcelExport: true,
            locale: 'es-ES',
            height: '100%',
            width: '100%',
            cssClass: 'e-keen-theme-grid'
        });

        gridInstance.appendTo('#reportePrestamosAtrasadosGrid');

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

        var url = 'apps/Prestamos/Reportes/api/reportes-endpoints.php?action=facturasPendientesPago&mes=' + encodeURIComponent(mes) + '&anio=' + encodeURIComponent(anio);

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
        mesSelect = document.getElementById('reportePrestamosAtrasadosMes');
        anioSelect = document.getElementById('reportePrestamosAtrasadosAnio');
        btnBuscar = document.getElementById('btnReportePrestamosAtrasadosBuscar');
        btnRefresh = document.getElementById('btnReportePrestamosAtrasadosRefresh');
        searchInput = document.getElementById('reportePrestamosAtrasadosSearch');
        gridContainer = document.getElementById('reportePrestamosAtrasadosGrid');

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
        btnExcel = document.getElementById('btnReportePrestamosAtrasadosExcel');
        if (btnExcel) {
            btnExcel.addEventListener('click', function() {
                if (gridInstance) {
                    gridInstance.excelExport({
                        fileName: 'Prestamos_Atrasados_' + (mesSelect ? mesSelect.value : '') + '_' + (anioSelect ? anioSelect.value : '') + '.xlsx'
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
