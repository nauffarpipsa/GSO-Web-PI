/**
 * Módulo de Pagos - Maestro de Préstamos
 * Versión: 1.0.0
 * 
 * Este archivo maneja la lógica de pagos para el módulo de préstamos
 */

class PagosManager {
    constructor(prestamosGrid) {
        this.prestamosGrid = prestamosGrid;
        this.procesandoAgregarPago = false; // Flag para prevenir doble clic
        this.procesandoGuardarPago = false; // Flag para prevenir doble clic en guardar pago
        this.init();
    }

    /**
     * Inicializar el módulo de pagos
     */
    init() {
        // Configurar el evento del botón de guardar pago
        const btnGuardarPago = document.getElementById('btnGuardarPago');
        if (btnGuardarPago) {
            btnGuardarPago.addEventListener('click', async (e) => {
                e.preventDefault();
                e.stopPropagation();
                
                // Protección contra doble clic
                if (this.procesandoGuardarPago) {
                    return;
                }
                
                // Deshabilitar botón inmediatamente
                btnGuardarPago.disabled = true;
                btnGuardarPago.classList.add('disabled');
                
                try {
                    await this.guardarPago();
                } catch (error) {
                    console.error('Error en guardarPago:', error);
                } finally {
                    // Rehabilitar botón después de un breve delay
                    setTimeout(() => {
                        btnGuardarPago.disabled = false;
                        btnGuardarPago.classList.remove('disabled');
                    }, 500);
                }
            });
        }
        
        // También configurar el evento del formulario por si acaso
        const formAgregarPago = document.getElementById('formAgregarPago');
        if (formAgregarPago) {
            formAgregarPago.addEventListener('submit', (e) => {
                e.preventDefault();
                e.stopPropagation();
                this.guardarPago();
            });
        }
        
        // Configurar formato de miles en inputs de capital e interés
        this.configurarFormatoMiles();
        
        // Configurar checkbox de interés no provisionado
        this.configurarInteresNoProvisionado();
    }
    
    /**
     * Configurar checkbox de interés no provisionado
     */
    configurarInteresNoProvisionado() {
        const checkbox = document.getElementById('pagoInteresNoProvisionado');
        const divInput = document.getElementById('divInteresNoProvisionado');
        const inputMonto = document.getElementById('pagoInteresNoProvisionadoMonto');
        
        if (checkbox && divInput && inputMonto) {
            checkbox.addEventListener('change', (e) => {
                if (e.target.checked) {
                    divInput.style.display = 'block';
                    inputMonto.required = true;
                } else {
                    divInput.style.display = 'none';
                    inputMonto.required = false;
                    inputMonto.value = '';
                }
            });
            
            // Configurar formato de miles en el input de interés no provisionado
            inputMonto.addEventListener('input', (e) => {
                this.formatearNumeroConMilesInput(e.target);
            });
            
            inputMonto.addEventListener('blur', (e) => {
                this.formatearNumeroConMilesBlur(e.target);
            });
        }
    }
    
    /**
     * Configurar formato de miles en inputs numéricos
     */
    configurarFormatoMiles() {
        const capitalInput = document.getElementById('pagoCapital');
        const interesInput = document.getElementById('pagoInteres');
        
        if (capitalInput) {
            capitalInput.addEventListener('input', (e) => {
                this.formatearNumeroConMilesInput(e.target);
                this.calcularSaldoPendiente();
            });
            
            capitalInput.addEventListener('blur', (e) => {
                this.formatearNumeroConMilesBlur(e.target);
                this.calcularSaldoPendiente();
            });
        }
        
        if (interesInput) {
            interesInput.addEventListener('input', (e) => {
                this.formatearNumeroConMilesInput(e.target);
                this.calcularSaldoPendiente();
            });
            
            interesInput.addEventListener('blur', (e) => {
                this.formatearNumeroConMilesBlur(e.target);
                this.calcularSaldoPendiente();
            });
        }
    }
    
    /**
     * Formatear número durante la escritura (solo separador de miles, sin forzar decimales)
     */
    formatearNumeroConMilesInput(input) {
        const cursorPosition = input.selectionStart;
        const valorOriginal = input.value;
        
        // Remover todo excepto números y punto decimal
        let valor = valorOriginal.replace(/[^\d.]/g, '');
        
        // Permitir solo un punto decimal
        const partes = valor.split('.');
        if (partes.length > 2) {
            valor = partes[0] + '.' + partes.slice(1).join('');
        }
        
        // Limitar decimales a 2
        if (partes.length === 2 && partes[1].length > 2) {
            valor = partes[0] + '.' + partes[1].substring(0, 2);
        }
        
        // Si está vacío, dejar vacío
        if (valor === '') {
            input.value = '';
            return;
        }
        
        // Separar parte entera y decimal
        const [parteEntera, parteDecimal] = valor.split('.');
        
        // Formatear parte entera con separador de miles
        const parteEnteraFormateada = parteEntera.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
        
        // Reconstruir el valor
        let valorFormateado = parteEnteraFormateada;
        if (valor.includes('.')) {
            valorFormateado += '.' + (parteDecimal || '');
        }
        
        input.value = valorFormateado;
        
        // Calcular nueva posición del cursor
        const diferencia = valorFormateado.length - valorOriginal.length;
        const nuevaPos = Math.max(0, Math.min(cursorPosition + diferencia, valorFormateado.length));
        input.setSelectionRange(nuevaPos, nuevaPos);
    }
    
