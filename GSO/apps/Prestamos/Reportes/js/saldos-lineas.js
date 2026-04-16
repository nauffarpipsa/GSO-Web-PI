/**
 * Reporte Saldos Líneas de Crédito - Préstamos
 * API: GET /api/loans/reports/credit-lines-balance (opcional bank_id)
 * Bancos: GET /api/SAP_Maestro_Bancos/GetAll/{company_id} (API 8030)
 */
(function() {
    'use strict';

    var bancoSelect, btnBuscar, btnRefresh, btnExcel, searchInput;
    var gridContainer;
    var gridInstance = null;

    function getColumns() {
        return [
            { field: 'nombre_linea', headerText: 'Nombre línea', width: 200 },
            { field: 'bank_name', headerText: 'Banco', width: 180 },
            {
                field: 'total_linea',
                headerText: 'Total línea',
                width: 130,
                textAlign: 'Right',
                template: function(data) {
                    var n = parseFloat(data.total_linea);
                    return isNaN(n) ? '' : n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
            },
            {
                field: 'consumido',
                headerText: 'Consumido',
                width: 130,
                textAlign: 'Right',
                template: function(data) {
                    var n = parseFloat(data.consumido);
                    return isNaN(n) ? '' : n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
            },
            {
                field: 'disponible',
                headerText: 'Disponible',
                width: 130,
                textAlign: 'Right',
                template: function(data) {
                    var n = parseFloat(data.disponible);
                    return isNaN(n) ? '' : n.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
            }
        ];
    }

    function normalizeData(data) {
        if (!Array.isArray(data)) return [];
        return data.map(function(r) {
            return {
                nombre_linea: r.nombre_linea ?? r.nombreLinea ?? '',
                bank_name: r.bank_name ?? r.bankName ?? '',
                total_linea: r.total_linea != null ? Number(r.total_linea) : (r.totalLinea != null ? Number(r.totalLinea) : null),
                consumido: r.consumido != null ? Number(r.consumido) : null,
                disponible: r.disponible != null ? Number(r.disponible) : null
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
            searchSettings: { operator: 'contains', fields: ['nombre_linea', 'bank_name'], key: '' },
            allowExcelExport: true,
            locale: 'es-ES',
            height: '100%',
            width: '100%',
            cssClass: 'e-keen-theme-grid'
        });

        gridInstance.appendTo('#reporteLineasGrid');

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
        gridContainer.innerHTML = '<div class="alert alert-info m-0">' + (message || 'No hay datos.') + '</div>';
    }

    function showError(message) {
        if (!gridContainer) return;
        if (gridInstance) {
            gridInstance.destroy();
            gridInstance = null;
        }
        gridContainer.innerHTML = '<div class="alert alert-danger m-0">' + (message || 'Error al cargar el reporte.') + '</div>';
    }

    function cargarBancos() {
        var url = 'apps/Prestamos/Reportes/api/reportes-endpoints.php?action=getBancos';
        fetch(url)
            .then(function(res) { return res.json(); })
            .then(function(json) {
                if (!bancoSelect) return;
                bancoSelect.innerHTML = '<option value="">Todos los bancos</option>';
                if (json.success && Array.isArray(json.data)) {
                    json.data.forEach(function(b) {
                        if (b.status === false) return;
                        var opt = document.createElement('option');
                        opt.value = b.bank_id != null ? String(b.bank_id) : '';
                        opt.textContent = b.bank_name || ('Banco ' + opt.value);
                        bancoSelect.appendChild(opt);
                    });
                }
            })
            .catch(function() {
                if (bancoSelect) bancoSelect.innerHTML = '<option value="">Todos los bancos</option>';
            });
    }

    function cargarReporte() {
        showLoading();

        var url = 'apps/Prestamos/Reportes/api/reportes-endpoints.php?action=saldosLineasCredito';
        var bankId = bancoSelect && bancoSelect.value ? bancoSelect.value.trim() : '';
        if (bankId !== '') {
            url += '&bank_id=' + encodeURIComponent(bankId);
        }

        fetch(url)
            .then(function(res) { return res.json(); })
            .then(function(json) {
                if (json.success && Array.isArray(json.data)) {
                    renderGrid(json.data);
                } else {
                    showEmpty(json.message || 'No hay datos.');
                }
            })
            .catch(function(e) {
                showError('Error al cargar el reporte: ' + (e.message || 'Error de conexión'));
                console.error(e);
            });
    }

    function init() {
        bancoSelect = document.getElementById('reporteLineasBanco');
        btnBuscar = document.getElementById('btnReporteLineasBuscar');
        btnRefresh = document.getElementById('btnReporteLineasRefresh');
        searchInput = document.getElementById('reporteLineasSearch');
        gridContainer = document.getElementById('reporteLineasGrid');

        cargarBancos();

        if (btnBuscar) btnBuscar.addEventListener('click', cargarReporte);
        if (btnRefresh) btnRefresh.addEventListener('click', cargarReporte);
        btnExcel = document.getElementById('btnReporteLineasExcel');
        if (btnExcel) {
            btnExcel.addEventListener('click', function() {
                if (gridInstance) {
                    gridInstance.excelExport({
                        fileName: 'Saldos_Lineas_Credito' + (bancoSelect && bancoSelect.value ? '_Banco_' + bancoSelect.value : '') + '.xlsx'
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
