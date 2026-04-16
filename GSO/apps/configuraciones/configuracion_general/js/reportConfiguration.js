import { Helper } from "../../helper/helper.js";
import { ReportConfigurationService } from "../api/reportConfigurationService.js";
import { SearchHelper } from "../../helper/searchHelper/searchHelper.js";
import { AccesoService } from "../api/accesoService.js";
import { UsuarioService } from "../../users/api/usuarioService.js";

export class ReportConfiguration {
    constructor() {
        this.service = new ReportConfigurationService();
        this.accessService = new AccesoService();
        this.usuarioService = new UsuarioService();
        this.helper = new Helper();
        this.grid = null;
        this.registroActualId = null;
        this.modoEdicion = false;
        this.isProcessing = false;
        this.validator = null;
        this.allReportsData = [];
        this.filteredReportsData = [];
        this.searchHelper = null;
        this.userId = 0;

        this.elementos = {
            grid: "#reportConfigurationGrid",
            modal: "#modalReportConfiguration",
            gridContainer: "#reportConfigurationGridContainer",
            modalTitle: "#modalReportConfigurationTitle",
            form: "#formReportConfiguration",
            descriptionInput: "#reportDescription",
            statusSwitch: "#reportStatus",
            accessDropdown: "#reportAccess",
            typeDropdown: "#reportType",
            btnAgregar: "#btnAgregarReportConfiguration",
            btnGuardar: "#btnGuardarReportConfiguration",
            btnCancelar: "#btnCancelarReportConfiguration",
            btnClose: "#btnCloseReportConfiguration",
        };

        this._init();
    }

    _init() {
        document.addEventListener("DOMContentLoaded", () => {
            if (document.querySelector(this.elementos.grid)) {
                this._createGrid();
                this._loadData();
                this._loadDDL();
                this._setupEventListeners();
                this._setupMainSearch();
            }
        });
    }

    async _loadDDL() {
        try {
            // Ejecutamos ambas peticiones en paralelo para mayor velocidad
            const [reportResponse, accessResponse] = await Promise.all([
                this.service.getReportNames(),
                this.accessService.getAll()
            ]);

            // 1. Llenar Dropdown de Accesos
            const accessSelect = document.querySelector(this.elementos.accessDropdown);
            if (accessSelect && accessResponse.dataResult) {
                this._fillSelect(accessSelect, accessResponse.dataResult, "accessId", "description");
            }

            // 2. Llenar Dropdown de Listado de Reportes
            const reportSelect = document.querySelector(this.elementos.descriptionInput);
            if (reportSelect && reportResponse.dataResult) {
                this._fillSelect(reportSelect, reportResponse.dataResult, "id", "name");
            }

        } catch (error) {
            console.error("Error al cargar los listados (DDL):", error);
        }
    }

    // Método auxiliar para limpiar y llenar cualquier select
    _fillSelect(element, data, valueProp, textProp) {
        // Mantener solo la primera opción (la de "Seleccione...")
        element.innerHTML = element.options[0].outerHTML;

        data.forEach(item => {
            const option = document.createElement("option");
            option.value = item[valueProp];
            option.textContent = item[textProp];
            element.appendChild(option);
        });
    }

    _createGrid() {
        const gridConfig = {
            dataSource: [],
            columns: [
                { field: "id", headerText: "ID", width: 80, textAlign: "Center" },
                { field: "accessName", headerText: "Acceso", width: 300 },
                { field: "description", headerText: "Descripción", width: 300 },
                {
                    field: "status",
                    headerText: "Estado",
                    width: 100,
                    textAlign: "Center",
                    template: this._estadoTemplate.bind(this),
                },
                {
                    headerText: "Acciones",
                    width: 150,
                    textAlign: "Center",
                    template: this._accionesTemplate.bind(this),
                },
            ],
            allowPaging: true,
            allowSorting: true,
            allowFiltering: true,
            pageSettings: { pageSize: 10, pageSizes: [5, 10, 15, 20] },
            filterSettings: { type: "Menu" },
            height: "auto",
        };
        this.grid = new ej.grids.Grid(gridConfig);
        this.grid.appendTo(this.elementos.grid);
    }

