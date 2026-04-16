/**
 * Módulo de Configuración General - Préstamos
 * Versión: 1.0.0
 * 
 * Este archivo maneja la funcionalidad de configuración de parámetros del sistema
 */

class ConfiguracionGeneral {
    constructor() {
        this.bancosGrid = null;
        this.tiposCuotaGrid = null;
        this.lineasCreditoGrid = null;
        this.condicionesGrid = null;
        this.registroActual = null;
        this.modoEdicion = false;
        this.apiBaseUrl = 'apps/Prestamos/Configuracion_General/api/configuracion-endpoints.php';
        this.isProcessing = false; // Estado para evitar múltiples envíos
        this.isLoadingSapCuentas = false; // Estado para evitar múltiples cargas de cuentas SAP
        this.permissions = {
            bancos: { canCreate: false, canEdit: false },
            tiposCuota: { canCreate: false, canEdit: false },
            lineasCredito: { canCreate: false, canEdit: false },
            condiciones: { canCreate: false, canEdit: false }
        };
        this.init();
    }

    /**
     * Inicializar el módulo
     */
    init() {
        // Verificar que los elementos del grid existan
        const bancosGridElement = document.getElementById('bancosGrid');
        const tiposCuotaGridElement = document.getElementById('tiposCuotaGrid');
        const lineasCreditoGridElement = document.getElementById('lineasCreditoGrid');
        const condicionesGridElement = document.getElementById('condicionesGrid');

        if (!bancosGridElement || !tiposCuotaGridElement || !lineasCreditoGridElement || !condicionesGridElement) {
            console.error('Elementos del grid no encontrados. Esperando...');
            setTimeout(() => this.init(), 200);
            return;
        }

        this.createBancosGrid();
        this.createTiposCuotaGrid();
        this.createLineasCreditoGrid();
        this.createCondicionesGrid();
        
        // Cargar cuentas SAP al inicio (se usa en el modal de bancos)
        this.loadSapCuentasBancarias();
        
        // Configurar eventos de los modales
        this.setupModalEvents();
        
        // Cargar permisos y luego cargar datos (los datos necesitan los permisos para agregar canEdit)
        this.setupPermissions().then(() => {
            // Cargar datos después de que los permisos estén configurados
            this.loadBancosData();
            this.loadTiposCuotaData();
            this.loadLineasCreditoData();
            this.loadCondicionesData();
        });
    }

    /**
     * Crear grid de bancos
     */
    createBancosGrid() {
        const gridConfig = {
            dataSource: [],
            columns: [
                {
                    field: 'id',
                    headerText: 'ID',
                    width: 80,
                    textAlign: 'Center'
                },
                {
                    field: 'nombre',
                    headerText: 'Nombre del Banco',
                    width: 200,
                    textAlign: 'Left'
                },
                {
                    field: 'activo',
                    headerText: 'Estado',
                    width: 100,
                    textAlign: 'Center',
                    template: this.getEstadoTemplate.bind(this)
                },
                {
                    field: 'acciones',
                    headerText: 'Acciones',
                    width: 80,
                    textAlign: 'Center',
                    template: this.getAccionesTemplate.bind(this, 'banco')
                }
            ],
            allowPaging: true,
            allowSorting: true,
            allowFiltering: true,
            pageSettings: {
                pageSize: 10,
                pageSizes: [5, 10, 15, 20]
            },
            filterSettings: {
                type: 'Menu'
            },
            sortSettings: {
                columns: [
                    { field: 'id', direction: 'Ascending' }
                ]
            },
            height: '100%',
            width: '100%'
        };

        this.bancosGrid = new ej.grids.Grid(gridConfig);
        this.bancosGrid.appendTo('#bancosGrid');
    }

    /**
     * Crear grid de tipos de cuota
     */
    createTiposCuotaGrid() {
        const gridConfig = {
            dataSource: [],
            columns: [
                {
                    field: 'id',
                    headerText: 'ID',
                    width: 80,
                    textAlign: 'Center'
                },
                {
                    field: 'nombre',
                    headerText: 'Tipo de Cuota',
                    width: 200,
                    textAlign: 'Left'
                },
                {
                    field: 'activo',
                    headerText: 'Estado',
                    width: 100,
                    textAlign: 'Center',
                    template: this.getEstadoTemplate.bind(this)
                },
                {
                    field: 'acciones',
                    headerText: 'Acciones',
                    width: 80,
                    textAlign: 'Center',
                    template: this.getAccionesTemplate.bind(this, 'tipoCuota')
                }
            ],
            allowPaging: true,
            allowSorting: true,
            allowFiltering: true,
            pageSettings: {
                pageSize: 10,
                pageSizes: [5, 10, 15, 20]
            },
            filterSettings: {
                type: 'Menu'
            },
            sortSettings: {
                columns: [
                    { field: 'id', direction: 'Ascending' }
                ]
            },
            height: '100%',
            width: '100%'
        };

        this.tiposCuotaGrid = new ej.grids.Grid(gridConfig);
        this.tiposCuotaGrid.appendTo('#tiposCuotaGrid');
    }

