$(document).ready(function() {
    // Variable global para el DataTable
    var tablaEtiquetas;
    
    // Cargar los filtros dinámicamente
    cargarFiltros();
    
    // Inicializar los combobox con valores por defecto
    $('#sede').val('');
    $('#impresora').val('');
    
    // Inicializar DataTable
    inicializarDataTable();
    
    // Evento para cargar datos cuando se selecciona una sede
    $('#sede').on('change', function() {
        var selectedBranch = $(this).val();
        
        // Limpiar combobox de impresoras
        $('#impresora').empty().append('<option value="">Seleccione una locación...</option>');
        
        if (selectedBranch) {
            // Cargar impresoras de la sede seleccionada
            cargarImpresorasPorSede(selectedBranch);
            
            // Mostrar indicador de carga
            mostrarCargando();
            cargarEtiquetas(selectedBranch);
        } else {
            // Limpiar tabla si no hay sede seleccionada
            if (tablaEtiquetas) {
                tablaEtiquetas.clear().draw();
            }
        }
    });
    
    // Evento para el botón buscar
    $('#btn_buscar').on('click', function() {
        var selectedBranch = $('#sede').val();
        if (selectedBranch) {
            // Mostrar indicador de carga
            mostrarCargando();
            cargarEtiquetas(selectedBranch);
        } else {
            mostrarError('Por favor seleccione una sede para buscar etiquetas.');
        }
    });
    
    // Función para inicializar DataTable
    function inicializarDataTable() {
        tablaEtiquetas = $('#tablaEtiquetas').DataTable({
            responsive: true,
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
            lengthMenu: [[10, 25, 50, 100], [10, 25, 50, 100]],
            order: [[0, 'asc']],
            columnDefs: [
                {
                    targets: 0, // Primera columna (Checkbox)
                    orderable: false,
                    searchable: false,
                    width: '50px'
                },
                {
                    targets: -1, // Última columna (Acciones)
                    orderable: false,
                    searchable: false
                }
            ],
            // Ocultar el campo de búsqueda nativo de DataTables
            dom: '<"row"<"col-sm-12 col-md-6"l>>' +
                 '<"row"<"col-sm-12"tr>>' +
                 '<"row"<"col-sm-12 col-md-5"i><"col-sm-12 col-md-7"p>>',
            initComplete: function() {
                // Conectar el input de búsqueda personalizado del diseño
                $('#EtiquetaSearch').on('keyup', function() {
                    tablaEtiquetas.search(this.value).draw();
                });
            }
        });
    }

    // Función para cargar los filtros dinámicamente
    function cargarFiltros() {
        // Cargar sucursales en el combobox de Sede
        cargarSucursales();
        
        // Inicializar combobox de impresoras con opción por defecto
        $('#impresora').empty().append('<option value="">Seleccione una sede primero...</option>');
    }

    // Función para cargar sucursales
    function cargarSucursales() {
        $.ajax({
            url: 'utilities/getBranchData.php?type=branchs',
            type: 'GET',
            success: function(response) {
                // jQuery ya parsea automáticamente la respuesta JSON como objeto
                var data = response;
                
                if (data.success && data.data.branchs) {
                    var sedeSelect = $('#sede');
                    sedeSelect.empty();
                    sedeSelect.append('<option value="">Seleccione una sede...</option>');
                    
                    data.data.branchs.forEach(function(branch) {
                        sedeSelect.append('<option value="' + branch.value + '">' + branch.text + '</option>');
                    });
                } else {
                    console.error('Error en respuesta de sucursales:', data);
                    $('#sede').html('<option value="">Error al cargar sedes</option>');
                }
            },
            error: function(xhr, status, error) {
                console.error('Error AJAX en sucursales:');
                console.error('Status:', status);
                console.error('Error:', error);
                console.error('Response Text:', xhr.responseText);
                console.error('Status Code:', xhr.status);
                $('#sede').html('<option value="">Error al cargar sedes</option>');
            }
        });
    }

    // Función para cargar impresoras por sede específica
    function cargarImpresorasPorSede(branchCode) {
        $.ajax({
            url: 'utilities/getBranchData.php?type=branch_locations&branch_code=' + branchCode,
            type: 'GET',
            success: function(response) {
                var data = response;
                if (data.success && data.data.locations) {
                    var impresoraSelect = $('#impresora');
                    impresoraSelect.empty();
                    impresoraSelect.append('<option value="">Seleccione una Locación...</option>');

                    data.data.locations.forEach(function(location) {
                        impresoraSelect.append('<option value="' + location.value + '">' + location.text + '</option>');
                    });
                } else {
                    console.error('Error en respuesta de impresoras por sede:', data);
                    $('#impresora').html('<option value="">Error al cargar impresoras</option>');
                }
            },
            error: function(xhr, status, error) {
                console.error('Error AJAX en impresoras por sede:');
                console.error('Status:', status);
                console.error('Error:', error);
                console.error('Response Text:', xhr.responseText);
                console.error('Status Code:', xhr.status);
                $('#impresora').html('<option value="">Error al cargar impresoras</option>');
            }
        });
    }
    
    // Función para mostrar indicador de carga
    function mostrarCargando() {
        // Deshabilitar el botón buscar
        $('#btn_buscar').prop('disabled', true);
        $('#btn_buscar').html('<i class="ki-duotone ki-loading fs-2"><span class="path1"></span><span class="path2"></span></i>Cargando...');
        
        // Mostrar mensaje de carga en la tabla con mejor centrado
        tablaEtiquetas.clear();
        
        // Crear una fila con una sola celda que ocupe todas las columnas
        var rowNode = tablaEtiquetas.row.add([
            '<div class="d-flex flex-column align-items-center justify-content-center" style="height: 200px;">' +
                '<i class="ki-duotone ki-loading fs-3 text-primary mb-2"><span class="path1"></span><span class="path2"></span></i>' +
                '<div class="text-muted">Cargando etiquetas...</div>' +
            '</div>',
            '', '', '', '', '', '', ''
        ]).draw().node();
        
        // Aplicar colspan a la primera celda
        $(rowNode).find('td:first').attr('colspan', '8').css('text-align', 'center');
        // Ocultar las otras celdas
        $(rowNode).find('td:not(:first)').hide();
    }
    
    // Función para ocultar indicador de carga
    function ocultarCargando() {
        // Habilitar el botón buscar
        $('#btn_buscar').prop('disabled', false);
        $('#btn_buscar').html('<i class="ki-duotone ki-magnifier fs-2"><span class="path1"></span><span class="path2"></span></i>Buscar');
    }
    
    // Función para mostrar mensaje de éxito
    function mostrarExito(mensaje) {
        Swal.fire({
            title: '¡Éxito!',
            text: mensaje,
            icon: 'success',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#3699FF',
            timer: 3000,
            timerProgressBar: true
        });
    }
    
    // Función para mostrar mensaje de error
    function mostrarError(mensaje) {
        Swal.fire({
            title: 'Error',
            text: mensaje,
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#F64E60'
        });
    }
    
    // Función para mostrar mensaje de advertencia
    function mostrarAdvertencia(mensaje) {
        Swal.fire({
            title: 'Advertencia',
            text: mensaje,
            icon: 'warning',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#FFA800'
        });
    }
    
    // Función para cargar etiquetas desde el endpoint
    function cargarEtiquetas(branchCode) {
        $.ajax({
            url: 'apps/Impresiones/Etiquetas/load_etiquetas.php',
            type: 'GET',
            data: {
                branch_code: branchCode
            },
            success: function(response) {
                // Ocultar indicador de carga
                ocultarCargando();
                
                if (response.success && response.data) {
                    // Limpiar la tabla
                    tablaEtiquetas.clear();
                    
                    if (response.data.length === 0) {
                        // Mostrar mensaje de no hay datos
                        var rowNode = tablaEtiquetas.row.add([
                            '<div class="d-flex flex-column align-items-center justify-content-center" style="height: 150px;">' +
                                '<i class="ki-duotone ki-information-5 fs-3 text-muted mb-2"><span class="path1"></span><span class="path2"></span></i>' +
                                '<div class="text-muted">No se encontraron etiquetas para esta sede</div>' +
                            '</div>',
                            '', '', '', '', '', '', ''
                        ]).draw().node();
                        
                        // Aplicar colspan a la primera celda
                        $(rowNode).find('td:first').attr('colspan', '8').css('text-align', 'center');
                        // Ocultar las otras celdas
                        $(rowNode).find('td:not(:first)').hide();
                        return;
                    }
                    
                    // Agregar los datos a la tabla
                    response.data.forEach(function(etiqueta, index) {
                        // Guardar todos los datos originales en el DOM para uso posterior
                        var rowData = {
                            branch_code: etiqueta.branch_code || '',
                            branch_description: etiqueta.sede || '',
                            product_code: etiqueta.codigo || '',
                            product_description: etiqueta.descripcion || '',
                            serie_code: etiqueta.lote || '',
                            quantity: parseFloat(etiqueta.cantidad_etiquetas || 0).toFixed(2),
                            unit: etiqueta.unidad || '',
                            production_date: etiqueta.fecha_produccion || ''
                        };
                        
                        tablaEtiquetas.row.add([
                            '<div class="form-check">' +
                                '<input class="form-check-input" type="checkbox" id="check_' + index + '" data-codigo="' + (etiqueta.codigo || '') + '" data-index="' + index + '" onchange="toggleSeleccion(this)">' +
                            '</div>',
                            etiqueta.lote || '',
                            etiqueta.codigo || '',
                            etiqueta.descripcion || '',
                            etiqueta.sede || '',
                            etiqueta.inventario || '',
                            '<input type="number" class="form-control form-control-sm cantidad-input" id="cantidad_' + index + '" value="0" min="0" data-codigo="' + (etiqueta.codigo || '') + '" data-index="' + index + '" onchange="actualizarCantidad(this)" style="width: 80px;">',
                            '<button type="button" class="btn btn-sm btn-light-primary me-2" onclick="imprimirEtiqueta(\'' + index + '\')">' +
                                '<i class="ki-duotone ki-printer fs-2">' +
                                    '<span class="path1"></span>' +
                                    '<span class="path2"></span>' +
                                '</i>' +
                                'Imprimir' +
                            '</button>'
                        ]);
                        
                        // Guardar los datos en una variable global
                        if (!window.etiquetasData) {
                            window.etiquetasData = {};
                        }
                        window.etiquetasData[index] = rowData;
                    });
                    
                    // Redibujar la tabla
                    tablaEtiquetas.draw();
                    
                } else {
                    console.error('Error en respuesta de etiquetas:', response);
                    var rowNode = tablaEtiquetas.row.add([
                        '<div class="d-flex flex-column align-items-center justify-content-center" style="height: 150px;">' +
                            '<i class="ki-duotone ki-exclamation-triangle fs-3 text-danger mb-2"><span class="path1"></span><span class="path2"></span></i>' +
                            '<div class="text-danger">Error al cargar las etiquetas</div>' +
                        '</div>',
                        '', '', '', '', '', '', ''
                    ]).draw().node();
                    
                    // Aplicar colspan a la primera celda
                    $(rowNode).find('td:first').attr('colspan', '8').css('text-align', 'center');
                    // Ocultar las otras celdas
                    $(rowNode).find('td:not(:first)').hide();
                }
            },
            error: function(xhr, status, error) {
                // Ocultar indicador de carga
                ocultarCargando();
                
                console.error('Error AJAX en etiquetas:');
                console.error('Status:', status);
                console.error('Error:', error);
                console.error('Response Text:', xhr.responseText);
                console.error('Status Code:', xhr.status);
                
                tablaEtiquetas.clear();
                var rowNode = tablaEtiquetas.row.add([
                    '<div class="d-flex flex-column align-items-center justify-content-center" style="height: 150px;">' +
                        '<i class="ki-duotone ki-exclamation-triangle fs-3 text-danger mb-2"><span class="path1"></span><span class="path2"></span></i>' +
                        '<div class="text-danger">Error al conectar con el servidor</div>' +
                    '</div>',
                    '', '', '', '', '', '', ''
                ]).draw().node();
                
                // Aplicar colspan a la primera celda
                $(rowNode).find('td:first').attr('colspan', '8').css('text-align', 'center');
                // Ocultar las otras celdas
                $(rowNode).find('td:not(:first)').hide();
            }
        });
    }
    
    // Función global para imprimir etiqueta (se puede llamar desde el HTML)
    window.imprimirEtiqueta = function(index) {
        // Obtener los datos de la etiqueta
        var etiquetaData = window.etiquetasData[index];
        
        // Intentar obtener la cantidad guardada primero
        var cantidad = etiquetaData.cantidadImprimir || 0;
        
        // Si no hay cantidad guardada, intentar obtener del input
        if (cantidad === 0) {
            var cantidadInput = document.getElementById('cantidad_' + index);
            if (!cantidadInput) {
                cantidadInput = document.querySelector('input.cantidad-input[data-index="' + index + '"]');
            }
            
            var valorDirecto = cantidadInput ? cantidadInput.value : '0';
            cantidad = parseInt(valorDirecto) || 0;
        }
        
        if (cantidad <= 0) {
            mostrarAdvertencia('Por favor ingrese una cantidad mayor a 0 para imprimir.');
            return;
        }
        
        // Obtener el path de la impresora seleccionada
        var impresoraSeleccionada = $('#impresora').val();
        if (!impresoraSeleccionada) {
            mostrarAdvertencia('Por favor seleccione una locación antes de imprimir.');
            return;
        }
        
        // Crear el payload para una sola etiqueta
        var payload = {
            path: impresoraSeleccionada,
            labels: [
                {
                    quantity_printer: cantidad,
                    label: etiquetaData
                }
            ]
        };
        
        enviarImpresion(payload);
    }
    
    // Función para manejar la selección de checkboxes
    window.toggleSeleccion = function(checkbox) {
        var index = checkbox.getAttribute('data-index');
        // Buscar el input de cantidad específico para este índice
        var cantidadInput = document.querySelector('input.cantidad-input[data-index="' + index + '"]');
        
        if (checkbox.checked) {
            // Dar foco al input de cantidad cuando se selecciona
            if (cantidadInput) {
                cantidadInput.focus();
            }
        } else {
            // Resetear el input de cantidad cuando se deselecciona
            if (cantidadInput) {
                cantidadInput.value = 0;
                // También resetear en memoria
                if (window.etiquetasData && window.etiquetasData[index]) {
                    window.etiquetasData[index].cantidadImprimir = 0;
                }
            }
        }
        
        verificarSeleccionMultiple();
    }
    
    // Función para actualizar la cantidad
    window.actualizarCantidad = function(input) {
        var cantidad = parseInt(input.value) || 0;
        
        if (cantidad < 0) {
            input.value = 0;
            cantidad = 0;
        }
        
        // Guardar la cantidad en el objeto de datos
        var index = input.getAttribute('data-index');
        if (index !== null && window.etiquetasData && window.etiquetasData[index]) {
            window.etiquetasData[index].cantidadImprimir = cantidad;
        }
        
        verificarSeleccionMultiple();
    }
    
    // Función para verificar si hay múltiples selecciones y mostrar/ocultar botón
    function verificarSeleccionMultiple() {
        var checkboxesSeleccionados = document.querySelectorAll('input[type="checkbox"]:checked');
        var botonImprimirVarias = document.getElementById('btn_imprimir_varias');
        
        if (checkboxesSeleccionados.length > 1) {
            // Mostrar botón de imprimir varias
            if (!botonImprimirVarias) {
                var boton = '<button type="button" id="btn_imprimir_varias" class="btn btn-primary ms-3" onclick="imprimirVarias()">' +
                    '<i class="ki-duotone ki-printer fs-2">' +
                        '<span class="path1"></span>' +
                        '<span class="path2"></span>' +
                    '</i>' +
                    'Imprimir varias (' + checkboxesSeleccionados.length + ')' +
                '</button>';
                document.querySelector('.card-toolbar .d-flex').insertAdjacentHTML('beforeend', boton);
            } else {
                botonImprimirVarias.innerHTML = '<i class="ki-duotone ki-printer fs-2"><span class="path1"></span><span class="path2"></span></i>Imprimir varias (' + checkboxesSeleccionados.length + ')';
            }
        } else {
            // Ocultar botón de imprimir varias
            if (botonImprimirVarias) {
                botonImprimirVarias.remove();
            }
        }
    }
    
    // Función para imprimir varias etiquetas
    window.imprimirVarias = function() {
        var labels = [];
        var checkboxesSeleccionados = document.querySelectorAll('input[type="checkbox"]:checked');
        var hasZeroQuantity = false;
        
        // Primero verificar que todas las cantidades sean mayores a 0
        checkboxesSeleccionados.forEach(function(checkbox) {
            var index = checkbox.getAttribute('data-index');
            var etiquetaData = window.etiquetasData[index];
            
            // Obtener la cantidad guardada en memoria
            var cantidad = etiquetaData.cantidadImprimir || 0;
            
            // Si no hay cantidad guardada, intentar obtener del input
            if (cantidad === 0) {
                var cantidadInput = document.getElementById('cantidad_' + index);
                if (!cantidadInput) {
                    cantidadInput = document.querySelector('input.cantidad-input[data-index="' + index + '"]');
                }
                
                var valorDirecto = cantidadInput ? cantidadInput.value : '0';
                cantidad = parseInt(valorDirecto) || 0;
            }
            
            if (cantidad <= 0) {
                hasZeroQuantity = true;
            }
        });
        
        // Si alguna cantidad es 0, mostrar error y detener
        if (hasZeroQuantity) {
            mostrarAdvertencia('Todas las cantidades deben ser mayores a 0 para imprimir.');
            return;
        }
        
        // Si todas las cantidades son válidas, proceder con la impresión
        checkboxesSeleccionados.forEach(function(checkbox) {
            var index = checkbox.getAttribute('data-index');
            var etiquetaData = window.etiquetasData[index];
            
            // Intentar obtener la cantidad guardada primero
            var cantidad = etiquetaData.cantidadImprimir || 0;
            
            // Si no hay cantidad guardada, intentar obtener del input
            if (cantidad === 0) {
                var cantidadInput = document.getElementById('cantidad_' + index);
                if (!cantidadInput) {
                    cantidadInput = document.querySelector('input.cantidad-input[data-index="' + index + '"]');
                }
                
                var valorDirecto = cantidadInput ? cantidadInput.value : '0';
                cantidad = parseInt(valorDirecto) || 0;
            }
            
            labels.push({
                quantity_printer: cantidad,
                label: etiquetaData
            });
        });
        
        // Obtener el path de la impresora seleccionada
        var impresoraSeleccionada = $('#impresora').val();
        if (!impresoraSeleccionada) {
            mostrarAdvertencia('Por favor seleccione una locación antes de imprimir.');
            return;
        }
        
        // Crear el payload para múltiples etiquetas
        var payload = {
            path: impresoraSeleccionada,
            labels: labels
        };
        
        enviarImpresion(payload);
    }
    
    // Función para enviar la impresión al endpoint
    function enviarImpresion(payload) {
        // Mostrar loading en SweetAlert
        Swal.fire({
            title: 'Enviando impresión...',
            text: 'Por favor espere mientras se procesa su solicitud',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        $.ajax({
            url: 'apps/Impresiones/Etiquetas/print_etiquetas.php',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify(payload),
            success: function(response) {
                // Cerrar el loading
                Swal.close();
                
                if (response.success) {
                    mostrarExito('Impresión enviada exitosamente');
                } else {
                    mostrarError(response.message || 'Error desconocido al enviar la impresión');
                }
            },
            error: function(xhr, status, error) {
                console.error('Error al enviar impresión:');
                console.error('Status:', status);
                console.error('Error:', error);
                console.error('Response Text:', xhr.responseText);
                
                // Cerrar el loading
                Swal.close();
                
                mostrarError('Error al enviar la impresión. Revisa la consola para más detalles.');
            }
        });
    }
}); 