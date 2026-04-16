<!-- Modal para Tipos de Módulos Operativos -->
<div class="modal fade" id="modalTipoModuloOperativo" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="modalTipoModuloOperativoTitle">Gestión de Módulo Operativo</h5>
                <button type="button" class="btn-close" id="btnCloseTipoModuloOperativo" aria-label="Close"></button>
            </div>
            <form id="formTipoModuloOperativo" onsubmit="return false;">
                <div class="modal-body">
                    <!-- Campo Descripción -->
                    <div class="mb-3">
                        <label for="tipoModuloOperativoNombre" class="form-label">Descripción *</label>
                        <input type="text" class="form-control" id="tipoModuloOperativoNombre" required>
                    </div>
                    <div class="form-check form-switch mb-3">
                        <input class="form-check-input" type="checkbox" id="tipoModuloOperativoStatus" checked>
                        <label class="form-check-label" for="tipoModuloOperativoStatus">Activo</label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-light" id="btnCancelarTipoModuloOperativo">Cancelar</button>
                    <button type="button" class="btn btn-primary" id="btnGuardarTipoModuloOperativo">Guardar</button>
                </div>
            </form>
        </div>
    </div>
</div>