    /**
     * Crear grid de líneas de crédito
     */
    createLineasCreditoGrid() {
        const gridConfig = {
            dataSource: [],
            columns: [
                {
                    field: 'id',
                    headerText: 'ID',
                    width: 80,
                    textAlign: 'Center'
                },
                {
                    field: 'nombre',
                    headerText: 'Línea de Crédito',
                    width: 200,
                    textAlign: 'Left'
                },
                {
                    field: 'bancoNombre',
                    headerText: 'Banco',
                    width: 150,
                    textAlign: 'Left'
                },
                {
                    field: 'credito',
                    headerText: 'Crédito',
                    width: 120,
                    textAlign: 'Right',
                    template: (data) => {
                        return `L. ${parseFloat(data.credito || 0).toLocaleString('es-HN', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                        })}`;
                    }
                },
                {
                    field: 'activo',
                    headerText: 'Estado',
                    width: 100,
                    textAlign: 'Center',
                    template: this.getEstadoTemplate.bind(this)
                },
                {
                    field: 'acciones',
                    headerText: 'Acciones',
                    width: 80,
                    textAlign: 'Center',
                    template: this.getAccionesTemplate.bind(this, 'lineaCredito')
                }
            ],
            allowPaging: true,
            allowSorting: true,
            allowFiltering: true,
            pageSettings: {
                pageSize: 10,
                pageSizes: [5, 10, 15, 20]
            },
            filterSettings: {
                type: 'Menu'
            },
            sortSettings: {
                columns: [
                    { field: 'id', direction: 'Ascending' }
                ]
            },
            height: '100%',
            width: '100%'
        };

        this.lineasCreditoGrid = new ej.grids.Grid(gridConfig);
        this.lineasCreditoGrid.appendTo('#lineasCreditoGrid');
    }

    /**
     * Crear grid de condiciones
     */
    createCondicionesGrid() {
        const gridConfig = {
            dataSource: [],
            columns: [
                {
                    field: 'id',
                    headerText: 'ID',
                    width: 80,
                    textAlign: 'Center'
                },
                {
                    field: 'nombre',
                    headerText: 'Descripción',
                    width: 250,
                    textAlign: 'Left'
                },
                {
                    field: 'activo',
                    headerText: 'Estado',
                    width: 100,
                    textAlign: 'Center',
                    template: this.getEstadoTemplate.bind(this)
                },
                {
                    field: 'acciones',
                    headerText: 'Acciones',
                    width: 80,
                    textAlign: 'Center',
                    template: this.getAccionesTemplate.bind(this, 'condicion')
                }
            ],
            allowPaging: true,
            allowSorting: true,
            allowFiltering: true,
            pageSettings: {
                pageSize: 10,
                pageSizes: [5, 10, 15, 20]
            },
            filterSettings: {
                type: 'Menu'
            },
            sortSettings: {
                columns: [
                    { field: 'id', direction: 'Ascending' }
                ]
            },
            height: '100%',
            width: '100%'
        };

        this.condicionesGrid = new ej.grids.Grid(gridConfig);
        this.condicionesGrid.appendTo('#condicionesGrid');
    }

    /**
     * Cargar datos de bancos desde API
     */
    async loadBancosData() {
        try {
            const response = await this.makeApiCall('getBancos');
            if (response.success) {
                if (this.bancosGrid) {
                    const canEdit = this.permissions.bancos?.canEdit || false;
                    const dataWithPermissions = this.addCanEditToRecords(response.data || [], canEdit);
                    this.bancosGrid.dataSource = dataWithPermissions;
                    this.bancosGrid.refresh();
                } else {
                    console.error('bancosGrid no está inicializado');
                }
            } else {
                console.error('Error al cargar bancos:', response.message);
            }
        } catch (error) {
            console.error('Error al cargar bancos:', error);
        }
    }

    /**
     * Cargar datos de tipos de cuota desde API
     */
    async loadTiposCuotaData() {
        try {
            const response = await this.makeApiCall('getTiposCuota');
            if (response.success) {
                const canEdit = this.permissions.tiposCuota?.canEdit || false;
                const dataWithPermissions = this.addCanEditToRecords(response.data || [], canEdit);
                this.tiposCuotaGrid.dataSource = dataWithPermissions;
                this.tiposCuotaGrid.refresh();
            } else {
                console.error('Error al cargar tipos de cuota:', response.message);
            }
        } catch (error) {
            console.error('Error al cargar tipos de cuota:', error);
        }
    }

    /**
     * Cargar datos de líneas de crédito desde API
     */
    async loadLineasCreditoData() {
        try {
            const response = await this.makeApiCall('getLineasCredito');
            if (response.success) {
                const canEdit = this.permissions.lineasCredito?.canEdit || false;
                const dataWithPermissions = this.addCanEditToRecords(response.data || [], canEdit);
                this.lineasCreditoGrid.dataSource = dataWithPermissions;
                this.lineasCreditoGrid.refresh();
            } else {
                console.error('Error al cargar líneas de crédito:', response.message);
            }
        } catch (error) {
            console.error('Error al cargar líneas de crédito:', error);
        }
    }

    /**
     * Cargar datos de condiciones desde API
     */
    async loadCondicionesData() {
        try {
            const response = await this.makeApiCall('getCondiciones');
            if (response.success) {
                const canEdit = this.permissions.condiciones?.canEdit || false;
                const dataWithPermissions = this.addCanEditToRecords(response.data || [], canEdit);
                this.condicionesGrid.dataSource = dataWithPermissions;
                this.condicionesGrid.refresh();
            } else {
                console.error('Error al cargar condiciones:', response.message);
            }
        } catch (error) {
            console.error('Error al cargar condiciones:', error);
        }
    }

