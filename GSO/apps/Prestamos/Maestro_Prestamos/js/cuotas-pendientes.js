/**
 * Módulo de Cuotas Pendientes de Interés
 * Versión: 1.0.0
 * 
 * Este archivo maneja la funcionalidad de cuotas pendientes de interés
 */

class CuotasPendientesManager {
    constructor(prestamosGrid) {
        this.prestamosGrid = prestamosGrid;
        this.grid = null;
        this.init();
    }

    /**
     * Inicializar eventos
     */
    init() {
        // Evento para botón de cuotas pendientes de interés
        const btnCuotasPendientesInteres = document.getElementById('btnCuotasPendientesInteres');
        if (btnCuotasPendientesInteres) {
            btnCuotasPendientesInteres.addEventListener('click', () => {
                this.abrirModal();
            });
        }

        // Evento para botón buscar cuotas pendientes
        const btnBuscarCuotasPendientes = document.getElementById('btnBuscarCuotasPendientes');
        if (btnBuscarCuotasPendientes) {
            btnBuscarCuotasPendientes.addEventListener('click', () => {
                this.buscarCuotasPendientes();
            });
        }
    }

    /**
     * Abrir modal de cuotas pendientes de interés
     */
    abrirModal() {
        const modal = new bootstrap.Modal(document.getElementById('modalCuotasPendientesInteres'));
        
        // Cargar años en el combobox (últimos 5 años y próximos 2)
        const anioSelect = document.getElementById('filtroAnio');
        if (anioSelect) {
            anioSelect.innerHTML = '<option value="">Seleccionar año...</option>';
            const anioActual = new Date().getFullYear();
            for (let i = anioActual - 5; i <= anioActual + 2; i++) {
                const option = document.createElement('option');
                option.value = i;
                option.textContent = i;
                if (i === anioActual) {
                    option.selected = true;
                }
                anioSelect.appendChild(option);
            }
        }
        
        // Establecer mes actual por defecto
        const mesSelect = document.getElementById('filtroMes');
        if (mesSelect) {
            const mesActual = new Date().getMonth() + 1;
            mesSelect.value = mesActual;
        }
        
        // Fecha de creación de facturas: por defecto hoy
        const fechaCreacionInput = document.getElementById('fechaCreacionFacturasIPM');
        if (fechaCreacionInput) {
            const hoy = new Date();
            fechaCreacionInput.value = hoy.toISOString().split('T')[0];
        }
        
        // Limpiar grid y resumen
        const gridContainer = document.getElementById('gridCuotasPendientesInteres');
        if (gridContainer) {
            gridContainer.innerHTML = '';
        }
        
        // Eliminar botón de crear facturas si existe
        const botonExistente = document.getElementById('btnCrearFacturasInteres');
        if (botonExistente && botonExistente.parentNode) {
            botonExistente.parentNode.remove();
        }
        
        // Destruir grid si existe
        if (this.grid) {
            this.grid.destroy();
            this.grid = null;
        }
        
        
        modal.show();
    }

