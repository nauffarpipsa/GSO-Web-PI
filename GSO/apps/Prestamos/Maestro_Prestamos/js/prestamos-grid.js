/**
 * DataGrid de Préstamos - Syncfusion Essential JS 2
 * Módulo: Maestro de Préstamos
 * Versión: 1.0.0
 * 
 * Este archivo maneja toda la funcionalidad del DataGrid de préstamos
 */

class PrestamosDataGrid {
    constructor() {
        this.grid = null;
        this.dataSource = [];
        this.amortizacionGrid = null;
        this.amortizacionDataSource = [];
        this.prestamoActual = null; // Almacenar datos del préstamo actual para usar en pagos
        this.pagosManager = null; // Módulo de pagos
        this.cuotasPendientesManager = null; // Módulo de cuotas pendientes de interés
        this.init();
    }

    /**
     * Configurar controles dependientes de permisos
     */
    async setupPermissionControls() {
        if (typeof permissionHelper === 'undefined' || !permissionHelper.loadPermissions) {
            return;
        }

        try {
            await permissionHelper.loadPermissions();
            const canEdit = await permissionHelper.canEdit('Maestro Prestamos');
            const btnGuardar = document.getElementById('btnGuardarEdicion');
            if (btnGuardar) {
                btnGuardar.disabled = !canEdit;
                if (!canEdit) {
                    btnGuardar.title = 'No tienes permisos para editar préstamos';
                } else {
                    btnGuardar.removeAttribute('title');
                }
            }
        } catch (error) {
            console.error('Error al configurar controles según permisos:', error);
        }
    }

    /**
     * Inicializar el DataGrid
     */
    async init() {
        // Asegurar que el combobox de banco tenga la opción por defecto inmediatamente
        const bancoSelect = document.getElementById('editBanco');
        if (bancoSelect) {
            // Si no tiene opciones o la primera opción no es la por defecto, agregarla
            if (bancoSelect.options.length === 0 || bancoSelect.options[0].value !== '') {
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = 'Seleccionar banco...';
                bancoSelect.insertBefore(defaultOption, bancoSelect.firstChild);
            }
        }
        
        await this.loadData();
        this.createGrid();
        this.bindEvents();
        await this.setupPermissionControls();
        this.setupCatalogos();
        
        // Inicializar módulo de pagos
        if (typeof PagosManager !== 'undefined') {
            this.pagosManager = new PagosManager(this);
        }
        
        // Inicializar módulo de cuotas pendientes de interés
        if (typeof CuotasPendientesManager !== 'undefined') {
            this.cuotasPendientesManager = new CuotasPendientesManager(this);
        }
    }
    
    /**
     * Configurar catálogos y eventos de comboboxes
     */
    async setupCatalogos() {
        // Asegurar que el combobox de banco tenga la opción por defecto desde el inicio
        const bancoSelect = document.getElementById('editBanco');
        if (bancoSelect) {
            // Si no tiene opciones o no tiene la opción por defecto, agregarla
            const hasDefaultOption = bancoSelect.querySelector('option[value=""]');
            if (!hasDefaultOption) {
                const defaultOption = document.createElement('option');
                defaultOption.value = '';
                defaultOption.textContent = 'Seleccionar banco...';
                bancoSelect.insertBefore(defaultOption, bancoSelect.firstChild);
            }
        }
        
        // Cargar catálogos y llenar comboboxes
        if (typeof catalogosLoader !== 'undefined') {
            try {
                await this.cargarCatalogosEnComboboxes();
                this.setupBancoChangeListener();
            } catch (error) {
                console.error('Error al configurar catálogos:', error);
                // En caso de error, asegurar que al menos tenga la opción por defecto
                if (bancoSelect) {
                    const hasDefaultOption = bancoSelect.querySelector('option[value=""]');
                    if (!hasDefaultOption) {
                        bancoSelect.innerHTML = '<option value="">Seleccionar banco...</option>';
                    }
                }
            }
            } else {
            // Si catalogosLoader no está disponible, asegurar que tenga la opción por defecto
            if (bancoSelect) {
                const hasDefaultOption = bancoSelect.querySelector('option[value=""]');
                if (!hasDefaultOption) {
                    bancoSelect.innerHTML = '<option value="">Seleccionar banco...</option>';
                }
            }
        }
    }
    
    /**
     * Cargar catálogos en los comboboxes
     */
    async cargarCatalogosEnComboboxes() {
        if (typeof catalogosLoader === 'undefined') {
            return;
        }
        
        try {
            const catalogos = await catalogosLoader.cargarCatalogos();
            
            // Cargar bancos
            const bancoSelect = document.getElementById('editBanco');
            if (bancoSelect) {
                // Primero asegurar que tenga la opción por defecto
                // Si ya existe una opción con value="", mantener su texto, sino crear una nueva
                let defaultOptionText = 'Seleccionar banco...';
                const existingDefault = bancoSelect.querySelector('option[value=""]');
                if (existingDefault) {
                    defaultOptionText = existingDefault.textContent || 'Seleccionar banco...';
                }
                
                // Limpiar y establecer la opción por defecto
                bancoSelect.innerHTML = `<option value="">${defaultOptionText}</option>`;
                bancoSelect.selectedIndex = 0; // Asegurar que la primera opción esté seleccionada
                
                if (catalogos.bancos && catalogos.bancos.length > 0) {
                    // Llenar con los bancos
                    catalogos.bancos.forEach(banco => {
                        const option = document.createElement('option');
                        option.value = banco.bank_id;
                        option.textContent = banco.bank_name;
                        bancoSelect.appendChild(option);
                    });
                }
            }
            
            // Cargar tipos de cuota
            if (catalogos.tiposCuota) {
                const tipoCuotaSelect = document.getElementById('editTipoCuota');
                if (tipoCuotaSelect) {
                    tipoCuotaSelect.innerHTML = '<option value="">Seleccionar tipo...</option>';
                    catalogos.tiposCuota.forEach(tipo => {
                        const option = document.createElement('option');
                        option.value = tipo.id;
                        option.textContent = tipo.description;
                        tipoCuotaSelect.appendChild(option);
                    });
                }
            }
            
            // Cargar condiciones
            if (catalogos.condiciones) {
                const condicionSelect = document.getElementById('editCondicion');
                if (condicionSelect) {
                    condicionSelect.innerHTML = '<option value="">Seleccionar condición...</option>';
                    catalogos.condiciones.forEach(condicion => {
                        const option = document.createElement('option');
                        option.value = condicion.id;
                        option.textContent = condicion.descripcion;
                        condicionSelect.appendChild(option);
                    });
                }
            }
            
            // Las líneas de crédito se cargarán cuando se seleccione un banco
            
        } catch (error) {
            console.error('Error al cargar catálogos:', error);
        }
    }

    /**
     * Configurar listener para cambio de banco
     */
    setupBancoChangeListener() {
        const bancoSelect = document.getElementById('editBanco');
        const lineaCreditoSelect = document.getElementById('editLineaCredito');
        
        if (!bancoSelect || !lineaCreditoSelect) {
            return;
        }

        bancoSelect.addEventListener('change', async (e) => {
            const bankId = e.target.value;
            
            // Limpiar y deshabilitar línea de crédito
            lineaCreditoSelect.innerHTML = '<option value="">Seleccione primero un banco...</option>';
            lineaCreditoSelect.disabled = true;
            
            if (!bankId) {
                return;
            }
            
            // Cargar líneas de crédito del banco seleccionado
            try {
                if (typeof catalogosLoader === 'undefined') {
                    return;
                }
                
                const catalogos = await catalogosLoader.cargarCatalogos();
                
                if (catalogos.lineasCredito) {
                    // Filtrar líneas de crédito por bank_id
                    const lineasFiltradas = catalogos.lineasCredito.filter(linea => {
                        return linea.bank_id == bankId;
                    });
                    
                    if (lineasFiltradas.length > 0) {
                        // Habilitar y llenar el select
                        lineaCreditoSelect.disabled = false;
                        lineaCreditoSelect.innerHTML = '<option value="">Seleccionar línea...</option>';
                        
                        lineasFiltradas.forEach(linea => {
                            const option = document.createElement('option');
                            option.value = linea.id;
                            option.textContent = linea.line_Description;
                            lineaCreditoSelect.appendChild(option);
                        });
                    } else {
                        lineaCreditoSelect.innerHTML = '<option value="">No hay líneas de crédito disponibles</option>';
                    }
                }
            } catch (error) {
                console.error('Error al cargar líneas de crédito:', error);
                lineaCreditoSelect.innerHTML = '<option value="">Error al cargar líneas de crédito</option>';
            }
        });
    }

    /**
     * Cargar datos de préstamos desde API
     */
    async loadData() {
        try {
            const response = await this.makeApiCall('getPrestamos');
            
            if (response.success) {
                this.dataSource = response.data;
            } else {
                this.mostrarNotificacion('error', 'Error al cargar préstamos: ' + response.message, 'Error');
            }
        } catch (error) {
            this.mostrarNotificacion('error', 'Error de conexión al cargar préstamos', 'Error de Conexión');
        }
    }

    /**
     * Realizar llamada a API
     */
    async makeApiCall(action) {
        const url = `apps/Prestamos/Maestro_Prestamos/api/prestamos-endpoints.php?action=${action}`;
        
        try {
            const response = await fetch(url);
            const result = await response.json();
            return result;
        } catch (error) {
            throw new Error(`Error en llamada API: ${error.message}`);
        }
    }