    /**
     * Cargar bancos en combobox
     */
    async loadBancosCombobox() {
        try {
            const response = await this.makeApiCall('getBancos');
            if (response.success) {
                const bancoSelect = document.getElementById('lineaCreditoBanco');
                if (bancoSelect) {
                    // Limpiar opciones existentes excepto la primera
                    bancoSelect.innerHTML = '<option value="">Seleccionar banco</option>';
                    
                    // Agregar bancos activos
                    response.data.forEach(banco => {
                        if (banco.activo) {
                            const option = document.createElement('option');
                            option.value = banco.id;
                            option.textContent = banco.nombre;
                            bancoSelect.appendChild(option);
                        }
                    });
                }
            } else {
                console.error('Error al cargar bancos para combobox:', response.message);
            }
        } catch (error) {
            console.error('Error al cargar bancos para combobox:', error);
        }
    }

    /**
     * Cargar cuentas SAP en combobox
     */
    async loadSapCuentasBancarias() {
        // Si ya se está cargando, no hacer nada
        if (this.isLoadingSapCuentas) {
            return;
        }

        this.isLoadingSapCuentas = true;
        const sapSelect = document.getElementById('bancoSapBankId');
        
        try {
            // Mostrar indicador de carga
            if (sapSelect) {
                sapSelect.disabled = true;
                sapSelect.innerHTML = '<option value="">Cargando cuentas SAP...</option>';
            }

            const response = await this.makeApiCall('getSapCuentasBancarias');
            if (response.success) {
                if (sapSelect) {
                    // Limpiar opciones existentes excepto la primera
                    sapSelect.innerHTML = '<option value="">Seleccionar cuenta SAP</option>';
                    
                    // Agregar cuentas SAP
                    response.data.forEach(cuenta => {
                        const option = document.createElement('option');
                        option.value = cuenta.value;
                        option.textContent = cuenta.text;
                        sapSelect.appendChild(option);
                    });
                    
                    sapSelect.disabled = false;
                }
            } else {
                console.error('Error al cargar cuentas SAP:', response.message);
                if (sapSelect) {
                    sapSelect.innerHTML = '<option value="">Error al cargar cuentas</option>';
                    sapSelect.disabled = false;
                }
            }
        } catch (error) {
            console.error('Error al cargar cuentas SAP:', error);
            if (sapSelect) {
                sapSelect.innerHTML = '<option value="">Error al cargar cuentas</option>';
                sapSelect.disabled = false;
            }
        } finally {
            this.isLoadingSapCuentas = false;
        }
    }

    /**
     * Template para el estado
     */
    getEstadoTemplate(data) {
        const activo = data.activo;
        const statusClass = activo ? 'activo' : 'inactivo';
        const statusText = activo ? 'Activo' : 'Inactivo';
        return `<span class="e-status-badge e-status-${statusClass}">${statusText}</span>`;
    }

    /**
     * Template para las acciones
     */
    getAccionesTemplate(tipo, data) {
        // Usar la propiedad canEdit que se agrega a cada registro
        const canEdit = data.canEdit !== undefined ? data.canEdit : false;
        
        if (!canEdit) {
            return '<span class="text-muted">Sin permiso</span>';
        }
        
        return `
            <button class="e-btn e-flat e-primary e-small" onclick="configuracionGeneral.editar${tipo.charAt(0).toUpperCase() + tipo.slice(1)}(${data.id})" title="Editar">
                <i class="e-icons e-edit"></i>
            </button>
        `;
    }
    
    /**
     * Agregar propiedad canEdit a los registros
     */
    addCanEditToRecords(records, canEdit) {
        if (!Array.isArray(records)) {
            return records;
        }
        return records.map(record => ({
            ...record,
            canEdit: canEdit
        }));
    }
    
    /**
     * Configurar permisos para los controles
     */
    async setupPermissions() {
        if (typeof permissionHelper === 'undefined' || !permissionHelper.loadPermissions) {
            return;
        }

        try {
            await permissionHelper.loadPermissions();
            
            // Verificar permisos para cada módulo
            this.permissions.bancos = {
                canCreate: await permissionHelper.canCreate('Configuracion General'),
                canEdit: await permissionHelper.canEdit('Configuracion General')
            };
            
            this.permissions.tiposCuota = {
                canCreate: await permissionHelper.canCreate('Configuracion General'),
                canEdit: await permissionHelper.canEdit('Configuracion General')
            };
            
            this.permissions.lineasCredito = {
                canCreate: await permissionHelper.canCreate('Configuracion General'),
                canEdit: await permissionHelper.canEdit('Configuracion General')
            };
            
            this.permissions.condiciones = {
                canCreate: await permissionHelper.canCreate('Configuracion General'),
                canEdit: await permissionHelper.canEdit('Configuracion General')
            };
            
            // Configurar botones de agregar
            this.setupAddButtons();
            
            // Refrescar grids para actualizar botones de editar
            this.refreshGrids();
        } catch (error) {
            console.error('Error al configurar permisos:', error);
        }
    }
    
