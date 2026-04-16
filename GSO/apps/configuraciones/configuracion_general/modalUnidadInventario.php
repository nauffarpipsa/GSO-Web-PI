<!-- Modal para Unidades de Inventario -->
<div class="modal fade" id="modalUnidadInventario" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="modalUnidadInventarioTitle">Gestión de Unidad de Inventario</h5>
                <button type="button" class="btn-close" id="btnCloseUnidadInventario" aria-label="Close"></button>
            </div>
            <form id="formUnidadInventario" onsubmit="return false;">
                <div class="modal-body">
                    <!-- Campo Descripción -->
                    <div class="mb-3">
                        <label for="unidadInventarioNombre" class="form-label">Descripción</label>
                        <input type="text" class="form-control" id="unidadInventarioNombre" required>
                    </div>

                    <div class="mb-3">
                        <label for="sapCodeUs" class="form-label">SAP Code</label>
                        <input type="text" class="form-control" id="sapCodeU" required>
                    </div>

                    <!-- Campo Empresa (Lista Desplegable) -->
                    <div class="mb-3">
                        <label for="unidadInventarioEmpresa" class="form-label">Empresa</label>
                        <select class="form-select" id="unidadInventarioEmpresa" required>
                            <option value="" disabled selected>Cargando empresas...</option>
                        </select>
                    </div>

                    <div class="form-check form-switch mb-3">
                        <input class="form-check-input" type="checkbox" id="unidadInventarioStatus" checked>
                        <label class="form-check-label" for="unidadInventarioStatus">Activo</label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-light" id="btnCancelarUnidadInventario">Cancelar</button>
                    <button type="button" class="btn btn-primary" id="btnGuardarUnidadInventario">Guardar</button>
                </div>
            </form>
        </div>
    </div>
</div>