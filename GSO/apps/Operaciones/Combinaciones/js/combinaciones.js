/**
 * Módulo de Combinaciones de Lotes
 * Gestiona la combinación de lotes de artículos
 */

class CombinacionesLotes {
    constructor() {
        this.lotes = []; // Array de todos los lotes disponibles
        this.lotesFiltrados = []; // Lotes filtrados según búsqueda
        this.lotePadre = null; // Lote seleccionado como padre
        this.loteHijo = null; // Lote seleccionado como hijo
        this.loteSeleccionado = null; // Lote actualmente seleccionado en el grid

        // Filtros
        this.terminoBusqueda = ''; // Texto de búsqueda
        this.categoriaSeleccionada = ''; // Categoría seleccionada (combobox)
        
        this.init();
    }

    /**
     * Inicialización del módulo
     */
    init() {
        this.setupEventListeners();
        this.cargarCategoriasProducto();
        // Los lotes se cargarán cuando se seleccione una categoría
    }

    /**
     * Configurar event listeners
     */
    setupEventListeners() {
        // Búsqueda de lotes
        const searchInput = document.getElementById('searchLotes');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.terminoBusqueda = e.target.value ?? '';
                this.aplicarFiltros();
            });
        }

        // Filtro por categoría de producto
        const cmbCategoria = document.getElementById('cmbCategoriaProducto');
        if (cmbCategoria) {
            // Select2 requiere jQuery para eventos
            $(cmbCategoria).on('change', (e) => {
                this.categoriaSeleccionada = e.target.value ?? '';
                // Recargar lotes cuando cambie la categoría
                this.cargarLotes();
            });
        }

        // Botón refrescar
        const btnRefrescar = document.getElementById('btnRefrescar');
        if (btnRefrescar) {
            btnRefrescar.addEventListener('click', () => {
                this.cargarLotes();
            });
        }

        // Botón limpiar selección
        const btnLimpiar = document.getElementById('btnLimpiarSeleccion');
        if (btnLimpiar) {
            btnLimpiar.addEventListener('click', () => {
                this.limpiarSeleccion();
            });
        }

        // Botón combinar lotes
        const btnCombinar = document.getElementById('btnCombinarLotes');
        if (btnCombinar) {
            btnCombinar.addEventListener('click', () => {
                this.mostrarModalConfirmacion();
            });
        }

        // Botón confirmar combinación en modal
        const btnConfirmar = document.getElementById('btnConfirmarCombinacion');
        if (btnConfirmar) {
            btnConfirmar.addEventListener('click', () => {
                this.combinarLotes();
            });
        }
    }

    /**
     * Cargar lotes desde la API
     * Endpoint: api/combinaciones-endpoints.php?action=getInventory&ccatcpUuid={categoria}
     */
    async cargarLotes() {
        const loadingDiv = document.getElementById('loadingLotes');
        const gridDiv = document.getElementById('lotesGrid');
        
        try {
            // Si no hay categoría seleccionada, mostrar mensaje inicial
            if (!this.categoriaSeleccionada || this.categoriaSeleccionada === '') {
                this.lotes = [];
                this.lotesFiltrados = [];
                if (gridDiv) {
                    gridDiv.innerHTML = `<p class="text-muted fw-semibold">Seleccione una categoría para ver los lotes disponibles</p>`;
                    gridDiv.classList.remove('has-content');
                }
                return;
            }

            // Mostrar loading y ocultar grid
            if (loadingDiv) loadingDiv.style.display = 'block';
            if (gridDiv) gridDiv.style.display = 'none';

            const endpoint = 'apps/Operaciones/Combinaciones/api/combinaciones-endpoints.php';
            const url = `${endpoint}?action=getInventory&ccatcpUuid=${encodeURIComponent(this.categoriaSeleccionada)}`;

            const response = await fetch(url);
            const result = await response.json();

            if (!result.success) {
                throw new Error(result.message || 'Error al obtener lotes');
            }

            // Mapear datos y agregar id temporal (índice del array)
            this.lotes = (result.data || []).map((lote, index) => ({
                ...lote,
                id: index + 1, // ID temporal basado en índice
            }));

            this.aplicarFiltros();
        } catch (error) {
            console.error('Error al cargar lotes:', error);
            this.mostrarError('Error al cargar los lotes. Por favor, intente nuevamente.');
            this.lotes = [];
            this.lotesFiltrados = [];
            
            // Mostrar mensaje de error en el grid
            if (gridDiv) {
                gridDiv.innerHTML = `
                    <div style="text-align: center;">
                        <i class="ki-duotone ki-cross-circle fs-3x text-danger mb-3 d-block">
                            <span class="path1"></span>
                            <span class="path2"></span>
                        </i>
                        <p class="text-danger fw-semibold mb-2">Error al cargar los lotes</p>
                        <small class="text-muted">${error.message || 'Por favor, intente nuevamente'}</small>
                    </div>
                `;
                gridDiv.classList.remove('has-content');
            }
        } finally {
            // Ocultar loading y mostrar grid
            if (loadingDiv) loadingDiv.style.display = 'none';
            if (gridDiv) gridDiv.style.display = 'block';
        }
    }

    /**
     * Cargar categorías de producto desde endpoint interno (PHP proxy)
     *
     * Endpoint interno:
     * - apps/Operaciones/Combinaciones/api/combinaciones-endpoints.php?action=getProductCategory
     */
    async cargarCategoriasProducto() {
        const select = document.getElementById('cmbCategoriaProducto');
        if (!select) return;

        try {
            // Estado inicial
            select.disabled = true;

            const url = 'apps/Operaciones/Combinaciones/api/combinaciones-endpoints.php?action=getProductCategory';
            const resp = await fetch(url, { method: 'GET' });
            const json = await resp.json();

            if (!resp.ok || !json?.success) {
                const msg = json?.message ?? `Error HTTP ${resp.status}`;
                throw new Error(msg);
            }

            const data = Array.isArray(json.data) ? json.data : [];
            // Limpiar dejando la opción default
            select.innerHTML = '<option value="">Todas las categorías</option>';

            data.forEach((item) => {
                const value = item?.value ?? '';
                const text = item?.text ?? value;
                if (!value) return;

                const opt = document.createElement('option');
                opt.value = value;
                opt.textContent = text;
                select.appendChild(opt);
            });

            // Mantener selección si ya existía
            if (this.categoriaSeleccionada) {
                select.value = this.categoriaSeleccionada;
            }

            select.disabled = false;

            // Si Select2 está inicializado, refrescamos visualmente
            if (window.jQuery && window.jQuery.fn && typeof window.jQuery(select).trigger === 'function') {
                const $select = window.jQuery(select);
                $select.trigger('change');
                $select.trigger('change.select2');
            }
        } catch (error) {
            console.error('Error al cargar categorías de producto:', error);
            // No bloqueamos el uso del módulo por fallo del combo
            select.disabled = false;
        }
    }

    /**
     * Aplicar filtros combinados (solo búsqueda, la categoría ya filtra desde el API)
     */
    aplicarFiltros() {
        const termino = (this.terminoBusqueda ?? '').trim().toLowerCase();

        this.lotesFiltrados = this.lotes.filter((lote) => {
            // Filtro por búsqueda (lote, código de artículo y nombre de artículo)
            const matchBusqueda =
                !termino ||
                (lote.codigo ?? '').toLowerCase().includes(termino) ||
                (lote.articulo ?? '').toLowerCase().includes(termino) ||
                (lote.nombreArticulo ?? '').toLowerCase().includes(termino) ||
                (lote.ubicacion ?? '').toLowerCase().includes(termino);

            return matchBusqueda;
        });

        this.renderizarLotes();
    }

    /**
     * Renderizar lotes en el grid
     */
    renderizarLotes() {
        const grid = document.getElementById('lotesGrid');
        if (!grid) return;

        if (this.lotesFiltrados.length === 0) {
            grid.innerHTML = `<p class="text-muted fw-semibold">No se encontraron lotes</p>`;
            grid.classList.remove('has-content');
            return;
        }

        grid.classList.add('has-content');
        grid.innerHTML = this.lotesFiltrados.map(lote => this.crearCardLote(lote)).join('');
        
        // Agregar event listeners a las cards
        this.lotesFiltrados.forEach(lote => {
            const card = document.querySelector(`[data-lote-id="${lote.id}"]`);
            if (card) {
                card.addEventListener('click', (e) => {
                    // No hacer nada si se hace clic en los botones
                    if (e.target.closest('.btn')) return;
                    this.seleccionarLote(lote);
                });
            }

            // Botón "Asignar como Padre"
            const btnPadre = document.querySelector(`[data-lote-id="${lote.id}"] .btn-asignar-padre`);
            if (btnPadre) {
                btnPadre.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.asignarComoPadre(lote);
                });
            }

            // Botón "Asignar como Hijo"
            const btnHijo = document.querySelector(`[data-lote-id="${lote.id}"] .btn-asignar-hijo`);
            if (btnHijo) {
                btnHijo.addEventListener('click', (e) => {
                    e.stopPropagation();
                    this.asignarComoHijo(lote);
                });
            }
        });
    }

    /**
     * Crear HTML de la card de lote
     */
    crearCardLote(lote) {
        const estaSeleccionado = this.loteSeleccionado?.id === lote.id;
        const esPadre = this.lotePadre?.id === lote.id;
        const esHijo = this.loteHijo?.id === lote.id;
        const enCombinacion = esPadre || esHijo;
        const puedeCombinar = this.puedeCombinar(lote);

        const clasesCard = [
            'lote-card',
            estaSeleccionado ? 'selected' : '',
            enCombinacion ? 'in-combination' : '',
            !puedeCombinar ? 'invalid' : ''
        ].filter(c => c).join(' ');

        // Formatear cantidad con 2 decimales
        const cantidadFormateada = typeof lote.cantidad === 'number' 
            ? lote.cantidad.toFixed(2) 
            : parseFloat(lote.cantidad || 0).toFixed(2);

        // Badge para tipo de lote no válido
        const badgeNoDisponible = !puedeCombinar ? `
            <span class="lote-card-badge inactivo">No disponible</span>
        ` : '';

        return `
            <div class="${clasesCard}" data-lote-id="${lote.id}">
                <div class="lote-card-header">
                    <span class="lote-card-codigo">${lote.codigo || 'N/A'}</span>
                    ${badgeNoDisponible}
                </div>
                <div class="lote-card-body">
                    <div class="lote-card-item">
                        <span class="lote-card-item-label">Artículo:</span>
                        <span class="lote-card-item-value">${lote.articulo || 'N/A'}</span>
                    </div>
                    <div class="lote-card-item">
                        <span class="lote-card-item-label">Cantidad:</span>
                        <span class="lote-card-item-value">${cantidadFormateada} ${lote.unidad || ''}</span>
                    </div>
                    <div class="lote-card-item">
                        <span class="lote-card-item-label">Ubicación:</span>
                        <span class="lote-card-item-value">${lote.ubicacion || 'N/A'}</span>
                    </div>
                    <div class="lote-card-item">
                        <span class="lote-card-item-label">Tipo de Lote:</span>
                        <span class="lote-card-item-value">${lote.tipoLote || 'N/A'}</span>
                    </div>
                    ${!puedeCombinar ? `
                    <div class="lote-card-item mt-2">
                        <small class="text-danger">
                            <i class="ki-duotone ki-information fs-6 me-1">
                                <span class="path1"></span>
                                <span class="path2"></span>
                                <span class="path3"></span>
                            </i>
                            Solo se permiten tipos de lote ID: 1 o 2
                        </small>
                    </div>
                    ` : ''}
                </div>
                ${puedeCombinar ? `
                <div class="lote-card-footer">
                    <button type="button" class="btn btn-sm btn-primary btn-asignar-padre" ${esPadre ? 'disabled' : ''}>
                        <i class="ki-duotone ki-star fs-6 me-1">
                            <span class="path1"></span>
                            <span class="path2"></span>
                        </i>
                        Padre
                    </button>
                    <button type="button" class="btn btn-sm btn-warning btn-asignar-hijo" ${esHijo ? 'disabled' : ''}>
                        <i class="ki-duotone ki-arrow-down fs-6 me-1">
                            <span class="path1"></span>
                            <span class="path2"></span>
                        </i>
                        Hijo
                    </button>
                </div>
                ` : ''}
            </div>
        `;
    }

    /**
     * Seleccionar un lote en el grid
     */
    seleccionarLote(lote) {
        this.loteSeleccionado = lote;
        this.renderizarLotes();
    }

    /**
     * Validar si un lote puede combinarse (tipo de lote debe ser 1 o 2)
     */
    puedeCombinar(lote) {
        const tipoLoteId = lote.tipoLoteId || lote.puedeCombinar;
        // Validar explícitamente que sea 1 o 2
        return tipoLoteId === '1' || tipoLoteId === '2' || tipoLoteId === 1 || tipoLoteId === 2;
    }

    /**
     * Obtener nombre del tipo de lote desde el ID
     */
    obtenerNombreTipoLote(lote) {
        const tipoLoteId = String(lote.tipoLoteId || '');
        const tipoLoteTexto = lote.tipoLote || '';
        
        // Si tenemos el texto descriptivo, usarlo; sino inferir desde el ID
        if (tipoLoteTexto) {
            return tipoLoteTexto;
        }
        
        // Mapeo por ID
        if (tipoLoteId === '1') return 'Estándar';
        if (tipoLoteId === '2') return 'Promedio variable';
        
        return 'Desconocido';
    }

    /**
     * Validar que la combinación de dos lotes sea válida
     */
    /**
     * Obtener prefijo del artículo (primeras 3 letras del código)
     */
    obtenerPrefijoArticulo(articuloId) {
        if (!articuloId || typeof articuloId !== 'string') return null;
        
        const upperId = articuloId.toUpperCase().trim();
        // Extraer las primeras 3 letras como prefijo
        if (upperId.length >= 3) {
            return upperId.substring(0, 3);
        }
        
        return null;
    }

    /**
     * Obtiene valor desde rawData con búsqueda flexible de llaves.
     */
    getRawValue(rawData, expectedKeys = []) {
        if (!rawData || typeof rawData !== 'object') return '';

        const normalizeKey = (key) => String(key || '').toUpperCase().replace(/[^A-Z0-9]/g, '');
        const lookup = {};

        Object.keys(rawData).forEach((key) => {
            lookup[normalizeKey(key)] = rawData[key];
        });

        for (const expectedKey of expectedKeys) {
            const value = lookup[normalizeKey(expectedKey)];
            if (value !== undefined && value !== null) {
                return value;
            }
        }

        return '';
    }

    validarCombinacion(lote1, lote2) {
        // Ambos deben poder combinarse (tipo 1 o 2)
        if (!this.puedeCombinar(lote1)) {
            const tipoLote1 = this.obtenerNombreTipoLote(lote1);
            return {
                valida: false,
                mensaje: `El lote "${lote1.codigo}" (${tipoLote1}) no está disponible para combinar. Solo se permiten lotes con tipo de lote ID 1 o 2.`
            };
        }

        if (!this.puedeCombinar(lote2)) {
            const tipoLote2 = this.obtenerNombreTipoLote(lote2);
            return {
                valida: false,
                mensaje: `El lote "${lote2.codigo}" (${tipoLote2}) no está disponible para combinar. Solo se permiten lotes con tipo de lote ID 1 o 2.`
            };
        }

        // Validar que ambos artículos tengan prefijos válidos (primeras 3 letras)
        const prefijo1 = this.obtenerPrefijoArticulo(lote1.articulo);
        const prefijo2 = this.obtenerPrefijoArticulo(lote2.articulo);

        if (!prefijo1 || !prefijo2) {
            return {
                valida: false,
                mensaje: 'Los artículos deben tener al menos 3 caracteres en su código para poder combinarse.'
            };
        }

        // Validar que ambos artículos tengan el mismo prefijo (primeras 3 letras)
        if (prefijo1 !== prefijo2) {
            return {
                valida: false,
                mensaje: `No se pueden combinar artículos de diferentes tipos. El lote "${lote1.codigo}" tiene prefijo "${prefijo1}" y el lote "${lote2.codigo}" tiene prefijo "${prefijo2}". Solo se pueden combinar artículos con el mismo prefijo (primeras 3 letras).`
            };
        }

        // Validar cantidades
        const cantidadPadre = parseFloat(lote1.cantidad) || 0;
        const cantidadHijo = parseFloat(lote2.cantidad) || 0;

        // No permitir combinar si ambos lotes tienen cantidad 0
        if (cantidadPadre === 0 && cantidadHijo === 0) {
            return {
                valida: false,
                mensaje: `No se pueden combinar lotes que ambos tienen cantidad 0. Lote padre "${lote1.codigo}" y lote hijo "${lote2.codigo}" tienen cantidad 0.`
            };
        }

        // No permitir combinar si el lote hijo tiene cantidad 0 (no hay nada que transferir)
        if (cantidadHijo === 0) {
            return {
                valida: false,
                mensaje: `El lote hijo "${lote2.codigo}" no tiene cantidad disponible para combinar (cantidad: 0).`
            };
        }

        // Validar combinación de tipos específicos (solo por IDs de tipo de lote)
        // Regla: NO se puede cuando padre es tipo 2 (Promedio variable) y hijo es tipo 1 (Estándar)
        // Pero SÍ se puede cuando padre es tipo 1 (Estándar) y hijo es tipo 2 (Promedio variable)
        const tipoLote1Id = String(lote1.tipoLoteId || '');
        const tipoLote2Id = String(lote2.tipoLoteId || '');
        const tipoLote1Nombre = this.obtenerNombreTipoLote(lote1);
        const tipoLote2Nombre = this.obtenerNombreTipoLote(lote2);

        // Validación específica: Solo se bloquea cuando padre (lote1) es Promedio variable (2) y hijo (lote2) es Estándar (1)
        if (tipoLote1Id === '2' && tipoLote2Id === '1') {
            return {
                valida: false,
                mensaje: `Lote de ${tipoLote1Nombre} no puede ser combinado a uno ${tipoLote2Nombre}.`
            };
        }

        return { valida: true };
    }

    /**
     * Asignar lote como padre
     */
    asignarComoPadre(lote) {
        // Validar que el lote pueda combinarse
        if (!this.puedeCombinar(lote)) {
            const tipoLote = this.obtenerNombreTipoLote(lote);
            this.mostrarError(`El lote "${lote.codigo}" (${tipoLote}) no está disponible para combinar. Solo se permiten lotes con tipo de lote ID 1 o 2.`);
            return;
        }

        // Si ya hay un lote hijo asignado, validar la combinación
        if (this.loteHijo) {
            const validacion = this.validarCombinacion(lote, this.loteHijo);
            if (!validacion.valida) {
                this.mostrarError(validacion.mensaje);
                return;
            }
        }

        if (this.loteHijo?.id === lote.id) {
            this.loteHijo = null; // Quitar de hijo si ya estaba asignado
        }
        
        this.lotePadre = lote;
        this.actualizarAreaCombinacion();
        this.actualizarVistaPrevia();
        this.renderizarLotes();
    }

    /**
     * Asignar lote como hijo
     */
    asignarComoHijo(lote) {
        // Validar que el lote pueda combinarse
        if (!this.puedeCombinar(lote)) {
            const tipoLote = this.obtenerNombreTipoLote(lote);
            this.mostrarError(`El lote "${lote.codigo}" (${tipoLote}) no está disponible para combinar. Solo se permiten lotes con tipo de lote ID 1 o 2.`);
            return;
        }

        // Si ya hay un lote padre asignado, validar la combinación
        if (this.lotePadre) {
            const validacion = this.validarCombinacion(this.lotePadre, lote);
            if (!validacion.valida) {
                this.mostrarError(validacion.mensaje);
                return;
            }
        }

        if (this.lotePadre?.id === lote.id) {
            this.lotePadre = null; // Quitar de padre si ya estaba asignado
        }
        
        this.loteHijo = lote;
        this.actualizarAreaCombinacion();
        this.actualizarVistaPrevia();
        this.renderizarLotes();
    }

    /**
     * Actualizar área de combinación
     */
    actualizarAreaCombinacion() {
        const areaPadre = document.getElementById('lotePadreArea');
        const areaHijo = document.getElementById('loteHijoArea');
        const btnCombinar = document.getElementById('btnCombinarLotes');

        // Área padre
        if (this.lotePadre) {
            areaPadre.className = 'combinacion-slot combinacion-slot-filled padre';
            areaPadre.innerHTML = this.crearCardCombinacion(this.lotePadre, 'padre');
            
            // Botón remover padre
            const btnRemover = areaPadre.querySelector('.btn-remover');
            if (btnRemover) {
                btnRemover.addEventListener('click', () => {
                    this.lotePadre = null;
                    this.actualizarAreaCombinacion();
                    this.actualizarVistaPrevia();
                    this.renderizarLotes();
                });
            }
        } else {
            areaPadre.className = 'combinacion-slot combinacion-slot-empty';
            areaPadre.innerHTML = `
                <div class="text-center py-10">
                    <i class="ki-duotone ki-information-5 fs-3x text-gray-400 mb-3">
                        <span class="path1"></span>
                        <span class="path2"></span>
                        <span class="path3"></span>
                    </i>
                    <p class="text-muted fw-semibold">Seleccione un lote como padre</p>
                    <small class="text-muted">Haga clic en un lote y seleccione "Asignar como Padre"</small>
                </div>
            `;
        }

        // Área hijo
        if (this.loteHijo) {
            areaHijo.className = 'combinacion-slot combinacion-slot-filled hijo';
            areaHijo.innerHTML = this.crearCardCombinacion(this.loteHijo, 'hijo');
            
            // Botón remover hijo
            const btnRemover = areaHijo.querySelector('.btn-remover');
            if (btnRemover) {
                btnRemover.addEventListener('click', () => {
                    this.loteHijo = null;
                    this.actualizarAreaCombinacion();
                    this.actualizarVistaPrevia();
                    this.renderizarLotes();
                });
            }
        } else {
            areaHijo.className = 'combinacion-slot combinacion-slot-empty';
            areaHijo.innerHTML = `
                <div class="text-center py-10">
                    <i class="ki-duotone ki-information-5 fs-3x text-gray-400 mb-3">
                        <span class="path1"></span>
                        <span class="path2"></span>
                        <span class="path3"></span>
                    </i>
                    <p class="text-muted fw-semibold">Seleccione un lote para combinar</p>
                    <small class="text-muted">Haga clic en un lote y seleccione "Asignar como Hijo"</small>
                </div>
            `;
        }

        // Habilitar/deshabilitar botón combinar
        if (btnCombinar) {
            btnCombinar.disabled = !(this.lotePadre && this.loteHijo);
        }
    }

    /**
     * Crear card para el área de combinación
     */
    crearCardCombinacion(lote, rol) {
        // Formatear cantidad con 2 decimales
        const cantidadFormateada = typeof lote.cantidad === 'number' 
            ? lote.cantidad.toFixed(2) 
            : parseFloat(lote.cantidad || 0).toFixed(2);

        return `
            <div class="combinacion-lote-card ${rol}">
                <button type="button" class="btn btn-sm btn-icon btn-light-danger btn-remover">
                    <i class="ki-duotone ki-cross fs-4">
                        <span class="path1"></span>
                        <span class="path2"></span>
                    </i>
                </button>
                <span class="lote-role-badge">${rol === 'padre' ? 'Padre' : 'Hijo'}</span>
                <div class="mb-3">
                    <strong class="fs-4">${lote.codigo || 'N/A'}</strong>
                </div>
                <div class="d-flex flex-column gap-2">
                    <div>
                        <span class="text-muted fs-7">Artículo:</span>
                        <div class="fw-semibold">${lote.articulo || 'N/A'}</div>
                    </div>
                    <div>
                        <span class="text-muted fs-7">Cantidad:</span>
                        <div class="fw-bold text-primary">${cantidadFormateada} ${lote.unidad || ''}</div>
                    </div>
                    <div>
                        <span class="text-muted fs-7">Ubicación:</span>
                        <div class="fw-semibold">${lote.ubicacion || 'N/A'}</div>
                    </div>
                    <div>
                        <span class="text-muted fs-7">Tipo de Lote:</span>
                        <div class="fw-semibold">${lote.tipoLote || 'N/A'}</div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Actualizar vista previa del resultado
     */
    actualizarVistaPrevia() {
        const preview = document.getElementById('previewResultado');
        const cantidadTotal = document.getElementById('previewCantidadTotal');
        const loteResultante = document.getElementById('previewLoteResultante');
        const articulo = document.getElementById('previewArticulo');

        if (this.lotePadre && this.loteHijo) {
            const cantidadTotalCalculada = this.lotePadre.cantidad + this.loteHijo.cantidad;
            const unidad = this.lotePadre.unidad || this.loteHijo.unidad || '';

            if (preview) preview.style.display = 'block';
            if (cantidadTotal) cantidadTotal.textContent = `${cantidadTotalCalculada.toFixed(2)} ${unidad}`;
            if (loteResultante) loteResultante.textContent = this.lotePadre.codigo;
            
            // Mostrar artículos de ambos lotes si son diferentes
            if (articulo) {
                if (this.lotePadre.articulo === this.loteHijo.articulo) {
                    articulo.textContent = this.lotePadre.articulo;
                } else {
                    articulo.textContent = `${this.lotePadre.articulo} + ${this.loteHijo.articulo}`;
                }
            }
        } else {
            if (preview) preview.style.display = 'none';
            if (cantidadTotal) cantidadTotal.textContent = '0';
            if (loteResultante) loteResultante.textContent = '-';
            if (articulo) articulo.textContent = '-';
        }
    }

    /**
     * Limpiar selección
     */
    limpiarSeleccion() {
        this.lotePadre = null;
        this.loteHijo = null;
        this.loteSeleccionado = null;
        this.actualizarAreaCombinacion();
        this.actualizarVistaPrevia();
        this.renderizarLotes();
    }

    /**
     * Mostrar modal de confirmación
     */
    mostrarModalConfirmacion() {
        if (!this.lotePadre || !this.loteHijo) return;

        // La validación ya se hizo al seleccionar los lotes, pero verificamos una vez más por seguridad
        const validacion = this.validarCombinacion(this.lotePadre, this.loteHijo);
        if (!validacion.valida) {
            this.mostrarError(validacion.mensaje);
            return;
        }

        const modal = new bootstrap.Modal(document.getElementById('modalConfirmarCombinacion'));
        const detalles = document.getElementById('modalDetallesCombinacion');
        
        if (detalles) {
            const cantidadTotal = this.lotePadre.cantidad + this.loteHijo.cantidad;
            const tipoPadre = this.lotePadre.tipoLoteId || 'N/A';
            const tipoHijo = this.loteHijo.tipoLoteId || 'N/A';
            
            detalles.innerHTML = `
                <div class="alert alert-info">
                    <div class="mb-2"><strong>Lote Padre:</strong> ${this.lotePadre.codigo} (${this.lotePadre.cantidad} ${this.lotePadre.unidad}) - Tipo ID: ${tipoPadre}</div>
                    <div class="mb-2"><strong>Lote Hijo:</strong> ${this.loteHijo.codigo} (${this.loteHijo.cantidad} ${this.loteHijo.unidad}) - Tipo ID: ${tipoHijo}</div>
                    <div class="mb-0"><strong>Resultado:</strong> El lote ${this.lotePadre.codigo} tendrá ${cantidadTotal} ${this.lotePadre.unidad} y el lote ${this.loteHijo.codigo} pasara a cantidad 0.</div>
                </div>
            `;
        }

        modal.show();
    }

    /**
     * Combinar los lotes
     */
    async combinarLotes() {
        try {
            // Validar que ambos lotes existan
            if (!this.lotePadre || !this.loteHijo) {
                this.mostrarError('Debe seleccionar un lote padre y un lote hijo para combinar.');
                return;
            }

            // Validar una vez más la combinación
            const validacion = this.validarCombinacion(this.lotePadre, this.loteHijo);
            if (!validacion.valida) {
                this.mostrarError(validacion.mensaje);
                return;
            }

            // Obtener datos rawData de ambos lotes
            const rawPadre = this.lotePadre.rawData || {};
            const rawHijo = this.loteHijo.rawData || {};

            // Preparar payload según especificaciones
            const payload = {
                idMaterial: String(this.getRawValue(rawHijo, ['CMATERIAL_UUID_01', 'MATERIAL_UUID_01', 'MATERIAL_ID']) || this.loteHijo.articulo || ''),
                idMaterialDestino: String(this.getRawValue(rawPadre, ['CMATERIAL_UUID_01', 'MATERIAL_UUID_01', 'MATERIAL_ID']) || this.lotePadre.articulo || ''),
                idLoteOrigen: String(this.getRawValue(rawHijo, ['CISTOCK_ID', 'ISTOCK_ID', 'STOCK_ID']) || this.loteHijo.codigo || ''),
                idLoteDestino: String(this.getRawValue(rawPadre, ['CISTOCK_ID', 'ISTOCK_ID', 'STOCK_ID']) || this.lotePadre.codigo || ''),
                idSedeOrigen: String(this.getRawValue(rawHijo, ['CSITE_UUID', 'SITE_UUID', 'SEDE']) || ''),
                idSedeDestino: String(this.getRawValue(rawPadre, ['CSITE_UUID', 'SITE_UUID', 'SEDE']) || ''),
                idAlmacenOrigen: String(this.getRawValue(rawHijo, ['CLOCATION_UUID', 'LOCATION_UUID', 'ALMACEN']) || ''),
                idAlmacenDestino: String(this.getRawValue(rawPadre, ['CLOCATION_UUID', 'LOCATION_UUID', 'ALMACEN']) || ''),
                idAreaLogisticaOrigen: String(this.getRawValue(rawHijo, ['CLOA_ID', 'LOA_ID', 'AREA_LOGISTICA']) || ''),
                idAreaLogisticaDestino: String(this.getRawValue(rawPadre, ['CLOA_ID', 'LOA_ID', 'AREA_LOGISTICA']) || ''),
                tipo: 'C',
                cantidad: {
                    unitCode: String(this.getRawValue(rawHijo, ['CINV_UNIT', 'INV_UNIT', 'UNIT']) || this.loteHijo.unidad || ''),
                    value: String(this.getRawValue(rawHijo, ['KCINV_QUAN_NORM', 'CINV_QUAN_NORM', 'QUANTITY', 'QTY']) || this.loteHijo.cantidad || 0)
                }
            };

            // Validar que todos los campos requeridos estén presentes
            const camposRequeridos = [
                'idMaterial', 'idMaterialDestino', 'idLoteOrigen', 'idLoteDestino',
                'idSedeOrigen', 'idSedeDestino', 'idAlmacenOrigen', 'idAlmacenDestino',
                'idAreaLogisticaOrigen', 'idAreaLogisticaDestino'
            ];

            const camposFaltantes = camposRequeridos.filter(campo => !payload[campo]);
            if (camposFaltantes.length > 0) {
                this.mostrarError(`Faltan campos requeridos: ${camposFaltantes.join(', ')}`);
                console.error('Payload completo:', payload);
                return;
            }

            // Cerrar modal
            const modal = bootstrap.Modal.getInstance(document.getElementById('modalConfirmarCombinacion'));
            if (modal) modal.hide();

            // Mostrar loading
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    title: 'Combinando lotes...',
                    text: 'Por favor espere',
                    allowOutsideClick: false,
                    allowEscapeKey: false,
                    didOpen: () => {
                        Swal.showLoading();
                    }
                });
            }

            // Llamar al endpoint
            const endpoint = 'apps/Operaciones/Combinaciones/api/combinaciones-endpoints.php';
            const url = `${endpoint}?action=createCombination`;

            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload)
            });

            const result = await response.json();

            // Cerrar loading
            if (typeof Swal !== 'undefined') {
                Swal.close();
            }

            // Manejar diferentes códigos de respuesta
            if (!result.success) {
                const errorCode = result.error_code || response.status;
                let errorMessage = result.message || 'Error al combinar los lotes';
                
                // Agregar detalles adicionales según el código de error
                if (errorCode === 409 && result.dataResult) {
                    // Error de conflicto SAP ByDesign
                    if (Array.isArray(result.dataResult) && result.dataResult.length > 0) {
                        const conflictos = result.dataResult
                            .map(c => c.note || '')
                            .filter(n => n)
                            .join('; ');
                        if (conflictos) {
                            errorMessage += '\n\nDetalles: ' + conflictos;
                        }
                    }
                } else if (errorCode === 400) {
                    // Bad Request
                    errorMessage = 'Error en la solicitud: ' + errorMessage;
                } else if (errorCode === 500) {
                    // Internal Server Error
                    errorMessage = 'Error interno del servidor: ' + errorMessage;
                }
                
                throw new Error(errorMessage);
            }

            // Cerrar loading y mostrar éxito
            if (typeof Swal !== 'undefined') {
                Swal.fire({
                    icon: 'success',
                    title: '¡Éxito!',
                    text: result.message || 'Los lotes se han combinado exitosamente.',
                    confirmButtonText: 'Aceptar',
                    confirmButtonClass: 'btn btn-primary',
                    buttonsStyling: false,
                    timer: 2000,
                    timerProgressBar: true
                }).then(() => {
                    // Limpiar selección y refrescar lista después de cerrar el mensaje
                    this.limpiarSeleccion();
                    this.cargarLotes();
                });
            } else {
                this.mostrarExito(result.message || 'Los lotes se han combinado exitosamente.');
                // Limpiar selección y refrescar lista
                this.limpiarSeleccion();
                await this.cargarLotes();
            }
        } catch (error) {
            console.error('Error al combinar lotes:', error);
            
            // Cerrar loading si está abierto
            if (typeof Swal !== 'undefined') {
                Swal.close();
            }
            
            this.mostrarError(error.message || 'Error al combinar los lotes. Por favor, intente nuevamente.');
        }
    }

    /**
     * Mostrar mensaje de error con SweetAlert
     */
    mostrarError(mensaje) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'error',
                title: 'Error de Validación',
                text: mensaje,
                confirmButtonText: 'Entendido',
                confirmButtonClass: 'btn btn-primary',
                buttonsStyling: false
            });
        } else {
            alert('Error: ' + mensaje);
        }
    }

    /**
     * Mostrar mensaje de éxito con SweetAlert
     */
    mostrarExito(mensaje) {
        if (typeof Swal !== 'undefined') {
            Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: mensaje,
                confirmButtonText: 'Aceptar',
                confirmButtonClass: 'btn btn-primary',
                buttonsStyling: false,
                timer: 3000,
                timerProgressBar: true
            });
        } else {
            alert('Éxito: ' + mensaje);
        }
    }
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    window.combinacionesLotes = new CombinacionesLotes();
});