    /**
     * Configurar botones de agregar según permisos
     */
    setupAddButtons() {
        const btnAgregarBanco = document.getElementById('btnAgregarBanco');
        const btnAgregarTipoCuota = document.getElementById('btnAgregarTipoCuota');
        const btnAgregarLineaCredito = document.getElementById('btnAgregarLineaCredito');
        const btnAgregarCondicion = document.getElementById('btnAgregarCondicion');
        
        if (btnAgregarBanco) {
            btnAgregarBanco.disabled = !this.permissions.bancos.canCreate;
            if (!this.permissions.bancos.canCreate) {
                btnAgregarBanco.title = 'No tienes permisos para crear bancos';
            }
        }
        
        if (btnAgregarTipoCuota) {
            btnAgregarTipoCuota.disabled = !this.permissions.tiposCuota.canCreate;
            if (!this.permissions.tiposCuota.canCreate) {
                btnAgregarTipoCuota.title = 'No tienes permisos para crear tipos de cuota';
            }
        }
        
        if (btnAgregarLineaCredito) {
            btnAgregarLineaCredito.disabled = !this.permissions.lineasCredito.canCreate;
            if (!this.permissions.lineasCredito.canCreate) {
                btnAgregarLineaCredito.title = 'No tienes permisos para crear líneas de crédito';
            }
        }
        
        if (btnAgregarCondicion) {
            btnAgregarCondicion.disabled = !this.permissions.condiciones.canCreate;
            if (!this.permissions.condiciones.canCreate) {
                btnAgregarCondicion.title = 'No tienes permisos para crear condiciones';
            }
        }
    }
    
    /**
     * Refrescar grids para actualizar botones de editar
     */
    refreshGrids() {
        if (this.bancosGrid) {
            this.bancosGrid.refresh();
        }
        if (this.tiposCuotaGrid) {
            this.tiposCuotaGrid.refresh();
        }
        if (this.lineasCreditoGrid) {
            this.lineasCreditoGrid.refresh();
        }
        if (this.condicionesGrid) {
            this.condicionesGrid.refresh();
        }
    }



    /**
     * Configurar eventos de los modales
     */
    setupModalEvents() {
        // Verificar que los elementos existan antes de agregar event listeners
        const btnAgregarBanco = document.getElementById('btnAgregarBanco');
        const btnAgregarTipoCuota = document.getElementById('btnAgregarTipoCuota');
        const btnAgregarLineaCredito = document.getElementById('btnAgregarLineaCredito');
        const btnAgregarCondicion = document.getElementById('btnAgregarCondicion');
        const btnGuardarBanco = document.getElementById('btnGuardarBanco');
        const btnGuardarTipoCuota = document.getElementById('btnGuardarTipoCuota');
        const btnGuardarLineaCredito = document.getElementById('btnGuardarLineaCredito');
        const btnGuardarCondicion = document.getElementById('btnGuardarCondicion');

        // Solo agregar event listeners si los elementos existen
        if (btnAgregarBanco) {
            btnAgregarBanco.addEventListener('click', () => this.agregarBanco());
        }
        if (btnAgregarTipoCuota) {
            btnAgregarTipoCuota.addEventListener('click', () => this.agregarTipoCuota());
        }
        if (btnAgregarLineaCredito) {
            btnAgregarLineaCredito.addEventListener('click', () => this.agregarLineaCredito());
        }
        if (btnGuardarBanco) {
            btnGuardarBanco.addEventListener('click', () => this.guardarBanco());
        }
        if (btnGuardarTipoCuota) {
            btnGuardarTipoCuota.addEventListener('click', () => this.guardarTipoCuota());
        }
        if (btnGuardarLineaCredito) {
            btnGuardarLineaCredito.addEventListener('click', () => this.guardarLineaCredito());
        }
        if (btnAgregarCondicion) {
            btnAgregarCondicion.addEventListener('click', () => this.agregarCondicion());
        }
        if (btnGuardarCondicion) {
            btnGuardarCondicion.addEventListener('click', () => this.guardarCondicion());
        }
        
        // Agregar método global para cerrar modal de notificación
        window.cerrarModalNotificacion = () => this.cerrarModalNotificacion();
        
        // Prevenir cierre accidental de modales durante procesamiento
        this.setupModalPrevention();
    }

    /**
     * Configurar prevención de cierre accidental de modales
     */
    setupModalPrevention() {
        const modals = ['modalBanco', 'modalTipoCuota', 'modalLineaCredito', 'modalCondicion'];
        
        modals.forEach(modalId => {
            const modalElement = document.getElementById(modalId);
            if (modalElement) {
                // Prevenir cierre con ESC durante procesamiento
                modalElement.addEventListener('keydown', (e) => {
                    if (e.key === 'Escape' && this.isProcessing) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                });
                
                // Prevenir cierre con click en backdrop durante procesamiento
                modalElement.addEventListener('click', (e) => {
                    if (e.target === modalElement && this.isProcessing) {
                        e.preventDefault();
                        e.stopPropagation();
                    }
                });
            }
        });
    }

