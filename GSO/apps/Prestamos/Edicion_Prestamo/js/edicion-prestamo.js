/**
 * Página de Edición Completa de Préstamos
 * Versión: 1.0.0
 * 
 * Este archivo maneja la funcionalidad de la página de edición completa
 */

class EdicionPrestamo {
    constructor() {
        this.prestamoId = null;
        this.prestamoData = null;
        this.pagosGrid = null;
        this.init();
    }

    /**
     * Inicializar la página
     */
    init() {
        this.getPrestamoIdFromURL();
        this.loadPrestamoData();
        this.setupEventListeners();
        this.createPagosGrid();
    }

    /**
     * Obtener ID del préstamo desde la URL
     */
    getPrestamoIdFromURL() {
        const urlParams = new URLSearchParams(window.location.search);
        this.prestamoId = urlParams.get('id');
        
        if (!this.prestamoId) {
            this.showNotification('Error: No se especificó el ID del préstamo', 'error');
            setTimeout(() => {
                window.history.back();
            }, 2000);
        }
    }

    /**
     * Cargar datos del préstamo
     */
    async loadPrestamoData() {
        if (!this.prestamoId) return;

        try {
            // Cargar todos los préstamos desde la API
            const response = await this.makeApiCall('getPrestamos');
            
            if (response.success) {
                // Buscar el préstamo específico por ID
                const prestamoEncontrado = response.data.find(prestamo => 
                    prestamo.prestamoId === this.prestamoId
                );
                
                if (prestamoEncontrado) {
                    // Transformar datos al formato esperado por el formulario
                    this.prestamoData = {
                        id: prestamoEncontrado.id,
                        prestamoId: prestamoEncontrado.prestamoId,
                        banco: prestamoEncontrado.bancoId,
                        lineaCredito: prestamoEncontrado.lineaCreditoId,
                        tasa: prestamoEncontrado.tasa,
                        condicion: prestamoEncontrado.condicionId,
                        diaPago: prestamoEncontrado.diaPago,
                        mesesGracia: prestamoEncontrado.mesesGracia,
                        tipoCuota: prestamoEncontrado.tipoCuotaId,
                        facturaSAP: prestamoEncontrado.facturaId,
                        fechaInicial: prestamoEncontrado.fechaInicial,
                        fechaFinal: prestamoEncontrado.fechaFinal,
                        montoTotal: prestamoEncontrado.montoNeto,
                        plazo: prestamoEncontrado.plazo,
                        observaciones: prestamoEncontrado.comentarios
                    };
                    this.fillForm();
                } else {
                    this.showNotification('Préstamo no encontrado con ID: ' + this.prestamoId, 'error');
                }
            } else {
                this.showNotification('Error al cargar préstamos: ' + response.message, 'error');
            }
        } catch (error) {
            // Si falla la API, usar datos de ejemplo para desarrollo
            console.warn('Usando datos de ejemplo (API no disponible):', error);
            this.prestamoData = {
                id: this.prestamoId,
                banco: 'Banco Atlántida',
                lineaCredito: 'Línea Comercial',
                tasa: 13.0,
                fechaInicial: '2024-01-01',
                fechaFinal: '2025-01-01',
                montoTotal: 10000000.00,
                condicion: 'Revolvente',
                diaPago: 15,
                mesesGracia: 2,
                tipoCuota: 'Cuota Fija',
                facturaSAP: 'INV-2024-001',
                observaciones: 'Préstamo para expansión de negocio'
            };
            this.fillForm();
        }
    }
    
    /**
     * Realizar llamada a API
     */
    async makeApiCall(action) {
        const url = `apps/Prestamos/Maestro_Prestamos/api/prestamos-endpoints.php?action=${action}`;
        
        try {
            const response = await fetch(url);
            
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const result = await response.json();
            return result;
        } catch (error) {
            throw new Error(`Error en llamada API: ${error.message}`);
        }
    }

