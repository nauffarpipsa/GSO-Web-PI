$(document).ready(function() {
    // Inicializar el formulario
    inicializarFormulario();
    
    /**
     * Inicializar el formulario y sus eventos
     */
    function inicializarFormulario() {
        // Evento para el envío del formulario
        $('#formReimpresion').on('submit', function(e) {
            e.preventDefault();
            procesarReimpresion();
        });
        
        // Evento para el botón limpiar
        $('#btnLimpiar').on('click', function() {
            limpiarFormulario();
        });
        
        // Validación en tiempo real
        $('#documentoId').on('input', function() {
            validarCampo($(this));
        });
        
        $('#tipoDocumento').on('change', function() {
            validarCampo($(this));
        });
    }
    
    /**
     * Validar un campo individual
     */
    function validarCampo($campo) {
        const valor = $campo.val().trim();
        const esRequerido = $campo.prop('required');
        
        if (esRequerido && valor === '') {
            $campo.removeClass('is-valid').addClass('is-invalid');
            return false;
        } else {
            $campo.removeClass('is-invalid').addClass('is-valid');
            return true;
        }
    }
    
    /**
     * Validar todo el formulario
     */
    function validarFormulario() {
        let esValido = true;
        
        const documentoId = $('#documentoId');
        const tipoDocumento = $('#tipoDocumento');
        
        if (!validarCampo(documentoId)) {
            esValido = false;
        }
        
        if (!validarCampo(tipoDocumento)) {
            esValido = false;
        }
        
        return esValido;
    }
    
    /**
     * Procesar la reimpresión del documento
     */
    function procesarReimpresion() {
        // Validar formulario
        if (!validarFormulario()) {
            mostrarError('Por favor complete todos los campos requeridos.');
            return;
        }
        
        // Obtener datos del formulario
        const documentoId = $('#documentoId').val().trim();
        const tipoDocumento = $('#tipoDocumento').val();
        
        // Deshabilitar botón y mostrar loading
        const $btnReimprimir = $('#btnReimprimir');
        $btnReimprimir.prop('disabled', true).addClass('btn-loading');
        $btnReimprimir.html('<i class="ki-duotone ki-loading fs-2"><span class="path1"></span><span class="path2"></span></i>Procesando...');
        
        // Mostrar loading con SweetAlert
        Swal.fire({
            title: 'Procesando reimpresión...',
            text: 'Por favor espere mientras se procesa su solicitud',
            allowOutsideClick: false,
            allowEscapeKey: false,
            showConfirmButton: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });
        
        // Realizar petición AJAX
        $.ajax({
            url: 'apps/Impresiones/Reimpresion/api/reimpresion-endpoints.php',
            type: 'POST',
            contentType: 'application/json',
            data: JSON.stringify({
                action: 'reimprimir',
                documentoId: documentoId,
                tipoDocumento: tipoDocumento
            }),
            success: function(response) {
                // Cerrar loading
                Swal.close();
                
                // Restaurar botón
                $btnReimprimir.prop('disabled', false).removeClass('btn-loading');
                $btnReimprimir.html('<i class="ki-duotone ki-printer fs-2"><span class="path1"></span><span class="path2"></span></i>Reimprimir');
                
                if (response.success) {
                    mostrarExito(response.message || 'Documento enviado para reimpresión exitosamente.');
                    limpiarFormulario();
                } else {
                    mostrarError(response.message || 'Error al procesar la reimpresión.');
                }
            },
            error: function(xhr, status, error) {
                // Cerrar loading
                Swal.close();
                
                // Restaurar botón
                $btnReimprimir.prop('disabled', false).removeClass('btn-loading');
                $btnReimprimir.html('<i class="ki-duotone ki-printer fs-2"><span class="path1"></span><span class="path2"></span></i>Reimprimir');
                
                console.error('Error AJAX en reimpresión:');
                console.error('Status:', status);
                console.error('Error:', error);
                console.error('Response Text:', xhr.responseText);
                
                let mensajeError = 'Error al conectar con el servidor.';
                
                if (xhr.responseJSON && xhr.responseJSON.message) {
                    mensajeError = xhr.responseJSON.message;
                } else if (xhr.responseText) {
                    try {
                        const errorResponse = JSON.parse(xhr.responseText);
                        mensajeError = errorResponse.message || mensajeError;
                    } catch (e) {
                        // Si no se puede parsear, usar el mensaje por defecto
                    }
                }
                
                mostrarError(mensajeError);
            }
        });
    }
    
    /**
     * Limpiar el formulario
     */
    function limpiarFormulario() {
        $('#formReimpresion')[0].reset();
        $('#documentoId, #tipoDocumento').removeClass('is-valid is-invalid');
        $('#documentoId').focus();
    }
    
    /**
     * Mostrar mensaje de éxito
     */
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
    
    /**
     * Mostrar mensaje de error
     */
    function mostrarError(mensaje) {
        Swal.fire({
            title: 'Error',
            text: mensaje,
            icon: 'error',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#F64E60'
        });
    }
    
    /**
     * Mostrar mensaje de advertencia
     */
    function mostrarAdvertencia(mensaje) {
        Swal.fire({
            title: 'Advertencia',
            text: mensaje,
            icon: 'warning',
            confirmButtonText: 'Aceptar',
            confirmButtonColor: '#FFA800'
        });
    }
});
