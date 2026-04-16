<!-- Modal para Unidades de Venta -->
<div class="modal fade" id="modalUnidadVenta" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="modalUnidadVentaTitle">Gestión de Unidad de Venta</h5>
                <button type="button" class="btn-close" id="btnCloseUnidadVenta" aria-label="Close"></button>
            </div>
            <form id="formUnidadVenta" onsubmit="return false;">
                <div class="modal-body">
                    <!-- Campo Descripción -->
                    <div class="mb-3">
                        <label for="unidadVentaNombre" class="form-label">Descripción</label>
                        <input type="text" class="form-control" id="unidadVentaNombre" required>
                    </div>

                    <div class="mb-3">
                        <label for="sapCode" class="form-label">SAP Code</label>
                        <input type="text" class="form-control" id="sapCode" required>
                    </div>


                    <!-- Campo Empresa (Lista Desplegable) -->
                    <div class="mb-3">
                        <label for="unidadVentaEmpresa" class="form-label">Empresa</label>
                        <select class="form-select" id="unidadVentaEmpresa" required>
                            <option value="" disabled selected>Cargando empresas...</option>
                        </select>
                    </div>

                    <div class="form-check form-switch mb-3">
                        <input class="form-check-input" type="checkbox" id="unidadVentaStatus" checked>
                        <label class="form-check-label" for="unidadVentaStatus">Activo</label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-light" id="btnCancelarUnidadVenta">Cancelar</button>
                    <button type="button" class="btn btn-primary" id="btnGuardarUnidadVenta">Guardar</button>
                </div>
            </form>
        </div>
    </div>
</div>