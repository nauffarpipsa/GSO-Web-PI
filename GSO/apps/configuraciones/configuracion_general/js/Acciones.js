import { Helper } from "../../helper/helper.js";
import { AccionesService } from "../api/accionesService.js";
import { SearchHelper } from "../../helper/searchHelper/searchHelper.js";

export class Acciones {
  constructor() {
    this.service = new AccionesService();
    this.helper = new Helper();
    this.grid = null;
    this.registroActualId = null;
    this.modoEdicion = false;
    this.isProcessing = false;
    this.validator = null;
    this.allAccionesData = [];
    this.filteredAccionesData = [];
    this.searchHelper = null;

    this.elementos = {
      grid: "#accionesGrid",
      modal: "#modalAcciones",
      gridContainer: "#accionesGridContainer",
      modalTitle: "#modalAccionesTitle",
      form: "#formAcciones",
      nombreInput: "#accionNombre",
      statusSwitch: "#accionStatus",
      btnAgregar: "#btnAgregarAccion",
      btnGuardar: "#btnGuardarAccion",
      btnCancelar: "#btnCancelarAccion",
      btnClose: "#btnCloseAccion",
    };

    this._init();
  }

  // --- Inicialización general ---
  _init() {
    document.addEventListener("DOMContentLoaded", () => {
      if (document.querySelector(this.elementos.grid)) {
        this._createGrid();
        this._loadData();
        this._setupEventListeners();
        this._setupMainSearch(); // NUEVO
      }
    });
  }