    /**
     * Formatear número al salir del campo (con 2 decimales)
     */
    formatearNumeroConMilesBlur(input) {
        let valor = input.value.replace(/,/g, '');
        
        if (valor === '' || valor === null || valor === undefined) {
            input.value = '';
            return;
        }
        
        const numero = parseFloat(valor);
        
        if (isNaN(numero)) {
            input.value = '';
            return;
        }
        
        // Formatear con separador de miles y 2 decimales
        const valorFormateado = numero.toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        });
        
        input.value = valorFormateado;
    }
    
    /**
     * Calcular saldo pendiente en tiempo real
     */
    calcularSaldoPendiente() {
        if (!this.capitalMaximo || !this.interesMaximo) {
            return;
        }
        
        const capitalIngresado = this.obtenerValorNumerico('pagoCapital');
        const interesIngresado = this.obtenerValorNumerico('pagoInteres');
        
        // Calcular saldos restantes usando parseFloat y toFixed para precisión
        const capitalRestante = parseFloat((this.capitalMaximo - capitalIngresado).toFixed(2));
        const interesRestante = parseFloat((this.interesMaximo - interesIngresado).toFixed(2));
        
        // Verificar si se excede el monto disponible
        const epsilon = 0.01;
        const excedeCapital = capitalRestante < -epsilon;
        const excedeInteres = interesRestante < -epsilon;
        const excedeAlgunMonto = excedeCapital || excedeInteres;
        
        // Mostrar/ocultar saldo pendiente de capital
        const capitalRestanteElement = document.getElementById('pagoCapitalRestante');
        if (capitalRestanteElement) {
            if (capitalIngresado > 0) {
                capitalRestanteElement.style.display = 'block';
                if (excedeCapital) {
                    capitalRestanteElement.className = 'form-text text-danger';
                    capitalRestanteElement.innerHTML = `
                        <i class="ki-duotone ki-cross-circle fs-6 me-1">
                            <span class="path1"></span>
                            <span class="path2"></span>
                        </i>
                        <strong>¡Excede el disponible por L. ${Math.abs(capitalRestante).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}!</strong>
                    `;
                } else {
                    capitalRestanteElement.className = 'form-text text-muted';
                    capitalRestanteElement.innerHTML = `
                        <i class="ki-duotone ki-information fs-6 me-1">
                            <span class="path1"></span>
                            <span class="path2"></span>
                            <span class="path3"></span>
                        </i>
                        Saldo pendiente: <strong>L. ${capitalRestante.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                    `;
                }
            } else {
                capitalRestanteElement.style.display = 'none';
            }
        }
        
        // Mostrar/ocultar saldo pendiente de interés
        const interesRestanteElement = document.getElementById('pagoInteresRestante');
        if (interesRestanteElement) {
            if (interesIngresado > 0) {
                interesRestanteElement.style.display = 'block';
                if (excedeInteres) {
                    interesRestanteElement.className = 'form-text text-danger';
                    interesRestanteElement.innerHTML = `
                        <i class="ki-duotone ki-cross-circle fs-6 me-1">
                            <span class="path1"></span>
                            <span class="path2"></span>
                        </i>
                        <strong>¡Excede el disponible por L. ${Math.abs(interesRestante).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}!</strong>
                    `;
                } else {
                    interesRestanteElement.className = 'form-text text-muted';
                    interesRestanteElement.innerHTML = `
                        <i class="ki-duotone ki-information fs-6 me-1">
                            <span class="path1"></span>
                            <span class="path2"></span>
                            <span class="path3"></span>
                        </i>
                        Saldo pendiente: <strong>L. ${interesRestante.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</strong>
                    `;
                }
            } else {
                interesRestanteElement.style.display = 'none';
            }
        }
        
        // Mostrar alerta si la cuota quedará completamente pagada
        const cuotaCompletaElement = document.getElementById('pagoCuotaCompleta');
        if (cuotaCompletaElement) {
            if (capitalRestante <= epsilon && interesRestante <= epsilon && capitalIngresado > 0 && interesIngresado > 0 && !excedeAlgunMonto) {
                cuotaCompletaElement.style.display = 'block';
            } else {
                cuotaCompletaElement.style.display = 'none';
            }
        }
        
        // Habilitar/deshabilitar botón Guardar Pago
        const btnGuardarPago = document.getElementById('btnGuardarPago');
        if (btnGuardarPago) {
            if (excedeAlgunMonto) {
                btnGuardarPago.disabled = true;
                btnGuardarPago.classList.add('disabled');
            } else {
                btnGuardarPago.disabled = false;
                btnGuardarPago.classList.remove('disabled');
            }
        }
    }
    
    /**
     * Obtener valor numérico de un input formateado
     */
    obtenerValorNumerico(inputId) {
        const input = document.getElementById(inputId);
        if (!input) return 0;
        
        const valor = input.value.replace(/,/g, '');
        return parseFloat(valor) || 0;
    }

    /**
     * Abrir modal para agregar nuevo pago a una cuota
     */
    async agregarPago(cuotaId) {
        // Protección contra doble clic: verificar si el modal ya está abierto
        const modalAgregarPago = document.getElementById('modalAgregarPago');
        if (modalAgregarPago && modalAgregarPago.classList.contains('show')) {
            // El modal ya está abierto, no hacer nada
            return;
        }
        
        // Protección contra doble clic: verificar si ya se está procesando
        if (this.procesandoAgregarPago) {
            return;
        }
        
        // Marcar como procesando
        this.procesandoAgregarPago = true;
        
        const prestamosGrid = this.prestamosGrid;
        
        // Obtener datos actualizados de la amortización antes de calcular máximos
        // Esto asegura que los datos estén sincronizados después de pagos manuales o con interés no provisionado
        try {
            const prestamoId = document.getElementById('editId')?.value || '';
            if (prestamoId) {
                // Obtener amortización actualizada desde el servidor
                const amortizacionResponse = await fetch(`apps/Prestamos/Maestro_Prestamos/api/prestamos-endpoints.php?action=obtenerAmortizacion&loanNumber=${prestamoId}`);
                if (amortizacionResponse.ok) {
                    const amortizacionData = await amortizacionResponse.json();
                    if (amortizacionData.success && amortizacionData.data) {
                        // Actualizar el dataSource con los datos más recientes
                        const todasLasCuotas = [
                            ...(amortizacionData.data.paidInstallments || []),
                            ...(amortizacionData.data.pendingInstallments || [])
                        ];
                        prestamosGrid.amortizacionDataSource = todasLasCuotas;
                    }
                }
            }
        } catch (error) {
            console.warn('No se pudo actualizar la amortización antes de abrir el modal:', error);
            // Continuar con los datos existentes si falla la actualización
        }
        
        // Buscar la cuota en el dataSource (ahora actualizado)
        const cuota = prestamosGrid.amortizacionDataSource.find(c => (c.period || c.id) === cuotaId);
        
        if (!cuota) {
            console.error(`No se encontró la cuota ${cuotaId}`);
            prestamosGrid.mostrarNotificacion('error', 'No se encontró la cuota seleccionada', 'Error');
            this.procesandoAgregarPago = false;
            return;
        }

        // Verificar si la cuota ya está pagada
        if (cuota.paid) {
            prestamosGrid.mostrarNotificacion('warning', 'Esta cuota ya está marcada como pagada. No se pueden agregar más pagos.', 'Atención');
            this.procesandoAgregarPago = false;
            return;
        }

        // Obtener datos del préstamo
        const prestamoId = document.getElementById('editId')?.value || cuota.loanNumber || '';
        const prestamo = prestamosGrid.prestamoActual || {};
        
        // Verificar si el préstamo está verificado
        const isVerified = prestamo.verified === true || 
                          prestamo.verified === 'true' || 
                          prestamo.verified === 1 || 
                          prestamo.verified === '1';
        
        if (!isVerified) {
            prestamosGrid.mostrarNotificacion('error', 'El préstamo debe estar verificado para poder aplicar pagos. Por favor, verifique el préstamo primero.', 'Préstamo no verificado');
            this.procesandoAgregarPago = false;
            return;
        }
        
        // Calcular capital e interés ya aplicados en esta cuota
        // IMPORTANTE: Solo considerar pagos válidos (no fallidos) para el cálculo de máximos disponibles
        // El interés no provisionado NO se considera en estos cálculos
        // Usar payments si está disponible, sino childRecords
        const pagosExistentes = cuota.payments || cuota.childRecords || [];
        // Filtrar pagos válidos: no fallidos y válidos (valid !== false)
        const pagosValidos = pagosExistentes.filter(p => p.failed !== true && p.valid !== false);
        const capitalAplicado = pagosValidos.reduce((sum, pago) => sum + (parseFloat(pago.capital) || 0), 0);
        const interesAplicado = pagosValidos.reduce((sum, pago) => sum + (parseFloat(pago.interest) || 0), 0);
        
        // Obtener valores de capital e interés de la cuota (puede ser capital o principal)
        const capitalCuota = parseFloat(cuota.capital) || parseFloat(cuota.principal) || 0;
        const interesCuota = parseFloat(cuota.interest) || 0;
        
        // Calcular máximos disponibles usando toFixed para precisión
        const capitalMaximo = parseFloat((capitalCuota - capitalAplicado).toFixed(2));
        const interesMaximo = parseFloat((interesCuota - interesAplicado).toFixed(2));
        
        // Log para depuración
        console.log('Cálculo de máximos disponibles:', {
            cuotaId: cuotaId,
            capitalCuota,
            capitalAplicado,
            capitalMaximo,
            interesCuota,
            interesAplicado,
            interesMaximo,
            totalPagos: pagosExistentes.length,
            pagosValidos: pagosValidos.length,
            pagosDetalle: pagosValidos.map(p => ({
                capital: p.capital,
                interest: p.interest,
                failed: p.failed,
                unprovisionedInterest: p.unprovisionedInterest
            }))
        });
        
        // Llenar el formulario del modal
        document.getElementById('pagoCuotaId').value = cuotaId;
        document.getElementById('pagoPrestamoId').value = prestamoId;
        document.getElementById('pagoFecha').value = new Date().toISOString().split('T')[0];
        
        // Guardar datos de la cuota para validación (ANTES de establecer valores en inputs)
        this.cuotaActual = cuota;
        this.capitalMaximo = capitalMaximo;
        this.interesMaximo = interesMaximo;
        
        // Formatear valores con miles
        const capitalInput = document.getElementById('pagoCapital');
        const interesInput = document.getElementById('pagoInteres');
        if (capitalInput) {
            capitalInput.value = capitalMaximo > 0 ? capitalMaximo.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
        }
        if (interesInput) {
            interesInput.value = interesMaximo > 0 ? interesMaximo.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
        }
        
        // Ocultar elementos de saldo pendiente inicialmente
        const capitalRestanteElement = document.getElementById('pagoCapitalRestante');
        const interesRestanteElement = document.getElementById('pagoInteresRestante');
        const cuotaCompletaElement = document.getElementById('pagoCuotaCompleta');
        if (capitalRestanteElement) capitalRestanteElement.style.display = 'none';
        if (interesRestanteElement) interesRestanteElement.style.display = 'none';
        if (cuotaCompletaElement) cuotaCompletaElement.style.display = 'none';
        
        // Resetear checkbox de interés no provisionado
        const checkboxInteresNoProvisionado = document.getElementById('pagoInteresNoProvisionado');
        const divInteresNoProvisionado = document.getElementById('divInteresNoProvisionado');
        const inputInteresNoProvisionado = document.getElementById('pagoInteresNoProvisionadoMonto');
        if (checkboxInteresNoProvisionado) {
            checkboxInteresNoProvisionado.checked = false;
        }
        if (divInteresNoProvisionado) {
            divInteresNoProvisionado.style.display = 'none';
        }
        if (inputInteresNoProvisionado) {
            inputInteresNoProvisionado.value = '';
            inputInteresNoProvisionado.required = false;
        }
        
        // Actualizar labels de máximos disponibles DESPUÉS de establecer valores y guardar máximos
        const capitalMaxElement = document.getElementById('pagoCapitalMax');
        const interesMaxElement = document.getElementById('pagoInteresMax');
        if (capitalMaxElement) {
            capitalMaxElement.textContent = `Máximo disponible: L. ${capitalMaximo.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        if (interesMaxElement) {
            interesMaxElement.textContent = `Máximo disponible: L. ${interesMaximo.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
        }
        
        // Calcular saldo pendiente inicial (esto actualizará los labels de saldo pendiente si hay valores)
        this.calcularSaldoPendiente();
        
        document.getElementById('pagoDescripcion').value = `Pago Préstamo ${prestamoId} / NO${String(cuota.period || cuotaId).padStart(2, '0')}`;
        
        // Llenar campos ocultos con datos del préstamo
        document.getElementById('pagoCProveedor').value = prestamo.cProveedor || '';
        document.getElementById('pagoCodeBankProveedor').value = prestamo.codeBankProveedor || '';
        document.getElementById('pagoNumberBankAccount').value = prestamo.numberBankAccount || '';
        document.getElementById('pagoSapBankId').value = prestamo.sapBankId || '';
        document.getElementById('pagoNameBankProveedor').value = prestamo.nameBankProveedor || '';
        document.getElementById('pagoFacturaDesembolso').value = prestamo.facturaId || '';
        document.getElementById('pagoFechaInicial').value = prestamo.fechaInicial || '';
        document.getElementById('pagoFechaFinal').value = prestamo.fechaFinal || '';
        document.getElementById('pagoCompany').value = prestamo.empresa || '';
        
        document.getElementById('pagoCuotaInfo').textContent = `Período ${cuota.period || cuotaId} - Vencimiento: ${cuota.dueDate ? new Date(cuota.dueDate).toLocaleDateString('es-HN') : 'N/A'}`;

        // Ocultar tabla de facturas IPM inicialmente y limpiar
        const divFacturaIPM = document.getElementById('divFacturaIPM');
        const tablaFacturasIPM = document.getElementById('tablaFacturasIPM');
        if (divFacturaIPM) {
            divFacturaIPM.style.display = 'none';
        }
        if (tablaFacturasIPM) {
            tablaFacturasIPM.innerHTML = '';
        }

        // Verificar si hay factura IPM pendiente
        await this.verificarFacturaIPMPendiente(prestamoId, cuota.period || cuotaId);

        // Mostrar el modal
        const modalElement = document.getElementById('modalAgregarPago');
        const modal = new bootstrap.Modal(modalElement);
        
        // Evento para limpiar el flag cuando el modal se cierre
        const limpiarFlag = () => {
            this.procesandoAgregarPago = false;
        };
        
        modalElement.addEventListener('hidden.bs.modal', limpiarFlag, { once: true });
        
        modal.show();
        
        // Limpiar el flag después de un pequeño delay para permitir que el modal se abra
        setTimeout(() => {
            if (!modalElement.classList.contains('show')) {
                this.procesandoAgregarPago = false;
            }
        }, 500);
    }

    /**
     * Guardar pago desde el modal
     */
    async guardarPago() {
        // Protección contra doble clic: verificar si ya se está procesando
        if (this.procesandoGuardarPago) {
            console.warn('Ya se está procesando un pago, ignorando solicitud duplicada');
            return;
        }
        
        // Marcar como procesando
        this.procesandoGuardarPago = true;
        
        // Deshabilitar botón inmediatamente y guardar texto original
        const btnGuardarPago = document.getElementById('btnGuardarPago');
        let textoOriginal = '';
        if (btnGuardarPago) {
            textoOriginal = btnGuardarPago.innerHTML;
            btnGuardarPago.disabled = true;
            btnGuardarPago.classList.add('disabled');
            // Cambiar texto a "Guardando..."
            btnGuardarPago.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status"></span>Guardando...';
        }
        
        try {
            const prestamosGrid = this.prestamosGrid;
            const form = document.getElementById('formAgregarPago');
            
            // Validar formulario
            if (!form.checkValidity()) {
                form.reportValidity();
                this.procesandoGuardarPago = false; // Restaurar bandera antes de return
                if (btnGuardarPago) {
                    btnGuardarPago.disabled = false;
                    btnGuardarPago.classList.remove('disabled');
                    if (textoOriginal) {
                        btnGuardarPago.innerHTML = textoOriginal;
                    }
                }
                return;
            }

            const cuotaId = parseInt(document.getElementById('pagoCuotaId').value);
        const prestamoId = document.getElementById('pagoPrestamoId').value;
        const fecha = document.getElementById('pagoFecha').value;
        const capital = this.obtenerValorNumerico('pagoCapital');
        const interes = this.obtenerValorNumerico('pagoInteres');
        const descripcion = document.getElementById('pagoDescripcion').value.trim();
        
        // Obtener datos del préstamo desde campos ocultos
        const cProveedor = document.getElementById('pagoCProveedor').value;
        const codeBankProveedor = document.getElementById('pagoCodeBankProveedor').value;
        const numberBankAccount = document.getElementById('pagoNumberBankAccount').value;
        const sapBankId = document.getElementById('pagoSapBankId').value;
        const nameBankProveedor = document.getElementById('pagoNameBankProveedor').value;
        const facturaDesembolso = document.getElementById('pagoFacturaDesembolso').value;
        const fechaInicial = document.getElementById('pagoFechaInicial').value;
        const fechaFinal = document.getElementById('pagoFechaFinal').value;
        const company = document.getElementById('pagoCompany').value;

            // Buscar la cuota
            const cuota = prestamosGrid.amortizacionDataSource.find(c => (c.period || c.id) === cuotaId);
            
            if (!cuota) {
                prestamosGrid.mostrarNotificacion('error', 'No se encontró la cuota seleccionada', 'Error');
                return;
            }

            // Validar que tengamos todos los datos necesarios (capital e interés no son obligatorios, pero al menos uno debe tener valor)
            if (!prestamoId || !fecha || !descripcion) {
                prestamosGrid.mostrarNotificacion('error', 'Por favor complete todos los campos requeridos', 'Error');
                return;
            }

            if (!facturaDesembolso) {
                prestamosGrid.mostrarNotificacion('error', 'No se encontró la factura de desembolso del préstamo', 'Error');
                return;
            }
            
            // Validar que el préstamo siga verificado en backend (protección ante cambios sin recargar página)
            try {
                const verificarResponse = await fetch(`apps/Prestamos/Maestro_Prestamos/api/prestamos-endpoints.php?action=validarPrestamoVerificado&prestamo_id=${encodeURIComponent(prestamoId)}`);
                if (verificarResponse.ok) {
                    const verificarData = await verificarResponse.json();
                    if (!verificarData.success || !verificarData.data?.verified) {
                        prestamosGrid.mostrarNotificacion('error', 'El préstamo ya no está verificado en el sistema. No se pueden aplicar pagos hasta verificarlo nuevamente.', 'Préstamo no verificado');
                        return;
                    }
                }
            } catch (e) {
                // Si falla la validación, por seguridad no permitimos el pago
                prestamosGrid.mostrarNotificacion('error', 'No se pudo validar el estado del préstamo. Por favor, recargue la página e intente de nuevo.', 'Error de validación');
                return;
            }
            
            // Mínimo aceptado para montos de pago (0.01)
            const epsilon = 0.01;
            
            // Validar que al menos uno de los dos (capital o interés) sea >= 0.01
            if (capital < epsilon && interes < epsilon) {
                prestamosGrid.mostrarNotificacion('error', 'Debe ingresar un monto mayor o igual a 0.01 en capital o interés', 'Error de Validación');
                return;
            }
            
            // Validar que no se exceda el máximo disponible (solo si se está pagando; mínimo 0.01)
            if (capital >= epsilon && capital > this.capitalMaximo + epsilon) {
                prestamosGrid.mostrarNotificacion('error', `El capital no puede exceder L. ${this.capitalMaximo.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Error de Validación');
                return;
            }
            
            if (interes >= epsilon && interes > this.interesMaximo + epsilon) {
                prestamosGrid.mostrarNotificacion('error', `El interés no puede exceder L. ${this.interesMaximo.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`, 'Error de Validación');
                return;
            }

            // Calcular payNumber: número secuencial de pago por cuota (no el ID autoincremental)
            // Contar todos los pagos existentes en la cuota (incluyendo fallidos)
            const pagosExistentes = cuota.childRecords || cuota.payments || [];
            const payNumber = pagosExistentes.length + 1; // Siguiente número de pago
            
            // Generar PaymentID: prestamo_id + cuota + numero de pago
            // Formato: LOAN-001-01-1 (prestamo-cuota-numero)
            const paymentID = `${prestamoId}-${String(cuota.period || cuotaId).padStart(2, '0')}-${payNumber}`;
            
            // Generar mediumName: prestamoId + numero de cuota + numero de pago
            // Formato: LOAN-001-01-1 (prestamo-cuota-numero)
            const numeroCuota = String(cuota.period || cuotaId).padStart(2, '0');
            const mediumName = `${prestamoId}-${numeroCuota}-${payNumber}`;

            let facturaInteresId = null;
            let invoiceResult = null;
            let facturaInteresDocumentID = null;
            let facturaCreada = false;
            let pagoCreado = false;
            let paymentIdSapByD = null; // ID del pago en SAP
            
            // Variables para interés no provisionado
            let interesNoProvisionado = false;
            let montoInteresNoProvisionado = 0;
            let facturaInteresNoProvisionadoId = null;
            let invoiceUnpinterest = null;
            
            // Determinar el tipo de pago: mínimo es 0.01, por debajo se considera "sin monto"
            const soloCapital = interes < epsilon;
            const soloInteres = capital < epsilon;
            const pagoMixto = !soloCapital && !soloInteres;
            
            // Verificar si el checkbox de interés no provisionado está activo
            const checkboxInteresNoProvisionado = document.getElementById('pagoInteresNoProvisionado');
            if (checkboxInteresNoProvisionado && checkboxInteresNoProvisionado.checked) {
                interesNoProvisionado = true;
                montoInteresNoProvisionado = this.obtenerValorNumerico('pagoInteresNoProvisionadoMonto');
                
                // Validar que el monto sea >= 0.01 (mínimo permitido)
                if (montoInteresNoProvisionado < epsilon) {
                    prestamosGrid.mostrarNotificacion('error', 'El monto de interés no provisionado debe ser mayor o igual a 0.01', 'Error de Validación');
                    this.procesandoGuardarPago = false;
                    if (btnGuardarPago) {
                        btnGuardarPago.disabled = false;
                        btnGuardarPago.classList.remove('disabled');
                        if (textoOriginal) btnGuardarPago.innerHTML = textoOriginal;
                    }
                    return;
                }
            }
            
            // Verificar si hay factura IPM seleccionada (checkbox)
            const checkboxFacturaIPM = document.querySelector('.checkbox-factura-ipm:checked');
            const facturaIPMSeleccionada = checkboxFacturaIPM ? checkboxFacturaIPM.getAttribute('data-factura-id') : null;
            let facturaIPMData = null;
            
            // Si hay factura IPM seleccionada, obtener sus datos
            if (facturaIPMSeleccionada) {
                try {
                    const facturaIPMResponse = await fetch(`apps/Prestamos/Maestro_Prestamos/api/pagos-endpoints.php?action=obtenerFacturaIPM&prestamo=${prestamoId}&cuota=${cuota.period || cuotaId}`);
                    if (facturaIPMResponse.ok) {
                        const facturaIPMResult = await facturaIPMResponse.json();
                        if (facturaIPMResult.success && facturaIPMResult.data) {
                            facturaIPMData = facturaIPMResult.data;
                            
                            // Validar que la factura no esté pagada
                            if (facturaIPMData.paid === true) {
                                prestamosGrid.mostrarNotificacion('error', 'La factura IPM seleccionada ya está pagada y no puede ser usada para realizar un pago.', 'Factura ya pagada');
                                return;
                            }
                            
                            facturaInteresId = facturaIPMData.facturaId;
                            invoiceResult = facturaIPMData.facturaId;
                            // facturaInteresDocumentID se usa para crear el pago en SAP (debe ser el facturaId)
                            facturaInteresDocumentID = facturaIPMData.facturaId;
                            facturaCreada = true;
                            
                            console.log('Usando factura IPM existente:', {
                                facturaId: facturaIPMData.facturaId,
                                monto: facturaIPMData.monto,
                                montoFaltante: facturaIPMData.montoFaltante,
                                paid: facturaIPMData.paid
                            });
                        }
                    }
                } catch (e) {
                    console.warn('Error al obtener datos de factura IPM:', e);
                }
            }
            
            // Endpoint 1: Crear factura por interés (SOLO si hay interés que pagar Y no hay factura IPM seleccionada)
            if (interes >= epsilon && !facturaIPMSeleccionada) {
                try {
                    const facturaInteresResponse = await fetch('apps/Prestamos/Maestro_Prestamos/api/pagos-endpoints.php?action=crearFacturaInteres', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            loanNumber: prestamoId,
                            mediumName: mediumName,
                            sellerPartyId: cProveedor, // Codigo de proveedor
                            fechaPago: fecha,
                            montoInteres: interes,
                            fechaInicial: fechaInicial,
                            fechaFinal: fechaFinal
                        })
                    });

                    let facturaInteresData = null;
                    try {
                        facturaInteresData = await facturaInteresResponse.json();
                    } catch (parseError) {
                        const errorText = await facturaInteresResponse.text();
                        throw {
                            message: `Error HTTP: ${facturaInteresResponse.status}`,
                            httpStatus: facturaInteresResponse.status,
                            responseText: errorText,
                            tipo: 'parse_error'
                        };
                    }

                    if (!facturaInteresResponse.ok || !facturaInteresData.success) {
                        const errorMessage = facturaInteresData?.message || 'Error al crear factura de interés';
                        const errorData = facturaInteresData?.error_data || facturaInteresData?.data || {};
                        const statusCode = facturaInteresData?.statusCode || facturaInteresResponse.status;
                        const dataResult = facturaInteresData?.dataResult || errorData?.dataResult || null;
                        
                        // Mostrar SweetAlert con detalles del error
                        await Swal.fire({
                            title: 'Error al crear factura de interés',
                            html: `
                                <div class="text-start">
                                    <p><strong>Mensaje:</strong> ${errorMessage}</p>
                                    <p><strong>Código HTTP:</strong> ${statusCode}</p>
                                    ${dataResult ? `<p><strong>Detalles SAP:</strong> ${typeof dataResult === 'object' ? JSON.stringify(dataResult, null, 2) : dataResult}</p>` : ''}
                                    ${errorData?.type ? `<p><strong>Tipo de error:</strong> ${errorData.type}</p>` : ''}
                                </div>
                            `,
                            icon: 'error',
                            confirmButtonText: 'Entendido',
                            confirmButtonColor: '#d33',
                            width: '600px'
                        });
                        
                        throw {
                            message: errorMessage,
                            httpStatus: statusCode,
                            errorData: errorData,
                            dataResult: dataResult,
                            tipo: errorData?.type || 'unknown'
                        };
                    }

                    facturaInteresId = facturaInteresData.data.invoiceId;
                    invoiceResult = facturaInteresData.data.dataResult || facturaInteresId; // dataResult completo para endpoint 3
                    facturaInteresDocumentID = facturaInteresData.data.dataResult || facturaInteresId; // DocumentID de la factura de interés (dataResult)
                    facturaCreada = true;
                    
                    // Toast de éxito para factura
                    prestamosGrid.mostrarNotificacion('success', 'Factura de interés creada exitosamente', 'Éxito');
                    
                } catch (facturaError) {
                    console.error('Error al crear factura de interés:', facturaError);
                    
                    // Si no se mostró SweetAlert antes, mostrarlo ahora
                    if (!facturaError.tipo || facturaError.tipo === 'parse_error') {
                        await Swal.fire({
                            title: 'Error al crear factura de interés',
                            html: `
                                <div class="text-start">
                                    <p><strong>Mensaje:</strong> ${facturaError.message || 'Error desconocido'}</p>
                                    ${facturaError.httpStatus ? `<p><strong>Código HTTP:</strong> ${facturaError.httpStatus}</p>` : ''}
                                    ${facturaError.responseText ? `<p><strong>Respuesta del servidor:</strong> ${facturaError.responseText}</p>` : ''}
                                </div>
                            `,
                            icon: 'error',
                            confirmButtonText: 'Entendido',
                            confirmButtonColor: '#d33',
                            width: '600px'
                        });
                    }
                    
                    throw facturaError; // Re-lanzar para que se detenga el proceso
                }
            } else {
                console.log('No se crea factura de interés - Pago solo de capital');
            }

            // Crear factura de interés no provisionado si el checkbox está activo (mínimo 0.01)
            if (interesNoProvisionado && montoInteresNoProvisionado >= epsilon) {
                try {
                    // Extraer los últimos 4 dígitos del préstamo para evitar duplicados en customerInvoiceId
                    const ultimos4Digitos = prestamoId.length >= 4 
                        ? prestamoId.slice(-4) 
                        : prestamoId;
                    const mediumNameINP = `${ultimos4Digitos}-${numeroCuota}-${payNumber}-INP`;
                    
                    const facturaInteresNoProvisionadoResponse = await fetch('apps/Prestamos/Maestro_Prestamos/api/pagos-endpoints.php?action=crearFacturaInteresNoProvisionado', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            loanNumber: prestamoId,
                            mediumName: mediumNameINP, // Usar solo últimos 4 dígitos + cuota + pago + INP
                            sellerPartyId: cProveedor, // Codigo de proveedor
                            fechaPago: fecha,
                            montoInteres: montoInteresNoProvisionado,
                            fechaInicial: fechaInicial,
                            fechaFinal: fechaFinal
                        })
                    });

                    let facturaInteresNoProvisionadoData = null;
                    try {
                        facturaInteresNoProvisionadoData = await facturaInteresNoProvisionadoResponse.json();
                    } catch (parseError) {
                        const errorText = await facturaInteresNoProvisionadoResponse.text();
                        throw {
                            message: `Error HTTP: ${facturaInteresNoProvisionadoResponse.status}`,
                            httpStatus: facturaInteresNoProvisionadoResponse.status,
                            responseText: errorText,
                            tipo: 'parse_error'
                        };
                    }

                    if (!facturaInteresNoProvisionadoResponse.ok || !facturaInteresNoProvisionadoData.success) {
                        const errorMessage = facturaInteresNoProvisionadoData?.message || 'Error al crear factura de interés no provisionado';
                        const errorData = facturaInteresNoProvisionadoData?.error_data || facturaInteresNoProvisionadoData?.data || {};
                        const statusCode = facturaInteresNoProvisionadoData?.statusCode || facturaInteresNoProvisionadoResponse.status;
                        const dataResult = facturaInteresNoProvisionadoData?.dataResult || errorData?.dataResult || null;
                        
                        // Mostrar SweetAlert con detalles del error
                        await Swal.fire({
                            title: 'Error al crear factura de interés no provisionado',
                            html: `
                                <div class="text-start">
                                    <p><strong>Mensaje:</strong> ${errorMessage}</p>
                                    <p><strong>Código HTTP:</strong> ${statusCode}</p>
                                    ${dataResult ? `<p><strong>Detalles SAP:</strong> ${typeof dataResult === 'object' ? JSON.stringify(dataResult, null, 2) : dataResult}</p>` : ''}
                                    ${errorData?.type ? `<p><strong>Tipo de error:</strong> ${errorData.type}</p>` : ''}
                                </div>
                            `,
                            icon: 'error',
                            confirmButtonText: 'Entendido',
                            confirmButtonColor: '#d33',
                            width: '600px'
                        });
                        
                        throw {
                            message: errorMessage,
                            httpStatus: statusCode,
                            errorData: errorData,
                            dataResult: dataResult,
                            tipo: errorData?.type || 'unknown'
                        };
                    }

                    facturaInteresNoProvisionadoId = facturaInteresNoProvisionadoData.data.invoiceId;
                    invoiceUnpinterest = facturaInteresNoProvisionadoData.data.dataResult || facturaInteresNoProvisionadoId; // DocumentID de la factura
                    
                    // Toast de éxito para factura de interés no provisionado
                    prestamosGrid.mostrarNotificacion('success', 'Factura de interés no provisionado creada exitosamente', 'Éxito');
                    
                } catch (facturaError) {
                    console.error('Error al crear factura de interés no provisionado:', facturaError);
                    
                    // Si no se mostró SweetAlert antes, mostrarlo ahora
                    if (!facturaError.tipo || facturaError.tipo === 'parse_error') {
                        await Swal.fire({
                            title: 'Error al crear factura de interés no provisionado',
                            html: `
                                <div class="text-start">
                                    <p><strong>Mensaje:</strong> ${facturaError.message || 'Error desconocido'}</p>
                                    ${facturaError.httpStatus ? `<p><strong>Código HTTP:</strong> ${facturaError.httpStatus}</p>` : ''}
                                    ${facturaError.responseText ? `<p><strong>Respuesta del servidor:</strong> ${facturaError.responseText}</p>` : ''}
                                </div>
                            `,
                            icon: 'error',
                            confirmButtonText: 'Entendido',
                            confirmButtonColor: '#d33',
                            width: '600px'
                        });
                    }
                    
                    throw facturaError; // Re-lanzar para que se detenga el proceso
                }
            }

            // Endpoint 2: Crear pago
            try {
                const pagoPayload = {
                    paymentID: paymentID,
                    fechaPago: fecha,
                    descripcion: descripcion,
                    montoCapital: capital,
                    montoInteres: interes,
                    facturaDesembolso: facturaDesembolso,
                    facturaInteres: facturaInteresDocumentID, // DocumentID de la factura de interés (dataResult) - puede ser null si es solo capital
                    facturaInteresNoProvisionado: invoiceUnpinterest || null, // DocumentID de la factura de interés no provisionado
                    montoInteresNoProvisionado: interesNoProvisionado ? montoInteresNoProvisionado : 0, // Monto de interés no provisionado
                    cProveedor: cProveedor,
                    codeBankProveedor: codeBankProveedor,
                    numberBankAccount: numberBankAccount,
                    sapBankId: sapBankId,
                    nameBankProveedor: nameBankProveedor,
                    tipoPago: soloCapital ? 'capital' : (soloInteres ? 'interes' : 'mixto'), // Indicar tipo de pago
                    
                };
                
                console.log('JSON enviado al endpoint crearPago:', JSON.stringify(pagoPayload, null, 2));
                
                const pagoResponse = await fetch('apps/Prestamos/Maestro_Prestamos/api/pagos-endpoints.php?action=crearPago', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(pagoPayload)
                });

                if (!pagoResponse.ok) {
                    // Intentar obtener información detallada del error
                    let errorData = null;
                    try {
                        errorData = await pagoResponse.json();
                    } catch (e) {
                        // Si no se puede parsear, usar el texto
                        const errorText = await pagoResponse.text();
                        throw new Error(`Error HTTP: ${pagoResponse.status} - ${errorText}`);
                    }
                    throw { 
                        message: errorData.message || `Error HTTP: ${pagoResponse.status}`,
                        errorData: errorData.error_data || errorData,
                        httpStatus: pagoResponse.status
                    };
                }

                const pagoData = await pagoResponse.json();
                
                // Esperar 8 segundos antes de procesar la respuesta del pago
                console.log('Esperando 8 segundos antes de procesar la respuesta del pago...');
                await new Promise(resolve => setTimeout(resolve, 8000));
                console.log('Continuando con el procesamiento de la respuesta del pago');
                
                if (!pagoData.success) {
                    // Verificar si el error indica que el pago puede haberse creado con excepciones
                    const errorData = pagoData.error_data || {};
                    throw { 
                        message: pagoData.message || 'Error al crear pago',
                        errorData: errorData,
                        mayHaveCreated: errorData.mayHaveCreated || false
                    };
                }
                
                // Extraer el número de pago de SAP (dataResult del endpoint de pago)
                paymentIdSapByD = pagoData.data?.dataResult || null;
                
                pagoCreado = true;
                
                // Toast de éxito para pago
                prestamosGrid.mostrarNotificacion('success', 'Pago creado exitosamente', 'Éxito');
                
            } catch (pagoError) {
                console.error('Error al crear pago:', pagoError);
                
                // Verificar si el error indica que el pago puede haberse creado con excepciones
                const mayHaveCreated = pagoError.mayHaveCreated || pagoError.errorData?.mayHaveCreated || false;
                const severityCode = pagoError.errorData?.severityCode || null;
                const errorMessage = pagoError.message || 'Error al crear pago';
                
                // Verificar si el mensaje indica que el pago se creó exitosamente pero con advertencias
                const mensajeIndicaExito = errorMessage.toLowerCase().includes('creado') && 
                                          (errorMessage.toLowerCase().includes('exitoso') || 
                                           errorMessage.toLowerCase().includes('successful') ||
                                           errorMessage.toLowerCase().includes('aviso de pago'));
                
                // Mostrar SweetAlert2 con mensaje especial si el pago puede haberse creado
                if (mayHaveCreated || severityCode === 1 || mensajeIndicaExito) {
                    // Extraer el número de pago del mensaje si está disponible
                    const numeroPagoMatch = errorMessage.match(/pago\s+Nro[:\s]+(\d+)/i) || 
                                           errorMessage.match(/payment[:\s]+(\d+)/i) ||
                                           errorMessage.match(/Nro[:\s]+(\d+)/i);
                    const numeroPago = numeroPagoMatch ? numeroPagoMatch[1] : null;
                    
                    await Swal.fire({
                        title: 'Atención',
                        html: `
                            <p><strong>El pago se creó en SAP pero con advertencias.</strong></p>
                            ${numeroPago ? `<p class="mt-2"><strong>Número de pago en SAP: ${numeroPago}</strong></p>` : ''}
                            <p class="mt-2">${errorMessage}</p>
                            <p class="mt-2"><strong>Por favor, verificar en SAP que el pago se haya creado correctamente.</strong></p>
                            <p class="mt-2 text-muted">Si el pago se creó correctamente, puede agregarlo manualmente usando el número de pago de SAP.</p>
                        `,
                        icon: 'warning',
                        confirmButtonText: 'Entendido',
                        confirmButtonColor: '#3085d6',
                        width: '600px'
                    });
                }
                
                // Si la factura se creó pero el pago falló, O si es solo capital y el pago falló, O si hay interés no provisionado, guardar con failed: true
                if (facturaCreada || soloCapital || interesNoProvisionado) {
                    prestamosGrid.mostrarNotificacion('error', `Error al crear pago: ${errorMessage}. Se guardará el registro como fallido para reintentar.`, 'Error');
                    
                    // Endpoint 3: Guardar pago fallido en API externa
                    try {
                        const dbResponse = await fetch('apps/Prestamos/Maestro_Prestamos/api/pagos-endpoints.php?action=guardarPagoDB', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                prestamoId: prestamoId,
                                quotaNumber: cuota.period || cuotaId,
                                fechaPago: fecha,
                                capital: capital,
                                interest: interes,
                                invoiceResult: invoiceResult || '', // dataResult completo del endpoint 1 (vacío si es solo capital)
                                company: company,
                                failed: true, // Marcar como fallido
                                payNumber: payNumber, // Número de pago por cuota
                                paymentIdSapByD: null, // No hay número de pago SAP si el pago falló
                                invoiceUnpinterest: invoiceUnpinterest || null, // ID de factura de interés no provisionado
                                unprovisionedInterest: interesNoProvisionado ? montoInteresNoProvisionado : 0 // Monto de interés no provisionado
                            })
                        });

                        if (!dbResponse.ok) {
                            throw new Error(`Error HTTP: ${dbResponse.status}`);
                        }

                        const dbData = await dbResponse.json();
                        
                        if (!dbData.success) {
                            throw new Error(dbData.message || 'Error al guardar pago fallido');
                        }
                        
                        // Toast de éxito para guardar pago fallido
                        prestamosGrid.mostrarNotificacion('info', 'Pago fallido guardado. Puede reintentar más tarde.', 'Información');
                        
                        // Recargar amortización para mostrar el pago fallido
                        try {
                            await prestamosGrid.recargarAmortizacion(prestamoId);
                        } catch (reloadError) {
                            console.error('Error al recargar amortización:', reloadError);
                        }
                        
                        // Cerrar el modal para evitar doble clic
                        const modal = bootstrap.Modal.getInstance(document.getElementById('modalAgregarPago'));
                        if (modal) {
                            modal.hide();
                        }
                        
                        // Limpiar el formulario
                        const form = document.getElementById('formAgregarPago');
                        if (form) {
                            form.reset();
                        }
                        
                    } catch (dbError) {
                        console.error('Error al guardar pago fallido:', dbError);
                        prestamosGrid.mostrarNotificacion('error', `Error al guardar pago fallido: ${dbError.message}`, 'Error');
                        
                        // Cerrar el modal incluso si falla el guardado
                        const modal = bootstrap.Modal.getInstance(document.getElementById('modalAgregarPago'));
                        if (modal) {
                            modal.hide();
                        }
                        
                        // Limpiar el formulario
                        const form = document.getElementById('formAgregarPago');
                        if (form) {
                            form.reset();
                        }
                    }
                } else {
                    // Si es pago de interés y la factura no se creó, mostrar error y detener
                    prestamosGrid.mostrarNotificacion('error', `Error al crear pago: ${pagoError.message}`, 'Error');
                    
                    // Cerrar el modal para evitar doble clic
                    const modal = bootstrap.Modal.getInstance(document.getElementById('modalAgregarPago'));
                    if (modal) {
                        modal.hide();
                    }
                    
                    // Limpiar el formulario
                    const form = document.getElementById('formAgregarPago');
                    if (form) {
                        form.reset();
                    }
                }
                
                // Re-lanzar el error para detener el proceso
                throw pagoError;
            }

            // Si llegamos aquí, tanto la factura como el pago se crearon exitosamente
            // Endpoint 3: Guardar pago exitoso en API externa
            try {
                const dbResponse = await fetch('apps/Prestamos/Maestro_Prestamos/api/pagos-endpoints.php?action=guardarPagoDB', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        prestamoId: prestamoId,
                        quotaNumber: cuota.period || cuotaId,
                        fechaPago: fecha,
                        capital: capital,
                        interest: interes,
                        invoiceResult: invoiceResult, // dataResult completo del endpoint 1
                        company: company,
                        failed: false, // Pago exitoso
                        payNumber: payNumber, // Número de pago por cuota
                        paymentIdSapByD: paymentIdSapByD, // Número de pago de SAP (dataResult del endpoint 2)
                        invoiceUnpinterest: invoiceUnpinterest || null, // ID de factura de interés no provisionado
                        unprovisionedInterest: interesNoProvisionado ? montoInteresNoProvisionado : 0 // Monto de interés no provisionado
                    })
                });

                if (!dbResponse.ok) {
                    throw new Error(`Error HTTP: ${dbResponse.status}`);
                }

                const dbData = await dbResponse.json();
                
                if (!dbData.success) {
                    throw new Error(dbData.message || 'Error al guardar pago en base de datos');
                }
                
                // Toast de éxito para guardar en DB
                prestamosGrid.mostrarNotificacion('success', 'Pago guardado exitosamente en base de datos', 'Éxito');
                
            } catch (dbError) {
                console.error('Error al guardar pago en DB:', dbError);
                prestamosGrid.mostrarNotificacion('error', `Error al guardar pago en base de datos: ${dbError.message}`, 'Error');
                throw dbError; // Re-lanzar para que se detenga el proceso
            }

            // Solo continuar con el flujo si el pago fue exitoso (no fallido)
            if (pagoCreado) {
                // Calcular saldos restantes después del pago
                const capitalRestante = parseFloat((this.capitalMaximo - capital).toFixed(2));
                const interesRestante = parseFloat((this.interesMaximo - interes).toFixed(2));
                
                // Si los saldos restantes quedaron en 0 o muy cercanos a 0, marcar la cuota como pagada automáticamente
                if (capitalRestante <= epsilon && interesRestante <= epsilon) {
                    try {
                        const markPaidResponse = await fetch('apps/Prestamos/Maestro_Prestamos/api/pagos-endpoints.php?action=marcarCuotaPagada', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                            },
                            body: JSON.stringify({
                                prestamo_number: prestamoId,
                                quota_number: cuota.period || cuotaId,
                                company: company
                            })
                        });

                        if (markPaidResponse.ok) {
                            const markPaidData = await markPaidResponse.json();
                            if (markPaidData.success) {
                                prestamosGrid.mostrarNotificacion('info', 'Cuota marcada como pagada automáticamente', 'Información');
                            }
                        }
                    } catch (markPaidError) {
                        // Si falla el mark-paid, no es crítico, solo registrar el error
                        console.warn('No se pudo marcar la cuota como pagada:', markPaidError);
                    }
                }

                // Recargar amortización para obtener datos actualizados con IDs correctos
                await prestamosGrid.recargarAmortizacion(prestamoId);

                // Cerrar el modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalAgregarPago'));
                modal.hide();

                // Limpiar el formulario
                form.reset();
            } else {
                // Si el pago falló pero se guardó como fallido, recargar para mostrar el estado
                await prestamosGrid.recargarAmortizacion(prestamoId);
                
                // Cerrar el modal
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalAgregarPago'));
                modal.hide();

                // Limpiar el formulario
                form.reset();
            }
            
        } catch (error) {
            console.error('Error al guardar pago:', error);
            
            // Verificar si el error indica que el pago puede haberse creado
            const mayHaveCreated = error.mayHaveCreated || error.errorData?.mayHaveCreated || false;
            const severityCode = error.errorData?.severityCode || null;
            const errorMessage = error.message || 'Error al guardar pago';
            
            // Verificar si el mensaje indica que el pago se creó exitosamente pero con advertencias
            const mensajeIndicaExito = errorMessage.toLowerCase().includes('creado') && 
                                      (errorMessage.toLowerCase().includes('exitoso') || 
                                       errorMessage.toLowerCase().includes('successful') ||
                                       errorMessage.toLowerCase().includes('aviso de pago'));
            
            // Mostrar SweetAlert si el pago puede haberse creado
            if (mayHaveCreated || severityCode === 1 || mensajeIndicaExito) {
                // Extraer el número de pago del mensaje si está disponible
                const numeroPagoMatch = errorMessage.match(/pago\s+Nro[:\s]+(\d+)/i) || 
                                       errorMessage.match(/payment[:\s]+(\d+)/i) ||
                                       errorMessage.match(/Nro[:\s]+(\d+)/i);
                const numeroPago = numeroPagoMatch ? numeroPagoMatch[1] : null;
                
                await Swal.fire({
                    title: 'Atención',
                    html: `
                        <p><strong>El pago se creó en SAP pero con advertencias.</strong></p>
                        ${numeroPago ? `<p class="mt-2"><strong>Número de pago en SAP: ${numeroPago}</strong></p>` : ''}
                        <p class="mt-2">${errorMessage}</p>
                        <p class="mt-2"><strong>Por favor, verificar en SAP que el pago se haya creado correctamente.</strong></p>
                        <p class="mt-2 text-muted">Si el pago se creó correctamente, puede agregarlo manualmente usando el número de pago de SAP.</p>
                    `,
                    icon: 'warning',
                    confirmButtonText: 'Entendido',
                    confirmButtonColor: '#3085d6',
                    width: '600px'
                });
            }
            
            prestamosGrid.mostrarNotificacion('error', `Error al guardar pago: ${errorMessage}`, 'Error');
            
            // Recargar amortización para obtener datos actualizados (incluso en caso de error)
            try {
                const prestamoIdRecarga = document.getElementById('pagoPrestamoId');
                if (prestamoIdRecarga && prestamoIdRecarga.value) {
                    await prestamosGrid.recargarAmortizacion(prestamoIdRecarga.value);
                }
            } catch (reloadError) {
                console.error('Error al recargar amortización:', reloadError);
            }
            
            // Cerrar el modal para evitar doble clic y creación de facturas duplicadas
            try {
                const modal = bootstrap.Modal.getInstance(document.getElementById('modalAgregarPago'));
                if (modal) {
                    modal.hide();
                }
                
                // Limpiar el formulario
                const form = document.getElementById('formAgregarPago');
                if (form) {
                    form.reset();
                }
            } catch (modalError) {
                console.error('Error al cerrar modal:', modalError);
            }
        } finally {
            // Restaurar bandera
            this.procesandoGuardarPago = false;
            
            // Rehabilitar botón y restaurar texto original
            const btnGuardar = document.getElementById('btnGuardarPago');
            if (btnGuardar) {
                btnGuardar.disabled = false;
                btnGuardar.classList.remove('disabled');
                if (textoOriginal) {
                    btnGuardar.innerHTML = textoOriginal;
                }
            }
        }
    }

    /**
     * Reintentar un pago fallido
     * NO crea factura nueva, usa la factura existente del invoiceResult
     */
    async reintentarPagoFallido(pagoFallido) {
        const prestamosGrid = this.prestamosGrid;
        
        // Validar datos requeridos
        if (!pagoFallido.prestamoId || !pagoFallido.quotaNumber || !pagoFallido.invoiceResult) {
            prestamosGrid.mostrarNotificacion('error', 'Datos incompletos del pago fallido', 'Error');
            return;
        }

        // Validar que el préstamo esté verificado
        try {
            const validacionResponse = await fetch(
                `apps/Prestamos/Maestro_Prestamos/api/prestamos-endpoints.php?action=validarPrestamoVerificado&prestamo_id=${encodeURIComponent(pagoFallido.prestamoId)}`
            );
            
            if (!validacionResponse.ok) {
                throw new Error(`Error HTTP: ${validacionResponse.status}`);
            }
            
            const validacionData = await validacionResponse.json();
            
            if (!validacionData.success || !validacionData.data.verified) {
                prestamosGrid.mostrarNotificacion('error', 'El préstamo debe estar verificado para poder reintentar pagos. Por favor, verifique el préstamo primero.', 'Préstamo no verificado');
                return;
            }
        } catch (error) {
            console.error('Error al validar préstamo:', error);
            prestamosGrid.mostrarNotificacion('error', 'Error al validar el estado del préstamo. Por favor, recargue la página e intente nuevamente.', 'Error');
            return;
        }

        // Obtener datos del préstamo
        const prestamo = prestamosGrid.prestamoActual || {};
        const facturaDesembolso = prestamo.facturaId || '';
        const cProveedor = prestamo.cProveedor || '';
        const codeBankProveedor = prestamo.codeBankProveedor || '';
        const numberBankAccount = prestamo.numberBankAccount || '';
        const sapBankId = prestamo.sapBankId || '';
        const nameBankProveedor = prestamo.nameBankProveedor || '';
        const company = prestamo.empresa || '';

        if (!facturaDesembolso) {
            prestamosGrid.mostrarNotificacion('error', 'No se encontró la factura de desembolso del préstamo', 'Error');
            return;
        }

        // Generar valores por defecto
        const payNumberInt = parseInt(pagoFallido.payNumber) || 1;
        const paymentID = `${pagoFallido.prestamoId}-${String(pagoFallido.quotaNumber).padStart(2, '0')}-${payNumberInt}`;
        const externalReferenceDefault = `${pagoFallido.prestamoId}-${String(pagoFallido.quotaNumber).padStart(2, '0')}-${payNumberInt}`;

        // Confirmar reintento con opción de modificar ExternalReferencee
        const confirmar = await Swal.fire({
            title: '¿Reintentar pago fallido?',
            html: `
                <p>Se intentará crear el pago usando la factura existente.</p>
                <div class="text-start mt-3">
                    <p><strong>Factura:</strong> ${pagoFallido.invoiceResult}</p>
                    <p><strong>Capital:</strong> L. ${pagoFallido.capital.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                    <p><strong>Interés:</strong> L. ${pagoFallido.interest.toLocaleString('es-HN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</p>
                </div>
                <div class="mt-3">
                    <label for="externalReference" class="form-label text-start d-block"><strong>Referencia Externa (ExternalReferencee):</strong></label>
                    <input type="text" id="externalReference" class="swal2-input" value="${externalReferenceDefault}" style="width: 90%; margin: 0 auto;">
                </div>
                <div class="mt-3 text-start">
                    <label class="form-check-label" style="cursor: pointer;">
                        <input type="checkbox" id="swal-marcar-cuota-pagada-reintentar" class="form-check-input me-2" style="cursor: pointer;">
                        Marcar cuota como pagada
                    </label>
                    <p class="text-muted mt-1 mb-0"><small>Active esta opción si este pago completa la cuota.</small></p>
                </div>
            `,
            icon: 'question',
            showCancelButton: true,
            confirmButtonText: 'Sí, reintentar',
            cancelButtonText: 'Cancelar',
            confirmButtonColor: '#3085d6',
            cancelButtonColor: '#d33',
            focusConfirm: false,
            preConfirm: () => {
                const externalReference = document.getElementById('externalReference').value;
                if (!externalReference || externalReference.trim() === '') {
                    Swal.showValidationMessage('La referencia externa no puede estar vacía');
                    return false;
                }
                const checkbox = document.getElementById('swal-marcar-cuota-pagada-reintentar');
                return { 
                    externalReference: externalReference.trim(),
                    marcarCuotaPagada: checkbox?.checked || false
                };
            }
        });

        if (!confirmar.isConfirmed) {
            return;
        }

        // Obtener la referencia externa modificada por el usuario y el checkbox
        const externalReference = confirmar.value.externalReference;
        const marcarCuotaPagada = confirmar.value.marcarCuotaPagada || false;
        
        // Mostrar modal de carga que permanecerá abierto durante el proceso
        Swal.fire({
            title: 'Procesando...',
            html: 'Reintentando el pago. Por favor espere...',
            icon: 'info',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Log para debug
        console.log('PaymentID generado:', paymentID);
        console.log('ExternalReferencee (modificado por usuario):', externalReference);
        console.log('Datos del pago fallido:', {
            payNumber: pagoFallido.payNumber,
            payNumberInt: payNumberInt,
            quotaNumber: pagoFallido.quotaNumber,
            prestamoId: pagoFallido.prestamoId
        });

        // Formatear fecha de pago
        const fechaPago = pagoFallido.payDate || new Date().toISOString().split('T')[0];

        try {
            // Preparar datos para el pago
            const datosPago = {
                paymentID: externalReference, // Usar la referencia externa modificada por el usuario
                fechaPago: fechaPago,
                descripcion: `Reintento de pago fallido - Pago #${pagoFallido.payNumber}`,
                montoCapital: pagoFallido.capital,
                montoInteres: pagoFallido.interest,
                facturaDesembolso: facturaDesembolso,
                facturaInteres: pagoFallido.invoiceResult, // Usar la factura existente
                cProveedor: cProveedor,
                codeBankProveedor: codeBankProveedor,
                numberBankAccount: numberBankAccount,
                sapBankId: sapBankId,
                nameBankProveedor: nameBankProveedor
            };
            
            // Log del JSON que se está enviando
            console.log('JSON enviado al endpoint crearPago:', JSON.stringify(datosPago, null, 2));
            console.log('Datos individuales:', datosPago);
            
            // Endpoint 2: Crear pago (NO creamos factura, usamos la existente)
            const pagoResponse = await fetch('apps/Prestamos/Maestro_Prestamos/api/pagos-endpoints.php?action=crearPago', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(datosPago)
            });

            if (!pagoResponse.ok) {
                // Intentar obtener el mensaje de error del servidor
                let errorMessage = `Error HTTP: ${pagoResponse.status}`;
                let errorData = null;
                try {
                    errorData = await pagoResponse.json();
                    errorMessage = errorData.message || errorMessage;
                    console.error('Error del servidor:', errorData);
                } catch (e) {
                    const errorText = await pagoResponse.text();
                    console.error('Error del servidor (texto):', errorText);
                    errorMessage = errorText || errorMessage;
                }
                
                // Cerrar modal de carga y mostrar error detallado
                await Swal.fire({
                    title: 'Error al crear pago',
                    html: `
                        <p><strong>${errorMessage}</strong></p>
                        ${errorData?.error_data ? `<p class="mt-2 text-muted"><small>${JSON.stringify(errorData.error_data)}</small></p>` : ''}
                    `,
                    icon: 'error',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#d33'
                });
                
                throw new Error(errorMessage);
            }

            const pagoData = await pagoResponse.json();
            
            // Esperar 8 segundos antes de procesar la respuesta del pago
            console.log('Esperando 8 segundos antes de procesar la respuesta del pago (reintento)...');
            await new Promise(resolve => setTimeout(resolve, 8000));
            console.log('Continuando con el procesamiento de la respuesta del pago (reintento)');
            
            if (!pagoData.success) {
                console.error('Respuesta del servidor:', pagoData);
                
                // Cerrar modal de carga y mostrar error
                await Swal.fire({
                    title: 'Error al crear pago',
                    text: pagoData.message || 'Error al crear pago',
                    icon: 'error',
                    confirmButtonText: 'OK',
                    confirmButtonColor: '#d33'
                });
                
                throw new Error(pagoData.message || 'Error al crear pago');
            }
            
            // Extraer el número de pago de SAP (dataResult del endpoint de pago)
            const paymentIdSapByD = pagoData.data?.dataResult || null;
            
            // Logs para depuración
            console.log('Respuesta completa del pago en reintento:', pagoData);
            console.log('Data del pago en reintento:', pagoData.data);
            console.log('DataResult extraído en reintento:', pagoData.data?.dataResult);
            console.log('paymentIdSapByD que se enviará en PUT:', paymentIdSapByD);
            
            // Toast de éxito para pago
            prestamosGrid.mostrarNotificacion('success', 'Pago creado exitosamente', 'Éxito');

            // Endpoint PUT: Actualizar estado del pago de failed: true a failed: false
            try {
                const updateResponse = await fetch('apps/Prestamos/Maestro_Prestamos/api/pagos-endpoints.php?action=actualizarPagoFallido', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        prestamoId: pagoFallido.prestamoId,
                        quotaNumber: pagoFallido.quotaNumber,
                        company: company,
                        payNumber: parseInt(pagoFallido.payNumber),
                        paymentIdSapByD: paymentIdSapByD // Número de pago de SAP
                    })
                });

                if (!updateResponse.ok) {
                    console.warn('No se pudo actualizar el estado del pago:', updateResponse.status);
                } else {
                    const updateData = await updateResponse.json();
                    if (updateData.success) {
                        prestamosGrid.mostrarNotificacion('success', 'Estado del pago actualizado exitosamente', 'Éxito');
                    } else {
                        console.warn('Error al actualizar estado:', updateData.message);
                    }
                }
            } catch (updateError) {
                console.warn('Error al actualizar estado del pago:', updateError);
                // No lanzar el error para que el flujo continúe
            }

            // Recargar amortización primero para obtener datos actualizados (incluyendo el nuevo pago)
            await prestamosGrid.recargarAmortizacion(pagoFallido.prestamoId);
            
            // Esperar un momento para asegurar que la amortización se recargó correctamente
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            // Si el usuario marcó la opción de marcar cuota como pagada, hacerlo directamente
            if (marcarCuotaPagada) {
                try {
                    const markPaidResponse = await fetch('apps/Prestamos/Maestro_Prestamos/api/pagos-endpoints.php?action=marcarCuotaPagada', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            prestamo_number: pagoFallido.prestamoId,
                            quota_number: pagoFallido.quotaNumber,
                            company: company
                        })
                    });

                    if (markPaidResponse.ok) {
                        const markPaidData = await markPaidResponse.json();
                        if (markPaidData.success) {
                            prestamosGrid.mostrarNotificacion('info', 'Cuota marcada como pagada', 'Información');
                            // Recargar nuevamente para mostrar el estado actualizado
                            await prestamosGrid.recargarAmortizacion(pagoFallido.prestamoId);
                        } else {
                            console.warn('Error al marcar cuota como pagada:', markPaidData.message);
                        }
                    } else {
                        const errorText = await markPaidResponse.text();
                        console.warn('Error HTTP al marcar cuota como pagada:', markPaidResponse.status, errorText);
                    }
                } catch (markPaidError) {
                    console.warn('Error al marcar cuota como pagada:', markPaidError);
                }
            } else {
                // Verificar si la cuota quedó completamente pagada después del reintento (solo si no se marcó manualmente)
                try {
                    const amortizacionResponse = await fetch(`apps/Prestamos/Maestro_Prestamos/api/prestamos-endpoints.php?action=obtenerAmortizacion&loanNumber=${pagoFallido.prestamoId}`);
                    
                    if (amortizacionResponse.ok) {
                        const amortizacionData = await amortizacionResponse.json();
                        
                        console.log('Amortización obtenida después del reintento:', amortizacionData);
                        
                        if (amortizacionData.success && amortizacionData.data) {
                            const todasLasCuotas = [
                                ...(amortizacionData.data.paidInstallments || []),
                                ...(amortizacionData.data.pendingInstallments || [])
                            ];
                            
                            // Buscar la cuota específica
                            const cuotaActualizada = todasLasCuotas.find(c => c.period === pagoFallido.quotaNumber);
                            
                            console.log('Cuota actualizada encontrada:', cuotaActualizada);
                            
                            if (cuotaActualizada) {
                                // Calcular los pagos totales realizados en esta cuota (solo pagos válidos, no fallidos)
                                const pagosRealizados = (cuotaActualizada.payments || []).filter(p => p.failed !== true && p.valid !== false);
                                const capitalPagado = pagosRealizados.reduce((sum, p) => sum + (parseFloat(p.capital) || 0), 0);
                                const interesPagado = pagosRealizados.reduce((sum, p) => sum + (parseFloat(p.interest) || 0), 0);
                                
                                // Usar capital o principal según lo que tenga la cuota
                                const capitalCuota = parseFloat(cuotaActualizada.capital) || parseFloat(cuotaActualizada.principal) || 0;
                                const interesCuota = parseFloat(cuotaActualizada.interest) || 0;
                                
                                const capitalRestante = Math.round((capitalCuota - capitalPagado) * 100) / 100;
                                // El interés no provisionado NO afecta el saldo pendiente de interés de la amortización
                                const interesRestante = Math.round((interesCuota - interesPagado) * 100) / 100;
                                
                                console.log('Cálculo de saldos después del reintento:', {
                                    capitalCuota,
                                    interesCuota,
                                    capitalPagado,
                                    interesPagado,
                                    capitalRestante,
                                    interesRestante,
                                    pagosRealizados: pagosRealizados.length,
                                    pagosDetalle: pagosRealizados.map(p => ({
                                        capital: p.capital,
                                        interest: p.interest,
                                        failed: p.failed,
                                        valid: p.valid
                                    }))
                                });
                                
                                const epsilon = 0.01;
                                
                                // Si los saldos quedaron en 0 o muy cercanos a 0, marcar la cuota como pagada
                                if (capitalRestante <= epsilon && interesRestante <= epsilon) {
                                    console.log('Cuota completamente pagada, marcando como pagada...');
                                    
                                    const markPaidResponse = await fetch('apps/Prestamos/Maestro_Prestamos/api/pagos-endpoints.php?action=marcarCuotaPagada', {
                                        method: 'POST',
                                        headers: {
                                            'Content-Type': 'application/json',
                                        },
                                        body: JSON.stringify({
                                            prestamo_number: pagoFallido.prestamoId,
                                            quota_number: pagoFallido.quotaNumber,
                                            company: company
                                        })
                                    });

                                    if (markPaidResponse.ok) {
                                        const markPaidData = await markPaidResponse.json();
                                        if (markPaidData.success) {
                                            prestamosGrid.mostrarNotificacion('info', 'Cuota marcada como pagada automáticamente', 'Información');
                                            // Recargar nuevamente para mostrar el estado actualizado
                                            await prestamosGrid.recargarAmortizacion(pagoFallido.prestamoId);
                                        } else {
                                            console.warn('Error al marcar cuota como pagada:', markPaidData.message);
                                        }
                                    } else {
                                        const errorText = await markPaidResponse.text();
                                        console.warn('Error HTTP al marcar cuota como pagada:', markPaidResponse.status, errorText);
                                    }
                                } else {
                                    console.log('La cuota aún tiene saldo pendiente, no se marca como pagada:', {
                                        capitalRestante,
                                        interesRestante
                                    });
                                }
                            } else {
                                console.warn('No se encontró la cuota en la amortización actualizada');
                            }
                        }
                    }
                } catch (checkError) {
                    console.warn('Error al verificar si la cuota está completamente pagada:', checkError);
                    // No lanzar el error, continuar el flujo
                }
            }

            // Cerrar modal de carga y mostrar éxito
            await Swal.fire({
                title: '¡Éxito!',
                text: 'El pago se ha reintentado exitosamente.',
                icon: 'success',
                confirmButtonText: 'OK',
                confirmButtonColor: '#3085d6'
            });
            
            prestamosGrid.mostrarNotificacion('success', 'Pago reintentado exitosamente', 'Éxito');
            
        } catch (error) {
            console.error('Error al reintentar pago fallido:', error);
            
            // Cerrar modal de carga y mostrar error
            await Swal.fire({
                title: 'Error',
                text: `Error al reintentar pago: ${error.message}`,
                icon: 'error',
                confirmButtonText: 'OK',
                confirmButtonColor: '#d33'
            });
            
            prestamosGrid.mostrarNotificacion('error', `Error al reintentar pago: ${error.message}`, 'Error');
            
            // Recargar amortización para obtener datos actualizados (incluso en caso de error)
            try {
                await prestamosGrid.recargarAmortizacion(pagoFallido.prestamoId);
            } catch (reloadError) {
                console.error('Error al recargar amortización:', reloadError);
            }
        }
    }
    
    /**
     * Agregar pago manualmente ingresando el número de pago de SAP
     */
    async agregarPagoManualmente(pagoData) {
        const prestamosGrid = this.prestamosGrid;
        
        // Validar datos requeridos
        if (!pagoData.prestamoId || !pagoData.quotaNumber || !pagoData.company || !pagoData.payNumber) {
            prestamosGrid.mostrarNotificacion('error', 'Datos incompletos para agregar pago manualmente', 'Error');
            return;
        }
        
        // Validar que el número de pago de SAP esté presente
        if (!pagoData.paymentIdSapByD || pagoData.paymentIdSapByD.trim() === '') {
            prestamosGrid.mostrarNotificacion('error', 'El número de pago de SAP es requerido', 'Error');
            return;
        }
        
        console.log('Agregando pago manualmente con datos:', {
            prestamoId: pagoData.prestamoId,
            quotaNumber: pagoData.quotaNumber,
            company: pagoData.company,
            payNumber: pagoData.payNumber,
            paymentIdSapByD: pagoData.paymentIdSapByD
        });
        
        try {
            // Endpoint PUT: Actualizar estado del pago de failed: true a failed: false con el número de pago de SAP
            const updateResponse = await fetch('apps/Prestamos/Maestro_Prestamos/api/pagos-endpoints.php?action=actualizarPagoFallido', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    prestamoId: pagoData.prestamoId,
                    quotaNumber: pagoData.quotaNumber,
                    company: pagoData.company,
                    payNumber: parseInt(pagoData.payNumber),
                    paymentIdSapByD: pagoData.paymentIdSapByD.trim() // Asegurar que se envíe el valor sin espacios
                })
            });

            if (!updateResponse.ok) {
                const errorText = await updateResponse.text();
                throw new Error(`Error HTTP: ${updateResponse.status} - ${errorText}`);
            }

            const updateData = await updateResponse.json();
            
            if (!updateData.success) {
                throw new Error(updateData.message || 'Error al actualizar pago');
            }
            
            prestamosGrid.mostrarNotificacion('success', 'Pago agregado manualmente exitosamente', 'Éxito');
            
            // Verificar si el usuario marcó la opción de marcar cuota como pagada
            const marcarCuotaPagada = pagoData.marcarCuotaPagada || false;
            
            if (marcarCuotaPagada) {
                try {
                    const markPaidResponse = await fetch('apps/Prestamos/Maestro_Prestamos/api/pagos-endpoints.php?action=marcarCuotaPagada', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({
                            prestamo_number: pagoData.prestamoId,
                            quota_number: pagoData.quotaNumber,
                            company: pagoData.company
                        })
                    });

                    if (markPaidResponse.ok) {
                        const markPaidData = await markPaidResponse.json();
                        if (markPaidData.success) {
                            prestamosGrid.mostrarNotificacion('info', 'Cuota marcada como pagada', 'Información');
                        } else {
                            console.warn('Error al marcar cuota como pagada:', markPaidData.message);
                        }
                    } else {
                        const errorText = await markPaidResponse.text();
                        console.warn('Error HTTP al marcar cuota como pagada:', markPaidResponse.status, errorText);
                    }
                } catch (markPaidError) {
                    console.warn('Error al marcar cuota como pagada:', markPaidError);
                }
            }
            
            // Recargar amortización primero para obtener datos actualizados
            await prestamosGrid.recargarAmortizacion(pagoData.prestamoId);
            
            // Esperar un momento para asegurar que la amortización se recargó correctamente
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Verificar si la cuota quedó completamente pagada después de agregar el pago manualmente (solo si no se marcó manualmente)
            if (!marcarCuotaPagada) {
                try {
                    const amortizacionResponse = await fetch(`apps/Prestamos/Maestro_Prestamos/api/prestamos-endpoints.php?action=obtenerAmortizacion&loanNumber=${pagoData.prestamoId}`);
                
                if (amortizacionResponse.ok) {
                    const amortizacionData = await amortizacionResponse.json();
                    
                    if (amortizacionData.success && amortizacionData.data) {
                        const todasLasCuotas = [
                            ...(amortizacionData.data.paidInstallments || []),
                            ...(amortizacionData.data.pendingInstallments || [])
                        ];
                        
                        // Buscar la cuota específica
                        const cuotaActualizada = todasLasCuotas.find(c => c.period === pagoData.quotaNumber);
                        
                        if (cuotaActualizada) {
                            // Calcular los pagos totales realizados en esta cuota
                            // Incluir todos los pagos que no estén marcados como fallidos (failed !== true) y sean válidos (valid !== false)
                            // NOTA: El interés no provisionado NO se considera en los cálculos de saldos de la amortización
                            const pagosRealizados = (cuotaActualizada.payments || []).filter(p => p.failed !== true && p.valid !== false);
                            const capitalPagado = pagosRealizados.reduce((sum, p) => sum + (parseFloat(p.capital) || 0), 0);
                            const interesPagado = pagosRealizados.reduce((sum, p) => sum + (parseFloat(p.interest) || 0), 0);
                            
                            // Usar capital o principal según lo que tenga la cuota
                            const capitalCuota = parseFloat(cuotaActualizada.capital) || parseFloat(cuotaActualizada.principal) || 0;
                            const interesCuota = parseFloat(cuotaActualizada.interest) || 0;
                            
                            const capitalRestante = Math.round((capitalCuota - capitalPagado) * 100) / 100;
                            // El interés no provisionado NO afecta el saldo pendiente de interés de la amortización
                            const interesRestante = Math.round((interesCuota - interesPagado) * 100) / 100;
                            
                            const epsilon = 0.01;
                            
                            console.log('Validación de cuota pagada después de agregar pago manual:', {
                                cuota: pagoData.quotaNumber,
                                capitalCuota,
                                capitalPagado,
                                capitalRestante,
                                interesCuota,
                                interesPagado,
                                interesRestante,
                                pagosRealizados: pagosRealizados.length,
                                pagosDetalle: pagosRealizados.map(p => ({
                                    capital: p.capital,
                                    interest: p.interest,
                                    failed: p.failed,
                                    valid: p.valid
                                }))
                            });
                            
                            // Si los saldos quedaron en 0 o muy cercanos a 0, marcar la cuota como pagada
                            if (capitalRestante <= epsilon && interesRestante <= epsilon) {
                                console.log('Cuota completamente pagada, marcando como pagada...');
                                
                                const markPaidResponse = await fetch('apps/Prestamos/Maestro_Prestamos/api/pagos-endpoints.php?action=marcarCuotaPagada', {
                                    method: 'POST',
                                    headers: {
                                        'Content-Type': 'application/json',
                                    },
                                    body: JSON.stringify({
                                        prestamo_number: pagoData.prestamoId,
                                        quota_number: pagoData.quotaNumber,
                                        company: pagoData.company
                                    })
                                });

                                if (markPaidResponse.ok) {
                                    const markPaidData = await markPaidResponse.json();
                                    if (markPaidData.success) {
                                        prestamosGrid.mostrarNotificacion('info', 'Cuota marcada como pagada automáticamente', 'Información');
                                        // Recargar nuevamente para mostrar el estado actualizado
                                        await prestamosGrid.recargarAmortizacion(pagoData.prestamoId);
                                    } else {
                                        console.warn('Error al marcar cuota como pagada:', markPaidData.message);
                                    }
                                } else {
                                    const errorText = await markPaidResponse.text();
                                    console.warn('Error HTTP al marcar cuota como pagada:', markPaidResponse.status, errorText);
                                }
                            } else {
                                console.log('La cuota aún tiene saldo pendiente:', {
                                    capitalRestante,
                                    interesRestante
                                });
                            }
                        } else {
                            console.warn('No se encontró la cuota en la amortización actualizada');
                        }
                    }
                }
                } catch (checkError) {
                    console.warn('Error al verificar si la cuota está completamente pagada:', checkError);
                    // No lanzar el error, continuar el flujo
                }
            }
            
        } catch (error) {
            console.error('Error al agregar pago manualmente:', error);
            prestamosGrid.mostrarNotificacion('error', `Error al agregar pago manualmente: ${error.message}`, 'Error');
        }
    }

    /**
     * Verificar si hay factura IPM pendiente
     */
    async verificarFacturaIPMPendiente(prestamoId, cuotaId) {
        try {
            const response = await fetch(`apps/Prestamos/Maestro_Prestamos/api/pagos-endpoints.php?action=obtenerFacturaIPM&prestamo=${prestamoId}&cuota=${cuotaId}`);
            
            if (!response.ok) {
                return; // Si hay error, simplemente no mostrar la tabla
            }
            
            const result = await response.json();
            
            if (result.success && result.data) {
                // Hay factura pendiente, mostrar tabla
                const divFacturaIPM = document.getElementById('divFacturaIPM');
                const tablaFacturasIPM = document.getElementById('tablaFacturasIPM');
                
                if (divFacturaIPM && tablaFacturasIPM) {
                    const factura = result.data;
                    const estaPagada = factura.paid === true;
                    
                    // Formatear montos
                    const montoTotal = (factura.monto || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    const montoPagado = (factura.montoPagado || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    const montoPendiente = (factura.montoFaltante || factura.monto || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                    
                    // Estilos para factura pagada (deshabilitada)
                    const trStyle = estaPagada ? 'padding: 0.25rem; opacity: 0.6; background-color: #f5f5f5;' : 'padding: 0.25rem;';
                    const checkboxDisabled = estaPagada ? 'disabled' : '';
                    const checkboxStyle = estaPagada ? 'margin: 0; cursor: not-allowed;' : 'margin: 0; cursor: pointer;';
                    const textoStyle = estaPagada ? 'font-size: 0.85rem; color: #999;' : 'font-size: 0.85rem;';
                    const montoPendienteStyle = estaPagada ? 'font-size: 0.85rem; color: #999;' : 'font-size: 0.85rem;';
                    
                    tablaFacturasIPM.innerHTML = `
                        <tr style="${trStyle}">
                            <td class="text-center align-middle" style="padding: 0.25rem;">
                                <input type="checkbox" class="form-check-input checkbox-factura-ipm" 
                                    style="${checkboxStyle}"
                                    id="facturaIPM_${factura.facturaId}"
                                    data-factura-id="${factura.facturaId}"
                                    data-monto-pendiente="${factura.montoFaltante || factura.monto || 0}"
                                    data-paid="${factura.paid || false}"
                                    ${checkboxDisabled}>
                            </td>
                            <td style="padding: 0.25rem;" class="align-middle"><strong style="${textoStyle}">${factura.facturaId}${estaPagada ? ' (Pagada)' : ''}</strong></td>
                            <td class="text-end align-middle" style="padding: 0.25rem; ${textoStyle}">L. ${montoTotal}</td>
                            <td class="text-end align-middle" style="padding: 0.25rem; ${textoStyle}">L. ${montoPagado}</td>
                            <td class="text-end align-middle" style="padding: 0.25rem;"><strong class="${estaPagada ? 'text-secondary' : 'text-primary'}" style="${montoPendienteStyle}">L. ${montoPendiente}</strong></td>
                        </tr>
                    `;
                    
                    divFacturaIPM.style.display = 'block';
                    
                    // Configurar eventos de checkboxes
                    const checkboxes = tablaFacturasIPM.querySelectorAll('.checkbox-factura-ipm');
                    checkboxes.forEach(checkbox => {
                        checkbox.addEventListener('change', (e) => {
                            // Validar que la factura no esté pagada
                            const estaPagada = e.target.getAttribute('data-paid') === 'true';
                            if (estaPagada) {
                                e.target.checked = false;
                                prestamosGrid.mostrarNotificacion('warning', 'Esta factura IPM ya está pagada y no puede ser seleccionada.', 'Factura pagada');
                                return;
                            }
                            
                            // Solo permitir un checkbox seleccionado a la vez
                            checkboxes.forEach(cb => {
                                if (cb !== e.target) {
                                    cb.checked = false;
                                }
                            });
                            
                            // Si se selecciona, actualizar el monto de interés
                            if (e.target.checked) {
                                const montoPendiente = parseFloat(e.target.getAttribute('data-monto-pendiente')) || 0;
                                const interesInput = document.getElementById('pagoInteres');
                                if (interesInput) {
                                    interesInput.value = montoPendiente.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                                    // Disparar evento input para recalcular
                                    interesInput.dispatchEvent(new Event('input', { bubbles: true }));
                                }
                            } else {
                                // Si se deselecciona, limpiar el monto de interés
                                const interesInput = document.getElementById('pagoInteres');
                                if (interesInput) {
                                    interesInput.value = '';
                                    interesInput.dispatchEvent(new Event('input', { bubbles: true }));
                                }
                            }
                        });
                    });
                }
            }
        } catch (error) {
            console.warn('Error al verificar factura IPM pendiente:', error);
        }
    }
}