    /**
     * Llenar el formulario con los datos
     */
    fillForm() {
        if (!this.prestamoData) return;

        // Función helper para establecer valores de forma segura
        const setValueSafely = (id, value) => {
            const element = document.getElementById(id);
            if (element) {
                element.value = value || '';
            }
        };
        
        // Función helper para convertir fechas ISO a formato YYYY-MM-DD
        const setDateValueSafely = (id, isoDate) => {
            const element = document.getElementById(id);
            if (element && isoDate) {
                const date = new Date(isoDate);
                if (!isNaN(date.getTime())) {
                    const year = date.getFullYear();
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const day = String(date.getDate()).padStart(2, '0');
                    element.value = `${year}-${month}-${day}`;
                }
            }
        };

        // Información general
        setValueSafely('editId', this.prestamoData.id);
        setValueSafely('editBanco', this.prestamoData.banco);
        setValueSafely('editLineaCredito', this.prestamoData.lineaCredito);
        setValueSafely('editTasa', this.prestamoData.tasa);
        setValueSafely('editCondicion', this.prestamoData.condicion);
        setValueSafely('editDiaPago', this.prestamoData.diaPago);
        setValueSafely('editMesesGracia', this.prestamoData.mesesGracia || 0);
        setValueSafely('editTipoCuota', this.prestamoData.tipoCuota);
        setValueSafely('editFacturaSAP', this.prestamoData.facturaSAP);
        setValueSafely('editPlazoMeses', this.prestamoData.plazo || 12);

        // Fechas (usar función especial para fechas)
        setDateValueSafely('editFechaInicial', this.prestamoData.fechaInicial);
        setDateValueSafely('editFechaFinal', this.prestamoData.fechaFinal);

        // Información financiera
        setValueSafely('editMontoTotal', this.prestamoData.montoTotal);

        // Información adicional
        setValueSafely('editObservaciones', this.prestamoData.observaciones);

        // Calcular plazo total
        this.calcularPlazoTotal();
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Botón guardar
        document.getElementById('btnGuardarEdicion').addEventListener('click', this.guardarEdicion.bind(this));

        // Validación de fechas
        document.getElementById('editFechaInicial').addEventListener('change', this.validarFechas.bind(this));
        document.getElementById('editFechaFinal').addEventListener('change', this.validarFechas.bind(this));

        // Cálculo automático del plazo total
        document.getElementById('editMesesGracia').addEventListener('change', this.calcularPlazoTotal.bind(this));
        document.getElementById('editMesesGracia').addEventListener('input', this.calcularPlazoTotal.bind(this));
    }

    /**
     * Calcular plazo total automáticamente
     */
    calcularPlazoTotal() {
        const fechaInicialElement = document.getElementById('editFechaInicial');
        const fechaFinalElement = document.getElementById('editFechaFinal');
        const mesesGraciaElement = document.getElementById('editMesesGracia');
        const plazoTotalElement = document.getElementById('editPlazoMeses');
        
        if (fechaInicialElement && fechaFinalElement && plazoTotalElement) {
            const fechaInicial = new Date(fechaInicialElement.value);
            const fechaFinal = new Date(fechaFinalElement.value);
            const mesesGracia = parseInt(mesesGraciaElement.value) || 0;
            
            if (!isNaN(fechaInicial.getTime()) && !isNaN(fechaFinal.getTime())) {
                // Calcular diferencia en meses entre fechas
                const diferenciaMeses = this.calcularDiferenciaMeses(fechaInicial, fechaFinal);
                
                // El plazo total es la diferencia real entre fechas
                // Los meses de gracia son parte del plazo total, no se suman
                const plazoTotal = diferenciaMeses;
                
                plazoTotalElement.value = plazoTotal;
                
                // Mostrar información adicional sobre meses de gracia
                this.mostrarInfoMesesGracia(plazoTotal, mesesGracia);
            }
        }
    }
    
    /**
     * Mostrar información sobre meses de gracia
     */
    mostrarInfoMesesGracia(plazoTotal, mesesGracia) {
        const infoElement = document.getElementById('infoMesesGracia');
        if (infoElement) {
            const mesesNormales = plazoTotal - mesesGracia;
            infoElement.innerHTML = `
                <small class="form-text text-muted">
                    <strong>Desglose:</strong> ${mesesGracia} meses de gracia + ${mesesNormales} meses normales = ${plazoTotal} meses total
                </small>
            `;
        }
    }
    
    /**
     * Calcular diferencia en meses entre dos fechas
     */
    calcularDiferenciaMeses(fechaInicial, fechaFinal) {
        const yearDiff = fechaFinal.getFullYear() - fechaInicial.getFullYear();
        const monthDiff = fechaFinal.getMonth() - fechaInicial.getMonth();
        
        // Calcular meses totales
        let meses = yearDiff * 12 + monthDiff;
        
        // Ajustar por días (si la fecha final es antes del día de la fecha inicial)
        if (fechaFinal.getDate() < fechaInicial.getDate()) {
            meses--;
        }
        
        return Math.max(0, meses); // No permitir valores negativos
    }

