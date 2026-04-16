$(document).ready(function() {
    // Función para formatear la fecha actual en YYYY-MM-DD
    function getCurrentDate() {
        return moment().format('YYYY-MM-DD');
    }

    // Inicializar los inputs de fecha con la fecha actual
    $('#fecha_inicial').val(getCurrentDate());
    $('#fecha_final').val(getCurrentDate());

    // Activar el checkbox de solo pendientes por defecto
    $('#solo_pendientes').prop('checked', true);

    // Variable global para la tabla
    var tabla;

    // Función para cargar los datos
    function loadData() {
        var fechaInicial = $('#fecha_inicial').val();
        var fechaFinal = $('#fecha_final').val();
        var sede = $('#sedeFilter').val();
        var estado = $('#filtro_estado').val();
        var limit = $('#registros_por_pagina').val() || 10;

        // Inicializar la tabla con DataTables
        tabla = $('#tablaDocumentos').DataTable({
            "language": {
                "decimal": "",
                "emptyTable": "No hay datos disponibles",
                "info": "Mostrando _START_ a _END_ de _TOTAL_ registros",
                "infoEmpty": "Mostrando 0 a 0 de 0 registros",
                "infoFiltered": "(filtrado de _MAX_ registros totales)",
                "infoPostFix": "",
                "thousands": ",",
                "lengthMenu": "Mostrar _MENU_ registros",
                "loadingRecords": "Cargando...",
                "processing": "Procesando...",
                "search": "Buscar:",
                "zeroRecords": "No se encontraron registros coincidentes",
                "paginate": {
                    "first": "Primero",
                    "last": "Último",
                    "next": "Siguiente",
                    "previous": "Anterior"
                }
            },
            "order": [[0, "asc"]],
            "pageLength": 10,
            "processing": true,
            "serverSide": false,
            "autoWidth": false,
            "scrollX": true,
            "responsive": true,
            "ajax": {
                "url": "apps/autorizaciones/documentos/load_documentos.php",
                "type": "GET",
                "data": function(d) {
                    d.draw = d.draw || 1;
                    d.requested_date_initial = fechaInicial;
                    d.requested_date_end = fechaFinal;
                    d.sede = sede;
                    d.limit = limit;
                    return d;
                },
                "dataSrc": "data",
                "error": function(xhr, error, thrown) {
                    console.error('Error en la petición:', error);
                    console.error('Detalles:', thrown);
                    console.error('Respuesta:', xhr.responseText);
                }
            },
            "columns": [
                { "data": "number", "className": "min-w-100px" },
                { 
                    "data": "requested_date",
                    "className": "min-w-100px",
                    "render": function(data) {
                        return moment(data).format('DD/MM/YYYY');
                    }
                },
                { "data": "petitioner", "className": "min-w-150px" },
                { "data": "branch_country", "className": "min-w-100px" },
                { "data": "authorization_description", "className": "min-w-150px" },
                { 
                    "data": null,
                    "className": "min-w-100px",
                    "render": function(data) {
                        // Si no hay detalles de autorización, es Pendiente
                        if (!data.authorization_detail || data.authorization_detail.length === 0) {
                            return '<span class="badge badge-light-warning">Pendiente</span>';
                        }

                        let hayPendientes = false;
                        let todasAutorizadas = true;
                        let todasRechazadas = true;

                        // Revisar cada autorización
                        data.authorization_detail.forEach(function(auth) {
                            if (auth.autorized) {
                                todasRechazadas = false;
                            } else if (auth.refused) {
                                todasAutorizadas = false;
                            } else {
                                hayPendientes = true;
                                todasAutorizadas = false;
                                todasRechazadas = false;
                            }
                        });

                        // Aplicar la lógica de estados
                        if (hayPendientes) {
                            return '<span class="badge badge-light-warning">Pendiente</span>';
                        } else if (todasAutorizadas) {
                            return '<span class="badge badge-light-success">Autorizado</span>';
                        } else if (todasRechazadas) {
                            return '<span class="badge badge-light-danger">Rechazado</span>';
                        } else {
                            return '<span class="badge badge-light-danger">Rechazado</span>'; // Si hay mezcla, es Rechazado
                        }
                    }
                },
                {
                    "data": null,
                    "orderable": false,
                    "className": "text-end min-w-100px",
                    "render": function(data, type, row) {
                        return '<div class="d-flex justify-content-end flex-shrink-0">' +
                               '<button class="btn btn-icon btn-bg-light btn-active-color-primary btn-sm me-1 ver-documento" data-id="' + row.id + '">' +
                               '<i class="ki-duotone ki-pencil fs-2">' +
                               '<span class="path1"></span>' +
                               '<span class="path2"></span>' +
                               '</i></button>' +
                               '</div>';
                    }
                },
                { "data": "id", "visible": false },
                { "data": "path_file", "visible": false }
            ],
            "columnDefs": [
                {
                    "targets": [7, 8],
                    "visible": false,
                    "searchable": false
                }
            ],
            initComplete: function(settings, json) {
                if ($('#solo_pendientes').is(':checked')) {
                    aplicarFiltroEstado();
                }
            }
        });

        return tabla;
    }

    // Cargar datos iniciales
    tabla = loadData();

    // Si el filtro de solo pendientes está activo al cargar la página, aplícalo
    if ($('#solo_pendientes').is(':checked')) {
        aplicarFiltroEstado();
    }

    // Función para aplicar el filtro de estado
    function aplicarFiltroEstado() {
        const soloPendientes = $('#solo_pendientes').is(':checked');
        
        // Aplicar filtro de estado
        $.fn.dataTable.ext.search.push(function(settings, data, dataIndex) {
            if (!soloPendientes) return true;
            
            const row = tabla.row(dataIndex).data();
            if (!row) return true;

            // Si no hay detalles de autorización, es Pendiente
            if (!row.authorization_detail || row.authorization_detail.length === 0) {
                return true;
            }

            let hayPendientes = false;
            let todasAutorizadas = true;
            let todasRechazadas = true;

            // Revisar cada autorización
            row.authorization_detail.forEach(function(auth) {
                if (auth.autorized) {
                    todasRechazadas = false;
                } else if (auth.refused) {
                    todasAutorizadas = false;
                } else {
                    hayPendientes = true;
                    todasAutorizadas = false;
                    todasRechazadas = false;
                }
            });

            // Solo mostrar si hay pendientes
            return hayPendientes;
        });
        
        tabla.draw();
        
        // Remover el filtro personalizado después de usarlo
        $.fn.dataTable.ext.search.pop();
    }

    // Evento para el checkbox de solo pendientes
    $('#solo_pendientes').on('change', function() {
        aplicarFiltroEstado();
    });

    // Evento para el botón de búsqueda
    $('#btn_buscar').on('click', function() {
        tabla.destroy();
        tabla = loadData();
        aplicarFiltroEstado();
    });

    // Evento para cambiar el número de registros por página
    $('#registros_por_pagina').on('change', function() {
        tabla.destroy();
        tabla = loadData();
        aplicarFiltroEstado();
    });

    // Evento para el cambio de sede
    $('#sedeFilter').on('change', function() {
        tabla.destroy();
        tabla = loadData();
        aplicarFiltroEstado();
    });

    // Variable para almacenar el ID del documento actual
    var currentDocId = null;

    // Variables para las tablas de detalle
    var tablaDetalle1 = null;
    var tablaDetalle11 = null;
    var tablaDetalle4 = null;
    

    // Inicializar las tablas de detalle
    function inicializarTablasDetalle() {
        // Inicializar tabla de detalle tipo 1
        tablaDetalle1 = $('#tablaDetalle1').DataTable({
            language: {
                "decimal": "",
                "emptyTable": "No hay datos disponibles",
                "info": "Mostrando _START_ a _END_ de _TOTAL_ registros",
                "infoEmpty": "Mostrando 0 a 0 de 0 registros",
                "infoFiltered": "(filtrado de _MAX_ registros totales)",
                "infoPostFix": "",
                "thousands": ",",
                "lengthMenu": "Mostrar _MENU_ registros",
                "loadingRecords": "Cargando...",
                "processing": "Procesando...",
                "search": "Buscar:",
                "zeroRecords": "No se encontraron registros coincidentes",
                "paginate": {
                    "first": "Primero",
                    "last": "Último",
                    "next": "Siguiente",
                    "previous": "Anterior"
                }
            },
            pageLength: 10,
            lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "Todos"]],
            order: [[0, 'asc']],
            columns: [
                { data: 'Codigo' },
                { data: 'Descripcion' },
                { data: 'Cantidad' },
                //{ data: 'Longitud' },
                { 
                    data: 'Costo',
                    render: function(data) {
                        return data ? parseFloat(data).toFixed(4) : '';
                    }
                },
                { 
                    data: 'PrecioLista',
                    render: function(data) {
                        return data ? parseFloat(data).toFixed(4) : '';
                    }
                },
                { 
                    data: 'NuevoPrecio',
                    render: function(data) {
                        return data ? parseFloat(data).toFixed(4) : '';
                    }
                },
                { 
                    data: 'Descuento',
                    render: function(data) {
                        return data ? parseFloat(data).toFixed(2) + '%' : '';
                    }
                },
                //{ data: 'ComentarioPrecio' },
                { 
                    data: 'Contribucion',
                    render: function(data) {
                        return data ? parseFloat(data).toFixed(2) + '%' : '';
                    }
                }
                //{ data: 'CodCliente' }
            ]
        });

        // Inicializar tabla de detalle tipo 11
        tablaDetalle11 = $('#tablaDetalle11').DataTable({
            language: {
                "decimal": "",
                "emptyTable": "No hay datos disponibles",
                "info": "Mostrando _START_ a _END_ de _TOTAL_ registros",
                "infoEmpty": "Mostrando 0 a 0 de 0 registros",
                "infoFiltered": "(filtrado de _MAX_ registros totales)",
                "infoPostFix": "",
                "thousands": ",",
                "lengthMenu": "Mostrar _MENU_ registros",
                "loadingRecords": "Cargando...",
                "processing": "Procesando...",
                "search": "Buscar:",
                "zeroRecords": "No se encontraron registros coincidentes",
                "paginate": {
                    "first": "Primero",
                    "last": "Último",
                    "next": "Siguiente",
                    "previous": "Anterior"
                }
            },
            pageLength: 10,
            lengthMenu: [[10, 25, 50, -1], [10, 25, 50, "Todos"]],
            order: [[0, 'asc']],
            columns: [
                { data: 'Part' },
                { 
                    data: 'PrecioVenta',
                    render: function(data) {
                        return data ? parseFloat(data).toFixed(4) : '';
                    }
                },
                { 
                    data: 'Costo',
                    render: function(data) {
                        return data ? parseFloat(data).toFixed(4) : '';
                    }
                },
                { 
                    data: 'Diferencia',
                    render: function(data) {
                        return data ? parseFloat(data).toFixed(4) : '';
                    }
                }
            ]
        });
    }

    // Llamar a la inicialización de tablas de detalle
    inicializarTablasDetalle();

    // Evento para ver documento
    $('#tablaDocumentos').on('click', '.ver-documento', function() {
        var row = tabla.row($(this).closest('tr')).data();
        currentDocId = row.id;
        
        // Extraer la sede (tomar solo la parte antes de '/')
        var sede = row.branch_country.split('/')[0].trim();

        
        
        
        // Llenar los datos del encabezado
        $('#modal_numero_doc').text(row.number);
        $('#modal_fecha').text(moment(row.requested_date).format('DD/MM/YYYY'));
        $('#modal_sede').text(row.branch_country);
        $('#modal_solicitante').text(row.petitioner);
        $('#modal_codigo_cliente').text(row.client_code || 'N/A');
        $('#modal_nombre_cliente').text(row.client_name || 'N/A');
        
        // Calcular y llenar los totales
        const subtotal = parseFloat(row.total_amount);
        const flete = parseFloat(row.total_freight || 0);
        const isv = parseFloat(row.total_isv || 0);
        const montoTotal = subtotal + flete + isv;
        const contribucionTotal = parseFloat(row.total_contribution);
        
        $('#modal_subtotal').text(subtotal.toFixed(2));
        $('#modal_flete').text(flete.toFixed(2));
        $('#modal_isv').text(isv.toFixed(2));
        $('#modal_monto_total').text(montoTotal.toFixed(2));
        $('#modal_contribucion_total').text(contribucionTotal.toFixed(2));

        // Verificar si hay algún tipo de autorización 4 para ocultar la contribución total
        const tieneTipo4 = row.authorization_detail.some(auth => auth.authorization_type == 4);
        if (tieneTipo4) {
            $('#modal_contribucion_total_container').hide();
        } else {
            $('#modal_contribucion_total_container').show();
        }

        // Ocultar todas las tablas primero
        $('#tablaDetalleTipo1').hide();
        $('#tablaDetalleTipo11').hide();

        // Limpiar las tablas
        if (tablaDetalle1) tablaDetalle1.clear();
        if (tablaDetalle11) tablaDetalle11.clear();

        // Limpiar las pestañas anteriores
        $('#kt_tabs_detalle').empty();
        $('#kt_tabs_content').empty();

        // Limpiar elementos PDF de documentos anteriores
        $('.pdf-ruta-info').remove();
        $('.btn-ver-pdf').remove();
        $('.pdf-info-container').remove();

        // Crear el contenedor de pestañas
        const tabsContainer = `
            <ul class="nav nav-stretch nav-line-tabs nav-line-tabs-2x border-transparent fs-5 fw-bold" role="tablist">
                ${row.authorization_detail.map((auth, index) => `
                    <li class="nav-item" role="presentation">
                        <a class="nav-link ${index === 0 ? 'active' : ''}" 
                           data-bs-toggle="tab" 
                           role="tab" 
                           href="#kt_tab_${auth.authorization_type}">
                            ${auth.authorization_description}
                        </a>
                    </li>
                `).join('')}
            </ul>
        `;

        // Crear el contenedor de contenido
        const contentContainer = `
            <div class="tab-content">
                ${row.authorization_detail.map((auth, index) => `
                    <div class="tab-pane fade ${index === 0 ? 'show active' : ''}" 
                         id="kt_tab_${auth.authorization_type}" 
                         role="tabpanel">
                        <div class="card mb-5 mb-xl-8">
                            <div class="card-header border-0 pt-5">
                                <div class="card-title d-flex align-items-center justify-content-between w-100">
                                    <div class="d-flex flex-column">
                                        <span class="card-label fw-bold fs-3 mb-1">${auth.authorization_description}</span>
                                        <span class="text-muted mt-1 fw-semibold fs-7">Justificación: ${auth.petitioner_comment || 'Sin justificación'}</span>
                                    </div>
                                    ${auth.autorized || auth.refused ? `
                                        <div class="d-flex align-items-center">
                                            <span class="badge badge-light-${auth.autorized ? 'success' : 'danger'} fs-7 fw-bold">
                                                ${auth.autorized ? 'Autorizado' : 'Rechazado'}
                                            </span>
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                            <div class="card-body">
                                ${auth.authorization_type == 1 ? `
                                    <div class="table-responsive">
                                        <table id="tablaDetalle1" class="table align-middle table-row-dashed fs-6 gy-5">
                                            <thead>
                                                <tr class="text-start text-muted fw-bold fs-7 text-uppercase gs-0">
                                                    <th class="min-w-100px">Código</th>
                                                    <th class="min-w-200px">Descripción</th>
                                                    <th class="min-w-100px">Cantidad</th>
                                                    <th class="min-w-100px">Costo</th>
                                                    <th class="min-w-100px">Precio Lista</th>
                                                    <th class="min-w-100px">Nuevo Precio</th>
                                                    <th class="min-w-100px">Descuento</th>
                                                    <th class="min-w-100px">Contribución</th>
                                                </tr>
                                            </thead>
                                            <tbody class="text-gray-600 fw-semibold">
                                            </tbody>
                                        </table>
                                    </div>
                                ` : auth.authorization_type == 11 ? `
                                    <div class="table-responsive">
                                        <table id="tablaDetalle11" class="table align-middle table-row-dashed fs-6 gy-5">
                                            <thead>
                                                <tr class="text-start text-muted fw-bold fs-7 text-uppercase gs-0">
                                                    <th class="min-w-150px">Parte</th>
                                                    <th class="min-w-100px">Precio Venta</th>
                                                    <th class="min-w-100px">Costo</th>
                                                    <th class="min-w-100px">Diferencia</th>
                                                </tr>
                                            </thead>
                                            <tbody class="text-gray-600 fw-semibold">
                                            </tbody>
                                        </table>
                                    </div>
                                ` : auth.authorization_type == 4 ? `
                                    <div class="d-flex flex-column">
                                        <div class="text-gray-800 fw-bold fs-6 mb-2">Detalles de la Autorización de Límite de Crédito</div>
                                        <div class="text-gray-600 fw-semibold fs-7">
                                            <p>Esta autorización no requiere detalles adicionales. Por favor, revise la justificación proporcionada y proceda con la autorización o rechazo según corresponda.</p>
                                        </div>
                                        <div class="mt-4 d-flex gap-2">
                                            ${!row.path_file || row.path_file.trim() === '' ? `
                                                ${!auth.refused ? `
                                                    <button type="button" class="btn btn-info btn-cargar-pdf" 
                                                            data-document-id="${row.id}" 
                                                            data-auth-type="${auth.authorization_type}">
                                                        <i class="ki-duotone ki-file-down fs-2">
                                                            <span class="path1"></span>
                                                            <span class="path2"></span>
                                                        </i>
                                                        Cargar PDF
                                                    </button>
                                                ` : ''}
                                            ` : ''}
                                            ${row.path_file && row.path_file.trim() !== '' ? `
                                                <button type="button" class="btn btn-primary btn-ver-pdf" 
                                                        data-path="${row.path_file}">
                                                    <i class="ki-duotone ki-eye fs-2">
                                                        <span class="path1"></span>
                                                        <span class="path2"></span>
                                                    </i>
                                                    Ver PDF
                                                </button>
                                            ` : ''}
                                        </div>
                                    </div>
                                ` : ''}
                            </div>
                            <div class="card-footer">
                                ${(() => {
                                    // Convertir strings 'true'/'false' a booleanos
                                    const isAutorized = auth.autorized === true || auth.autorized === 'true';
                                    const isRefused = auth.refused === true || auth.refused === 'true';
                                    
                                    // Si está autorizado o rechazado, no mostrar nada
                                    if (isAutorized || isRefused) {
                                        return ``;
                                    }
                                    
                                    // Verificar si es tipo 4 y si tiene path_file
                                    const isTipo4 = auth.authorization_type == 4;
                                    const hasPathFile = row.path_file && row.path_file.trim() !== '';
                                    const isDisabled = isTipo4 && !hasPathFile;
                                    
                                    // Si no está autorizado ni rechazado, mostrar los botones
                                    return `
                                        <div class="d-flex justify-content-end">
                                            <button type="button" 
                                                    class="btn ${isDisabled ? 'btn-secondary' : 'btn-success'} me-3 btn-autorizar" 
                                                    data-auth-type="${auth.authorization_type}"
                                                    data-document-id="${row.id}"
                                                    ${isDisabled ? 'disabled' : ''}>
                                                <i class="ki-duotone ki-check fs-2">
                                                    <span class="path1"></span>
                                                    <span class="path2"></span>
                                                </i>
                                                Autorizar
                                            </button>
                                            <button type="button" class="btn btn-danger me-3 btn-rechazar" data-auth-type="${auth.authorization_type}">
                                                <i class="ki-duotone ki-cross fs-2">
                                                    <span class="path1"></span>
                                                    <span class="path2"></span>
                                                </i>
                                                Rechazar
                                            </button>
                                        </div>
                                        ${isTipo4 && !hasPathFile ? `
                                            <div class="mt-2">
                                                <small class="text-warning">
                                                    <i class="ki-duotone ki-information-5 fs-6">
                                                        <span class="path1"></span>
                                                        <span class="path2"></span>
                                                    </i>
                                                    Debe cargar un PDF antes de poder autorizar este documento.
                                                </small>
                                            </div>
                                        ` : ''}
                                    `;
                                })()}
                            </div>
                        </div>
                    </div>
                `).join('')}
            </div>
        `;

        // Agregar las pestañas y el contenido al modal
        $('#kt_tabs_detalle').html(tabsContainer);
        $('#kt_tabs_content').html(contentContainer);

        // Reinicializar las tablas después de agregar el contenido
        if (tablaDetalle1) {
            tablaDetalle1.destroy();
        }
        if (tablaDetalle11) {
            tablaDetalle11.destroy();
        }

        // Inicializar las tablas nuevamente
        inicializarTablasDetalle();

        // Procesar cada tipo de autorización
        row.authorization_detail.forEach(function(auth) {
            // Mostrar la tabla correspondiente según el tipo de autorización
            if (auth.authorization_type == 1) {
                // Convertir los productos al formato esperado por la tabla
                const productos = auth.products_detail.map(product => ({
                    Codigo: product.code,
                    Descripcion: product.description,
                    Cantidad: product.quantity,
                    Costo: product.cost,
                    PrecioLista: product.price,
                    NuevoPrecio: product.new_price,
                    Descuento: product.discount_percent,
                    Contribucion: product.contribution_percent
                }));
                tablaDetalle1.rows.add(productos).draw();
            } else if (auth.authorization_type == 11) {
                // Convertir los productos al formato esperado por la tabla
                const productos = auth.products_detail.map(product => ({
                    Part: product.code,
                    PrecioVenta: product.price,
                    Costo: product.cost,
                    Diferencia: product.price_cost_difference
                }));
                tablaDetalle11.rows.add(productos).draw();
            }
            
            // Restaurar información del PDF si existe (solo para tipo 4)
            if (auth.authorization_type == 4) {
                // Tipo de autorización 4 detectado - funcionalidad específica para PDF
            }
        });

        // Configurar eventos para los botones de autorizar y rechazar
        $(document).on('click', '.btn-autorizar', function() {
            const authType = $(this).data('auth-type');

            autorizarDocumento(row.id, authType);
        });

        $(document).on('click', '.btn-rechazar', function() {
            const authType = $(this).data('auth-type');

            rechazarDocumento(row.id, authType);
        });

        // Evento para cargar PDF (solo tipo 4) - Usar off antes de on para evitar acumulación
        $(document).off('click', '.btn-cargar-pdf').on('click', '.btn-cargar-pdf', function() {
            const documentId = $(this).data('document-id');
            const authType = $(this).data('auth-type');
            
            cargarPDF(documentId, authType);
        });

        // Evento para ver PDF (solo tipo 4) - Movido fuera del modal para evitar acumulación
        $(document).off('click', '.btn-ver-pdf').on('click', '.btn-ver-pdf', function() {
            const pdfPath = $(this).attr('data-path');
            
            // Construir la URL completa manualmente
            const baseUrl = 'http://192.168.10.80:3002/Corporativo';
            let fullPdfUrl = '';
            
            if (pdfPath) {
                // Remover './' del inicio y agregar '/' si no empieza con '/'
                let cleanPath = pdfPath.replace('./', '');
                if (!cleanPath.startsWith('/')) {
                    cleanPath = '/' + cleanPath;
                }
                fullPdfUrl = baseUrl + cleanPath;
                
                // Abrir el PDF en un modal personalizado para mejor control del tamaño
                const modalHtml = `
                    <div id="pdfModal" class="modal fade" tabindex="-1" role="dialog" style="display: none;">
                        <div class="modal-dialog modal-xl" role="document" style="max-width: 95%; width: 95%; margin: 20px auto;">
                            <div class="modal-content" style="height: 90vh;">
                                <div class="modal-header">
                                    <h5 class="modal-title">Vista del PDF</h5>
                                    <button type="button" class="btn-close" data-bs-dismiss="modal" aria-label="Close"></button>
                                </div>
                                <div class="modal-body" style="height: calc(90vh - 120px); padding: 0;">
                                    <iframe src="${fullPdfUrl}" width="100%" height="100%" style="border: none;" allow="fullscreen"></iframe>
                                </div>
                            </div>
                        </div>
                    </div>
                `;
                
                // Remover modal anterior si existe
                $('#pdfModal').remove();
                
                // Agregar el nuevo modal al body
                $('body').append(modalHtml);
                
                // Mostrar el modal
                $('#pdfModal').modal('show');
                
                // Limpiar el modal cuando se cierre
                $('#pdfModal').on('hidden.bs.modal', function() {
                    $(this).remove();
                });
            } else {
                alert('Error: No se pudo obtener la ruta del PDF');
            }
        });

        // Mostrar el modal
        $('#kt_modal_detalle_documento').modal('show');
    });

    // Evento para cuando se cierra el modal
    $('#kt_modal_detalle_documento').on('hidden.bs.modal', function () {
        // Limpiar las tablas al cerrar el modal
        if (tablaDetalle1) tablaDetalle1.clear();
        if (tablaDetalle11) tablaDetalle11.clear();
    });

    // Evento para editar documento
    $('#tablaDocumentos').on('click', '.editar-documento', function() {
        var id = $(this).data('id');
    });

    // Función para autorizar un documento
    function autorizarDocumento(documentId, authType) {
        // Limpiar el textarea y poner el texto por defecto
        $('#comentario_autorizacion').val('Autorizado por GSO');
        
        // Guardar el ID y tipo de autorización para usarlo después
        $('#kt_modal_comentario_autorizacion').data('document-id', documentId);
        $('#kt_modal_comentario_autorizacion').data('auth-type', authType);
        
        // Obtener la ruta del PDF si existe
        const btnAutorizar = $(`.btn-autorizar[data-document-id="${documentId}"][data-auth-type="${authType}"]`);
        const pathFile = btnAutorizar.data('pdf-path') || '';
        $('#kt_modal_comentario_autorizacion').data('path-file', pathFile);
        
        // Mostrar el modal de comentario
        $('#kt_modal_comentario_autorizacion').modal('show');
    }

    // Evento para cuando se cierra el modal de comentario de autorización
    $('#kt_modal_comentario_autorizacion').on('hidden.bs.modal', function() {
        // Limpiar el textarea
        $('#comentario_autorizacion').val('');
    });

    // Función para rechazar documento
    function rechazarDocumento(documentId, authType) {
        // Limpiar el textarea
        $('#comentario_rechazo').val('');
        
        // Guardar el ID y tipo de autorización para usarlo después
        $('#kt_modal_comentario_rechazo').data('document-id', documentId);
        $('#kt_modal_comentario_rechazo').data('auth-type', authType);
        
        // Mostrar el modal de comentario
        $('#kt_modal_comentario_rechazo').modal('show');
    }

    // Evento para confirmar el rechazo
    $('#btn_confirmar_rechazo').on('click', function() {
        const comment = $('#comentario_rechazo').val().trim();
        const documentId = $('#kt_modal_comentario_rechazo').data('document-id');
        const authType = $('#kt_modal_comentario_rechazo').data('auth-type');

        if (!comment) {
            Swal.fire({
                text: "El comentario es requerido",
                icon: "error",
                buttonsStyling: false,
                confirmButtonText: "Ok",
                customClass: {
                    confirmButton: "btn btn-primary"
                }
            });
            return;
        }

        $.ajax({
            url: 'apps/autorizaciones/documentos/update_refused.php',
            type: 'POST',
            data: { 
                id: documentId,
                authorization_type: authType,
                comment: comment
            },
            success: function(response) {
                if (response === 'refused') {
                    // Cerrar el modal de comentario
                    $('#kt_modal_comentario_rechazo').modal('hide');
                    
                    // Actualizar el estado en la pestaña correspondiente
                    const tabContent = $(`#kt_tab_${authType}`);
                    const cardHeader = tabContent.find('.card-header');
                    const originalTitle = cardHeader.find('.card-label').text();
                    const originalComment = cardHeader.find('.text-muted').text();
                    
                    // Actualizar el encabezado con el nuevo estado
                    cardHeader.html(`
                        <div class="card-title d-flex align-items-center justify-content-between w-100">
                            <div class="d-flex flex-column">
                                <span class="card-label fw-bold fs-3 mb-1">${originalTitle}</span>
                                <span class="text-muted mt-1 fw-semibold fs-7">${originalComment}</span>
                            </div>
                            <div class="d-flex align-items-center">
                                <span class="badge badge-light-danger fs-7 fw-bold">Rechazado</span>
                            </div>
                        </div>
                    `);
                    
                    // Ocultar los botones
                    tabContent.find('.card-footer').hide();
                    
                    Swal.fire({
                        text: "Documento rechazado exitosamente",
                        icon: "success",
                        buttonsStyling: false,
                        confirmButtonText: "Ok",
                        customClass: {
                            confirmButton: "btn btn-primary"
                        }
                    }).then(function() {
                        // Cerrar el modal de detalle
                        $('#kt_modal_detalle_documento').modal('hide');
                        // Recargar la tabla principal
                        tabla.ajax.reload(function() {
                            if ($('#solo_pendientes').is(':checked')) {
                                aplicarFiltroEstado();
                            }
                        });
                    });
                } else {
                    Swal.fire({
                        text: "Error al rechazar el documento",
                        icon: "error",
                        buttonsStyling: false,
                        confirmButtonText: "Ok",
                        customClass: {
                            confirmButton: "btn btn-primary"
                        }
                    });
                }
            },
            error: function(xhr, status, error) {
                console.error('Error en la petición:', error);
                console.error('Detalles:', xhr.responseText);
                
                Swal.fire({
                    text: "Error al procesar la solicitud",
                    icon: "error",
                    buttonsStyling: false,
                    confirmButtonText: "Ok",
                    customClass: {
                        confirmButton: "btn btn-primary"
                    }
                });
            }
        });
    });

    // Evento para confirmar la autorización
    $('#btn_confirmar_autorizacion').on('click', function() {
        const comment = $('#comentario_autorizacion').val().trim();
        const documentId = $('#kt_modal_comentario_autorizacion').data('document-id');
        const authType = $('#kt_modal_comentario_autorizacion').data('auth-type');
        const pathFile = $('#kt_modal_comentario_autorizacion').data('path-file');

        if (!comment) {
            Swal.fire({
                text: "El comentario es requerido",
                icon: "error",
                buttonsStyling: false,
                confirmButtonText: "Ok",
                customClass: {
                    confirmButton: "btn btn-primary"
                }
            });
            return;
        }

        $.ajax({
            url: 'apps/autorizaciones/documentos/update_autorized.php',
            type: 'POST',
            data: { 
                id: documentId,
                authorization_type: authType,
                comment: comment,
                path_file: pathFile
            },
            success: function(response) {
                // Verificar si la respuesta es exitosa
                if (response.success || response === 'autorized' || response.success === true) {
                    // Cerrar el modal de comentario
                    $('#kt_modal_comentario_autorizacion').modal('hide');
                    
                    // Ocultar el botón de cargar PDF después de autorizar (solo para tipo 4)
                    if (authType == 4) {
                        const btnAutorizar = $(`.btn-autorizar[data-document-id="${documentId}"][data-auth-type="${authType}"]`);
                        const btnCargarPdf = btnAutorizar.closest('.card-body').find('.btn-cargar-pdf');
                        if (btnCargarPdf.length > 0) {
                            btnCargarPdf.hide();
                        }
                    }
                    
                    // Actualizar el estado en la pestaña correspondiente
                    const tabContent = $(`#kt_tab_${authType}`);
                    const cardHeader = tabContent.find('.card-header');
                    const originalTitle = cardHeader.find('.card-label').text();
                    const originalComment = cardHeader.find('.text-muted').text();
                    
                    // Actualizar el encabezado con el nuevo estado
                    cardHeader.html(`
                        <div class="card-title d-flex align-items-center justify-content-between w-100">
                            <div class="d-flex flex-column">
                                <span class="card-label fw-bold fs-3 mb-1">${originalTitle}</span>
                                <span class="text-muted mt-1 fw-semibold fs-7">${originalComment}</span>
                            </div>
                            <div class="d-flex align-items-center">
                                <span class="badge badge-light-success fs-7 fw-bold">Autorizado</span>
                            </div>
                        </div>
                    `);
                    
                    // Ocultar los botones
                    tabContent.find('.card-footer').hide();
                    
                    // Mantener el botón Ver PDF visible después de autorizar
                    const btnVerPdf = tabContent.find('.btn-ver-pdf');
                    if (btnVerPdf.length > 0) {
                        btnVerPdf.show();
                    }
                    
                    // Mantener el div con la información del PDF
                    const pdfInfoDiv = tabContent.find('.pdf-ruta-info');
                    if (pdfInfoDiv.length > 0) {
                        pdfInfoDiv.show();
                    }
                    
                    Swal.fire({
                        text: "Documento autorizado exitosamente",
                        icon: "success",
                        buttonsStyling: false,
                        confirmButtonText: "Ok",
                        customClass: {
                            confirmButton: "btn btn-primary"
                        }
                    }).then(function() {
                        // Cerrar el modal de detalle
                        $('#kt_modal_detalle_documento').modal('hide');
                        // Recargar la tabla principal
                        tabla.ajax.reload(function() {
                            if ($('#solo_pendientes').is(':checked')) {
                                aplicarFiltroEstado();
                            }
                        });
                    });
                } else {
                    // Mostrar el mensaje de error específico si existe
                    const errorMessage = response.message || response.error || "Error al autorizar el documento";
                    Swal.fire({
                        text: errorMessage,
                        icon: "error",
                        buttonsStyling: false,
                        confirmButtonText: "Ok",
                        customClass: {
                            confirmButton: "btn btn-primary"
                        }
                    });
                }
            },
            error: function(xhr, status, error) {
                console.error('Error en la petición:', error);
                console.error('Detalles:', xhr.responseText);
                
                Swal.fire({
                    text: "Error al procesar la solicitud",
                    icon: "error",
                    buttonsStyling: false,
                    confirmButtonText: "Ok",
                    customClass: {
                        confirmButton: "btn btn-primary"
                    }
                });
            }
        });
    });

    // Agregar funcionalidad de búsqueda al input
    $('#DocSearch').on('keyup', function() {
        tabla.search(this.value).draw();
    });

    // Configurar la actualización automática
    setInterval(function() {
        const soloPendientes = $('#solo_pendientes').is(':checked');
        tabla.ajax.reload(function() {
            if (soloPendientes) {
                aplicarFiltroEstado();
            }
        });
    }, 30000);

    // Función para cargar PDF
    function cargarPDF(documentId, authType) {
        // Obtener el número de documento del modal
        const documentNumber = $('#modal_numero_doc').text();
        
        // Limpiar inputs anteriores para evitar acumulación de eventos
        $('input[type="file"][accept=".pdf"]').remove();
        
        // Crear un input file oculto
        const input = document.createElement('input');
        input.type = 'file';
        input.accept = '.pdf';
        input.style.display = 'none';
        
        // Agregar el input al DOM
        document.body.appendChild(input);
        
        // Evento cuando se selecciona un archivo
        input.onchange = function(e) {
            const file = e.target.files[0];
            if (file) {
                // Verificar que sea un PDF
                if (file.type !== 'application/pdf') {
                    Swal.fire({
                        text: "Por favor seleccione un archivo PDF",
                        icon: "error",
                        buttonsStyling: false,
                        confirmButtonText: "Ok",
                        customClass: {
                            confirmButton: "btn btn-primary"
                        }
                    });
                    return;
                }
                
                // Verificar tamaño del archivo (máximo 10MB)
                if (file.size > 10 * 1024 * 1024) {
                    Swal.fire({
                        text: "El archivo es demasiado grande. Máximo 10MB permitido",
                        icon: "error",
                        buttonsStyling: false,
                        confirmButtonText: "Ok",
                        customClass: {
                            confirmButton: "btn btn-primary"
                        }
                    });
                    return;
                }
                
                // Crear URL para vista previa
                const fileUrl = URL.createObjectURL(file);
                
                // Mostrar modal de vista previa
                Swal.fire({
                    title: 'Vista Previa del PDF',
                    html: `
                        <div class="text-start mb-3">
                            <p><strong>Nombre:</strong> ${file.name}</p>
                            <p><strong>Nuevo nombre:</strong> File_${documentNumber}.pdf</p>
                            <p><strong>Tamaño:</strong> ${(file.size / 1024 / 1024).toFixed(2)} MB</p>
                        </div>
                        <iframe src="${fileUrl}" width="100%" height="800" style="border: 1px solid #ddd;"></iframe>
                    `,
                    width: '90%',
                    heightAuto: false,
                    showCancelButton: true,
                    confirmButtonText: 'Subir PDF',
                    cancelButtonText: 'Cancelar',
                    buttonsStyling: false,
                    customClass: {
                        popup: 'swal2-popup-pdf-preview',
                        confirmButton: "btn btn-success me-3",
                        cancelButton: "btn btn-light"
                    },
                    didOpen: () => {
                        // Ajustar la altura del modal después de que se abre
                        const swalPopup = document.querySelector('.swal2-popup-pdf-preview');
                        if (swalPopup) {
                            swalPopup.style.height = '90vh';
                            swalPopup.style.maxHeight = '90vh';
                            const swalContent = swalPopup.querySelector('.swal2-html-container');
                            if (swalContent) {
                                swalContent.style.maxHeight = 'calc(90vh - 200px)';
                                swalContent.style.overflow = 'auto';
                            }
                        }
                    },
                    preConfirm: () => {
                        // Crear FormData para enviar el archivo
                        const formData = new FormData();
                        formData.append('pdf_file', file);
                        formData.append('document_id', documentId);
                        formData.append('auth_type', authType);
                        formData.append('document_number', documentNumber);
                        
                        // Mostrar indicador de carga
                        Swal.fire({
                            title: 'Subiendo PDF...',
                            text: 'Por favor espere',
                            allowOutsideClick: false,
                            didOpen: () => {
                                Swal.showLoading();
                            }
                        });
                        
                        // Enviar el archivo al servidor
                        return $.ajax({
                            url: 'apps/autorizaciones/documentos/upload_pdf.php',
                            type: 'POST',
                            data: formData,
                            processData: false,
                            contentType: false
                        });
                    }
                }).then((result) => {
                    if (result.isConfirmed && result.value.success) {
                        // Si la carga fue exitosa, capturar la ruta y actualizar la interfaz
                        const filePath = result.value.path_file;
                        
                        Swal.fire({
                            text: "PDF cargado exitosamente",
                            icon: "success",
                            buttonsStyling: false,
                            confirmButtonText: "Ok",
                            customClass: {
                                confirmButton: "btn btn-primary"
                            }
                        }).then(function() {
                            // Si estamos en el modal de detalle, actualizar la interfaz
                            if ($('#kt_modal_detalle_documento').hasClass('show')) {
                                actualizarInterfazConPDF(documentId, authType, filePath);
                            }
                        });
                    } else if (result.isConfirmed) {
                        Swal.fire({
                            text: result.value.message || "Error al cargar el PDF",
                            icon: "error",
                            buttonsStyling: false,
                            confirmButtonText: "Ok",
                            customClass: {
                                confirmButton: "btn btn-primary"
                            }
                        });
                    }
                    
                    // Limpiar la URL del archivo
                    URL.revokeObjectURL(fileUrl);
                });
            }
            
            // Limpiar el input después de procesar
            if (input.parentNode) {
                input.parentNode.removeChild(input);
            }
        };
        
        // Limpiar el input si el usuario cancela la selección de archivo
        // Esto se ejecuta cuando el diálogo de archivo se cierra sin seleccionar
        setTimeout(function() {
            // Si el input todavía existe y no tiene archivo seleccionado, removerlo
            if (input && input.parentNode && !input.files.length) {
                // Esperar un poco más para asegurar que no se está procesando
                setTimeout(function() {
                    if (input && input.parentNode && !input.files.length) {
                        input.parentNode.removeChild(input);
                    }
                }, 100);
            }
        }, 100);
        
        // Simular clic en el input
        input.click();
    }

    // Función para actualizar la interfaz cuando se carga un PDF
    function actualizarInterfazConPDF(documentId, authType, filePath) {
        // Buscar el botón de autorizar en el modal y habilitarlo si es tipo 4
        if (authType == 4 && filePath && filePath.trim() !== '') {
            const btnAutorizar = $(`.btn-autorizar[data-document-id="${documentId}"][data-auth-type="${authType}"]`);
            
            if (btnAutorizar.length > 0) {
                // Habilitar el botón
                btnAutorizar.prop('disabled', false)
                           .removeClass('btn-secondary')
                           .addClass('btn-success');
                
                // Remover el mensaje de advertencia si existe
                btnAutorizar.closest('.card-footer').find('.text-warning').remove();
                
                // Construir la URL completa para ver el PDF
                const baseUrl = 'http://192.168.10.80:3002/Corporativo';
                let cleanPath = filePath.replace('./', '');
                if (!cleanPath.startsWith('/')) {
                    cleanPath = '/' + cleanPath;
                }
                const fullPdfUrl = baseUrl + cleanPath;
                
                // Agregar el botón de ver PDF si no existe
                const btnVerPdf = btnAutorizar.closest('.card-body').find('.btn-ver-pdf');
                if (btnVerPdf.length === 0) {
                    const btnCargarPdf = btnAutorizar.closest('.card-body').find('.btn-cargar-pdf');
                    
                    const nuevoBtn = $(`
                        <button type="button" class="btn btn-primary btn-ver-pdf">
                            <i class="ki-duotone ki-eye fs-2">
                                <span class="path1"></span>
                                <span class="path2"></span>
                            </i>
                            Ver PDF
                        </button>
                    `);
                    
                    nuevoBtn.attr('data-path', fullPdfUrl);
                    btnCargarPdf.after(nuevoBtn);
                } else {
                    // Si el botón ya existe, actualizar su data-path
                    btnVerPdf.attr('data-path', fullPdfUrl);
                }
                
                // Agregar div para mostrar la ruta del PDF
                const cardBody = btnAutorizar.closest('.card-body');
                const rutaDiv = cardBody.find('.pdf-ruta-info');
                if (rutaDiv.length === 0) {
                    cardBody.append(`
                        <div class="mt-3 pdf-ruta-info">
                            <div class="alert alert-info">
                                <strong>PDF cargado:</strong> ${filePath}<br>
                                <small class="text-muted">URL completa: ${fullPdfUrl}</small>
                            </div>
                        </div>
                    `);
                } else {
                    rutaDiv.find('.alert').html(`<strong>PDF cargado:</strong> ${filePath}<br><small class="text-muted">URL completa: ${fullPdfUrl}</small>`);
                }
                
                // Guardar la ruta en el botón de autorizar para usarla después
                btnAutorizar.data('pdf-path', filePath);
            }
        }
    }

    // Hacer la función disponible globalmente
    window.cargarPDFInternal = cargarPDF;
});

// Función para cargar PDF (versión global para compatibilidad)
function cargarPDF(documentId, authType) {
    // Esta función ahora está definida dentro del scope de $(document).ready()
    // pero mantenemos esta versión global para compatibilidad
    if (typeof window.cargarPDFInternal === 'function') {
        window.cargarPDFInternal(documentId, authType);
    } else {
        console.error('Función cargarPDF no disponible');
    }
}

