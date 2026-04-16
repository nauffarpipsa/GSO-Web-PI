<!-- Modal para Configuración de Reportes -->
<div class="modal fade" id="modalReportConfiguration" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="modalReportConfigurationTitle">Gestión de Configuración de Reportes</h5>
                <button type="button" class="btn-close" id="btnCloseReportConfiguration" aria-label="Close"></button>
            </div>
            <form id="formReportConfiguration" onsubmit="return false;">
                <div class="modal-body">

                    <!-- Dropdowns -->
                    <div class="mb-3">
                        <label for="reportAccess" class="form-label">Acceso</label>
                        <select class="form-select" id="reportAccess" required>
                            <option value="">Seleccione una opción</option>
                        </select>
                    </div>

                    <!-- Dropdowns Descripción -->
                    <div class="mb-3">
                        <label for="reportDescription" class="form-label">Listado de Reportes</label>
                        <select class="form-select" id="reportDescription" required>
                            <option value="">Seleccione una opción</option>
                        </select>
                    </div>

                    <!-- Campo Estado (Switch) -->
                    <div class="form-check form-switch mb-3">
                        <input class="form-check-input" type="checkbox" id="reportStatus" checked>
                        <label class="form-check-label" for="reportStatus">Activo</label>
                    </div>



                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-light" id="btnCancelarReportConfiguration">Cancelar</button>
                    <button type="button" class="btn btn-primary" id="btnGuardarReportConfiguration">Guardar</button>
                </div>
            </form>
        </div>
    </div>
</div>

<script type="module" src="apps\configuraciones\configuracion_general\js\reportConfiguration.js"></script>