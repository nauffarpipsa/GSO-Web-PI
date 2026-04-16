<!-- Modal para Tipos de Cambio -->
<div class="modal fade" id="modalTiposCambio" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="modalTiposCambioTitle">Gestión de Tipo de Cambio</h5>
                <button type="button" class="btn-close" id="btnCloseTipoCambio" aria-label="Close"></button>
            </div>
            <!-- El 'novalidate' es importante para que JustValidate tome el control total -->
            <form id="formTiposCambio" novalidate>
                <div class="modal-body">

                    <!-- Campo Fecha -->
                    <div class="mb-3">
                        <label for="tipoCambioDate" class="form-label">Fecha</label>
                        <input type="date" class="form-control" id="tipoCambioDate" required>
                    </div>

                    <!-- Campo Tasa de Cambio -->
                    <div class="mb-3">
                        <label for="tipoCambioRate" class="form-label">Tasa de Cambio</label>
                        <input type="number" step="any" class="form-control" id="tipoCambioRate" required>
                    </div>

                    <div class="mb-3">
                        <label for="companyId" class="form-label fw-bold">Sociedad
                        </label>
                        <select class="form-select" id="companyId" required>
                            <option value="">Seleccionar una sociedad...</option>
                        </select>
                    </div>

                    <!-- Campo País (Select) -->
                    <div class="mb-3">
                        <label for="tipoCambioCountry" class="form-label">País</label>
                        <select class="form-select" id="tipoCambioCountry" required>
                            <option value="">Seleccione un país...</option>
                        </select>
                    </div>

                    <!-- Campo Moneda (Select) -->
                    <div class="mb-3">
                        <label for="tipoCambioCurrency" class="form-label">Código de Moneda</label>
                        <input type="text" class="form-control" id="tipoCambioCurrency" required maxlength="3" style="text-transform:uppercase">
                    </div>

                    <!-- Campo Estado (Switch) -->
                    <div class="form-check form-switch mb-3">
                        <input class="form-check-input" type="checkbox" id="tipoCambioStatus" checked>
                        <label class="form-check-label" for="tipoCambioStatus">Activo</label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-light" id="btnCancelarTipoCambio">Cancelar</button>
                    <!-- Cambiado a type="submit" para que JustValidate intercepte el evento -->
                    <button type="submit" class="btn btn-primary" id="btnGuardarTipoCambio">Guardar</button>
                </div>
            </form>
        </div>
    </div>
</div>



<script type="module" src="apps/configuraciones/configuracion_general/js/tiposCambio.js"></script>