    /**
     * Realizar llamada a API
     */
    async makeApiCall(action, data = null) {
        const url = `${this.apiBaseUrl}?action=${action}`;
        
        const options = {
            method: data ? 'POST' : 'GET',
            headers: {
                'Content-Type': 'application/json'
            }
        };

        if (data) {
            options.body = JSON.stringify(data);
        }

        try {
            const response = await fetch(url, options);
            const result = await response.json();
            
            // Si la respuesta no es exitosa, incluir el mensaje de error
            if (!response.ok) {
                return {
                    success: false,
                    message: result.message || `Error ${response.status}: ${response.statusText}`,
                    error: result
                };
            }
            
            return result;
        } catch (error) {
            throw new Error(`Error en llamada API: ${error.message}`);
        }
    }

    /**
     * Agregar banco
     */
    agregarBanco() {
        this.modoEdicion = false;
        this.registroActual = null;
        document.getElementById('modalBancoTitle').textContent = 'Agregar Banco';
        document.getElementById('formBanco').reset();
        document.getElementById('bancoActivo').checked = true;
        document.getElementById('bancoSapBankId').value = '';
        
        const modal = new bootstrap.Modal(document.getElementById('modalBanco'));
        modal.show();
    }

    /**
     * Editar banco
     */
    editarBanco(id) {
        this.modoEdicion = true;
        this.registroActual = id;
        
        // Buscar el registro en el grid
        const bancos = this.bancosGrid.dataSource;
        const banco = bancos.find(b => b.id === id);
        
        if (banco) {
            document.getElementById('modalBancoTitle').textContent = 'Editar Banco';
            document.getElementById('bancoNombre').value = banco.nombre;
            document.getElementById('bancoActivo').checked = banco.activo;
            
            // Seleccionar el valor de la cuenta SAP si existe
            if (banco.sapBankId) {
                document.getElementById('bancoSapBankId').value = banco.sapBankId;
            } else {
                document.getElementById('bancoSapBankId').value = '';
            }
            
            const modal = new bootstrap.Modal(document.getElementById('modalBanco'));
            modal.show();
        }
    }

