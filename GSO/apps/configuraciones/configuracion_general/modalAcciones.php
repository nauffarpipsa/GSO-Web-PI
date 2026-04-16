<!-- Modal para Acciones -->
<div class="modal fade" id="modalAcciones" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="modalAccionesTitle">Gestión de Acción</h5>
                <button type="button" class="btn-close" id="btnCloseAccion" aria-label="Close"></button>
            </div>
            <form id="formAcciones" onsubmit="return false;">
                <div class="modal-body">
                    <!-- Campo Descripción -->
                    <div class="mb-3">
                        <label for="accionNombre" class="form-label">Descripción</label>
                        <input type="text" class="form-control" id="accionNombre" required>
                    </div>

                    <!-- Campo Estado (Switch) -->
                    <div class="form-check form-switch mb-3">
                        <input class="form-check-input" type="checkbox" id="accionStatus" checked>
                        <label class="form-check-label" for="accionStatus">Activo</label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-light" id="btnCancelarAccion">Cancelar</button>
                    <button type="button" class="btn btn-primary" id="btnGuardarAccion">Guardar</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script type="module" src="apps/configuraciones/configuracion_general/js/acciones.js"></script>