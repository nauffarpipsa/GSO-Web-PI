<div class="modal fade" id="modalTipoAutorizacion" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="modalTipoAutorizacionTitle">Gestión de Tipo de Autorización</h5>
                <button type="button" class="btn-close" aria-label="Close"></button>
            </div>
            <form id="formTipoAutorizacion">
                <!-- Evita el envío tradicional del formulario -->
                <div class="modal-body">
                    <div class="mb-3">
                        <label for="tipoAutorizacionNombre" class="form-label">Nombre del Tipo Autorizacion</label>
                        <input type="text" class="form-control" id="tipoAutorizacionNombre">
                    </div>
                    <div class="mb-3">
                        <label for="idOperation" class="form-label">Id Operativo</label>
                        <input type="text" class="form-control" id="idOperation">
                    </div>
                    <div class="form-check form-switch mb-3">
                        <input class="form-check-input" type="checkbox" id="tipoAutorizacionStatus" checked>
                        <label class="form-check-label" for="tipoAutorizacionStatus">Activo</label>
                    </div>
                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-light" id="btnCancelarTipoAutorizacion">Cancelar</button>
                    <button type="button" class="btn btn-primary" id="btnGuardarTipoAutorizacion">Guardar</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- CSS específico del módulo Configuración General -->
<link rel="stylesheet" href="apps\configuraciones\configuracion_general\css\configuraciones_generales.css">
<script src="https://cdn.jsdelivr.net/npm/just-validate@4.2.0/dist/just-validate.production.min.js"></script>

<!-- Módulo específico de configuración -->
<script src="https://cdn.jsdelivr.net/npm/axios/dist/axios.min.js"></script>
<script type="module" src="apps\configuraciones\configuracion_general\js\configuracion-general.js"></script>