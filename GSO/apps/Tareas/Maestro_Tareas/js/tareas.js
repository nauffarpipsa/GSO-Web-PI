document.addEventListener('DOMContentLoaded', function() {
    let grid;

    function initGrid() {
        grid = new ej.grids.Grid({
            dataSource: new ej.data.DataManager({
                url: 'apps/Tareas/Maestro_Tareas/api/tareas-endpoints.php?action=getAll',
                adaptor: new ej.data.WebApiAdaptor()
            }),
            allowPaging: true,
            allowSorting: true,
            allowFiltering: false,
            pageSettings: { pageSize: 15 },
            columns: [
                { field: 'id', headerText: 'ID', width: 70, isPrimaryKey: true, textAlign: 'Right' },
                { field: 'description', headerText: 'Descripción', width: 220 },
                { field: 'companyName', headerText: 'Compañía', width: 150 },
                { field: 'action_Type', headerText: 'Tipo Acción', width: 120 },
                { field: 'last_Run', headerText: 'Última Ejecución', width: 160, format: 'dd/MM/yyyy HH:mm', type: 'datetime' },
                { 
                    field: 'is_Active', 
                    headerText: 'Estado', 
                    width: 100,
                    textAlign: 'Center',
                    template: '#statusTemplate'
                },
                {
                    headerText: 'Acciones',
                    width: 120,
                    textAlign: 'Center',
                    template: '#actionsTemplate'
                }
            ],
            dataBound: function() {
                // Agregar listeners a los toggles de estado
                const switches = document.querySelectorAll('.task-status-toggle');
                switches.forEach(sw => {
                    sw.addEventListener('change', function(e) {
                        const taskId = this.getAttribute('data-id');
                        const actionType = this.getAttribute('data-action-type');
                        const isChecked = this.checked;
                        toggleTaskStatus(taskId, isChecked, actionType, this);
                    });
                });
                
                // Listeners de edición
                document.querySelectorAll('.btn-edit').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const id = parseInt(this.getAttribute('data-id'));
                        const rowData = grid.currentViewData.find(item => item.id === id);
                        if (rowData) {
                            abrirModalEditar(rowData);
                        } else {
                            toastr.error('No se encontró la información de la tarea.');
                        }
                    });
                });
                
                // Listeners de eliminación
                document.querySelectorAll('.btn-delete').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const id = this.getAttribute('data-id');
                        toastr.info('Eliminar tarea ' + id + ' (Próximamente)');
                    });
                });

                // Listeners de ejecución manual
                document.querySelectorAll('.btn-execute').forEach(btn => {
                    btn.addEventListener('click', function() {
                        const id = this.getAttribute('data-id');
                        ejecutarTarea(id);
                    });
                });
            }
        });
        console.log('[Tareas] Ejecutando grid.appendTo("#tareasGrid")');
        grid.appendTo('#tareasGrid');
        console.log('[Tareas] grid.appendTo() completado exitosamente');
    }

    let currentIsActive = true; // Estado temporal para el modal

    function abrirModalEditar(data) {
        document.getElementById('edit_id').value = data.id || '';
        document.getElementById('edit_description').value = data.description || '';
        
        const companySelect = $('#edit_company_id');
        companySelect.val(data.company_Id || '').trigger('change');
        
        const odataSelect = $('#edit_odata_link_id');
        odataSelect.val(data.odata_Link_Id || '').trigger('change');
        
        currentIsActive = data.is_Active === true || data.is_Active === 'true' || data.is_Active === 1;
        
        const actionTypeEl = $('#edit_action_type');
        if (data.action_Type) {
            actionTypeEl.val(data.action_Type).trigger('change');
        } else {
            actionTypeEl.val('MAIL').trigger('change');
        }

        const cronInput = document.getElementById('edit_frequency_cron');
        const cronPreset = document.getElementById('edit_cron_preset');
        
        cronInput.value = data.frequency_Cron || '';
        
        // Revisar si hace match con algún preset
        let presetFound = false;
        Array.from(cronPreset.options).forEach(opt => {
            if (opt.value === data.frequency_Cron && opt.value !== 'custom') {
                presetFound = true;
                cronPreset.value = opt.value;
            }
        });
        
        const builderEl = document.getElementById('custom_cron_builder');
        if (!presetFound && data.frequency_Cron) {
            cronPreset.value = 'custom';
            builderEl.style.display = 'block';
            parseCronToUI(data.frequency_Cron);
        } else {
            builderEl.style.display = 'none';
        }

        const modalEl = document.getElementById('modalEditarTarea');
        const modal = new bootstrap.Modal(modalEl);
        modal.show();
    }

    function parseCronToUI(cron) {
        if (!cron) return;
        const parts = cron.split(' ');
        if (parts.length >= 5) {
            const min = parts[0];
            const hour = parts[1];
            const dom = parts[2];
            // const month = parts[3]; // ignorado por ahora
            const dow = parts[4];
            
            // Format time HH:mm
            const hh = hour.toString().padStart(2, '0');
            const mm = min.toString().padStart(2, '0');
            document.getElementById('custom_cron_time').value = `${hh}:${mm}`;
            
            if (dom === '*' && dow === '*') {
                document.getElementById('custom_cron_type').value = 'daily';
            } else if (dom === '*' && dow !== '*') {
                document.getElementById('custom_cron_type').value = 'weekly';
                document.getElementById('custom_cron_dow').value = dow;
            } else if (dom !== '*' && dow === '*') {
                document.getElementById('custom_cron_type').value = 'monthly';
                document.getElementById('custom_cron_dom').value = dom;
            }
            // Trigger change para actualizar la UI interna
            document.getElementById('custom_cron_type').dispatchEvent(new Event('change'));
        }
    }

    function buildCronFromUI() {
        const time = document.getElementById('custom_cron_time').value; // HH:mm
        const type = document.getElementById('custom_cron_type').value;
        const [hour, min] = time.split(':');
        
        let dom = '*';
        let dow = '*';
        
        if (type === 'weekly') {
            dow = document.getElementById('custom_cron_dow').value;
        } else if (type === 'monthly') {
            dom = document.getElementById('custom_cron_dom').value;
        }
        
        const cronStr = `${parseInt(min)} ${parseInt(hour)} ${dom} * ${dow}`;
        document.getElementById('edit_frequency_cron').value = cronStr;
    }

    // Listeners del constructor visual de cron
    document.getElementById('edit_cron_preset').addEventListener('change', function() {
        const builder = document.getElementById('custom_cron_builder');
        const hiddenCron = document.getElementById('edit_frequency_cron');
        if (this.value === 'custom') {
            builder.style.display = 'block';
            buildCronFromUI(); // Construir de inmediato con los valores por defecto del builder
        } else {
            builder.style.display = 'none';
            hiddenCron.value = this.value;
        }
    });

    document.getElementById('custom_cron_type').addEventListener('change', function() {
        const type = this.value;
        const container = document.getElementById('custom_cron_day_container');
        const wWeekly = document.getElementById('wrapper_day_weekly');
        const wMonthly = document.getElementById('wrapper_day_monthly');
        
        if (type === 'daily') {
            container.style.display = 'none';
        } else if (type === 'weekly') {
            container.style.display = 'block';
            wWeekly.style.display = 'block';
            wMonthly.style.display = 'none';
        } else if (type === 'monthly') {
            container.style.display = 'block';
            wWeekly.style.display = 'none';
            wMonthly.style.display = 'block';
        }
        buildCronFromUI();
    });

    // Actualizar el cron real si modifican los inputs personalizados
    ['custom_cron_dow', 'custom_cron_dom', 'custom_cron_time'].forEach(id => {
        document.getElementById(id).addEventListener('change', buildCronFromUI);
    });

    function toggleTaskStatus(id, isActive, actionType, checkbox) {
        // Bloquear UI mientras guarda
        checkbox.disabled = true;
        
        const payload = { id: id, actionType: actionType };

        fetch(`apps/Tareas/Maestro_Tareas/api/tareas-endpoints.php?action=toggleStatus`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        })
        .then(response => {
            return response.json().then(data => ({ ok: response.ok, status: response.status, data }));
        })
        .then(({ ok, status, data }) => {
            checkbox.disabled = false;
            if (ok && (data.statusResult === true || data.isSuccess === true || data.estadoActual !== undefined)) {
                const msg = data.messageResult || data.message || 'Estado actualizado correctamente';
                toastr.success(msg);
                if (grid) grid.refresh(); 
            } else {
                const errMsg = data.messageResult || data.message || 'Error desconocido (HTTP ' + status + ')';
                toastr.error(errMsg);
                checkbox.checked = !isActive; // Revertir visualmente
            }
        })
        .catch(err => {
            checkbox.disabled = false;
            toastr.error('Error de conexión con el servidor');
            checkbox.checked = !isActive; // Revertir visualmente
            console.error('toggleStatus error:', err);
        });
    }

    const btnNuevaTarea = document.getElementById('btnNuevaTarea');
    if (btnNuevaTarea) {
        btnNuevaTarea.addEventListener('click', function() {
            document.getElementById('formEditarTarea').reset();
            document.getElementById('edit_id').value = '';
            $('#edit_company_id').val('').trigger('change');
            $('#edit_odata_link_id').val('').trigger('change');
            $('#edit_action_type').val('MAIL').trigger('change');
            currentIsActive = true; // Por defecto activa
            document.querySelector('#modalEditarTarea .modal-header h2').innerText = 'Nueva Tarea';
            
            // Set default presets
            document.getElementById('edit_cron_preset').value = '0 6 * * *';
            document.getElementById('edit_frequency_cron').value = '0 6 * * *';
            document.getElementById('custom_cron_builder').style.display = 'none';

            const modalEl = document.getElementById('modalEditarTarea');
            const modal = new bootstrap.Modal(modalEl);
            modal.show();
        });
    }

    // --- Guardar Tarea (Crear / Editar) ---
    document.getElementById('btnGuardarTarea').addEventListener('click', function() {
        const form = document.getElementById('formEditarTarea');
        if (!form.checkValidity()) {
            form.reportValidity();
            return;
        }
        
        const btn = this;
        btn.setAttribute('data-kt-indicator', 'on');
        btn.disabled = true;

        const idVal = document.getElementById('edit_id').value;
        const idInt = idVal ? parseInt(idVal) : 0;
        const actionType = document.getElementById('edit_action_type').value;

        const payload = {
            id: idInt,
            description: document.getElementById('edit_description').value,
            company_Id: parseInt(document.getElementById('edit_company_id').value) || 0,
            odata_Link_Id: parseInt(document.getElementById('edit_odata_link_id').value) || 0,
            frequency_Cron: document.getElementById('edit_frequency_cron').value,
            is_Active: false, // Siempre se guardará como inactiva según la nueva regla
            action_Type: actionType,
            parameters_Json: null
        };

        const executeSave = () => {
            fetch(`apps/Tareas/Maestro_Tareas/api/tareas-endpoints.php?action=save`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            })
            .then(response => response.json().then(data => ({ ok: response.ok, status: response.status, data })))
            .then(({ ok, status, data }) => {
                btn.removeAttribute('data-kt-indicator');
                btn.disabled = false;
                
                if (ok && (data.statusResult === true || data.isSuccess === true)) {
                    toastr.success(data.messageResult || data.message || 'Tarea guardada correctamente. Debe volver a activarla.');
                    bootstrap.Modal.getInstance(document.getElementById('modalEditarTarea')).hide();
                    if (grid) grid.refresh();
                } else {
                    toastr.error(data.messageResult || data.message || 'Error al guardar (HTTP ' + status + ')');
                }
            })
            .catch(err => {
                btn.removeAttribute('data-kt-indicator');
                btn.disabled = false;
                toastr.error('Error de conexión al guardar');
                console.error('Save error:', err);
            });
        };

        // Si es una edición y la tarea estaba activa, debemos hacer el toggle primero 
        // para que Hangfire la quite de los jobs antes de sobreescribir la configuración.
        if (idInt > 0 && currentIsActive) {
            fetch(`apps/Tareas/Maestro_Tareas/api/tareas-endpoints.php?action=toggleStatus`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: idInt, actionType: actionType })
            })
            .then(response => response.json())
            .then(data => {
                // Independientemente de si falla o no, procedemos a guardar, 
                // pero lo ideal es que el toggle haya tenido éxito eliminando el job de Hangfire.
                executeSave();
            })
            .catch(err => {
                console.error('Error al intentar desactivar la tarea antes de guardar:', err);
                executeSave(); // Guardamos de todos modos
            });
        } else {
            executeSave();
        }
    });

    document.getElementById('btnRefresh').addEventListener('click', () => {
        if (grid) grid.refresh();
    });

    // Cargar Catálogo de Compañías
    function cargarCompanias() {
        fetch('apps/Tareas/Maestro_Tareas/api/tareas-endpoints.php?action=getCompanies')
            .then(res => res.json())
            .then(data => {
                const select = document.getElementById('edit_company_id');
                select.innerHTML = '<option value="">Seleccione una Compañía</option>';
                if (data.statusResult && data.dataResult) {
                    data.dataResult.forEach(c => {
                        const option = document.createElement('option');
                        option.value = c.companyId;
                        option.textContent = c.legalName;
                        select.appendChild(option);
                    });
                }
            })
            .catch(err => console.error("Error al cargar compañías:", err));
    }

    function cargarODataLinks() {
        fetch('apps/Tareas/Maestro_Tareas/api/tareas-endpoints.php?action=getODataLinks')
            .then(res => res.json())
            .then(data => {
                const select = document.getElementById('edit_odata_link_id');
                select.innerHTML = '<option value="">Seleccione un Enlace OData</option>';
                if (data.statusResult && data.dataResult) {
                    data.dataResult.forEach(o => {
                        const option = document.createElement('option');
                        option.value = o.id; // Asumo que el campo es 'id' según GetAll
                        option.textContent = o.description;
                        select.appendChild(option);
                    });
                }
            })
            .catch(err => console.error("Error al cargar OData Links:", err));
    }

    cargarCompanias();
    cargarODataLinks();
    initGrid();

    function ejecutarTarea(id) {
        // Primero validar si está activa consultando el servidor
        fetch(`apps/Tareas/Maestro_Tareas/api/tareas-endpoints.php?action=getById&id=${id}`)
            .then(res => res.json())
            .then(data => {
                // El objeto de respuesta puede variar según la API, pero solemos recibir el objeto de la tarea directamente o en dataResult
                const task = data.dataResult || data;
                const isActive = task.is_Active === true || task.is_Active === 'true' || task.is_Active === 1 || task.is_Active === "1";

                if (!isActive) {
                    toastr.warning('No se puede ejecutar la tarea porque no está activa.');
                    return;
                }

                // Si está activa, proceder con la confirmación de ejecución manual
                Swal.fire({
                    title: 'Ejecutar tarea?',
                    text: "Se ejecutará la tarea manualmente en este momento.",
                    icon: 'warning',
                    showCancelButton: true,
                    confirmButtonText: 'Sí, ejecutar',
                    cancelButtonText: 'Cancelar',
                    customClass: {
                        confirmButton: "btn fw-bold btn-primary",
                        cancelButton: "btn fw-bold btn-active-light-primary"
                    }
                }).then((result) => {
                    if (result.isConfirmed) {
                        // Mostrar indicador de carga
                        Swal.fire({
                            title: 'Ejecutando...',
                            text: 'Por favor espere mientras se dispara la tarea.',
                            allowOutsideClick: false,
                            didOpen: () => {
                                Swal.showLoading();
                            }
                        });

                        fetch(`apps/Tareas/Maestro_Tareas/api/tareas-endpoints.php?action=executeTask&id=${id}`, {
                            method: 'POST'
                        })
                        .then(res => res.json())
                        .then(data => {
                            if (data.statusResult || data.isSuccess || data.statusCode === 200) {
                                toastr.success(data.messageResult || data.message || 'Tarea disparada exitosamente');
                                Swal.close();
                            } else {
                                toastr.error('Error: ' + (data.messageResult || data.message || 'No se pudo ejecutar la tarea'));
                                Swal.fire('Error', data.messageResult || data.message || 'Ocurrió un error al disparar la tarea', 'error');
                            }
                        })
                        .catch(err => {
                            toastr.error('Error de conexión');
                            Swal.fire('Error', 'No se pudo conectar con el servidor', 'error');
                        });
                    }
                });
            })
            .catch(err => {
                console.error('Error al validar estado de la tarea:', err);
                toastr.error('Error al validar el estado de la tarea.');
            });
    }
});