    /**
     * Cerrar modal de banco
     */
    cerrarModalBanco() {
        const modalElement = document.getElementById('modalBanco');
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        }
        // Limpiar backdrop manualmente si es necesario
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
        // Remover clase modal-open del body
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    }

    /**
     * Guardar banco
     */
    async guardarBanco() {
        const form = document.getElementById('formBanco');
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        // Verificar si ya está procesando
        if (this.isProcessing) {
            return;
        }
        
        // Bloquear botones
        this.toggleProcessingState('modalBanco', true);
        
        try {
            const bancoData = {
                nombre: document.getElementById('bancoNombre').value,
                sapBankId: document.getElementById('bancoSapBankId').value,
                activo: document.getElementById('bancoActivo').checked
            };
            
            let response;
            
            if (this.modoEdicion && this.registroActual) {
                // Modo edición - actualizar
                bancoData.id = this.registroActual;
                response = await this.makeApiCall('updateBanco', bancoData);
                
                if (response.success) {
                    this.mostrarNotificacion('success', 'Banco actualizado exitosamente', 'Éxito');
                    this.cerrarModalYLimpiar('modalBanco');
                    this.loadBancosData(); // Recargar datos
                } else {
                    this.mostrarNotificacion('error', 'Error al actualizar banco: ' + response.message, 'Error');
                    this.toggleProcessingState('modalBanco', false); // Desbloquear en caso de error
                }
            } else {
                // Modo creación - crear nuevo
                response = await this.makeApiCall('createBanco', bancoData);
                
                if (response.success) {
                    this.mostrarNotificacion('success', 'Banco creado exitosamente', 'Éxito');
                    this.cerrarModalYLimpiar('modalBanco');
                    this.loadBancosData(); // Recargar datos
                } else {
                    this.mostrarNotificacion('error', 'Error al crear banco: ' + response.message, 'Error');
                    this.toggleProcessingState('modalBanco', false); // Desbloquear en caso de error
                }
            }
        } catch (error) {
            console.error('Error al guardar banco:', error);
            this.mostrarNotificacion('error', 'Error de conexión al guardar banco', 'Error de Conexión');
            this.toggleProcessingState('modalBanco', false); // Desbloquear en caso de error
        }
    }

    /**
     * Guardar tipo de cuota
     */
    async guardarTipoCuota() {
        const form = document.getElementById('formTipoCuota');
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        // Verificar si ya está procesando
        if (this.isProcessing) {
            return;
        }
        
        // Bloquear botones
        this.toggleProcessingState('modalTipoCuota', true);
        
        try {
            const tipoCuotaData = {
                nombre: document.getElementById('tipoCuotaNombre').value,
                activo: document.getElementById('tipoCuotaActivo').checked
            };
            
            let response;
            
            if (this.modoEdicion && this.registroActual) {
                // Modo edición - actualizar
                tipoCuotaData.id = this.registroActual;
                response = await this.makeApiCall('updateTipoCuota', tipoCuotaData);
                
                if (response.success) {
                    this.mostrarNotificacion('success', 'Tipo de cuota actualizado exitosamente', 'Éxito');
                    this.cerrarModalYLimpiar('modalTipoCuota');
                    this.loadTiposCuotaData(); // Recargar datos
                } else {
                    this.mostrarNotificacion('error', 'Error al actualizar tipo de cuota: ' + response.message, 'Error');
                    this.toggleProcessingState('modalTipoCuota', false); // Desbloquear en caso de error
                }
            } else {
                // Modo creación - crear nuevo
                response = await this.makeApiCall('createTipoCuota', tipoCuotaData);
                
                if (response.success) {
                    this.mostrarNotificacion('success', 'Tipo de cuota creado exitosamente', 'Éxito');
                    this.cerrarModalYLimpiar('modalTipoCuota');
                    this.loadTiposCuotaData(); // Recargar datos
                } else {
                    const errorMessage = response.message || response.error?.message || 'Error desconocido al crear tipo de cuota';
                    this.mostrarNotificacion('error', errorMessage, 'Error');
                    this.toggleProcessingState('modalTipoCuota', false); // Desbloquear en caso de error
                }
            }
        } catch (error) {
            console.error('Error al guardar tipo de cuota:', error);
            this.mostrarNotificacion('error', 'Error de conexión al guardar tipo de cuota', 'Error de Conexión');
            this.toggleProcessingState('modalTipoCuota', false); // Desbloquear en caso de error
        }
    }

    /**
     * Guardar línea de crédito
     */
    async guardarLineaCredito() {
        const form = document.getElementById('formLineaCredito');
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        // Verificar si ya está procesando
        if (this.isProcessing) {
            return;
        }
        
        // Bloquear botones
        this.toggleProcessingState('modalLineaCredito', true);
        
        try {
            const lineaCreditoData = {
                nombre: document.getElementById('lineaCreditoNombre').value,
                bancoId: parseInt(document.getElementById('lineaCreditoBanco').value) || 0,
                credito: parseFloat(document.getElementById('lineaCreditoCredito').value) || 0,
                activo: document.getElementById('lineaCreditoActivo').checked
            };
            
            let response;
            
            if (this.modoEdicion && this.registroActual) {
                // Modo edición - actualizar
                lineaCreditoData.id = this.registroActual;
                response = await this.makeApiCall('updateLineaCredito', lineaCreditoData);
                
                if (response.success) {
                    this.mostrarNotificacion('success', 'Línea de crédito actualizada exitosamente', 'Éxito');
                    this.cerrarModalYLimpiar('modalLineaCredito');
                    this.loadLineasCreditoData(); // Recargar datos
                } else {
                    this.mostrarNotificacion('error', 'Error al actualizar línea de crédito: ' + response.message, 'Error');
                    this.toggleProcessingState('modalLineaCredito', false); // Desbloquear en caso de error
                }
            } else {
                // Modo creación - crear nuevo
                response = await this.makeApiCall('createLineaCredito', lineaCreditoData);
                
                if (response.success) {
                    this.mostrarNotificacion('success', 'Línea de crédito creada exitosamente', 'Éxito');
                    this.cerrarModalYLimpiar('modalLineaCredito');
                    this.loadLineasCreditoData(); // Recargar datos
                } else {
                    this.mostrarNotificacion('error', 'Error al crear línea de crédito: ' + response.message, 'Error');
                    this.toggleProcessingState('modalLineaCredito', false); // Desbloquear en caso de error
                }
            }
        } catch (error) {
            console.error('Error al guardar línea de crédito:', error);
            this.mostrarNotificacion('error', 'Error de conexión al guardar línea de crédito', 'Error de Conexión');
            this.toggleProcessingState('modalLineaCredito', false); // Desbloquear en caso de error
        }
    }

    /**
     * Agregar condición
     */
    agregarCondicion() {
        this.modoEdicion = false;
        this.registroActual = null;
        
        const modalTitle = document.getElementById('modalCondicionTitle');
        const form = document.getElementById('formCondicion');
        const activoField = document.getElementById('condicionActivo');
        const modalElement = document.getElementById('modalCondicion');
        
        if (modalTitle && form && activoField && modalElement) {
            modalTitle.textContent = 'Agregar Condición';
            form.reset();
            activoField.checked = true;
            
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        } else {
            console.error('Elementos del modal de condición no encontrados');
            this.mostrarNotificacion('error', 'No se pueden cargar los elementos del formulario', 'Error del Sistema');
        }
    }

    /**
     * Editar condición
     */
    editarCondicion(id) {
        this.modoEdicion = true;
        this.registroActual = id;
        
        const condiciones = this.condicionesGrid.dataSource;
        const condicion = condiciones.find(c => c.id === id);
        
        if (condicion) {
            const modalTitle = document.getElementById('modalCondicionTitle');
            const nombreField = document.getElementById('condicionNombre');
            const activoField = document.getElementById('condicionActivo');
            const modalElement = document.getElementById('modalCondicion');
            
            if (modalTitle && nombreField && activoField && modalElement) {
                modalTitle.textContent = 'Editar Condición';
                nombreField.value = condicion.nombre;
                activoField.checked = condicion.activo;
                
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            } else {
                console.error('Elementos del modal de condición no encontrados');
                alert('Error: No se pueden cargar los elementos del formulario');
            }
        }
    }

    /**
     * Guardar condición
     */
    async guardarCondicion() {
        const form = document.getElementById('formCondicion');
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        // Verificar si ya está procesando
        if (this.isProcessing) {
            return;
        }
        
        // Bloquear botones
        this.toggleProcessingState('modalCondicion', true);
        
        try {
            const condicionData = {
                nombre: document.getElementById('condicionNombre').value,
                activo: document.getElementById('condicionActivo').checked
            };
            
            let response;
            
            if (this.modoEdicion && this.registroActual) {
                // Modo edición - actualizar
                condicionData.id = this.registroActual;
                response = await this.makeApiCall('updateCondicion', condicionData);
                
                if (response.success) {
                    this.mostrarNotificacion('success', 'Condición actualizada exitosamente', 'Éxito');
                    this.cerrarModalYLimpiar('modalCondicion');
                    this.loadCondicionesData(); // Recargar datos
                } else {
                    this.mostrarNotificacion('error', 'Error al actualizar condición: ' + response.message, 'Error');
                    this.toggleProcessingState('modalCondicion', false); // Desbloquear en caso de error
                }
            } else {
                // Modo creación - crear nuevo
                response = await this.makeApiCall('createCondicion', condicionData);
                
                if (response.success) {
                    this.mostrarNotificacion('success', 'Condición creada exitosamente', 'Éxito');
                    this.cerrarModalYLimpiar('modalCondicion');
                    this.loadCondicionesData(); // Recargar datos
                } else {
                    this.mostrarNotificacion('error', 'Error al crear condición: ' + response.message, 'Error');
                    this.toggleProcessingState('modalCondicion', false); // Desbloquear en caso de error
                }
            }
        } catch (error) {
            console.error('Error al guardar condición:', error);
            this.mostrarNotificacion('error', 'Error de conexión al guardar condición', 'Error de Conexión');
            this.toggleProcessingState('modalCondicion', false); // Desbloquear en caso de error
        }
    }

    /**
     * Cerrar modal de condición
     */
    cerrarModalCondicion() {
        const modalElement = document.getElementById('modalCondicion');
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        }
        // Limpiar backdrop manualmente si es necesario
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
        // Remover clase modal-open del body
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    }

    /**
     * Mostrar notificación unificada
     * @param {string} tipo - 'success', 'error', 'warning', 'info'
     * @param {string} mensaje - Mensaje a mostrar
     * @param {string} titulo - Título del modal (opcional)
     */
    mostrarNotificacion(tipo, mensaje, titulo = 'Notificación') {
        const modalElement = document.getElementById('modalNotificacion');
        const modalTitle = document.getElementById('modalNotificacionTitle');
        const modalHeader = document.getElementById('modalNotificacionHeader');
        const modalIcon = document.getElementById('modalNotificacionIcon');
        const modalMensaje = document.getElementById('modalNotificacionMensaje');

        // Configurar título
        modalTitle.textContent = titulo;

        // Configurar ícono y colores según el tipo
        let iconClass = '';
        let headerClass = '';
        
        switch (tipo) {
            case 'success':
                iconClass = 'fas fa-check-circle text-success';
                headerClass = 'bg-success text-white';
                break;
            case 'error':
                iconClass = 'fas fa-exclamation-circle text-danger';
                headerClass = 'bg-danger text-white';
                break;
            case 'warning':
                iconClass = 'fas fa-exclamation-triangle text-warning';
                headerClass = 'bg-warning text-dark';
                break;
            case 'info':
                iconClass = 'fas fa-info-circle text-info';
                headerClass = 'bg-info text-white';
                break;
            default:
                iconClass = 'fas fa-info-circle text-primary';
                headerClass = 'bg-primary text-white';
        }

        // Aplicar clases
        modalHeader.className = `modal-header ${headerClass}`;
        modalIcon.innerHTML = `<i class="${iconClass}" style="font-size: 3rem;"></i>`;
        
        // Configurar mensaje
        modalMensaje.textContent = mensaje;

        // Mostrar modal
        const modal = new bootstrap.Modal(modalElement);
        modal.show();
    }

    /**
     * Cerrar modal de notificación
     */
    cerrarModalNotificacion() {
        const modalElement = document.getElementById('modalNotificacion');
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        }
        // Limpiar backdrop manualmente si es necesario
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
        // Remover clase modal-open del body
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    }

    /**
     * Bloquear botones y mostrar estado de carga
     * @param {string} modalId - ID del modal
     * @param {boolean} isProcessing - Estado de procesamiento
     */
    toggleProcessingState(modalId, isProcessing) {
        this.isProcessing = isProcessing;
        
        const modal = document.getElementById(modalId);
        if (!modal) return;
        
        // Buscar botones de guardar y cancelar
        const btnGuardar = modal.querySelector('button[type="button"][id*="Guardar"]');
        const btnCancelar = modal.querySelector('button[type="button"][class*="btn-secondary"]');
        
        if (btnGuardar) {
            if (isProcessing) {
                btnGuardar.disabled = true;
                btnGuardar.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Procesando...';
            } else {
                btnGuardar.disabled = false;
                btnGuardar.innerHTML = 'Guardar';
            }
        }
        
        if (btnCancelar) {
            btnCancelar.disabled = isProcessing;
        }
    }

    /**
     * Cerrar modal y limpiar estado
     * @param {string} modalId - ID del modal
     */
    cerrarModalYLimpiar(modalId) {
        // Desbloquear botones
        this.toggleProcessingState(modalId, false);
        
        // Cerrar modal
        const modalElement = document.getElementById(modalId);
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        }
        
        // Limpiar backdrop manualmente si es necesario
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
        
        // Remover clase modal-open del body
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
        
        // Limpiar formulario
        const form = modalElement.querySelector('form');
        if (form) {
            form.reset();
        }
        
        // Resetear variables
        this.modoEdicion = false;
        this.registroActual = null;
    }

    /**
     * Agregar tipo de cuota
     */
    agregarTipoCuota() {
        this.modoEdicion = false;
        this.registroActual = null;
        
        const modalTitle = document.getElementById('modalTipoCuotaTitle');
        const form = document.getElementById('formTipoCuota');
        const activoField = document.getElementById('tipoCuotaActivo');
        const modalElement = document.getElementById('modalTipoCuota');
        
        if (modalTitle && form && activoField && modalElement) {
            modalTitle.textContent = 'Agregar Tipo de Cuota';
            form.reset();
            activoField.checked = true;
            
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        } else {
            console.error('Elementos del modal de tipo de cuota no encontrados');
            this.mostrarNotificacion('error', 'No se pueden cargar los elementos del formulario', 'Error del Sistema');
        }
    }

    /**
     * Editar tipo de cuota
     */
    editarTipoCuota(id) {
        this.modoEdicion = true;
        this.registroActual = id;
        
        const tiposCuota = this.tiposCuotaGrid.dataSource;
        const tipoCuota = tiposCuota.find(t => t.id === id);
        
        if (tipoCuota) {
            const modalTitle = document.getElementById('modalTipoCuotaTitle');
            const nombreField = document.getElementById('tipoCuotaNombre');
            const activoField = document.getElementById('tipoCuotaActivo');
            const modalElement = document.getElementById('modalTipoCuota');
            
            if (modalTitle && nombreField && activoField && modalElement) {
                modalTitle.textContent = 'Editar Tipo de Cuota';
                nombreField.value = tipoCuota.nombre;
                activoField.checked = tipoCuota.activo;
                
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            } else {
                console.error('Elementos del modal de tipo de cuota no encontrados');
                this.mostrarNotificacion('error', 'No se pueden cargar los elementos del formulario', 'Error del Sistema');
            }
        }
    }

    /**
     * Agregar línea de crédito
     */
    async agregarLineaCredito() {
        this.modoEdicion = false;
        this.registroActual = null;
        
        const modalTitle = document.getElementById('modalLineaCreditoTitle');
        const form = document.getElementById('formLineaCredito');
        const activoField = document.getElementById('lineaCreditoActivo');
        const modalElement = document.getElementById('modalLineaCredito');
        
        if (modalTitle && form && activoField && modalElement) {
            modalTitle.textContent = 'Agregar Línea de Crédito';
            form.reset();
            activoField.checked = true;
            
            // Cargar bancos en el combobox
            await this.loadBancosCombobox();
            
            const modal = new bootstrap.Modal(modalElement);
            modal.show();
        } else {
            console.error('Elementos del modal de línea de crédito no encontrados');
            this.mostrarNotificacion('error', 'No se pueden cargar los elementos del formulario', 'Error del Sistema');
        }
    }

    /**
     * Editar línea de crédito
     */
    async editarLineaCredito(id) {
        this.modoEdicion = true;
        this.registroActual = id;
        
        const lineasCredito = this.lineasCreditoGrid.dataSource;
        const lineaCredito = lineasCredito.find(l => l.id === id);
        
        if (lineaCredito) {
            const modalTitle = document.getElementById('modalLineaCreditoTitle');
            const nombreField = document.getElementById('lineaCreditoNombre');
            const creditoField = document.getElementById('lineaCreditoCredito');
            const activoField = document.getElementById('lineaCreditoActivo');
            const bancoField = document.getElementById('lineaCreditoBanco');
            const modalElement = document.getElementById('modalLineaCredito');
            
            if (modalTitle && nombreField && creditoField && activoField && bancoField && modalElement) {
                modalTitle.textContent = 'Editar Línea de Crédito';
                nombreField.value = lineaCredito.nombre;
                creditoField.value = lineaCredito.credito || 0;
                activoField.checked = lineaCredito.activo;
                
                // Cargar bancos en el combobox y seleccionar el banco actual
                await this.loadBancosCombobox();
                bancoField.value = lineaCredito.bancoId || '';
                
                const modal = new bootstrap.Modal(modalElement);
                modal.show();
            } else {
                console.error('Elementos del modal de línea de crédito no encontrados');
                alert('Error: No se pueden cargar los elementos del formulario');
            }
        }
    }

    /**
     * Cerrar modal de tipo de cuota
     */
    cerrarModalTipoCuota() {
        const modalElement = document.getElementById('modalTipoCuota');
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        }
        // Limpiar backdrop manualmente si es necesario
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
        // Remover clase modal-open del body
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    }

    /**
     * Cerrar modal de línea de crédito
     */
    cerrarModalLineaCredito() {
        const modalElement = document.getElementById('modalLineaCredito');
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) {
            modal.hide();
        }
        // Limpiar backdrop manualmente si es necesario
        const backdrop = document.querySelector('.modal-backdrop');
        if (backdrop) {
            backdrop.remove();
        }
        // Remover clase modal-open del body
        document.body.classList.remove('modal-open');
        document.body.style.overflow = '';
        document.body.style.paddingRight = '';
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Esperar un poco más para asegurar que todos los elementos estén disponibles
        setTimeout(() => {
            window.configuracionGeneral = new ConfiguracionGeneral();
        }, 100);
    } catch (error) {
        console.error('Error al inicializar ConfiguracionGeneral:', error);
    }
});