    /**
     * Buscar cuotas pendientes de interés
     */
    async buscarCuotasPendientes() {
        const mes = document.getElementById('filtroMes').value;
        const anio = document.getElementById('filtroAnio').value;
        
        if (!mes || !anio) {
            this.prestamosGrid.mostrarNotificacion('error', 'Por favor seleccione mes y año', 'Error');
            return;
        }
        
        const gridContainer = document.getElementById('gridCuotasPendientesInteres');
        
        // Mostrar loading
        gridContainer.innerHTML = '<div class="text-center p-4"><div class="spinner-border" role="status"></div><p class="mt-2">Cargando cuotas pendientes...</p></div>';
        
        try {
            // Llamar al endpoint PHP
            const response = await fetch(`apps/Prestamos/Maestro_Prestamos/api/cuotas-pendientes-endpoints.php?action=obtenerCuotasPendientesInteres&month=${mes}&year=${anio}`);
            
            if (!response.ok) {
                const errorData = await response.json().catch(() => ({ message: `Error HTTP: ${response.status}` }));
                throw new Error(errorData.message || `Error HTTP: ${response.status}`);
            }
            
            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Error al obtener cuotas pendientes');
            }
            
            const data = result.data;
            
            // Preparar datos para el grid (estructura padre-hijo)
            const datosParaGrid = (data.loans || []).map(prestamo => {
                const cuotas = (prestamo.pendingInstallments || []).map(cuota => ({
                    ...cuota,
                    loanNumber: prestamo.loanNumber,
                    cProveedor: prestamo.cProveedor,
                    nProveedor: prestamo.nProveedor,
                    selected: false // Para el checkbox
                }));
                
                return {
                    loanNumber: prestamo.loanNumber,
                    cProveedor: prestamo.cProveedor,
                    nProveedor: prestamo.nProveedor,
                    totalCuotas: cuotas.length,
                    totalInteres: cuotas.reduce((sum, c) => sum + (parseFloat(c.interestPending) || 0), 0),
                    childRecords: cuotas
                };
            });
            
            // Limpiar contenedor antes de crear el grid
            gridContainer.innerHTML = '';
            
            // Eliminar botón de crear facturas si existe
            const botonExistente = document.getElementById('btnCrearFacturasInteres');
            if (botonExistente && botonExistente.parentNode) {
                botonExistente.parentNode.remove();
            }
            
            // Crear grid si no existe o actualizar
            if (this.grid) {
                this.grid.destroy();
                this.grid = null;
            }
            
            this.crearGrid(datosParaGrid);
            
        } catch (error) {
            console.error('Error al buscar cuotas pendientes:', error);
            gridContainer.innerHTML = `
                <div class="alert alert-danger">
                    <i class="ki-duotone ki-information fs-4 me-2">
                        <span class="path1"></span>
                        <span class="path2"></span>
                        <span class="path3"></span>
                    </i>
                    Error al cargar cuotas pendientes: ${error.message}
                </div>
            `;
            this.prestamosGrid.mostrarNotificacion('error', `Error: ${error.message}`, 'Error');
        }
    }

    /**
     * Crear grid de cuotas pendientes de interés
     */
    crearGrid(datos) {
        const childGridColumns = [
            {
                field: 'selected',
                headerText: 'Seleccionar',
                width: 100,
                textAlign: 'Center',
                template: (args) => {
                    return `<input type="checkbox" class="form-check-input checkbox-cuota" 
                            data-loan-number="${args.loanNumber}" 
                            data-quota-number="${args.quotaNumber}"
                            ${args.selected ? 'checked' : ''}>`;
                }
            },
            {
                field: 'quotaNumber',
                headerText: 'N° Cuota',
                width: 100,
                textAlign: 'Center'
            },
            {
                field: 'dueDate',
                headerText: 'Fecha Vencimiento',
                width: 150,
                textAlign: 'Center',
                template: (args) => {
                    if (args.dueDate) {
                        const date = new Date(args.dueDate);
                        return date.toLocaleDateString('es-HN');
                    }
                    return '';
                }
            },
            {
                field: 'interestPending',
                headerText: 'Interés Pendiente',
                width: 150,
                textAlign: 'Right',
                template: (args) => this.formatearMoneda(args.interestPending || 0)
            }
        ];
        
        const gridConfig = {
            dataSource: datos,
            columns: [
                {
                    field: 'loanNumber',
                    headerText: 'N° Préstamo',
                    width: 180,
                    textAlign: 'Left'
                },
                {
                    field: 'cProveedor',
                    headerText: 'Código Proveedor',
                    width: 150,
                    textAlign: 'Left'
                },
                {
                    field: 'nProveedor',
                    headerText: 'Nombre Proveedor',
                    width: 250,
                    textAlign: 'Left'
                },
                {
                    field: 'totalCuotas',
                    headerText: 'Total Cuotas',
                    width: 120,
                    textAlign: 'Center',
                    template: (args) => `<span class="badge bg-primary">${args.totalCuotas || 0}</span>`
                },
                {
                    field: 'totalInteres',
                    headerText: 'Total Interés',
                    width: 150,
                    textAlign: 'Right',
                    template: (args) => this.formatearMoneda(args.totalInteres || 0)
                }
            ],
            detailTemplate: (props) => `
                <div class="child-grid-container">
                    <div class="child-grid" data-loan-number="${props.loanNumber}"></div>
                </div>
            `,
            allowPaging: true,
            allowSorting: true,
            allowFiltering: true,
            pageSettings: {
                pageSize: 10,
                pageSizes: [5, 10, 15, 20, 50]
            },
            filterSettings: {
                type: 'Menu'
            },
            height: 'auto',
            width: '100%',
            detailDataBound: (args) => {
                const cuotas = args.data.childRecords || [];
                const childContainer = args.detailElement.querySelector('.child-grid');
                
                if (!childContainer) {
                    return;
                }
                
                childContainer.innerHTML = '';
                
                if (!cuotas.length) {
                    childContainer.innerHTML = `
                        <div class="text-muted px-4 py-3">
                            <i class="ki-duotone ki-information fs-4 me-2"></i>
                            No hay cuotas pendientes para este préstamo.
                        </div>
                    `;
                } else {
                    const childGrid = new ej.grids.Grid({
                        dataSource: cuotas,
                        columns: childGridColumns,
                        allowPaging: cuotas.length > 5,
                        pageSettings: {
                            pageSize: 5,
                            pageSizes: [5, 10, 20]
                        },
                        width: '100%',
                        height: 'auto'
                    });
                    
                    childGrid.appendTo(childContainer);
                    
                    // Configurar eventos de checkboxes después de renderizar
                    setTimeout(() => {
                        this.configurarCheckboxes(childContainer);
                    }, 100);
                }
            }
        };
        
        // Inyectar módulo DetailRow si no está inyectado
        if (ej.grids && ej.grids.DetailRow) {
            ej.grids.Grid.Inject(ej.grids.DetailRow);
        }
        
        this.grid = new ej.grids.Grid(gridConfig);
        this.grid.appendTo('#gridCuotasPendientesInteres');
        
        // Agregar botón para crear facturas
        this.agregarBotonCrearFacturas();
    }

    /**
     * Configurar eventos de checkboxes
     */
    configurarCheckboxes(container) {
        const checkboxes = container.querySelectorAll('.checkbox-cuota');
        checkboxes.forEach(checkbox => {
            checkbox.addEventListener('change', (e) => {
                const loanNumber = e.target.getAttribute('data-loan-number');
                const quotaNumber = parseInt(e.target.getAttribute('data-quota-number'));
                const isChecked = e.target.checked;
                
                // Actualizar el estado en los datos
                if (this.grid && this.grid.dataSource) {
                    const prestamo = this.grid.dataSource.find(p => p.loanNumber === loanNumber);
                    if (prestamo && prestamo.childRecords) {
                        const cuota = prestamo.childRecords.find(c => c.quotaNumber === quotaNumber);
                        if (cuota) {
                            cuota.selected = isChecked;
                        }
                    }
                }
            });
        });
    }

    /**
     * Agregar botón para crear facturas
     */
    agregarBotonCrearFacturas() {
        // Verificar si el botón ya existe y eliminarlo
        const botonExistente = document.getElementById('btnCrearFacturasInteres');
        if (botonExistente && botonExistente.parentNode) {
            botonExistente.parentNode.remove();
        }
        
        const gridContainer = document.getElementById('gridCuotasPendientesInteres');
        if (!gridContainer) {
            return;
        }
        
        const botonContainer = document.createElement('div');
        botonContainer.className = 'd-flex justify-content-end mb-3';
        botonContainer.id = 'containerBtnCrearFacturas';
        botonContainer.innerHTML = `
            <button type="button" class="btn btn-primary" id="btnCrearFacturasInteres">
                <i class="ki-duotone ki-file fs-2 me-2">
                    <span class="path1"></span>
                    <span class="path2"></span>
                </i>
                Crear Facturas de Interés
            </button>
        `;
        
        // Insertar antes del grid
        if (gridContainer && gridContainer.parentNode) {
            gridContainer.parentNode.insertBefore(botonContainer, gridContainer);
        }
        
        // Evento del botón
        const btnCrearFacturas = document.getElementById('btnCrearFacturasInteres');
        if (btnCrearFacturas) {
            btnCrearFacturas.addEventListener('click', () => {
                this.crearFacturasInteres();
            });
        }
    }

    /**
     * Crear facturas de interés para las cuotas seleccionadas
     */
    async crearFacturasInteres() {
        if (!this.grid || !this.grid.dataSource) {
            this.prestamosGrid.mostrarNotificacion('error', 'No hay datos disponibles', 'Error');
            return;
        }
        
        // Obtener todas las cuotas seleccionadas
        const cuotasSeleccionadas = [];
        this.grid.dataSource.forEach(prestamo => {
            if (prestamo.childRecords) {
                prestamo.childRecords.forEach(cuota => {
                    if (cuota.selected) {
                        cuotasSeleccionadas.push({
                            ...cuota,
                            loanNumber: prestamo.loanNumber,
                            cProveedor: prestamo.cProveedor,
                            nProveedor: prestamo.nProveedor
                        });
                    }
                });
            }
        });
        
        if (cuotasSeleccionadas.length === 0) {
            this.prestamosGrid.mostrarNotificacion('warning', 'Por favor seleccione al menos una cuota', 'Advertencia');
            return;
        }
        
        // Confirmar acción
        const confirm = await Swal.fire({
            title: '¿Crear facturas de interés?',
            html: `
                <p>Se crearán <strong>${cuotasSeleccionadas.length}</strong> factura(s) de interés sin pago.</p>
                <p class="text-muted">Esta acción creará las facturas en SAP para provisionar la contabilidad.</p>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, crear facturas',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#3085d6'
        });
        
        if (!confirm.isConfirmed) {
            return;
        }
        
        // Mostrar loading
        const loadingSwal = Swal.fire({
            title: 'Creando facturas...',
            html: `Procesando ${cuotasSeleccionadas.length} factura(s)`,
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        const resultados = {
            exitosas: [],
            fallidas: []
        };
        
        // Crear facturas una por una
        for (const cuota of cuotasSeleccionadas) {
            try {
                // Obtener el número de pago basado en paymentsCount (siguiente pago)
                const numeroPago = (cuota.paymentsCount || 0) + 1;
                
                // Construir mediumName: loanNumber-cuota-pago-IPM
                const mediumName = `${cuota.loanNumber}-${String(cuota.quotaNumber).padStart(2, '0')}-${numeroPago}-IPM`;
                
                // Calcular fechas basándose en la fecha de vencimiento y los días de la cuota
                const fechaVencimiento = cuota.dueDate ? new Date(cuota.dueDate) : new Date();
                const fechaFinal = new Date(fechaVencimiento);
                fechaFinal.setHours(0, 0, 0, 0);
                
                // Calcular fechaInicial: fechaFinal menos los días de la cuota
                const dias = parseInt(cuota.days) || 30; // Por defecto 30 días si no viene
                const fechaInicial = new Date(fechaFinal);
                fechaInicial.setDate(fechaInicial.getDate() - dias);
                fechaInicial.setHours(0, 0, 0, 0);
                
                // Usar la fecha elegida en el modal (o hoy si no hay valor)
                const fechaCreacionInput = document.getElementById('fechaCreacionFacturasIPM');
                const fechaCreacionStr = fechaCreacionInput && fechaCreacionInput.value
                    ? fechaCreacionInput.value
                    : new Date().toISOString().split('T')[0];
                const fechaCreacion = new Date(fechaCreacionStr + 'T12:00:00');
                
                const payload = {
                    loanNumber: cuota.loanNumber,
                    fechaPago: fechaCreacionStr,
                    montoInteres: parseFloat(cuota.interestPending) || 0,
                    fechaInicial: fechaInicial.toISOString().split('T')[0],
                    fechaFinal: fechaFinal.toISOString().split('T')[0],
                    mediumName: mediumName,
                    sellerPartyId: cuota.cProveedor || ''
                };
                
                const response = await fetch('apps/Prestamos/Maestro_Prestamos/api/pagos-endpoints.php?action=crearFacturaInteres', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(payload)
                });
                
                const result = await response.json();
                
                if (result.success && result.data && result.data.invoiceId) {
                    const invoiceId = result.data.invoiceId;
                    
                    // Guardar la factura IPM en la base de datos
                    try {
                        const guardarResponse = await fetch('apps/Prestamos/Maestro_Prestamos/api/cuotas-pendientes-endpoints.php?action=guardarFacturaIPM', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                proveedorId: cuota.cProveedor || '',
                                prestamoId: cuota.loanNumber,
                                fecha: fechaCreacion.toISOString(),
                                nCuota: cuota.quotaNumber,
                                facturaId: invoiceId,
                                interes: parseFloat(cuota.interestPending) || 0,
                                company: cuota.company || '' // El backend usará el de la sesión si está vacío
                            })
                        });
                        
                        if (!guardarResponse.ok) {
                            console.warn(`Factura ${invoiceId} creada pero no se pudo guardar en BD`);
                        }
                    } catch (guardarError) {
                        console.warn('Error al guardar factura IPM en BD:', guardarError);
                        // No agregar a fallidas porque la factura sí se creó en SAP
                    }
                    
                    resultados.exitosas.push({
                        loanNumber: cuota.loanNumber,
                        quotaNumber: cuota.quotaNumber,
                        invoiceId: invoiceId,
                        monto: cuota.interestPending
                    });
                } else {
                    resultados.fallidas.push({
                        loanNumber: cuota.loanNumber,
                        quotaNumber: cuota.quotaNumber,
                        error: result.message || 'Error desconocido',
                        monto: cuota.interestPending
                    });
                }
            } catch (error) {
                resultados.fallidas.push({
                    loanNumber: cuota.loanNumber,
                    quotaNumber: cuota.quotaNumber,
                    error: error.message,
                    monto: cuota.interestPending
                });
            }
        }
        
        // Cerrar loading
        Swal.close();
        
        // Mostrar resultados
        let mensaje = '';
        if (resultados.exitosas.length > 0) {
            mensaje += `<p class="text-success"><strong>${resultados.exitosas.length} factura(s) creada(s) exitosamente:</strong></p><ul>`;
            resultados.exitosas.forEach(r => {
                mensaje += `<li>Préstamo ${r.loanNumber} - Cuota ${r.quotaNumber}: ${r.invoiceId} (${this.formatearMoneda(r.monto)})</li>`;
            });
            mensaje += '</ul>';
        }
        
        if (resultados.fallidas.length > 0) {
            mensaje += `<p class="text-danger mt-3"><strong>${resultados.fallidas.length} factura(s) fallida(s):</strong></p><ul>`;
            resultados.fallidas.forEach(r => {
                mensaje += `<li>Préstamo ${r.loanNumber} - Cuota ${r.quotaNumber}: ${r.error}</li>`;
            });
            mensaje += '</ul>';
        }
        
        await Swal.fire({
            title: resultados.fallidas.length === 0 ? '¡Éxito!' : 'Proceso completado',
            html: mensaje,
            icon: resultados.fallidas.length === 0 ? 'success' : 'warning',
            confirmButtonText: 'OK',
            width: '600px'
        });
        
        // Recargar datos si hubo éxito
        if (resultados.exitosas.length > 0) {
            const mes = document.getElementById('filtroMes').value;
            const anio = document.getElementById('filtroAnio').value;
            if (mes && anio) {
                await this.buscarCuotasPendientes();
            }
        }
    }

    /**
     * Formatear moneda
     */
    formatearMoneda(valor) {
        return new Intl.NumberFormat('es-HN', {
            style: 'currency',
            currency: 'HNL',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(valor);
    }
}