    _setupMainSearch() {
        this.searchHelper = SearchHelper.createSearchContainer(
            this.elementos.gridContainer.replace("#", ""),
            (searchTerm) => this._filterReportsData(searchTerm),
            () => this._clearReportsFilter()
        );
    }

    _filterReportsData(searchTerm) {
        if (!searchTerm) {
            this.filteredReportsData = [...this.allReportsData];
        } else {
            const term = searchTerm.toLowerCase();
            this.filteredReportsData = this.allReportsData.filter((item) => {
                return (
                    item.reportConfigurationId?.toString().includes(term) ||
                    item.description?.toLowerCase().includes(term)
                );
            });
        }
        this.grid.dataSource = this.filteredReportsData;
    }

    _clearReportsFilter() {
        this.filteredReportsData = [...this.allReportsData];
        this.grid.dataSource = this.filteredReportsData;
    }

    async _loadData() {
        try {
            const ACCESS_NAME = 'Configuraciones Generales';
            const EDIT_ACTION_ID = 2;
            const DELETE_ACTION_ID = 3;

            // Verificación de permisos similar al ejemplo
            const userCanEdit = window.permissionHelper ? await window.permissionHelper.hasAction(ACCESS_NAME, EDIT_ACTION_ID) : true;
            const userCanDelete = window.permissionHelper ? await window.permissionHelper.hasAction(ACCESS_NAME, DELETE_ACTION_ID) : true;


            const sessionData = await this.usuarioService.getSessionData();
            this.userId = sessionData.userId;

            const response = await this._safeCall(() => this.service.getAll());
            let rawData = response.dataResult || [];

            this.allReportsData = rawData.map(item => ({
                ...item,
                canEdit: userCanEdit,
                canDelete: userCanDelete
            }));

            this.filteredReportsData = [...this.allReportsData];
            this.grid.dataSource = this.filteredReportsData;

        } catch (err) {
            console.error("Error cargando Reportes:", err);
        }
    }

    _setupEventListeners() {
        document.querySelector(this.elementos.btnAgregar)?.addEventListener("click", () => this._showModal(false));

        const saveBtn = document.querySelector(this.elementos.btnGuardar);
        const formEl = document.querySelector(this.elementos.form);

        if (saveBtn && formEl) {
            saveBtn.addEventListener("click", (e) => {
                e.preventDefault();
                if (this.validator) this.validator.revalidate().then(isValid => {
                    if (isValid) this._guardar();
                });
            });
        }

        [this.elementos.btnCancelar, this.elementos.btnClose].forEach((sel) => {
            document.querySelector(sel)?.addEventListener("click", () => this.cerrarModal());
        });

        // Limpieza de validación al cerrar modal
        const modalEl = document.querySelector(this.elementos.modal);
        if (modalEl) {
            modalEl.addEventListener("hidden.bs.modal", () => {
                this._resetForm();
            });
        }
    }

    _resetForm() {
        if (this.validator) this.validator.destroy();
        this.validator = null;
        document.querySelectorAll(".is-invalid").forEach(el => el.classList.remove("is-invalid"));
        document.querySelector(this.elementos.form)?.reset();
        this.modoEdicion = false;
        this.registroActualId = null;
    }

    _showModal(isEdit = false, registro = null) {
        this.modoEdicion = isEdit;
        this.registroActualId = registro ? (registro.reportConfigurationId || registro.id) : null;

        const formEl = document.querySelector(this.elementos.form);
        formEl.reset();

        document.querySelector(this.elementos.modalTitle).textContent = isEdit ? "Editar Configuración" : "Agregar Configuración";

        if (isEdit && registro) {
            document.querySelector(this.elementos.descriptionInput).value = registro.description || "";
            document.querySelector(this.elementos.accessDropdown).value = registro.accessId || "";
            document.querySelector(this.elementos.statusSwitch).checked = registro.status || false;
        } else {
            document.querySelector(this.elementos.statusSwitch).checked = true;
        }

        this._initValidation();
        const modal = bootstrap.Modal.getOrCreateInstance(document.querySelector(this.elementos.modal));
        modal.show();
    }