    /**
     * Mostrar notificación
     */
    mostrarNotificacion(tipo, mensaje, titulo = 'Notificación') {
        // Crear notificación temporal
        const notification = document.createElement('div');
        notification.className = `alert alert-${tipo === 'success' ? 'success' : tipo === 'error' ? 'danger' : 'info'} alert-dismissible fade show position-fixed`;
        notification.style.cssText = 'top: 20px; right: 20px; z-index: 9999; min-width: 300px;';
        notification.innerHTML = `
            <strong>${titulo}</strong><br>
            ${mensaje}
            <button type="button" class="btn-close" data-bs-dismiss="alert"></button>
        `;
        
        document.body.appendChild(notification);
        
        // Auto-remover después de 5 segundos
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove();
            }
        }, 5000);
    }

    /**
     * Crear el DataGrid
     */
    createGrid() {
        
        // Verificar que Syncfusion esté cargado
        if (typeof ej === 'undefined' || !ej.grids) {
            console.error('Syncfusion no está cargado correctamente');
            const container = document.getElementById('prestamosGrid');
            if (container) {
                container.innerHTML = `
                    <div class="alert alert-warning" role="alert">
                        <h4 class="alert-heading">Syncfusion no disponible</h4>
                        <p>La librería Syncfusion no se ha cargado correctamente.</p>
                        <hr>
                        <p class="mb-0">Por favor, verifica la conexión a internet y recarga la página.</p>
                    </div>
                `;
            }
            return;
        }
        
        // Verificar que el módulo Grid esté disponible
        if (typeof ej.grids.Grid === 'undefined') {
            console.error('Módulo Grid de Syncfusion no está disponible');
            const container = document.getElementById('prestamosGrid');
            if (container) {
                container.innerHTML = `
                    <div class="alert alert-warning" role="alert">
                        <h4 class="alert-heading">Módulo Grid no disponible</h4>
                        <p>El módulo Grid de Syncfusion no se ha cargado correctamente.</p>
                        <hr>
                        <p class="mb-0">Por favor, recarga la página.</p>
                    </div>
                `;
            }
            return;
        }
        
        // Configuración completa del grid
        const gridConfig = {
            dataSource: this.dataSource,
            columns: this.getColumns(),
            allowPaging: true,
            allowSorting: true,
            allowFiltering: true,
            allowGrouping: true,
            allowReordering: true,
            allowResizing: true,
            allowTextWrap: true,
            showColumnChooser: true,
            toolbar: [],
            editSettings: {
                allowAdding: false,
                allowEditing: false,
                allowDeleting: false,
                mode: 'Dialog',
                showDeleteConfirmDialog: true
            },
            pageSettings: {
                pageSize: 10,
                pageSizes: [5, 10, 20, 50, 100]
            },
            filterSettings: {
                type: 'Menu'
            },
            searchSettings: {
                operator: 'contains',
                fields: ['prestamoId', 'proveedor', 'facturaId', 'fechaFactura'],
                key: ''
            },
            locale: 'es-ES',
            height: '100%',
            width: '100%',
            rowSelected: this.onRowSelected.bind(this),
            actionBegin: this.onActionBegin.bind(this),
            actionComplete: this.onActionComplete.bind(this),
            recordDoubleClick: this.onRecordDoubleClick.bind(this)
        };

        
        try {
            this.grid = new ej.grids.Grid(gridConfig);
            this.grid.appendTo('#prestamosGrid');
        } catch (error) {
            console.error('Error al crear el grid:', error);
            // Mostrar mensaje de error en el contenedor
            const container = document.getElementById('prestamosGrid');
            if (container) {
                container.innerHTML = `
                    <div class="alert alert-danger" role="alert">
                        <h4 class="alert-heading">Error al cargar la tabla</h4>
                        <p>No se pudo inicializar el DataGrid. Error: ${error.message}</p>
                        <hr>
                        <p class="mb-0">Por favor, recarga la página o contacta al administrador.</p>
                    </div>
                `;
            }
        }
    }

    /**
     * Obtener configuración de columnas
     */
    getColumns() {
        return [
            {
                field: 'prestamoId',
                headerText: '# Préstamo',
                width: 100,
                isPrimaryKey: true,
                validationRules: { required: true }
            },
            {
                field: 'proveedor',
                headerText: 'Proveedor',
                width: 170,
                validationRules: { required: true }
            },
            {
                field: 'facturaId',
                headerText: 'Factura ID',
                width: 110,
                template: (data) => {
                    return data.facturaId || '';
                }
            },
            {
                field: 'fechaFactura',
                headerText: 'Fecha Factura',
                width: 110,
                type: 'date',
                format: 'dd/MM/yyyy',
                template: (data) => {
                    if (data.fechaFactura) {
                        const fecha = new Date(data.fechaFactura);
                        return fecha.toLocaleDateString('es-HN');
                    }
                    return '';
                }
            },
            {
                field: 'fechaInicial',
                headerText: 'Fecha Inicial',
                width: 100,
                type: 'date',
                format: 'dd/MM/yyyy',
                template: (data) => {
                    if (data.fechaInicial) {
                        const fecha = new Date(data.fechaInicial);
                        return fecha.toLocaleDateString('es-HN');
                    }
                    return '';
                }
            },
            {
                field: 'fechaFinal',
                headerText: 'Fecha Final',
                width: 100,
                type: 'date',
                format: 'dd/MM/yyyy',
                template: (data) => {
                    if (data.fechaFinal) {
                        const fecha = new Date(data.fechaFinal);
                        return fecha.toLocaleDateString('es-HN');
                    }
                    return '';
                }
            },
            {
                field: 'tasa',
                headerText: 'Tasa (%)',
                width: 85,
                textAlign: 'Right',
                format: 'N2',
                template: (data) => {
                    return data.tasa ? `${data.tasa.toFixed(2)}%` : '0.00%';
                }
            },
            {
                field: 'plazo',
                headerText: 'Plazo',
                width: 85,
                textAlign: 'Center',
                template: (data) => {
                    return data.plazo ? `${data.plazo} meses` : '0 meses';
                }
            },
            {
                field: 'montoNeto',
                headerText: 'Monto Neto',
                width: 120,
                textAlign: 'Right',
                template: (data) => {
                    if (data.montoNeto) {
                        return new Intl.NumberFormat('es-HN', {
                            style: 'currency',
                            currency: 'HNL',
                            minimumFractionDigits: 2
                        }).format(data.montoNeto);
                    }
                    return 'L. 0.00';
                }
            },
            
        ];
    }

    /**
     * Template para la columna de condición
     */
    getCondicionTemplate(data) {
        const condicion = data.condicion;
        const statusClass = this.getStatusClass(condicion);
        return `<span class="e-status-badge e-status-${statusClass}">${condicion}</span>`;
    }

    /**
     * Obtener clase CSS para el estado
     */
    getStatusClass(condicion) {
        const statusMap = {
            'Revolvente': 'revolvente',
            'No Revolvente': 'no-revolvente',
            'Pagado': 'pagado',
            'Vencido': 'vencido',
            'Moroso': 'moroso'
        };
        return statusMap[condicion] || 'revolvente';
    }

    /**
     * Template para la columna de acciones
     */
    getAccionesTemplate(data) {
        return `
            <div class="e-actions">
                <!-- Acciones eliminadas - solo se usa edición completa -->
            </div>
        `;
    }

    /**
     * Evento cuando se selecciona una fila
     */
    onRowSelected(args) {
    }

    /**
     * Evento al completar una acción
     */
    onActionComplete(args) {
        if (args.requestType === 'save') {
            this.showNotification('Préstamo guardado exitosamente', 'success');
        }
    }

    /**
     * Evento al comenzar una acción
     */
    onActionBegin(args) {
        if (args.requestType === 'beginEdit') {
            // Obtener el registro seleccionado
            const selectedRow = this.grid.getSelectedRowIndexes()[0];
            if (selectedRow !== undefined) {
                const record = this.grid.getCurrentViewRecords()[selectedRow];
                this.editRecord(record.prestamoId);
                args.cancel = true; // Cancelar la edición nativa del grid
            }
        }
    }

    /**
     * Validar datos
     */
    validateData(data) {
        if (!data.proveedor || data.proveedor.trim() === '') {
            this.showNotification('El proveedor es requerido', 'error');
            return false;
        }
        
        if (!data.tasa || data.tasa <= 0) {
            this.showNotification('La tasa debe ser mayor a 0', 'error');
            return false;
        }
        
        if (!data.montoNeto || data.montoNeto <= 0) {
            this.showNotification('El monto neto debe ser mayor a 0', 'error');
            return false;
        }
        
        return true;
    }

    /**
     * Mostrar notificación
     */
    showNotification(message, type = 'info') {
        // Usar SweetAlert si está disponible, sino alert básico
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: type === 'success' ? '¡Éxito!' : 'Atención',
                text: message,
                icon: type,
                confirmButtonText: 'Aceptar'
            });
        } else {
            alert(message);
        }
    }

    /**
     * Edición completa - Abrir div de edición
     */
    editRecord(id) {
        const record = this.dataSource.find(item => item.prestamoId === id);
        if (record) {
            this.abrirEdicionCompleta(record);
        } else {
            this.mostrarNotificacion('error', 'Registro no encontrado', 'Error');
        }
    }

    /**
     * Abrir edición completa con slide
     */
    abrirEdicionCompleta(prestamo) {
        // Llenar el formulario con los datos del préstamo
        this.llenarFormularioEdicionCompleta(prestamo);
        
        // Mostrar el div de edición con animación
        this.mostrarEdicionCompleta();
    }

    /**
     * Mostrar div de edición completa
     */
    mostrarEdicionCompleta() {
        const tablaDiv = document.getElementById('tablaPrestamos');
        const edicionDiv = document.getElementById('edicionCompleta');
        
        // Primero mostrar el div de edición (slide in desde la derecha)
        edicionDiv.classList.remove('edicion-oculta');
        edicionDiv.classList.add('edicion-visible');
        
        // Luego ocultar la tabla (slide out hacia la izquierda)
        setTimeout(() => {
            tablaDiv.classList.add('edicion-activa');
        }, 100);
    }

    /**
     * Volver a la tabla
     */
    volverATabla() {
        const tablaDiv = document.getElementById('tablaPrestamos');
        const edicionDiv = document.getElementById('edicionCompleta');
        
        // Primero mostrar la tabla (slide in desde la izquierda)
        tablaDiv.classList.remove('edicion-activa');
        
        // Luego ocultar el div de edición (slide out hacia la derecha)
        setTimeout(() => {
            edicionDiv.classList.remove('edicion-visible');
            edicionDiv.classList.add('edicion-oculta');
        }, 100);
    }


    /**
     * Refrescar datos
     */
    refresh() {
        this.grid.refresh();
    }

    /**
     * Buscar en el grid
     */
    search(searchText) {
        this.grid.search(searchText);
    }

    /**
     * Exportar a Excel
     */
    exportToExcel() {
        this.grid.excelExport();
    }

    /**
     * Exportar a PDF
     */
    exportToPdf() {
        this.grid.pdfExport();
    }

    /**
     * Configurar event listeners
     */
    bindEvents() {
        const btnObtener = document.getElementById('btnObtenerPrestamo');
        if (btnObtener) {
            btnObtener.addEventListener('click', this.btnObtenerPrestamo.bind(this));
        }

        const btnRefresh = document.getElementById('btnRefresh');
        if (btnRefresh) {
            btnRefresh.addEventListener('click', this.btnRefresh.bind(this));
        }
        
        // Búsqueda en tiempo real
        this.setupRealTimeSearch();
        
        // Event listeners para edición completa
        this.setupCompleteEditListeners();
        
        // Reconfigurar evento de doble clic después de que el grid esté listo
        this.reconfigurarEventoDobleClic();
    }

    /**
     * Botón obtener préstamo
     */
    async btnObtenerPrestamo() {
        this.showNotification('Ejecutando proceso de obtención de préstamos...', 'info');
        
        try {
            // Llamar al endpoint de ejecución y esperar respuesta completa
            const result = await this.ejecutarProcesoPrestamos();
            
            // Verificar que el resultado indica éxito antes de continuar
            if (!result || (result.result && result.result.status !== 'completed')) {
                throw new Error('El proceso no se completó correctamente');
            }
            
            // Construir mensaje de éxito simplificado
            let successMessage = 'Proceso completado y datos actualizados';
            if (result && result.result && result.result.result) {
                const jobResult = result.result.result;
                const cantidadObtenida = jobResult.processed || jobResult.saved || 0;
                successMessage = `${cantidadObtenida} préstamo(s) obtenido(s) exitosamente`;
            }
            
            // Esperar un breve momento para asegurar que los datos se hayan guardado en la DB
            // El endpoint es síncrono pero puede haber un pequeño delay en la persistencia
            this.showNotification('Esperando confirmación de guardado...', 'info');
            await new Promise(resolve => setTimeout(resolve, 1000)); // 1 segundo de delay
            
            // Después de ejecutar y esperar, refrescar los datos
            await this.loadData();
            
            // Refrescar el grid
            if (this.grid) {
                this.grid.dataSource = this.dataSource;
                this.grid.refresh();
            }
            
            this.showNotification(successMessage, 'success');
        } catch (error) {
            console.error('Error al ejecutar proceso de préstamos:', error);
            this.showNotification('Error al ejecutar proceso: ' + error.message, 'error');
        }
    }

    /**
     * Actualizar préstamo
     */
    async actualizarPrestamo(prestamoId, datos) {
        try {
            const response = await fetch('apps/Prestamos/Maestro_Prestamos/api/prestamos-endpoints.php?action=updatePrestamo', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prestamo_id: prestamoId,
                    ...datos
                })
            });

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
            }

            const result = await response.json();
            
            if (!result.success) {
                throw new Error(result.message || 'Error al actualizar el préstamo');
            }
            
            return result;
        } catch (error) {
            console.error('Error al actualizar préstamo:', error);
            throw error;
        }
    }

    /**
     * Ejecutar proceso de obtención de préstamos
     */
    async ejecutarProcesoPrestamos() {
        try {
            // Realizar la petición y esperar la respuesta completa
            const response = await fetch('apps/Prestamos/Maestro_Prestamos/api/prestamos-endpoints.php?action=ejecutarProceso', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                }
            });

            // Verificar que la respuesta HTTP sea exitosa
            if (!response.ok) {
                const errorText = await response.text();
                let errorMessage = `Error HTTP ${response.status}: ${response.statusText}`;
                try {
                    const errorJson = JSON.parse(errorText);
                    errorMessage = errorJson.message || errorMessage;
                } catch (e) {
                    // Si no es JSON, usar el texto tal cual
                }
                throw new Error(errorMessage);
            }

            // Esperar y parsear la respuesta JSON completa
            const result = await response.json();
            
            // Verificar que el resultado indique éxito
            if (!result.success) {
                // Construir mensaje de error más descriptivo
                let errorMessage = result.message || 'Error al ejecutar el proceso';
                
                // Si hay información adicional en result.data o result.result, agregarla
                if (result.data && result.data.result) {
                    const jobResult = result.data.result;
                    if (jobResult.error) {
                        errorMessage += ': ' + jobResult.error;
                    }
                }
                
                throw new Error(errorMessage);
            }
            
            // Verificar que el job realmente se completó exitosamente
            const jobData = result.data || result;
            if (jobData.result && jobData.result.status === 'failed') {
                const errorMsg = jobData.result.error || 'El job falló durante la ejecución';
                throw new Error('Error en la ejecución del job: ' + errorMsg);
            }
            
            // Si la respuesta es exitosa, retornar los datos completos para mostrar información detallada
            return jobData;
        } catch (error) {
            console.error('Error al ejecutar proceso de préstamos:', error);
            throw error;
        }
    }

    /**
     * Botón refrescar
     */
    async btnRefresh() {
        this.showNotification('Refrescando datos...', 'info');
        
        try {
            // Recargar datos desde la API
            await this.loadData();
            
            // Refrescar el grid
            if (this.grid) {
                this.grid.dataSource = this.dataSource;
                this.grid.refresh();
            }
            
            this.showNotification('Datos refrescados exitosamente', 'success');
        } catch (error) {
            console.error('Error al refrescar datos:', error);
            this.showNotification('Error al refrescar datos', 'error');
        }
    }

    /**
     * Configurar búsqueda en tiempo real
     */
    setupRealTimeSearch() {
        const searchInput = document.getElementById('prestamoSearch');
        let searchTimeout;

        searchInput.addEventListener('input', (e) => {
            const searchTerm = e.target.value.toLowerCase().trim();
            
            // Limpiar timeout anterior para evitar múltiples búsquedas
            clearTimeout(searchTimeout);
            
            // Mostrar indicador de búsqueda
            this.showSearchIndicator(true);
            
            // Búsqueda con delay de 300ms para mejor performance
            searchTimeout = setTimeout(() => {
                this.performSearch(searchTerm);
                this.showSearchIndicator(false);
            }, 300);
        });

        // Limpiar búsqueda al hacer clic en el botón X (si existe)
        searchInput.addEventListener('search', (e) => {
            if (e.target.value === '') {
                this.performSearch('');
                this.showSearchIndicator(false);
            }
        });

        // Búsqueda al presionar Enter
        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                clearTimeout(searchTimeout);
                const searchTerm = e.target.value.toLowerCase().trim();
                this.performSearch(searchTerm);
                this.showSearchIndicator(false);
            }
        });
    }

    /**
     * Mostrar/ocultar indicador de búsqueda
     */
    showSearchIndicator(show) {
        const searchInput = document.getElementById('prestamoSearch');
        
        if (show) {
            searchInput.classList.add('searching');
            searchInput.style.backgroundImage = 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'16\' height=\'16\' fill=\'%236c757d\' class=\'bi bi-arrow-clockwise\' viewBox=\'0 0 16 16\'%3E%3Cpath fill-rule=\'evenodd\' d=\'M8 3a5 5 0 1 0 4.546 2.914.5.5 0 0 1 .908-.417A6 6 0 1 1 8 2v1z\'/%3E%3Cpath d=\'M8 4.466V.534a.25.25 0 0 1 .41-.192l2.36 1.966c.12.1.12.284 0 .384L8.41 4.658A.25.25 0 0 1 8 4.466z\'/%3E%3C/svg%3E")';
            searchInput.style.backgroundRepeat = 'no-repeat';
            searchInput.style.backgroundPosition = 'right 10px center';
            searchInput.style.backgroundSize = '16px';
        } else {
            searchInput.classList.remove('searching');
            searchInput.style.backgroundImage = '';
        }
    }

    /**
     * Realizar búsqueda en el grid
     */
    performSearch(searchTerm) {
        if (!this.grid) return;

        if (searchTerm === '') {
            // Si no hay término de búsqueda, mostrar todos los registros
            this.grid.searchSettings.key = '';
            this.grid.searchSettings.operator = 'contains';
            this.grid.searchSettings.fields = ['prestamoId', 'proveedor', 'facturaId', 'fechaFactura'];
            this.grid.search('');
        } else {
            // Configurar búsqueda en múltiples campos
            this.grid.searchSettings.key = searchTerm;
            this.grid.searchSettings.operator = 'contains';
            this.grid.searchSettings.fields = ['prestamoId', 'proveedor', 'facturaId', 'fechaFactura'];
            this.grid.search(searchTerm);
        }
    }

    /**
     * Evento para obtener préstamo
     */
    onObtenerPrestamo() {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                title: 'Obtener Préstamo',
                text: '¿Desea obtener un nuevo préstamo?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33',
                confirmButtonText: 'Sí, obtener',
                cancelButtonText: 'Cancelar'
            }).then((result) => {
                if (result.isConfirmed) {
                    this.showNotification('Préstamo obtenido exitosamente', 'success');
                }
            });
        } else {
            if (confirm('¿Desea obtener un nuevo préstamo?')) {
                this.showNotification('Préstamo obtenido exitosamente', 'success');
            }
        }
    }

    /**
     * Configurar event listeners para edición completa
     */
    setupCompleteEditListeners() {
        // Event listeners para edición completa configurados aquí
    }

    /**
     * Evento al hacer doble clic en un registro
     */
    onRecordDoubleClick(args) {
        
        // Los datos pueden estar en args.data o args.rowData
        const recordData = args.data || args.rowData;
        
        if (args && recordData) {
            
            // Cancelar el evento nativo del grid para evitar que se abra el modal
            args.cancel = true;
            
            // Abrir nuestro slide de edición personalizado
            this.editRecord(recordData.prestamoId);
        } else {
        }
    }

    /**
     * Reconfigurar evento de doble clic
     */
    reconfigurarEventoDobleClic() {
        if (this.grid) {
            // Asegurar que el evento esté configurado correctamente
            this.grid.recordDoubleClick = this.onRecordDoubleClick.bind(this);
        }
    }

    /**
     * Llenar formulario de edición completa
     */
    async llenarFormularioEdicionCompleta(prestamo) {
        // Limpiar formulario antes de llenar con nuevos datos
        this.limpiarFormularioEdicion();
        
        // Configurar eventos del formulario
        this.configurarEventosFormularioEdicion();
        
        // Llenar los campos con los datos
        this.llenarCamposFormularioEdicion(prestamo);
        
        // Configurar el botón de guardar
        this.configurarBotonGuardar();
        
        // Cargar datos de amortización
        await this.cargarAmortizacion(prestamo.prestamoId);
    }

    /**
     * Configurar el botón de guardar
     */
    configurarBotonGuardar() {
        const btnGuardar = document.getElementById('btnGuardarEdicion');
        if (btnGuardar) {
            btnGuardar.addEventListener('click', () => {
                this.guardarEdicionCompleta();
            });
        }
    }



    /**
     * Configurar eventos del formulario de edición
     */
    configurarEventosFormularioEdicion() {
        // Evento para recalcular amortización cuando cambie la tasa
        const tasaElement = document.getElementById('editTasa');
        if (tasaElement) {
            tasaElement.addEventListener('change', () => {
                // Solo mostrar mensaje, no calcular automáticamente
                this.mostrarMensajeRecalculo();
            });
        }

        // Evento para el switch de plantilla Excel
        const switchExcel = document.getElementById('switchPlantillaExcel');
        if (switchExcel) {
            switchExcel.addEventListener('change', (e) => {
                this.toggleAreaCargarExcel(e.target.checked);
            });
        }

        // Evento para el switch de verificar préstamo
        const switchVerificar = document.getElementById('switchVerificar');
        if (switchVerificar) {
            switchVerificar.addEventListener('change', async (e) => {
                await this.confirmarYVerificarPrestamo(e.target, e.target.checked);
            });
        }
    }

    /**
     * Mostrar mensaje de que se necesita recalcular la amortización
     */
    mostrarMensajeRecalculo() {
        // Ocultar amortización actual
        this.ocultarAmortizacion();
        
        // Mostrar mensaje
        const sinAmortizacion = document.getElementById('sinAmortizacion');
        if (sinAmortizacion) {
            sinAmortizacion.innerHTML = `
                <i class="ki-duotone ki-information fs-3 me-2">
                    <span class="path1"></span>
                    <span class="path2"></span>
                    <span class="path3"></span>
                </i>
                <strong>Amortización desactualizada:</strong> La tasa ha cambiado. Guarde los cambios para recalcular la amortización.
            `;
        }
    }

    /**
     * Recalcular amortización cuando cambie la tasa
     */
    async recalcularAmortizacion() {
        try {
            // Obtener datos actuales del formulario
            const prestamo = this.obtenerDatosFormularioEdicion();
            
            if (!prestamo.prestamoId || !prestamo.tasa) {
                return;
            }

            // Calcular nueva amortización
            const calculoExitoso = await this.calcularAmortizacion(prestamo);
            
            if (calculoExitoso) {
                // Recargar datos de amortización
                await this.cargarAmortizacion(prestamo.prestamoId);
            }
        } catch (error) {
            console.error('Error al recalcular amortización:', error);
        }
    }

    /**
     * Obtener datos actuales del formulario de edición
     */
    obtenerDatosFormularioEdicion() {
        const montoElement = document.getElementById('editMontoTotal');
        const montoValue = montoElement?.value || '0';
        // Limpiar formato de moneda paso a paso
        let cleanedValue = montoValue;
        
        // Paso 1: Remover "L. " del inicio
        cleanedValue = cleanedValue.replace(/^L\.\s*/, '');
        
        // Paso 2: Remover comas
        cleanedValue = cleanedValue.replace(/,/g, '');
        
        // Paso 3: Remover .00 del final si existe
        cleanedValue = cleanedValue.replace(/\.00$/, '');
        
        const montoNeto = parseFloat(cleanedValue) || 0;
        
        return {
            prestamoId: document.getElementById('editId')?.value || '',
            montoNeto: montoNeto,
            tasa: parseFloat(document.getElementById('editTasa')?.value || 0),
            mesesGracia: parseInt(document.getElementById('editMesesGracia')?.value || 0),
            plazo: parseInt(document.getElementById('editPlazoTotal')?.value || 0),
            diaPago: parseInt(document.getElementById('editDiaPago')?.value || 0), // Si está vacío, enviar 0 para que la API lo calcule automáticamente
            diasDesembolso: parseInt(document.getElementById('editDiasDesembolso')?.value || 0), // Días de desembolso, 0 por defecto
            modoRedondeo: parseInt(document.getElementById('editModoRedondeo')?.value || 100), // Modo de redondeo: 100 (abajo) o 200 (arriba)
            tipoCuota: document.getElementById('editTipoCuota')?.value || '1',
            fechaInicial: document.getElementById('editFechaInicial')?.value || '',
            fechaFinal: document.getElementById('editFechaFinal')?.value || ''
        };
    }

    /**
     * Limpiar todos los campos del formulario de edición
     */
    limpiarFormularioEdicion() {
        // Limpiar todos los inputs
        const inputs = [
            'editId', 'editFacturaSAP', 'editProveedor', 'editTasa', 
            'editMesesGracia', 'editPlazoTotal', 'editFechaInicial', 'editFechaFinal', 
            'editMontoTotal', 'editSaldo', 'editObservaciones'
        ];
        
        inputs.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                element.value = '';
            }
        });

        // Restaurar valores por defecto para campos específicos
        const elementDiaPago = document.getElementById('editDiaPago');
        if (elementDiaPago) {
            elementDiaPago.value = '0';
        }

        const elementDiasDesembolso = document.getElementById('editDiasDesembolso');
        if (elementDiasDesembolso) {
            elementDiasDesembolso.value = '0';
        }

        // Restaurar modo de redondeo por defecto
        const elementModoRedondeo = document.getElementById('editModoRedondeo');
        if (elementModoRedondeo) {
            elementModoRedondeo.value = '100';
        }
        
        // Limpiar y reactivar todos los comboboxes
        const combos = ['editBanco', 'editLineaCredito', 'editCondicion', 'editTipoCuota'];
        combos.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                // Asegurar que tenga la opción por defecto antes de establecer el valor
                if (id === 'editBanco' && !element.querySelector('option[value=""]')) {
                    const defaultOption = document.createElement('option');
                    defaultOption.value = '';
                    defaultOption.textContent = 'Seleccionar banco...';
                    element.insertBefore(defaultOption, element.firstChild);
                } else if (id === 'editLineaCredito' && !element.querySelector('option[value=""]')) {
                    const defaultOption = document.createElement('option');
                    defaultOption.value = '';
                    defaultOption.textContent = 'Seleccione primero un banco...';
                    element.insertBefore(defaultOption, element.firstChild);
                } else if (id === 'editCondicion' && !element.querySelector('option[value=""]')) {
                    const defaultOption = document.createElement('option');
                    defaultOption.value = '';
                    defaultOption.textContent = 'Seleccionar condición...';
                    element.insertBefore(defaultOption, element.firstChild);
                } else if (id === 'editTipoCuota' && !element.querySelector('option[value=""]')) {
                    const defaultOption = document.createElement('option');
                    defaultOption.value = '';
                    defaultOption.textContent = 'Seleccionar tipo...';
                    element.insertBefore(defaultOption, element.firstChild);
                }
                
                element.value = '';
                element.disabled = false;
                element.classList.remove('disabled-field');
            }
        });

        // Resetear el switch de Excel y su área
        const switchExcel = document.getElementById('switchPlantillaExcel');
        if (switchExcel) {
            switchExcel.checked = false;
        }
        
        const areaCargarExcel = document.getElementById('areaCargarExcel');
        if (areaCargarExcel) {
            areaCargarExcel.style.display = 'none';
        }

        const excelInput = document.getElementById('excelAmortizacion');
        if (excelInput) {
            excelInput.value = '';
        }

        // Resetear el switch de verificar
        const switchVerificar = document.getElementById('switchVerificar');
        if (switchVerificar) {
            switchVerificar.checked = false;
        }
    }

    /**
     * Calcular amortización cuando cambie la tasa
     */
    async calcularAmortizacion(prestamo) {
        try {
            const datosAmortizacion = {
                loanNumber: prestamo.prestamoId || prestamo.loanNumber || '',
                principal: prestamo.montoNeto || prestamo.principal || 0,
                interestRate: prestamo.tasa || prestamo.interestRate || 0,
                gracePeriod: prestamo.mesesGracia || prestamo.gracePeriod || 0,
                totalPeriods: prestamo.plazo || prestamo.totalPeriods || 0,
                paymentType: parseInt(prestamo.tipoCuota || prestamo.paymentType) || 1,
                days: prestamo.diaPago || prestamo.days || 0,  // Si es 0, la API lo calcula automáticamente
                startDate: prestamo.fechaInicial || prestamo.startDate || '',
                endDate: prestamo.fechaFinal || prestamo.endDate || '',
                disbursementDays: prestamo.diasDesembolso || prestamo.disbursementDays || 0,  // Días de desembolso
                roundingModeCode: prestamo.modoRedondeo || prestamo.roundingModeCode || 100,  // Modo de redondeo: 100 (abajo) o 200 (arriba)
                company: prestamo.empresa || prestamo.company || ''  // El backend lo completará desde la sesión si está vacío
            };
            
            // Validar que todos los campos requeridos tengan valores válidos
            if (!datosAmortizacion.loanNumber || datosAmortizacion.principal <= 0 || datosAmortizacion.interestRate <= 0 || datosAmortizacion.totalPeriods <= 0) {
                console.error('Datos inválidos para calcular amortización:', datosAmortizacion);
                throw new Error('Datos inválidos: loanNumber, principal, interestRate y totalPeriods son requeridos y deben ser mayores a 0');
            }
            
            // Validar fechas
            if (!datosAmortizacion.startDate || !datosAmortizacion.endDate) {
                console.error('Fechas faltantes:', { startDate: datosAmortizacion.startDate, endDate: datosAmortizacion.endDate });
                throw new Error('Fechas inicial y final son requeridas para calcular la amortización');
            }

            const response = await fetch('apps/Prestamos/Maestro_Prestamos/api/prestamos-endpoints.php?action=calcularAmortizacion', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(datosAmortizacion)
            });

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error al calcular amortización:', errorText);
                throw new Error(`Error HTTP: ${response.status} - ${response.statusText}. Detalles: ${errorText}`);
            }

            const result = await response.json();
            return result.success;
        } catch (error) {
            console.error('Error al calcular amortización:', error);
            return false;
        }
    }

    /**
     * Obtener datos de amortización
     */
    async obtenerAmortizacion(loanNumber) {
        try {
            const response = await fetch(`apps/Prestamos/Maestro_Prestamos/api/prestamos-endpoints.php?action=obtenerAmortizacion&loanNumber=${encodeURIComponent(loanNumber)}`);
            
            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status} - ${response.statusText}`);
            }

            const result = await response.json();
            
            // La API externa devuelve la estructura directamente con success, paidInstallments, pendingInstallments
            // Si success es true y hay al menos un installment (paid o pending), retornar los datos
            if (result.success) {
                const hasPaid = result.paidInstallments && result.paidInstallments.length > 0;
                const hasPending = result.pendingInstallments && result.pendingInstallments.length > 0;
                
                // Si hay cuotas (pagadas o pendientes), retornar los datos
                if (hasPaid || hasPending) {
                    return result;
                }
            }
            
            // Si no hay cuotas, retornar null
            return null;
        } catch (error) {
            console.error('Error al obtener amortización:', error);
            return null;
        }
    }

    /**
     * Recargar amortización después de un pago
     */
    async recargarAmortizacion(loanNumber) {
        try {
            const datosAmortizacion = await this.obtenerAmortizacion(loanNumber);
            if (datosAmortizacion) {
                this.mostrarAmortizacion(datosAmortizacion);
            } else {
                // Si no hay datos, ocultar amortización y switch
                this.ocultarAmortizacion();
            }
            
            // Refrescar datos del préstamo actual y tabla principal
            await this.refrescarDatosPrestamoYTabla(loanNumber);
        } catch (error) {
            console.error('Error al recargar amortización:', error);
            this.mostrarNotificacion('warning', 'No se pudo recargar la amortización. Por favor, recargue la página.', 'Advertencia');
            // Ocultar amortización y switch en caso de error
            this.ocultarAmortizacion();
        }
    }
    
    /**
     * Refrescar datos del préstamo actual y tabla principal
     */
    async refrescarDatosPrestamoYTabla(loanNumber) {
        try {
            // Primero refrescar la tabla principal de préstamos
            await this.refrescarTablaPrincipal();
            
            // Luego, si hay un préstamo actual seleccionado, refrescar sus datos
            if (this.prestamoActual && this.prestamoActual.prestamoId === loanNumber) {
                await this.refrescarDatosPrestamoActual(loanNumber);
            }
        } catch (error) {
            console.error('Error al refrescar datos del préstamo y tabla:', error);
        }
    }
    
    /**
     * Refrescar datos del préstamo actual desde el servidor
     */
    async refrescarDatosPrestamoActual(loanNumber) {
        try {
            // Buscar el préstamo actualizado en la tabla principal
            const prestamoActualizado = this.dataSource.find(p => p.prestamoId === loanNumber);
            
            if (prestamoActualizado) {
                // Actualizar prestamoActual con los datos frescos
                this.prestamoActual = prestamoActualizado;
                
                // Si el formulario de edición está visible, actualizar los campos
                const edicionDiv = document.getElementById('edicionCompleta');
                if (edicionDiv && !edicionDiv.classList.contains('edicion-oculta')) {
                    // Actualizar los campos del formulario con los datos frescos
                    this.llenarCamposFormularioEdicion(prestamoActualizado);
                }
            }
        } catch (error) {
            console.error('Error al refrescar datos del préstamo actual:', error);
        }
    }
    
    /**
     * Refrescar tabla principal de préstamos
     */
    async refrescarTablaPrincipal() {
        try {
            // Recargar datos desde el servidor
            await this.loadData();
            
            // Refrescar el grid de Syncfusion
            if (this.grid) {
                this.grid.refresh();
            }
        } catch (error) {
            console.error('Error al refrescar tabla principal:', error);
        }
    }

    /**
     * Mostrar datos de amortización en las tablas
     */
    mostrarAmortizacion(datosAmortizacion) {
        if (!datosAmortizacion) {
            this.ocultarAmortizacion();
            return;
        }

        // Mostrar resumen
        this.mostrarResumenAmortizacion(datosAmortizacion.summary);

        // Combinar cuotas pagadas y pendientes para la tabla unificada
        const cuotasPagadas = (datosAmortizacion.paidInstallments || []).map(cuota => ({
            ...cuota,
            estadoCuota: 'paid'
        }));

        const cuotasPendientes = (datosAmortizacion.pendingInstallments || []).map(cuota => ({
            ...cuota,
            estadoCuota: 'pending'
        }));

        const todasLasCuotas = [
            ...cuotasPagadas,
            ...cuotasPendientes
        ];
        
        // Si no hay cuotas, ocultar amortización y switch
        if (todasLasCuotas.length === 0) {
            this.ocultarAmortizacion();
            return;
        }

        // Preparar datos para el grid con estructura de pagos
        // Syncfusion childGrid busca 'childRecords' por defecto
        const datosParaGrid = todasLasCuotas.map((cuota, index) => {
            // Determinar si está pagada basado en el estado provisto por la API
            const estaPagadaPorAPI = cuota.estadoCuota === 'paid' || cuota.paid === true;
            const tienePagos = cuota.payments && cuota.payments.length > 0;
            const estaPagada = estaPagadaPorAPI !== undefined
                ? estaPagadaPorAPI
                : tienePagos;
            
            // Mapear payments y failPayments a childRecords para Syncfusion
            const paymentsExitosos = (cuota.payments || []).map(pago => {
                // Usar payNumber si existe, si no usar id como fallback
                const payNumber = pago.payNumber !== undefined && pago.payNumber !== null 
                    ? parseInt(pago.payNumber) 
                    : (pago.id !== undefined && pago.id !== null ? parseInt(pago.id) : 0);
                
                return {
                    id: pago.id || 0,
                    payDate: pago.payDate || '',
                    capital: pago.capital || 0,
                    interest: pago.interest || 0,
                    invoiceResult: pago.invoiceResult || '',
                    paymentIdSapbyd: pago.paymentIdSapbyd || null,
                    invoiceUnpinterest: pago.invoiceUnpinterest || null,
                    unprovisionedInterest: pago.unprovisionedInterest || 0,
                    failed: false,
                    payNumber: payNumber,
                    prestamoId: pago.prestamoId || '',
                    quotaNumber: pago.quotaNumber || cuota.period || 0
                };
            });
            
            const pagosFallidos = (cuota.failPayments || []).map(pago => {
                // Usar payNumber si existe, si no usar id como fallback
                const payNumber = pago.payNumber !== undefined && pago.payNumber !== null 
                    ? parseInt(pago.payNumber) 
                    : (pago.id !== undefined && pago.id !== null ? parseInt(pago.id) : 0);
                
                return {
                    id: pago.id || 0,
                    payDate: pago.payDate || '',
                    capital: pago.capital || 0,
                    interest: pago.interest || 0,
                    invoiceResult: pago.invoiceResult || '',
                    paymentIdSapbyd: pago.paymentIdSapbyd || null,
                    invoiceUnpinterest: pago.invoiceUnpinterest || null,
                    unprovisionedInterest: pago.unprovisionedInterest || 0,
                    failed: true,
                    payNumber: payNumber,
                    prestamoId: pago.prestamoId || '',
                    quotaNumber: pago.quotaNumber || cuota.period || 0
                };
            });
            
            // Combinar pagos exitosos y fallidos y ordenar por payNumber ascendente
            const childRecords = [...paymentsExitosos, ...pagosFallidos].sort((a, b) => {
                const payNumberA = a.payNumber || 0;
                const payNumberB = b.payNumber || 0;
                return payNumberA - payNumberB;
            });
            
            // Verificar si tiene pagos fallidos
            const tienePagosFallidos = pagosFallidos.length > 0;
            
            return {
                ...cuota,
                id: cuota.period || index + 1,
                paid: estaPagada,
                childRecords: childRecords, // Array de pagos mapeados para Syncfusion
                tienePagosFallidos: tienePagosFallidos // Flag para indicar si tiene pagos fallidos
            };
        });

        // Crear o actualizar grid de amortización
        if (!this.amortizacionGrid) {
            this.crearGridAmortizacion();
        }
        
        // Guardar datos en el dataSource
        this.amortizacionDataSource = datosParaGrid;
        
        // Actualizar el grid con los nuevos datos
        this.amortizacionGrid.dataSource = datosParaGrid;
        this.amortizacionGrid.dataBind();

        // Mostrar elementos de amortización
        document.getElementById('resumenAmortizacion').style.display = 'block';
        document.getElementById('tablaAmortizacionUnificada').style.display = 'block';
        document.getElementById('sinAmortizacion').style.display = 'none';

        // Actualizar campo saldo
        this.actualizarSaldo(datosAmortizacion.summary);
        
        // Establecer el estado del switch según el campo verified del préstamo actual
        if (this.prestamoActual) {
            const switchVerificar = document.getElementById('switchVerificar');
            if (switchVerificar) {
                const isVerified = this.prestamoActual.verified === true || 
                                  this.prestamoActual.verified === 'true' || 
                                  this.prestamoActual.verified === 1 || 
                                  this.prestamoActual.verified === '1';
                switchVerificar.checked = isVerified;
                switchVerificar.disabled = false;
            }
        }
    }

    /**
     * Crear grid de amortización con Detail Template
     */
    crearGridAmortizacion() {
        // Configurar código de moneda por defecto para Syncfusion (HNL)
        if (window.ej?.base?.setCurrencyCode) {
            ej.base.setCurrencyCode('HNL');
        }

        const gridElement = document.getElementById('amortizacionGrid');
        if (!gridElement) {
            console.error('No se encontró el elemento amortizacionGrid');
            return;
        }

        // Columnas reutilizables para el grid de pagos
        const childGridColumns = [
            {
                field: 'payNumber',
                headerText: 'N° Pago',
                width: 80,
                textAlign: 'Center'
            },
            {
                field: 'payDate',
                headerText: 'Fecha de Pago',
                width: 150,
                textAlign: 'Center',
                type: 'date',
                format: { type: 'date', format: 'dd/MM/yyyy' },
                template: (args) => {
                    if (args.payDate) {
                        const date = new Date(args.payDate);
                        return date.toLocaleDateString('es-HN');
                    }
                    return '';
                }
            },
            {
                field: 'capital',
                headerText: 'Capital',
                width: 120,
                textAlign: 'Right',
                template: (args) => this.formatearMoneda(args.capital || 0)
            },
            {
                field: 'interest',
                headerText: 'Interés',
                width: 120,
                textAlign: 'Right',
                template: (args) => this.formatearMoneda(args.interest || 0)
            },
            {
                field: 'invoiceResult',
                headerText: 'Factura',
                width: 150,
                textAlign: 'Left'
            },
            {
                field: 'paymentIdSapbyd',
                headerText: 'N° Pago SAPBYD',
                width: 150,
                textAlign: 'Center',
                template: (args) => {
                    return args.paymentIdSapbyd || '<span class="text-muted">-</span>';
                }
            },
            {
                field: 'invoiceUnpinterest',
                headerText: 'Factura Int. No Prov.',
                width: 180,
                textAlign: 'Left',
                template: (args) => {
                    return args.invoiceUnpinterest || '<span class="text-muted">-</span>';
                }
            },
            {
                field: 'unprovisionedInterest',
                headerText: 'Int. No Provisionado',
                width: 160,
                textAlign: 'Right',
                template: (args) => {
                    const monto = args.unprovisionedInterest || 0;
                    if (monto > 0) {
                        return this.formatearMoneda(monto);
                    }
                    return '<span class="text-muted">-</span>';
                }
            },
            {
                field: 'failed',
                headerText: 'Estado',
                width: 120,
                textAlign: 'Center',
                template: (args) => {
                    if (args.failed === true) {
                        return '<span class="badge bg-danger">Fallido</span>';
                    }
                    return '<span class="badge bg-success">Exitoso</span>';
                }
            },
            {
                field: 'acciones',
                headerText: 'Acciones',
                width: 200,
                textAlign: 'Center',
                template: (args) => {
                    if (args.failed === true) {
                        return `
                            <div class="d-flex flex-column gap-1" style="align-items: center;">
                                <button type="button" class="btn btn-xs btn-warning btn-reintentar-pago" 
                                    style="font-size: 0.7rem; padding: 0.2rem 0.4rem; white-space: nowrap;"
                                    data-pay-number="${args.payNumber}" 
                                    data-prestamo-id="${args.prestamoId || ''}" 
                                    data-quota-number="${args.quotaNumber || ''}"
                                    data-pay-date="${args.payDate || ''}"
                                    data-capital="${args.capital || 0}"
                                    data-interest="${args.interest || 0}"
                                    data-invoice-result="${args.invoiceResult || ''}">
                                    <i class="ki-duotone ki-arrow-repeat" style="font-size: 0.7rem;"></i>
                                    <span style="font-size: 0.7rem;">Reintentar</span>
                                </button>
                                <button type="button" class="btn btn-xs btn-info btn-agregar-pago-manual" 
                                    style="font-size: 0.7rem; padding: 0.2rem 0.4rem; white-space: nowrap;"
                                    data-pay-number="${args.payNumber}" 
                                    data-prestamo-id="${args.prestamoId || ''}" 
                                    data-quota-number="${args.quotaNumber || ''}"
                                    data-pay-date="${args.payDate || ''}"
                                    data-capital="${args.capital || 0}"
                                    data-interest="${args.interest || 0}"
                                    data-invoice-result="${args.invoiceResult || ''}">
                                    <i class="ki-duotone ki-pencil" style="font-size: 0.7rem;"></i>
                                    <span style="font-size: 0.7rem;">Agregar Manual</span>
                                </button>
                            </div>
                        `;
                    }
                    return '<span class="text-muted">-</span>';
                }
            }
        ];

        // Configuración del grid principal
        const gridConfig = {
            dataSource: [],
            columns: [
                {
                    field: 'period',
                    headerText: 'Período',
                    width: 100,
                    textAlign: 'Center'
                },
                {
                    field: 'dueDate',
                    headerText: 'Fecha Vencimiento',
                    width: 160,
                    textAlign: 'Center',
                    type: 'date',
                    format: { type: 'date', format: 'dd/MM/yyyy' },
                    template: (args) => {
                        if (args.dueDate) {
                            const date = new Date(args.dueDate);
                            return date.toLocaleDateString('es-HN');
                        }
                        return '';
                    }
                },
                {
                    field: 'days',
                    headerText: 'Días',
                    width: 90,
                    textAlign: 'Center'
                },
                {
                    field: 'capital',
                    headerText: 'Capital',
                    width: 140,
                    textAlign: 'Right',
                    template: (args) => this.formatearMoneda(args.capital || 0)
                },
                {
                    field: 'interest',
                    headerText: 'Interés',
                    width: 140,
                    textAlign: 'Right',
                    template: (args) => this.formatearMoneda(args.interest || 0)
                },
                {
                    field: 'totalQuota',
                    headerText: 'Total Cuota',
                    width: 150,
                    textAlign: 'Right',
                    template: (args) => this.formatearMoneda(args.totalQuota || 0)
                },
                {
                    field: 'capitalBalance',
                    headerText: 'Saldo Capital',
                    width: 150,
                    textAlign: 'Right',
                    template: (args) => this.formatearMoneda(args.capitalBalance || 0)
                },
                {
                    field: 'rate',
                    headerText: 'Tasa',
                    width: 110,
                    textAlign: 'Right',
                    template: (args) => {
                        return `${args.rate || 0}%`;
                    }
                },
                {
                    field: 'TEA',
                    headerText: 'TEA',
                    width: 110,
                    textAlign: 'Right',
                    template: (args) => {
                        return `${args.TEA || 0}%`;
                    }
                },
                {
                    field: 'paid',
                    headerText: 'Estado',
                    width: 120,
                    textAlign: 'Center',
                    template: (args) => {
                        // Si tiene pagos fallidos, mostrar "Revisión" en anaranjado
                        if (args.tienePagosFallidos) {
                            return '<span class="badge bg-warning">Revisión</span>';
                        }
                        
                        const esPagada = args.paid || false;
                        let estadoClass = 'success';
                        let estadoText = 'Pagada';
                        
                        if (!esPagada) {
                            // Verificar si la fecha de vencimiento ya pasó
                            const fechaVencimiento = args.dueDate ? new Date(args.dueDate) : null;
                            const fechaActual = new Date();
                            fechaActual.setHours(0, 0, 0, 0); // Resetear horas para comparar solo fechas
                            
                            if (fechaVencimiento) {
                                fechaVencimiento.setHours(0, 0, 0, 0);
                                if (fechaVencimiento < fechaActual) {
                                    // La fecha ya pasó y no está pagada = Atraso
                                    estadoClass = 'danger';
                                    estadoText = 'Atrasado';
                                } else {
                                    // Aún no vence = Pendiente
                                    estadoClass = 'warning';
                                    estadoText = 'Pendiente';
                                }
                            } else {
                                // No hay fecha de vencimiento = Pendiente
                                estadoClass = 'warning';
                                estadoText = 'Pendiente';
                            }
                        }
                        
                        return `<span class="badge bg-${estadoClass}">${estadoText}</span>`;
                    }
                },
                {
                    field: 'payments',
                    headerText: 'Pagos',
                    width: 100,
                    textAlign: 'Center',
                    template: (args) => {
                        const numPagos = args.childRecords ? args.childRecords.length : (args.payments ? args.payments.length : 0);
                        return `<span class="badge bg-primary">${numPagos}</span>`;
                    }
                }
            ],
            detailTemplate: (props) => `
                <div class="child-grid-container">
                    <div class="child-grid" data-cuota-id="${props.period || props.id}"></div>
                </div>
            `,
            allowPaging: true,
            allowSorting: true,
            allowFiltering: true,
            allowColumnChooser: true,
            showColumnChooser: true,
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
                
                const pagos = args.data.childRecords || args.data.payments || [];
                const childContainer = args.detailElement.querySelector('.child-grid');
                
                if (!childContainer) {
                    console.warn('No se encontró contenedor para el child grid');
                    return;
                }
                
                childContainer.innerHTML = '';
                
                if (!pagos.length) {
                    childContainer.innerHTML = `
                        <div class="text-muted px-4 py-3">
                            <i class="ki-duotone ki-information fs-4 me-2"></i>
                            No hay pagos registrados para esta cuota.
                        </div>
                    `;
                } else {
                    const childGrid = new ej.grids.Grid({
                        dataSource: pagos,
                        columns: childGridColumns,
                        allowPaging: pagos.length > 5,
                        pageSettings: {
                            pageSize: 5,
                            pageSizes: [5, 10, 20]
                        },
                        width: '100%',
                        height: 'auto'
                    });
                    
                    childGrid.appendTo(childContainer);
                    
                    // Esperar a que Syncfusion renderice completamente antes de configurar eventos
                    setTimeout(() => {
                        this.configurarBotonesReintentar(childContainer);
                    }, 100);
                }
                
                // Botón para agregar pago (permite async/await)
                this.configurarBotonAgregarPago(args);
            },
            rowExpanded: () => {}
        };

        // Inyectar módulo DetailRow si no está inyectado globalmente
        if (ej.grids && ej.grids.DetailRow) {
            ej.grids.Grid.Inject(ej.grids.DetailRow);
        }
        
        this.amortizacionGrid = new ej.grids.Grid(gridConfig);
        this.amortizacionGrid.appendTo('#amortizacionGrid');
    }

    /**
     * Configurar botón para agregar pago en el detail row
     */
    async configurarBotonAgregarPago(args) {
        const cuotaId = args.data.period || args.data.id;
        const cuotaPagada = args.data.paid || false;
        const container = args.detailElement?.querySelector('.child-grid-container');
        
        if (container && !container.querySelector('.agregar-pago-btn')) {
            const buttonWrapper = document.createElement('div');
            buttonWrapper.classList.add('child-grid-actions');
            
            // Verificar si el préstamo está verificado
            const prestamo = this.prestamoActual || {};
            const isVerified = prestamo.verified === true || 
                              prestamo.verified === 'true' || 
                              prestamo.verified === 1 || 
                              prestamo.verified === '1';
            
            let puedeAplicarPagos = false;
            try {
                if (window.permissionHelper?.canApplyPayments) {
                    puedeAplicarPagos = await window.permissionHelper.canApplyPayments('Maestro Prestamos');
                }
            } catch (error) {
                console.warn('No se pudo validar permiso para aplicar pagos:', error);
            }
            
            // Si la cuota ya está pagada, deshabilitar el botón
            if (cuotaPagada) {
                buttonWrapper.innerHTML = `
                    <button class="btn btn-sm btn-secondary agregar-pago-btn" disabled>
                        <i class="ki-duotone ki-check fs-6 me-1"></i>
                        Cuota ya pagada
                    </button>
                `;
            } else if (!isVerified) {
                buttonWrapper.innerHTML = `
                    <button class="btn btn-sm btn-secondary agregar-pago-btn" disabled>
                        <i class="ki-duotone ki-information fs-6 me-1"></i>
                        El préstamo debe estar verificado para aplicar pagos
                    </button>
                `;
            } else if (!puedeAplicarPagos) {
                buttonWrapper.innerHTML = `
                    <button class="btn btn-sm btn-secondary agregar-pago-btn" disabled>
                        <i class="ki-duotone ki-lock fs-6 me-1"></i>
                        No tienes permisos para agregar pagos
                    </button>
                `;
            } else {
                const button = document.createElement('button');
                button.className = 'btn btn-sm btn-primary agregar-pago-btn';
                button.innerHTML = `
                    <i class="ki-duotone ki-plus fs-6 me-1"></i>
                    Agregar Pago
                `;
                let procesandoClick = false;
                button.addEventListener('click', async (e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    
                    // Protección contra doble clic
                    if (procesandoClick) {
                        return;
                    }
                    
                    procesandoClick = true;
                    button.disabled = true;
                    
                    try {
                        if (window.prestamosGrid && window.prestamosGrid.pagosManager) {
                            await window.prestamosGrid.pagosManager.agregarPago(cuotaId);
                        }
                    } finally {
                        // Rehabilitar el botón después de un delay
                        setTimeout(() => {
                            procesandoClick = false;
                            button.disabled = false;
                        }, 1000);
                    }
                });
                buttonWrapper.appendChild(button);
            }
            
            container.prepend(buttonWrapper);
        }
    }

    /**
     * Configurar botones de reintentar pago fallido y agregar pago manualmente
     */
    configurarBotonesReintentar(container) {
        // Evitar agregar múltiples listeners al mismo contenedor
        if (container.hasAttribute('data-reintentar-listener')) {
            return;
        }
        container.setAttribute('data-reintentar-listener', 'true');
        
        // Usar event delegation para manejar clicks en botones dinámicos
        container.addEventListener('click', async (e) => {
            // Manejar botón de reintentar
            const btnReintentar = e.target.closest('.btn-reintentar-pago');
            if (btnReintentar) {
                await this.handleReintentarPago(e, btnReintentar);
                return;
            }
            
            // Manejar botón de agregar pago manualmente
            const btnAgregarManual = e.target.closest('.btn-agregar-pago-manual');
            if (btnAgregarManual) {
                await this.handleAgregarPagoManual(e, btnAgregarManual);
            return;
            }
        });
    }
    
    /**
     * Manejar click en botón de reintentar pago
     */
    async handleReintentarPago(e, btn) {
        if (!btn) return;
        
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Si el botón ya está deshabilitado (procesando), no hacer nada
        if (btn.disabled) {
            return;
        }
        
        const payNumber = btn.getAttribute('data-pay-number');
        const prestamoId = btn.getAttribute('data-prestamo-id');
        const quotaNumber = btn.getAttribute('data-quota-number');
        const payDate = btn.getAttribute('data-pay-date');
        const capital = parseFloat(btn.getAttribute('data-capital')) || 0;
        const interest = parseFloat(btn.getAttribute('data-interest')) || 0;
        const invoiceResult = btn.getAttribute('data-invoice-result');
        
        // Validar que tengamos los datos necesarios
        if (!payNumber || !prestamoId || !quotaNumber || !invoiceResult) {
            console.error('Datos incompletos del pago fallido:', { payNumber, prestamoId, quotaNumber, invoiceResult });
            this.mostrarNotificacion('error', 'Datos incompletos del pago fallido', 'Error');
            return;
        }
        
        // Guardar el HTML original del botón
        const btnOriginalHTML = btn.innerHTML;
        const btnOriginalDisabled = btn.disabled;
        
        try {
            // Verificar que pagosManager esté disponible
            if (!this.pagosManager) {
                console.error('pagosManager no está disponible');
                this.mostrarNotificacion('error', 'Error: No se pudo acceder al módulo de pagos', 'Error');
                return;
            }
            
            // Llamar al método de reintentar pago (el SweetAlert está dentro de ese método)
            await this.pagosManager.reintentarPagoFallido({
                payNumber,
                prestamoId,
                quotaNumber,
                payDate,
                capital,
                interest,
                invoiceResult
            });
        } catch (error) {
            console.error('Error al reintentar pago:', error);
            this.mostrarNotificacion('error', `Error al reintentar pago: ${error.message}`, 'Error');
        } finally {
            // Restaurar el botón después de un breve delay para que el usuario vea el resultado
            setTimeout(() => {
                btn.disabled = btnOriginalDisabled;
                btn.innerHTML = btnOriginalHTML;
            }, 1000);
        }
    }
    
    /**
     * Manejar click en botón de agregar pago manualmente
     */
    async handleAgregarPagoManual(e, btn) {
        if (!btn) return;
        
        e.preventDefault();
        e.stopPropagation();
        e.stopImmediatePropagation();
        
        // Si el botón ya está deshabilitado (procesando), no hacer nada
        if (btn.disabled) {
            return;
        }
        
        const payNumber = btn.getAttribute('data-pay-number');
        const prestamoId = btn.getAttribute('data-prestamo-id');
        const quotaNumber = btn.getAttribute('data-quota-number');
        const payDate = btn.getAttribute('data-pay-date');
        const capital = parseFloat(btn.getAttribute('data-capital')) || 0;
        const interest = parseFloat(btn.getAttribute('data-interest')) || 0;
        const invoiceResult = btn.getAttribute('data-invoice-result');
        
        // Validar que tengamos los datos necesarios
        if (!payNumber || !prestamoId || !quotaNumber) {
            console.error('Datos incompletos del pago fallido:', { payNumber, prestamoId, quotaNumber });
            this.mostrarNotificacion('error', 'Datos incompletos del pago fallido', 'Error');
            return;
        }
        
        // Obtener el préstamo actual para obtener el company
        const prestamo = this.prestamoActual || {};
        const company = prestamo.empresa || '';
        
        if (!company) {
            this.mostrarNotificacion('error', 'No se encontró la información de la empresa', 'Error');
            return;
        }
        
        // Mostrar SweetAlert2 para ingresar el número de pago de SAP
        const result = await Swal.fire({
            title: 'Agregar Pago Manualmente',
            html: `
                <p>Ingrese el número de pago de SAP ByDesign:</p>
                <input type="text" id="swal-payment-id" class="swal2-input" placeholder="Ej: 100787" autofocus>
                <p class="text-muted mt-2"><small>Este número debe coincidir con el pago creado en SAP.</small></p>
                <div class="mt-3 text-start">
                    <label class="form-check-label" style="cursor: pointer;">
                        <input type="checkbox" id="swal-marcar-cuota-pagada" class="form-check-input me-2" style="cursor: pointer;">
                        Marcar cuota como pagada
                    </label>
                    <p class="text-muted mt-1 mb-0"><small>Active esta opción si este pago completa la cuota.</small></p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Agregar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            preConfirm: () => {
                const input = document.getElementById('swal-payment-id');
                const value = input?.value?.trim();
                if (!value) {
                    Swal.showValidationMessage('El número de pago es requerido');
                    return false;
                }
                const checkbox = document.getElementById('swal-marcar-cuota-pagada');
                return {
                    paymentIdSapByD: value,
                    marcarCuotaPagada: checkbox?.checked || false
                };
            }
        });
        
        if (!result.isConfirmed || !result.value) {
            return; // Usuario canceló
        }
        
        const paymentIdSapByD = result.value.paymentIdSapByD;
        const marcarCuotaPagada = result.value.marcarCuotaPagada;
        
        // Deshabilitar botón durante el proceso
        btn.disabled = true;
        const btnOriginalHTML = btn.innerHTML;
        btn.innerHTML = `
            <span class="spinner-border spinner-border-sm me-1" role="status" aria-hidden="true"></span>
            Procesando...
        `;
        
        try {
            if (window.prestamosGrid && window.prestamosGrid.pagosManager) {
                await window.prestamosGrid.pagosManager.agregarPagoManualmente({
                    payNumber,
                    prestamoId,
                    quotaNumber,
                    payDate,
                    capital,
                    interest,
                    invoiceResult,
                    company,
                    paymentIdSapByD,
                    marcarCuotaPagada
                });
            } else {
                console.error('prestamosGrid o pagosManager no está disponible');
                this.mostrarNotificacion('error', 'Error: No se pudo acceder al módulo de pagos', 'Error');
            }
        } catch (error) {
            console.error('Error al agregar pago manualmente:', error);
            this.mostrarNotificacion('error', `Error al agregar pago: ${error.message}`, 'Error');
        } finally {
            // Restaurar el botón después de un breve delay
            setTimeout(() => {
                btn.disabled = false;
                btn.innerHTML = btnOriginalHTML;
            }, 1000);
        }
    }

    /**
     * Eliminar pago de una cuota
     */
    eliminarPago(cuotaId, pagoId) {
        const cuota = this.amortizacionDataSource.find(c => (c.period || c.id) === cuotaId);
        
        if (!cuota || !cuota.childRecords) {
            console.error(`No se encontró la cuota o los pagos`);
            return;
        }

        // Confirmar eliminación
        if (confirm('¿Está seguro de que desea eliminar este pago?')) {
            // Buscar el índice del pago por ID o usar el índice directamente
            const indexPago = typeof pagoId === 'number' && pagoId < cuota.childRecords.length 
                ? pagoId 
                : cuota.childRecords.findIndex(p => p.id === pagoId);
            
            if (indexPago >= 0) {
                cuota.childRecords.splice(indexPago, 1);
                
                // Actualizar el estado paid de la cuota
                cuota.paid = cuota.childRecords.length > 0;
                
                // Actualizar el grid principal - el child grid se actualizará automáticamente
                this.amortizacionGrid.dataSource = [...this.amortizacionDataSource];
                this.amortizacionGrid.refresh();
            }
        }
    }

    /**
     * Mostrar resumen de amortización
     */
    mostrarResumenAmortizacion(summary) {
        document.getElementById('totalCuotas').textContent = summary.totalInstallments || 0;
        document.getElementById('cuotasPagadas').textContent = summary.paidCount || 0;
        document.getElementById('cuotasPendientes').textContent = summary.pendingCount || 0;
    }


    /**
     * Actualizar campo saldo
     */
    actualizarSaldo(summary) {
        const saldoElement = document.getElementById('editSaldo');
        if (saldoElement) {
            const saldo = summary.totalPendingCapital || 0;
            saldoElement.value = `L. ${saldo.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
    }

    /**
     * Ocultar sección de amortización
     */
    ocultarAmortizacion() {
        document.getElementById('resumenAmortizacion').style.display = 'none';
        document.getElementById('tablaAmortizacionUnificada').style.display = 'none';
        document.getElementById('sinAmortizacion').style.display = 'block';
        
        // Limpiar grid de amortización si existe
        if (this.amortizacionGrid) {
            this.amortizacionDataSource = [];
            this.amortizacionGrid.dataSource = [];
            this.amortizacionGrid.refresh();
        }
    }

    /**
     * Formatear moneda
     */
    formatearMoneda(valor) {
        return new Intl.NumberFormat('es-HN', {
            style: 'currency',
            currency: 'HNL'
        }).format(valor);
    }

    /**
     * Mostrar/Ocultar área de carga de Excel
     */
    toggleAreaCargarExcel(mostrar) {
        const areaCargarExcel = document.getElementById('areaCargarExcel');
        if (areaCargarExcel) {
            if (mostrar) {
                areaCargarExcel.style.display = 'block';
            } else {
                areaCargarExcel.style.display = 'none';
                // Limpiar el input de archivo si se desactiva
                const excelInput = document.getElementById('excelAmortizacion');
                if (excelInput) {
                    excelInput.value = '';
                }
            }
        }
    }

    /**
     * Cargar amortización desde archivo Excel
     */
    async cargarAmortizacionDesdeExcel() {
        const fileInput = document.getElementById('excelAmortizacion');
        const file = fileInput?.files[0];
        
        if (!file) {
            this.mostrarNotificacion('warning', 'Por favor seleccione un archivo', 'Atención');
            return;
        }

        const prestamoId = document.getElementById('editId')?.value;
        if (!prestamoId) {
            this.mostrarNotificacion('error', 'No se encontró ID del préstamo', 'Error');
            return;
        }

        // Crear FormData para enviar el archivo
        const formData = new FormData();
        formData.append('file', file);
        formData.append('prestamo_id', prestamoId);


        try {
            this.mostrarNotificacion('info', 'Cargando amortización desde Excel...', 'Procesando');

            const response = await fetch(
                'apps/Prestamos/Maestro_Prestamos/api/prestamos-endpoints.php?action=uploadAmortizacion',
                {
                    method: 'POST',
                    body: formData
                }
            );
            
            console.log('Response status:', response.status);
            console.log('Response headers:', response.headers);

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                this.mostrarNotificacion('success', 'Amortización cargada exitosamente desde Excel', 'Éxito');
                
                // Recargar la amortización para mostrar los datos actualizados
                await this.cargarAmortizacion(prestamoId);
                
                // Limpiar el input de archivo
                fileInput.value = '';
                
                // Desactivar el switch
                const switchExcel = document.getElementById('switchPlantillaExcel');
                if (switchExcel) {
                    switchExcel.checked = false;
                    this.toggleAreaCargarExcel(false);
                }
            } else {
                throw new Error(data.message || 'Error desconocido al cargar Excel');
            }
        } catch (error) {
            console.error('Error al cargar Excel:', error);
            this.mostrarNotificacion('error', `Error al cargar amortización: ${error.message}`, 'Error');
        }
    }

    /**
     * Confirmar y verificar/desverificar préstamo
     */
    async confirmarYVerificarPrestamo(switchElement, isVerifying) {
        const prestamoId = document.getElementById('editId')?.value;
        
        if (!prestamoId) {
            this.mostrarNotificacion('error', 'No se encontró ID del préstamo', 'Error');
            switchElement.checked = !isVerifying;
            return;
        }

        // Validar que exista amortización antes de permitir verificar
        if (isVerifying) {
            // Verificar si hay amortización cargada
            if (!this.amortizacionDataSource || this.amortizacionDataSource.length === 0) {
                this.mostrarNotificacion('error', 'No se puede verificar el préstamo sin una tabla de amortización cargada. Por favor, cargue la amortización primero.', 'Sin amortización');
                switchElement.checked = false;
                return;
            }
        }

        // Mostrar confirmación con SweetAlert2
        const result = await Swal.fire({
            title: isVerifying ? '¿Verificar Préstamo?' : '¿Desverificar Préstamo?',
            html: isVerifying 
                ? `¿Está seguro de que desea <strong>verificar</strong> el préstamo <strong>${prestamoId}</strong>?<br><br>
                   <small class="text-muted">Esta acción marcará el préstamo como verificado en el sistema.</small>`
                : `¿Está seguro de que desea <strong>desverificar</strong> el préstamo <strong>${prestamoId}</strong>?<br><br>
                   <small class="text-muted">Esta acción marcará el préstamo como NO verificado en el sistema.</small>`,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: isVerifying ? 'Sí, verificar' : 'Sí, desverificar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: isVerifying ? '#3085d6' : '#f1416c',
            cancelButtonColor: '#d33',
            reverseButtons: true
        });

        // Si el usuario cancela, revertir el switch
        if (!result.isConfirmed) {
            switchElement.checked = !isVerifying;
            return;
        }

        // Si confirma, ejecutar la verificación/desverificación
        try {
            this.mostrarNotificacion('info', isVerifying ? 'Verificando préstamo...' : 'Desverificando préstamo...', 'Procesando');

            const response = await fetch(
                `apps/Prestamos/Maestro_Prestamos/api/prestamos-endpoints.php?action=verificarPrestamo`,
                {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/x-www-form-urlencoded',
                    },
                    body: `prestamo_id=${encodeURIComponent(prestamoId)}&verified=${isVerifying}`
                }
            );

            if (!response.ok) {
                throw new Error(`Error HTTP: ${response.status}`);
            }

            const data = await response.json();

            if (data.success) {
                // Actualizar estado de verificación en el préstamo actual (usado por pagos)
                if (this.prestamoActual) {
                    this.prestamoActual.verified = isVerifying;
                }

                // Recargar la amortización del préstamo actual para que el detalle
                // y los botones de pago reflejen inmediatamente el nuevo estado
                if (prestamoId) {
                    await this.recargarAmortizacion(prestamoId);
                }

                await Swal.fire({
                    title: isVerifying ? '¡Verificado!' : '¡Desverificado!',
                    text: `El préstamo ${prestamoId} ha sido ${isVerifying ? 'verificado' : 'desverificado'} exitosamente`,
                    icon: 'success',
                    confirmButtonText: 'OK'
                });
                
                // Recargar la tabla para reflejar el cambio
                await this.loadData();
            } else {
                throw new Error(data.message || `Error desconocido al ${isVerifying ? 'verificar' : 'desverificar'} préstamo`);
            }
        } catch (error) {
            console.error(`Error al ${isVerifying ? 'verificar' : 'desverificar'} préstamo:`, error);
            
            await Swal.fire({
                title: 'Error',
                text: `Error al ${isVerifying ? 'verificar' : 'desverificar'} préstamo: ${error.message}`,
                icon: 'error',
                confirmButtonText: 'OK'
            });
            
            // Revertir el switch en caso de error
            switchElement.checked = !isVerifying;
        }
    }

    /**
     * Cargar datos de amortización
     */
    async cargarAmortizacion(loanNumber) {
        try {
            const datosAmortizacion = await this.obtenerAmortizacion(loanNumber);
            
            // Solo mostrar amortización si hay datos válidos
            if (datosAmortizacion) {
            this.mostrarAmortizacion(datosAmortizacion);
            } else {
                // Si no hay datos, ocultar amortización y switch
                this.ocultarAmortizacion();
            }
            
            // Refrescar datos del préstamo actual y tabla principal
            await this.refrescarDatosPrestamoYTabla(loanNumber);
        } catch (error) {
            console.error('Error al cargar amortización:', error);
            this.ocultarAmortizacion();
        }
    }

    /**
     * Llenar campos del formulario de edición
     */
    llenarCamposFormularioEdicion(prestamo) {
        // Guardar datos del préstamo para usar en pagos
        this.prestamoActual = prestamo;
        
        // Función helper para establecer valores de forma segura
        const setValueSafely = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                // Permitir 0 como valor válido
                element.value = (value !== null && value !== undefined && value !== '') ? value : '';
            } else {
            }
        };
     
        // Función helper para establecer valores numéricos (permite 0)
        const setNumericValueSafely = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                // Permitir 0 como valor válido, usar 0 como default si no hay valor
                element.value = (value !== null && value !== undefined && value !== '') ? value : '0';
            }
        };

        // Función helper para fechas
        const setDateValueSafely = (id, dateString) => {
            const element = document.getElementById(id);
            if (element && dateString) {
                // Convertir de ISO string a formato YYYY-MM-DD
                const date = new Date(dateString);
                if (!isNaN(date.getTime())) {
                    element.value = date.toISOString().split('T')[0];
                }
            } else {
            }
        };

        // Función helper para formato de moneda
        const setCurrencyValueSafely = (id, value) => {
            const element = document.getElementById(id);
            if (element && value) {
                const numValue = parseFloat(value);
                element.value = `L. ${numValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
            } else {
            }
        };
        
        // Función helper para desactivar combobox si ya tiene datos
        const disableComboboxIfHasData = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                if (value && value !== '' && value !== null && value !== undefined) {
                    element.disabled = true;
                    element.classList.add('disabled-field');
                } else {
                    element.disabled = false;
                    element.classList.remove('disabled-field');
                }
            }
        };

        // Primera fila: #Préstamo - Factura SAP BYD - Proveedor
        setValueSafely('editId', prestamo.prestamoId);
        setValueSafely('editFacturaSAP', prestamo.facturaId);
        setValueSafely('editProveedor', prestamo.proveedor);

        // Segunda fila: Tasa - Día de Pago - Meses de Gracia
        setValueSafely('editTasa', prestamo.tasa);
        setNumericValueSafely('editDiaPago', prestamo.diaPago);
        setNumericValueSafely('editMesesGracia', prestamo.mesesGracia);

        // Tercera fila: Banco - Línea de Crédito - Condición
        // Para los combos, necesitamos buscar por descripción ya que no tenemos IDs directos
        // Primero seleccionar el banco y luego cargar sus líneas de crédito
        if (prestamo.bancoId) {
            const bancoSelect = document.getElementById('editBanco');
            if (bancoSelect) {
                bancoSelect.value = prestamo.bancoId;
                // Disparar evento change para cargar líneas de crédito
                bancoSelect.dispatchEvent(new Event('change'));
            }
        } else {
        this.seleccionarPorDescripcion('editBanco', prestamo.bancoName);
        }
        
        // Esperar un momento para que se carguen las líneas de crédito antes de seleccionar
        setTimeout(() => {
            if (prestamo.lineaCreditoId) {
                const lineaCreditoSelect = document.getElementById('editLineaCredito');
                if (lineaCreditoSelect) {
                    lineaCreditoSelect.value = prestamo.lineaCreditoId;
                }
            } else {
        this.seleccionarPorDescripcion('editLineaCredito', prestamo.lineaCreditoDescription);
            }
        }, 300);
        
        this.seleccionarPorDescripcion('editCondicion', prestamo.condicionName);

        // Cuarta fila: Tipo de Cuota - Plazo Total - Fecha Inicial
        this.seleccionarPorDescripcion('editTipoCuota', prestamo.cuotaName);
        
        // Desactivar comboboxes si ya tienen datos
        disableComboboxIfHasData('editBanco', prestamo.bancoName);
        disableComboboxIfHasData('editLineaCredito', prestamo.lineaCreditoDescription);
        disableComboboxIfHasData('editCondicion', prestamo.condicionName);
        disableComboboxIfHasData('editTipoCuota', prestamo.cuotaName);
        setValueSafely('editPlazoTotal', prestamo.plazo);
        setNumericValueSafely('editDiasDesembolso', prestamo.diasDesembolso);
        setDateValueSafely('editFechaInicial', prestamo.fechaInicial);
        
        // Establecer Modo de Redondeo según el valor de la API
        const modoRedondeoElement = document.getElementById('editModoRedondeo');
        if (modoRedondeoElement && prestamo.metodoRedondeo !== undefined && prestamo.metodoRedondeo !== null) {
            // Convertir a string para comparar con los valores de las opciones
            const valorRedondeo = String(prestamo.metodoRedondeo);
            modoRedondeoElement.value = valorRedondeo;
        }

        // Quinta fila: Fecha Final - Monto Total
        setDateValueSafely('editFechaFinal', prestamo.fechaFinal);
        setCurrencyValueSafely('editMontoTotal', prestamo.montoNeto);
        
        // Campo Saldo (usar monto neto como saldo por ahora)
        setCurrencyValueSafely('editSaldo', prestamo.montoNeto);

        // Tercera fila de Datos Financieros: Datos Bancarios del Proveedor (Solo Lectura)
        setValueSafely('editCodeBankProveedor', prestamo.codeBankProveedor);
        setValueSafely('editNameBankProveedor', prestamo.nameBankProveedor);
        setValueSafely('editNumberBankAccount', prestamo.numberBankAccount);
        setValueSafely('editSapBankId', prestamo.sapBankId);

        // Sexta fila: Observaciones
        setValueSafely('editObservaciones', prestamo.comentarios);

        // NO establecer el estado del switch aquí - se establecerá cuando se cargue la amortización
        // El switch solo debe mostrarse cuando hay amortización cargada
        // El div ya está oculto por defecto en el HTML y se mostrará solo cuando haya amortización
    }

    /**
     * Seleccionar opción en combobox por descripción
     */
    seleccionarPorDescripcion(selectId, descripcion) {
        const select = document.getElementById(selectId);
        if (select && descripcion) {
            // Buscar la opción que coincida con la descripción
            for (let option of select.options) {
                if (option.text === descripcion) {
                    select.value = option.value;
                    return;
                }
            }
        } else {
        }
    }



    /**
     * Guardar edición completa
     */
    async guardarEdicionCompleta() {
        try {
            // Verificar si el switch de Excel está activo
            const switchExcel = document.getElementById('switchPlantillaExcel');
            const fileInput = document.getElementById('excelAmortizacion');
            const archivoSeleccionado = fileInput?.files[0];

            // Si el switch está activo pero no hay archivo seleccionado
            if (switchExcel?.checked && !archivoSeleccionado) {
                this.mostrarNotificacion('warning', 'Por favor seleccione un archivo Excel o desactive la opción', 'Atención');
                return;
            }

            // Recopilar datos del formulario
            const datosActualizados = this.recopilarDatosFormularioEdicion();
            
            // Validar datos
            if (!this.validarDatosEdicionCompleta(datosActualizados)) {
                return;
            }

            // Mostrar SweetAlert de confirmación
            const result = await Swal.fire({
                title: '¿Guardar cambios?',
                text: switchExcel?.checked 
                    ? '¿Está seguro de que desea guardar los cambios y cargar la amortización desde Excel?' 
                    : '¿Está seguro de que desea guardar los cambios realizados?',
                icon: 'question',
                showCancelButton: true,
                confirmButtonText: 'Sí, guardar',
                cancelButtonText: 'Cancelar',
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#d33'
            });

            if (result.isConfirmed) {
                // Determinar si se usa Excel o cálculo automático
                const usarExcel = switchExcel?.checked && archivoSeleccionado;
                
                // Si el switch está activo, primero cargar el Excel
                if (usarExcel) {
                    await this.cargarAmortizacionDesdeExcel();
                }
                
                // Luego llamada real a la API para guardar los datos del préstamo
                await this.guardarEdicionCompletaAPI(datosActualizados, usarExcel);
            }

        } catch (error) {
            this.mostrarNotificacion('error', 'Error al guardar: ' + error.message, 'Error');
        }
    }

    /**
     * Recopilar datos del formulario de edición
     */
    recopilarDatosFormularioEdicion() {
        return {
            prestamoId: document.getElementById('editId')?.value,
            facturaSAP: document.getElementById('editFacturaSAP')?.value,
            banco: document.getElementById('editBanco')?.value,
            tasa: document.getElementById('editTasa')?.value,
            diaPago: document.getElementById('editDiaPago')?.value,
            mesesGracia: document.getElementById('editMesesGracia')?.value,
            plazoTotal: document.getElementById('editPlazoTotal')?.value,
            diasDesembolso: document.getElementById('editDiasDesembolso')?.value,
            modoRedondeo: document.getElementById('editModoRedondeo')?.value,
            lineaCredito: document.getElementById('editLineaCredito')?.value,
            condicion: document.getElementById('editCondicion')?.value,
            tipoCuota: document.getElementById('editTipoCuota')?.value,
            fechaInicial: document.getElementById('editFechaInicial')?.value,
            fechaFinal: document.getElementById('editFechaFinal')?.value,
            observaciones: document.getElementById('editObservaciones')?.value,
            montoTotal: document.getElementById('editMontoTotal')?.value
        };
    }

    /**
     * Validar datos de edición completa
     */
    validarDatosEdicionCompleta(datos) {
        if (!datos.tasa || datos.tasa <= 0) {
            this.mostrarNotificacion('error', 'La tasa debe ser mayor a 0', 'Error de Validación');
            return false;
        }

        // Validar día de pago solo si tiene un valor (0 es válido, significa que la API lo calculará)
        if (datos.diaPago !== '' && datos.diaPago !== null && datos.diaPago !== undefined) {
            const diaPagoNum = parseInt(datos.diaPago);
            if (diaPagoNum < 0 || diaPagoNum > 31) {
                this.mostrarNotificacion('error', 'El día de pago debe estar entre 0 y 31', 'Error de Validación');
            return false;
            }
        }

        if (!datos.fechaInicial || !datos.fechaFinal) {
            this.mostrarNotificacion('error', 'Las fechas inicial y final son requeridas', 'Error de Validación');
            return false;
        }

        const fechaIni = new Date(datos.fechaInicial);
        const fechaFin = new Date(datos.fechaFinal);

        if (fechaFin <= fechaIni) {
            this.mostrarNotificacion('error', 'La fecha final debe ser posterior a la fecha inicial', 'Error de Validación');
            return false;
        }

        return true;
    }

    /**
     * Simular guardado de edición (temporal)
     */
    async guardarEdicionCompletaAPI(datos, usarExcel = false) {
        try {
            // Preparar datos para la API
            const datosAPI = {
                tasa: parseFloat(datos.tasa) || 0,
                dia_pago: parseInt(datos.diaPago) || 0,
                meses_gracia: parseInt(datos.mesesGracia) || 0,
                plazo: parseInt(datos.plazoTotal) || 0,
                bank_id: parseInt(datos.banco) || 0,
                creditline_id: parseInt(datos.lineaCredito) || 0,
                condicion_id: parseInt(datos.condicion) || 0,
                cuotatipo_id: parseInt(datos.tipoCuota) || 0,
                dias_de_desembolso: parseInt(datos.diasDesembolso) || 0,
                metodo_redondeo: parseInt(datos.modoRedondeo) || 100,
                commets: datos.observaciones || ''
            };


            // Actualizar préstamo
            await this.actualizarPrestamo(datos.prestamoId, datosAPI);

            // Solo recalcular amortización si NO se usó Excel
            if (!usarExcel) {
                await this.recalcularAmortizacion();
            }
            
            // Refrescar datos del préstamo actual y tabla principal después de guardar
            await this.refrescarDatosPrestamoYTabla(datos.prestamoId);

            // Mostrar SweetAlert de éxito
            const result = await Swal.fire({
                title: '¡Guardado exitoso!',
                text: 'Los cambios se han guardado correctamente y la amortización se ha recalculado',
                icon: 'success',
                showCancelButton: true,
                confirmButtonText: 'Volver a tabla',
                cancelButtonText: 'Seguir editando',
                confirmButtonColor: '#3085d6',
                cancelButtonColor: '#6c757d'
            });

            if (result.isConfirmed) {
                // Recargar datos y volver a tabla
                await this.loadData();
                this.volverATabla();
            } else {
                // Si el usuario decide seguir editando, refrescar los datos del formulario
                await this.refrescarDatosPrestamoActual(datos.prestamoId);
            }

        } catch (error) {
            this.mostrarNotificacion('error', 'Error al guardar: ' + error.message, 'Error');
        }
    }

}

