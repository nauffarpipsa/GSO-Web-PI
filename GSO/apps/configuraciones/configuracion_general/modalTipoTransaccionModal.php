<div class="modal fade" id="modalTipoTransaccion" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="modalTipoTransaccionTitle">Gestión de Tipo de Autorización</h5>
                <button type="button" class="btn-close" aria-label="Close"></button>
            </div>
            <form id="formTipoTransaccion">
                <!-- Evita el envío tradicional del formulario -->
                <div class="modal-body">
                    <div class="mb-3">
                        <label for="TipoTransaccionNombre" class="form-label">Nombre del Tipo Transaccion</label>
                        <input type="text" class="form-control" id="TipoTransaccionNombre">
                    </div>
                    <div class="form-check form-switch mb-3">
                        <input class="form-check-input" type="checkbox" id="tipoTransaccionStatus" checked>
                        <label class="form-check-label" for="tipoTransaccionStatus">Activo</label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-light" id="btnCancelarTipoTransaccion">Cancelar</button>
                    <button type="button" class="btn btn-primary" id="btnGuardarTipoTransaccion">Guardar</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- CSS específico del módulo Configuración General -->
<link rel="stylesheet" href="apps\configuraciones\configuracion_general\css\configuraciones_generales.css">

<!-- Módulo específico de configuración -->
<script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
<script type="module" src="apps\configuraciones\configuracion_general\js\configuracion-general.js"></script>