    async _guardar() {
        if (this.isProcessing) return;

        const data = {
            id:  0,
            description: document.querySelector(this.elementos.descriptionInput).value.trim(),
            status: document.querySelector(this.elementos.statusSwitch).checked,
            accessId: parseInt(document.querySelector(this.elementos.accessDropdown).value),
            createBy: this.userId,
            updateBy: this.userId,
        };

        try {
            this._toggleProcessingState(true, this.modoEdicion ? "Actualizando" : "Guardando");
            let response;

            if (this.modoEdicion) {
                data.id = this.registroActualId;
                response = await this._safeCall(() => this.service.update(data));
            } else {
                response = await this._safeCall(() => this.service.create(data));
            }

            if (response && (response.statusResult || response.id)) {
                this.cerrarModal();
                await this._loadData();
                this.helper.MessageSucces("Operación realizada con éxito");
            }
        } catch (error) {
            console.error("Error al guardar:", error);
        } finally {
            this._toggleProcessingState(false);
        }
    }

    editar(id) {
        const registro = this.grid.dataSource.find(item => (item.reportConfigurationId || item.id) === id);
        if (registro) this._showModal(true, registro);
    }

    async eliminar(id) {
        const confirmado = await this.helper.MessageQuestion("¿Desea eliminar este registro?");
        if (!confirmado) return;

        try {
            await this._safeCall(() => this.service.delete(id));
            await this._loadData();
            this.helper.MessageSucces("Eliminado correctamente");
        } catch (error) {
            console.error("Error al eliminar:", error);
        }
    }

    cerrarModal() {
        const modal = bootstrap.Modal.getInstance(document.querySelector(this.elementos.modal));
        if (modal) modal.hide();
    }

    // --- Templates ---
    _estadoTemplate(data) {
        const status = data.status ? "success" : "danger";
        const text = data.status ? "Activo" : "Inactivo";
        return `<span class="badge badge-light-${status}">${text}</span>`;
    }

    _accionesTemplate(data) {
        const id = data.reportConfigurationId || data.id;
        let html = `<div class="d-flex justify-content-center gap-2">`;
        // let html = ``;
        if (data.canEdit) {
            html += `<button class="e-btn e-flat e-primary e-small" onclick="reportConfig.editar(${id})"><i class="e-icons e-edit"></i></button>`;
        }
        if (data.canDelete) {
            html += `<button class="e-btn e-flat e-danger e-small" onclick="reportConfig.eliminar(${id})"><i class="e-icons e-delete"></i></button>`;
        }
        html += `</div>`;
        return html;
    }

    // --- Helpers ---
    async _safeCall(fn) {
        try { return await fn(); } catch (error) {
            this.helper.handleApiError(error);
            throw error;
        }
    }

    _toggleProcessingState(isProcessing, label = "Guardar") {
        this.isProcessing = isProcessing;
        const btn = document.querySelector(this.elementos.btnGuardar);
        if (btn) {
            btn.disabled = isProcessing;
            btn.innerHTML = isProcessing ? `<span class="spinner-border spinner-border-sm"></span> ${label}...` : "Guardar";
        }
    }

    _initValidation() {
        const JV = window.JustValidate || JustValidate;
        this.validator = new JV(this.elementos.form, {
            errorFieldCssClass: "is-invalid",
            errorLabelCssClass: "invalid-feedback",
        });

        this.validator
            .addField(this.elementos.descriptionInput, [{ rule: "required", errorMessage: "Seleccione un Reporte" }])
            .addField(this.elementos.accessDropdown, [{ rule: "required", errorMessage: "Seleccione un acceso" }]);
        // .addField(this.elementos.typeDropdown, [{ rule: "required", errorMessage: "Seleccione un tipo" }]);
    }
}

// --- Instancia Global ---
const reportConfig = new ReportConfiguration();
window.reportConfig = reportConfig;