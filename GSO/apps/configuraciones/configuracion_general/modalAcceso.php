<!-- Modal para Acceso -->
<div class="modal fade" id="modalAcceso" tabindex="-1" aria-hidden="true">
    <!-- Se aumenta el tamaño a modal-lg para las acciones -->
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title" id="modalAccesoTitle">Gestión de Acceso</h5>
                <button type="button" class="btn-close" id="btnCloseAcceso" aria-label="Close"></button>
            </div>
            <form id="formAcceso" onsubmit="return false;">
                <div class="modal-body">
                    <!-- Campo Descripción -->
                    <div class="mb-3">
                        <label for="accesoNombre" class="form-label">Descripción</label>
                        <input type="text" class="form-control" id="accesoNombre" required>
                    </div>

                    <!-- Campo Acceso Padre (MEJORADO - visible en edición) -->
                    <div class="mb-3" id="fatherField" style="display: none;">
                        <label class="form-label fw-bold">Acceso Padre</label>
                        <div class="input-group">
                            <input 
                                type="text" 
                                class="form-control" 
                                id="accesoFatherId" 
                                readonly
                                placeholder="Sin padre asignado"
                            >
                            <button 
                                type="button" 
                                class="btn btn-outline-danger" 
                                id="btnDesasignarPadre"
                                title="Desasignar padre"
                                style="display: none;"
                            >
                                <i class="e-icons e-close"></i>
                            </button>
                            <button 
                                type="button" 
                                class="btn btn-outline-primary" 
                                id="btnCambiarPadre"
                                title="Cambiar o asignar padre"
                            >
                                <i class="e-icons e-edit"></i> Cambiar
                            </button>
                        </div>
                        <small class="text-muted d-block mt-2" id="fatherHierarchyInfo">
                            <!-- Mostrará info jerárquica -->
                        </small>
                    </div>

                    <!-- Campo Estado (Switch) -->
                    <div class="form-check form-switch mb-3">
                        <input class="form-check-input" type="checkbox" id="accesoStatus" checked>
                        <label class="form-check-label" for="accesoStatus">Activo</label>
                    </div>

                    <!-- INICIO: Sección para Acciones -->
                    <div class="mb-3">
                        <label class="form-label fw-bold">Acciones disponibles:</label>
                        <div id="accesoAccionesContainer" class="border p-3 rounded" style="max-height: 200px; overflow-y: auto;">
                            <!-- Checkboxes de acciones se cargarán aquí dinámicamente -->
                            Cargando acciones...
                        </div>
                    </div>
                    <!-- FIN: Sección para Acciones -->

                </div>
                <div class="modal-footer">
                    <button type="button" class="btn btn-light" id="btnCancelarAcceso">Cancelar</button>
                    <button type="button" class="btn btn-primary" id="btnGuardarAcceso">Guardar</button>
                </div>
            </form>
        </div>
    </div>
</div>

<!-- Modal para seleccionar Acceso Padre -->
<div class="modal fade" id="modalSeleccionarPadre" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-dialog-centered modal-lg">
        <div class="modal-content">
            <div class="modal-header">
                <h5 class="modal-title">Seleccionar Acceso Padre</h5>
                <button type="button" class="btn-close" id="btnClosePadreModal" aria-label="Close"></button>
            </div>
            <div class="modal-body">
                <!-- Opción Sin Padre -->
                <div class="alert alert-info" role="alert">
                    <div class="form-check">
                        <input 
                            class="form-check-input" 
                            type="radio" 
                            name="padreSeleccionado" 
                            id="opcionSinPadre"
                            value="0"
                        >
                        <label class="form-check-label" for="opcionSinPadre">
                            <strong>Sin acceso padre</strong>
                            <br>
                            <small class="text-muted">Este acceso será un acceso raíz</small>
                        </label>
                    </div>
                </div>

                <!-- Grid de accesos elegibles -->
                <div class="mb-3">
                    <label class="form-label">O selecciona un acceso como padre:</label>
                    <div id="padreSeleccionGrid"></div>
                </div>

                <!-- Info de jerarquía -->
                <div id="padreJerarquiaInfo" class="alert alert-sm alert-secondary" style="display: none;">
                    <!-- Se muestra la jerarquía del padre seleccionado -->
                </div>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-light" id="btnCancelarPadreModal">Cancelar</button>
                <button type="button" class="btn btn-primary" id="btnConfirmarPadre" disabled>Confirmar</button>
            </div>
        </div>
    </div>
</div>

<script type="module" src="apps/configuraciones/configuracion_general/js/acceso.js"></script>