  // --- Grid ---
  _createGrid() {
    const gridConfig = {
      dataSource: [],
      columns: [
        { field: "actionId", headerText: "ID", width: 80, textAlign: "Center" },
        { field: "description", headerText: "Descripción", width: 350 },
        {
          field: "active",
          headerText: "Estado",
          width: 100,
          textAlign: "Center",
          template: this._estadoTemplate.bind(this),
        },
        {
          field: "acciones",
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

  // NUEVO: Configurar búsqueda
  _setupMainSearch() {
    this.searchHelper = SearchHelper.createSearchContainer(
      this.elementos.gridContainer.replace("#", ""),
      (searchTerm) => this._filterAccionesData(searchTerm),
      () => this._clearAccionesFilter()
    );
  }

  // NUEVO: Filtrar datos
  _filterAccionesData(searchTerm) {
    if (!searchTerm) {
      this.filteredAccionesData = [...this.allAccionesData];
    } else {
      const term = searchTerm.toLowerCase();
      this.filteredAccionesData = this.allAccionesData.filter((item) => {
        return (
          item.actionId?.toString().includes(term) ||
          item.description?.toLowerCase().includes(term)
        );
      });
    }
    this.grid.dataSource = this.filteredAccionesData;
  }

  // NUEVO: Limpiar filtro
  _clearAccionesFilter() {
    this.filteredAccionesData = [...this.allAccionesData];
    this.grid.dataSource = this.filteredAccionesData;
  }

  async _loadData() {
    try {
      const ACCESS_NAME = 'Configuraciones Generales';
      const EDIT_ACTION_ID = 2;
      const DELETE_ACTION_ID = 3;

      if (!window.permissionHelper) {
        this.grid.hideColumns("Acciones");
        const response = await this._safeCall(() => this.service.getAll());
        this.grid.dataSource = response.dataResult || [];
        return;
      }

      const userCanEdit = await window.permissionHelper.hasAction(ACCESS_NAME, EDIT_ACTION_ID);
      const userCanDelete = await window.permissionHelper.hasAction(ACCESS_NAME, DELETE_ACTION_ID);

      const userHasAnyAction = userCanEdit || userCanDelete;

      if (this.grid) {
        if (userHasAnyAction) {
          this.grid.showColumns("Acciones");
        } else {
          this.grid.hideColumns("Acciones");
        }
      }

      const response = await this._safeCall(() => this.service.getAll());
      let rawData = response.dataResult || [];

      const datosConPermisos = rawData.map(item => ({
        ...item,
        canEdit: userCanEdit,
        canDelete: userCanDelete
      }));

      this.grid.dataSource = datosConPermisos;

      this.allAccionesData = rawData;
      this.filteredAccionesData = [...this.allAccionesData];

    } catch (err) {
      console.error("Error cargando Acciones:", err);
    }
  }

  // --- Listeners globales ---
  _setupEventListeners() {
    document
      .querySelector(this.elementos.btnAgregar)
      ?.addEventListener("click", () => this._showModal(false));

    const saveBtn = document.querySelector(this.elementos.btnGuardar);
    const formEl = document.querySelector(this.elementos.form);
    if (saveBtn && formEl) {
      saveBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (typeof formEl.requestSubmit === "function") {
          formEl.requestSubmit();
        } else {
          formEl.dispatchEvent(new Event("submit", { cancelable: true }));
        }
      });
    }

    [this.elementos.btnCancelar, this.elementos.btnClose].forEach((sel) => {
      document
        .querySelector(sel)
        ?.addEventListener("click", () => this.cerrarModal());
    });

    const modalEl = document.querySelector(this.elementos.modal);
    if (modalEl) {
      modalEl.addEventListener("shown.bs.modal", () => {
        document.querySelector(this.elementos.nombreInput)?.focus();
      });

      modalEl.addEventListener("hidden.bs.modal", () => {
        if (this.validator && typeof this.validator.destroy === "function") {
          try {
            this.validator.destroy();
          } catch (e) {
            /* ignore */
          }
        }
        this.validator = null;
        document
          .querySelectorAll(".invalid-feedback")
          .forEach((el) => el.remove());
        document
          .querySelectorAll(".is-invalid")
          .forEach((el) => el.classList.remove("is-invalid"));

        document.querySelector(this.elementos.form)?.reset();
        this.modoEdicion = false;
        this.registroActualId = null;
      });
    }
  }

  // --- Mostrar modal ---
  _showModal(isEdit = false, registro = null) {
    this.modoEdicion = isEdit;
    this.registroActualId = registro?.actionId ?? null;

    const formEl = document.querySelector(this.elementos.form);
    formEl.reset();
    document.querySelector(this.elementos.modalTitle).textContent = isEdit
      ? "Editar Acción"
      : "Agregar Acción";

    if (isEdit && registro) {
      document.querySelector(this.elementos.nombreInput).value =
        registro.description ?? "";
      document.querySelector(this.elementos.statusSwitch).checked =
        registro.active ?? false;
    } else {
      document.querySelector(this.elementos.statusSwitch).checked = true;
    }

    this._initValidation();
    const modal = new bootstrap.Modal(
      document.querySelector(this.elementos.modal)
    );
    modal.show();
  }

  // Wrappers públicos
  agregar() {
    this._showModal(false);
  }

  editar(id) {
    const registro = this.grid.dataSource.find((item) => item.actionId === id);
    if (!registro) {
      console.error("No se encontró el registro para editar.");
      return;
    }
    this._showModal(true, registro);
  }

  // --- Eliminar ---
  async eliminar(id) {
    if (this.isProcessing) return;

    const registro = this.grid.dataSource.find((item) => item.actionId === id);
    if (!registro) {
      console.error("No se encontró el registro para inhabilitar.");
      this.helper.MessageError("No se pudo encontrar el registro.");
      return;
    }

    try {
      const confirmado = await this.helper.MessageQuestion(
        "¿Está seguro de que desea inhabilitar este registro?"
      );
      if (!confirmado) return;

      this._toggleProcessingState(true, "Eliminando");
      registro.active = false;
      await this._safeCall(() => this.service.update(registro));
      await this._loadData();
      this.helper.MessageSucces("Registro inhabilitado correctamente");
    } catch (error) {
      console.error("Error al eliminar el registro:", error);
    } finally {
      this._toggleProcessingState(false);
    }
  }

  // --- Guardar ---
  async _guardar() {
    if (this.isProcessing) return;
    this._toggleProcessingState(
      true,
      this.modoEdicion ? "Actualizando" : "Guardando"
    );

    const data = {
      description: (
        document.querySelector(this.elementos.nombreInput)?.value || ""
      ).trim(),
      active: document.querySelector(this.elementos.statusSwitch).checked,
    };

    try {
      let response;
      if (this.modoEdicion) {
        data.actionId = this.registroActualId;
        response = await this._safeCall(() => this.service.update(data));
      } else {
        response = await this._safeCall(() => this.service.create(data));
      }

      if (response && response.statusResult) {
        this.cerrarModal();
        await this._loadData();
        this.helper.MessageSucces(
          response.messageResult || "Guardado correctamente"
        );
      } else {
        this.helper.MessageError(response?.messageResult || "Error al guardar");
      }
    } catch (error) {
      console.error("Error al guardar:", error);
    } finally {
      this._toggleProcessingState(false);
    }
  }

  // --- Cerrar modal ---
  cerrarModal() {
    const modalElement = document.querySelector(this.elementos.modal);
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) modal.hide();
  }

  // --- Grid templates ---
  _estadoTemplate(data) {
    const statusText = data.active ? "Activo" : "Inactivo";
    const statusClass = data.active ? "success" : "danger";
    return `<span class="badge badge-light-${statusClass}">${statusText}</span>`;
  }

  // Este método debe ser SÍNCRONO.

  _accionesTemplate(data) {
    let html = '';

    // Si tiene permiso para EDITAR
    if (data.canEdit) {
      html += `
            <button class="e-btn e-flat e-primary e-small" 
                    onclick="acciones.editar(${data.actionId})" title="Editar">
                <i class="e-icons e-edit"></i>
            </button>
        `;
    }

    // Si tiene permiso para ELIMINAR
    if (data.canDelete) {
      html += `
            <button class="e-btn e-flat e-danger e-small" 
                    onclick="acciones.eliminar(${data.actionId})" title="Eliminar">
                <i class="e-icons e-delete"></i>
            </button>
        `;
    }

    return html;
  }

  // --- Helpers ---
  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      this.helper.handleApiError(error);
      throw error;
    }
  }

  _toggleProcessingState(isProcessing, label = "Guardar") {
    this.isProcessing = isProcessing;
    const btnGuardar = document.querySelector(this.elementos.btnGuardar);
    if (btnGuardar) {
      btnGuardar.disabled = isProcessing;
      btnGuardar.innerHTML = isProcessing
        ? `<span class="spinner-border spinner-border-sm"></span> ${label}...`
        : "Guardar";
    }
  }

  // --- Validación ---
  _initValidation() {
    const formEl = document.querySelector(this.elementos.form);
    if (!formEl) return;
    formEl.setAttribute("novalidate", "true");

    if (this.validator && typeof this.validator.destroy === "function") {
      try {
        this.validator.destroy();
      } catch (e) {
        /* ignore */
      }
    }
    this.validator = null;

    const JV =
      window.JustValidate ||
      (typeof JustValidate !== "undefined" ? JustValidate : null);
    if (!JV) return;

    this.validator = new JV(this.elementos.form, {
      errorFieldCssClass: "is-invalid",
      errorLabelCssClass: "invalid-feedback",
      errorLabelStyle: { display: "block" },
    });

    this.validator
      .addField(this.elementos.nombreInput, [
        { rule: "required", errorMessage: "La descripción es obligatoria" },
        { rule: "minLength", value: 3, errorMessage: "Mínimo 3 caracteres" },
      ])
      .onSuccess((ev) => {
        ev.preventDefault();
        this._guardar();
      });
  }
}

// --- Inicialización ---
const acciones = new Acciones();
window.acciones = acciones;
const helper = new PermissionHelper();
window.permissionHelper = helper;