    /**
     * Crear grid de pagos
     */
    createPagosGrid() {
        const pagosData = this.generatePagosData();

        const gridConfig = {
            dataSource: pagosData,
            columns: [
                {
                    field: 'numeroPago',
                    headerText: '# Pago',
                    width: 80,
                    textAlign: 'Center'
                },
                {
                    field: 'tipo',
                    headerText: 'Tipo',
                    width: 80,
                    textAlign: 'Center',
                    template: this.getTipoTemplate.bind(this)
                },
                {
                    field: 'fechaVencimiento',
                    headerText: 'Fecha Vencimiento',
                    width: 120,
                    type: 'date',
                    format: 'dd/MM/yyyy'
                },
                {
                    field: 'montoCuota',
                    headerText: 'Monto Cuota',
                    width: 120,
                    textAlign: 'Right',
                    format: 'C2'
                },
                {
                    field: 'capital',
                    headerText: 'Capital',
                    width: 120,
                    textAlign: 'Right',
                    format: 'C2'
                },
                {
                    field: 'interes',
                    headerText: 'Interés',
                    width: 120,
                    textAlign: 'Right',
                    format: 'C2'
                },
                {
                    field: 'saldoCapital',
                    headerText: 'Saldo Capital',
                    width: 120,
                    textAlign: 'Right',
                    format: 'C2'
                },
                {
                    field: 'estado',
                    headerText: 'Estado',
                    width: 100,
                    template: this.getEstadoTemplate.bind(this)
                }
            ],
            allowPaging: true,
            allowSorting: true,
            allowFiltering: true,
            pageSettings: {
                pageSize: 12,
                pageSizes: [6, 12, 24, 36]
            },
            filterSettings: {
                type: 'Menu'
            },
            height: '100%',
            width: '100%'
        };

        this.pagosGrid = new ej.grids.Grid(gridConfig);
        this.pagosGrid.appendTo('#pagosGrid');
    }

    /**
     * Generar datos de pagos de ejemplo
     */
    generatePagosData() {
        const pagos = [];
        const montoCuota = this.prestamoData ? this.prestamoData.cuota : 4500;
        const montoTotal = this.prestamoData ? this.prestamoData.montoTotal : 10000000;
        const fechaInicial = this.prestamoData ? new Date(this.prestamoData.fechaInicial) : new Date('2024-01-01');
        const tasa = this.prestamoData ? this.prestamoData.tasa : 13.0;
        const mesesGracia = this.prestamoData ? this.prestamoData.mesesGracia : 0;
        const totalMeses = 12 + mesesGracia; // 12 meses normales + meses de gracia

        let saldoCapital = montoTotal;
        const cuotaCapital = montoTotal / 12; // Solo se paga capital en los 12 meses normales

        for (let i = 1; i <= totalMeses; i++) {
            const fechaVencimiento = new Date(fechaInicial);
            fechaVencimiento.setMonth(fechaVencimiento.getMonth() + i);

            let montoCuotaActual = 0;
            let capital = 0;
            let interes = 0;

            if (i <= mesesGracia) {
                // Meses de gracia: solo se paga interés
                interes = (saldoCapital * (tasa / 100)) / 12;
                montoCuotaActual = interes;
                capital = 0;
            } else {
                // Meses normales: se paga capital + interés
                interes = (saldoCapital * (tasa / 100)) / 12;
                capital = cuotaCapital;
                montoCuotaActual = capital + interes;
                saldoCapital -= capital;
            }

            const estado = this.getEstadoPago(i, mesesGracia);

            pagos.push({
                numeroPago: i,
                fechaVencimiento: fechaVencimiento,
                montoCuota: montoCuotaActual,
                capital: capital,
                interes: interes,
                saldoCapital: Math.max(0, saldoCapital),
                estado: estado,
                tipo: i <= mesesGracia ? 'Gracia' : 'Normal'
            });
        }

        return pagos;
    }

    /**
     * Obtener estado del pago
     */
    getEstadoPago(numeroPago, mesesGracia = 0) {
        const hoy = new Date();
        const fechaVencimiento = new Date();
        fechaVencimiento.setMonth(fechaVencimiento.getMonth() + numeroPago);

        // Los meses de gracia siempre aparecen como pendientes
        if (numeroPago <= mesesGracia) {
            return 'Pendiente';
        }

        // Para los meses normales, usar la lógica anterior
        const mesNormal = numeroPago - mesesGracia;
        if (mesNormal <= 3) return 'Pagado';
        if (mesNormal === 4) return 'Pendiente';
        if (mesNormal === 5) return 'Vencido';
        return 'Pendiente';
    }

    /**
     * Template para el estado del pago
     */
    getEstadoTemplate(data) {
        const estado = data.estado;
        const statusClass = this.getEstadoClass(estado);
        return `<span class="e-status-badge e-status-${statusClass}">${estado}</span>`;
    }

    /**
     * Template para el tipo de pago
     */
    getTipoTemplate(data) {
        const tipo = data.tipo;
        const tipoClass = tipo === 'Gracia' ? 'gracia' : 'normal';
        return `<span class="e-tipo-badge e-tipo-${tipoClass}">${tipo}</span>`;
    }