// ========================================
// DETECCIÓN AUTOMÁTICA DE TEMA
// ========================================

/**
 * Función para detectar y aplicar el tema actual
 */
function detectarYAplicarTema() {
    // Detectar tema actual
    const body = document.body;
    const html = document.documentElement;
    
    // Verificar atributos de tema
    const temaActual = body.getAttribute('data-bs-theme') || 
                      body.getAttribute('data-kt-app-theme') || 
                      html.getAttribute('data-bs-theme') || 
                      html.getAttribute('data-kt-app-theme') || 
                      'light';
    
    
    // Aplicar tema al modal si está abierto
    const modal = document.getElementById('modalModificacionRapida');
    if (modal) {
        modal.setAttribute('data-tema-actual', temaActual);
    }
}

/**
 * Observer para detectar cambios de tema en tiempo real
 */
function configurarObserverTema() {
    // Observer para cambios en el body
    const bodyObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && 
                (mutation.attributeName === 'data-bs-theme' || 
                 mutation.attributeName === 'data-kt-app-theme')) {
                
                detectarYAplicarTema();
                
                // Forzar re-renderizado del modal si está abierto
                const modal = document.getElementById('modalModificacionRapida');
                if (modal && modal.classList.contains('show')) {
                    // Pequeño delay para asegurar que el cambio de tema se haya aplicado
                    setTimeout(() => {
                        const modalContent = modal.querySelector('.modal-content');
                        if (modalContent) {
                            modalContent.style.transition = 'all 0.3s ease';
                        }
                    }, 100);
                }
            }
        });
    });
    
    // Observer para cambios en el html
    const htmlObserver = new MutationObserver(function(mutations) {
        mutations.forEach(function(mutation) {
            if (mutation.type === 'attributes' && 
                (mutation.attributeName === 'data-bs-theme' || 
                 mutation.attributeName === 'data-kt-app-theme')) {
                
                detectarYAplicarTema();
            }
        });
    });
    
    // Configurar observers
    bodyObserver.observe(document.body, {
        attributes: true,
        attributeFilter: ['data-bs-theme', 'data-kt-app-theme']
    });
    
    htmlObserver.observe(document.documentElement, {
        attributes: true,
        attributeFilter: ['data-bs-theme', 'data-kt-app-theme']
    });
    
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    try {
        // Configurar detección de tema
        detectarYAplicarTema();
        configurarObserverTema();
        
        // Inicializar el grid
        window.prestamosGrid = new PrestamosDataGrid();
    } catch (error) {
        console.error('Error al inicializar PrestamosDataGrid:', error);
    }
});