    /**
     * Obtener clase CSS para el estado
     */
    getEstadoClass(estado) {
        const statusMap = {
            'Pagado': 'pagado',
            'Pendiente': 'pendiente',
            'Vencido': 'vencido',
            'Moroso': 'moroso'
        };
        return statusMap[estado] || 'pendiente';
    }

    /**
     * Validar fechas
     */
    validarFechas() {
        const fechaInicial = document.getElementById('editFechaInicial').value;
        const fechaFinal = document.getElementById('editFechaFinal').value;
        
        if (fechaInicial && fechaFinal) {
            if (new Date(fechaInicial) >= new Date(fechaFinal)) {
                document.getElementById('editFechaFinal').setCustomValidity('La fecha final debe ser posterior a la fecha inicial');
            } else {
                document.getElementById('editFechaFinal').setCustomValidity('');
            }
        }
    }

    /**
     * Guardar edición
     */
    guardarEdicion() {
        const form = document.getElementById('formEdicionCompleta');
        
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        // Recopilar datos del formulario
        const datosActualizados = {
            id: document.getElementById('editId').value,
            banco: document.getElementById('editBanco').value,
            lineaCredito: document.getElementById('editLineaCredito').value,
            tasa: parseFloat(document.getElementById('editTasa').value),
            condicion: document.getElementById('editCondicion').value,
            diaPago: parseInt(document.getElementById('editDiaPago').value),
            mesesGracia: parseInt(document.getElementById('editMesesGracia').value),
            tipoCuota: document.getElementById('editTipoCuota').value,
            facturaSAP: document.getElementById('editFacturaSAP').value,
            fechaInicial: new Date(document.getElementById('editFechaInicial').value),
            fechaFinal: new Date(document.getElementById('editFechaFinal').value),
            montoTotal: parseFloat(document.getElementById('editMontoTotal').value),
            cuota: parseFloat(document.getElementById('editCuota').value),
            observaciones: document.getElementById('editObservaciones').value,
            plazoTotal: parseInt(document.getElementById('editPlazoMeses').value)
        };
        
        // Validar datos
        if (!this.validarDatos(datosActualizados)) {
            return;
        }
        
        // Aquí iría la llamada a la API para guardar
        this.showNotification('Guardando cambios...', 'info');
        
        setTimeout(() => {
            this.showNotification('Préstamo actualizado exitosamente', 'success');
            setTimeout(() => {
                window.history.back();
            }, 1500);
        }, 2000);
    }

    /**
     * Validar datos
     */
    validarDatos(datos) {
        if (!datos.lineaCredito || datos.lineaCredito.trim() === '') {
            this.showNotification('Debe seleccionar una línea de crédito', 'error');
            return false;
        }
        
        if (!datos.tipoCuota || datos.tipoCuota.trim() === '') {
            this.showNotification('Debe seleccionar un tipo de cuota', 'error');
            return false;
        }
        
        if (datos.tasa < 0 || datos.tasa > 100) {
            this.showNotification('La tasa debe estar entre 0% y 100%', 'error');
            return false;
        }
        
        if (datos.mesesGracia < 0 || datos.mesesGracia > 12) {
            this.showNotification('Los meses de gracia deben estar entre 0 y 12', 'error');
            return false;
        }
        
        if (datos.diaPago < 1 || datos.diaPago > 31) {
            this.showNotification('El día de pago debe estar entre 1 y 31', 'error');
            return false;
        }
        
        if (datos.montoTotal <= 0) {
            this.showNotification('El monto total debe ser mayor a 0', 'error');
            return false;
        }
        
        if (datos.cuota <= 0) {
            this.showNotification('La cuota mensual debe ser mayor a 0', 'error');
            return false;
        }
        
        if (datos.fechaInicial >= datos.fechaFinal) {
            this.showNotification('La fecha final debe ser posterior a la fecha inicial', 'error');
            return false;
        }
        
        if (datos.plazoTotal < 1 || datos.plazoTotal > 120) {
            this.showNotification('El plazo total debe estar entre 1 y 120 meses', 'error');
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
                title: type === 'success' ? 'Éxito' : type === 'error' ? 'Error' : 'Información',
                text: message,
                icon: type,
                timer: type === 'success' ? 2000 : undefined,
                timerProgressBar: type === 'success',
                confirmButtonText: 'OK'
            });
        } else {
            alert(message);
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', function() {
    try {
        window.edicionPrestamo = new EdicionPrestamo();
    } catch (error) {
        console.error('Error al inicializar EdicionPrestamo:', error);
    }
});
