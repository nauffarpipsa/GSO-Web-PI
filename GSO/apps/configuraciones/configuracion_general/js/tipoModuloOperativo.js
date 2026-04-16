
import { TipoModuloOperativoService } from "../api/tipoModuloPerativo.js";
import { Helper } from "../../helper/helper.js";
export class TipoModuloOperativo {
  constructor() {
    this.service = new TipoModuloOperativoService();
    this.helper = new Helper();
    this.grid = null;
    this.registroActualId = null;
    this.modoEdicion = false;
    this.isProcessing = false;
    this.validator = null;

    this.elementos = {
      grid: "#tiposModulosOperativosGrid",
      modal: "#modalTipoModuloOperativo",
      modalTitle: "#modalTipoModuloOperativoTitle",
      form: "#formTipoModuloOperativo",
      nombreInput: "#tipoModuloOperativoNombre",
      statusSwitch: "#tipoModuloOperativoStatus",
      btnAgregar: "#btnAgregarTipoModuloOperativo",
      btnGuardar: "#btnGuardarTipoModuloOperativo",
      btnCancelar: "#btnCancelarTipoModuloOperativo",
      btnClose: "#btnCloseTipoModuloOperativo",
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
      }
    });
  }

  // --- Grid ---
  _createGrid() {
    const gridConfig = {
      dataSource: [],
      columns: [
        {
          field: "opModuleTypeId",
          headerText: "ID",
          width: 80,
          textAlign: "Center",
        },
        { field: "description", headerText: "Descripción", width: 350 },
        {
          field: "status",
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

  // --- Carga datos ---
  async _loadData() {
    try {
      // Usando _safeCall para manejar errores de forma centralizada
      const response = await this._safeCall(() => this.service.getAll());
      this.grid.dataSource = response.dataResult || [];
    } catch (err) {
      console.error("Error cargando Tipos de Módulos Operativos:", err);
    }
  }

  // --- Listeners globales (no modal) ---
  _setupEventListeners() {
    // Agregar
    document
      .querySelector(this.elementos.btnAgregar)
      ?.addEventListener("click", () => this._showModal(false));

    // Botón Guardar -> dispara submit del formulario
    const saveBtn = document.querySelector(this.elementos.btnGuardar);
    const formEl = document.querySelector(this.elementos.form);
    if (saveBtn && formEl) {
      saveBtn.addEventListener("click", (e) => {
        e.preventDefault();
        // Dispara el submit para que JustValidate lo intercepte
        if (typeof formEl.requestSubmit === "function") {
          formEl.requestSubmit();
        } else {
          formEl.dispatchEvent(new Event("submit", { cancelable: true }));
        }
      });
    }

    // Cancelar / Close
    [this.elementos.btnCancelar, this.elementos.btnClose].forEach((sel) => {
      document
        .querySelector(sel)
        ?.addEventListener("click", () => this.cerrarModal());
    });

    // Modal events: limpieza y autofocus
    const modalEl = document.querySelector(this.elementos.modal);
    if (modalEl) {
      modalEl.addEventListener("shown.bs.modal", () => {
        document.querySelector(this.elementos.nombreInput)?.focus();
      });

      modalEl.addEventListener("hidden.bs.modal", () => {
        // Destruir validador y limpiar errores visuales
        if (this.validator && typeof this.validator.destroy === "function") {
          try {
            this.validator.destroy();
          } catch (e) {
            /* ignore */
          }
          this.validator = null;
        }
        document
          .querySelectorAll(".invalid-feedback")
          .forEach((el) => el.remove());
        document
          .querySelectorAll(".is-invalid")
          .forEach((el) => el.classList.remove("is-invalid"));

        // Resetear estado del modal
        document.querySelector(this.elementos.form)?.reset();
        this.modoEdicion = false;
        this.registroActualId = null;
      });
    }
  }

  // --- Mostrar modal (centraliza agregar/editar) ---
  _showModal(isEdit = false, registro = null) {
    this.modoEdicion = isEdit;
    this.registroActualId = registro?.opModuleTypeId ?? null;

    const formEl = document.querySelector(this.elementos.form);
    if (!formEl) return;

    formEl.reset();
    document.querySelector(this.elementos.modalTitle).textContent = isEdit
      ? "Editar Módulo Operativo"
      : "Agregar Módulo Operativo";
    if (isEdit && registro) {
      document.querySelector(this.elementos.nombreInput).value =
        registro.description ?? "";
      document.querySelector(this.elementos.statusSwitch).checked =
        registro.status ?? false;
    } else {
      document.querySelector(this.elementos.statusSwitch).checked = true;
    }

    // Inicializar validación cada vez que se abre el modal
    this._initValidation();

    const modal = new bootstrap.Modal(
      document.querySelector(this.elementos.modal)
    );
    modal.show();
  }

  // Wrappers públicos para compatibilidad con templates del grid
  agregar() {
    this._showModal(false);
  }

  editar(id) {
    const registro = this.grid.dataSource.find(
      (item) => item.opModuleTypeId === id
    );
    if (!registro) {
      console.error("No se encontró el registro para editar.");
      return;
    }
    this._showModal(true, registro);
  }

  // --- Eliminar con confirmación mejorada y uso de _safeCall ---
  async eliminar(id) {
    if (this.isProcessing) return;
    try {
      const confirmado = await this.helper.MessageQuestion(
        "¿Está seguro de que desea inhabilitar este registro?"
      );
      if (!confirmado) return;

      this._toggleProcessingState(true, "Eliminando");
      await this._safeCall(() => this.service.delete(id));
      await this._loadData();
      this.helper.MessageSucces("Registro inhabilitar correctamente");
    } catch (error) {
      console.error("Error al eliminar el registro:", error);
    } finally {
      this._toggleProcessingState(false);
    }
  }

  // --- Guardar (create/update) ---
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
      status: document.querySelector(this.elementos.statusSwitch).checked,
    };

    try {
      let response;
      if (this.modoEdicion) {
        data.opModuleTypeId = this.registroActualId;
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

  // --- Grid templates (nombres estandarizados) ---
  _estadoTemplate(data) {
    const statusText = data.status ? "Activo" : "Inactivo";
    const statusClass = data.status ? "success" : "danger";
    return `<span class="badge badge-light-${statusClass}">${statusText}</span>`;
  }

  _accionesTemplate(data) {
    return `
      <button class="e-btn e-flat e-primary e-small" onclick="tipoModuloOperativo.editar(${data.opModuleTypeId})" title="Editar">
        <i class="e-icons e-edit"></i>
      </button>
      <button class="e-btn e-flat e-danger e-small" onclick="tipoModuloOperativo.eliminar(${data.opModuleTypeId})" title="Eliminar">
        <i class="e-icons e-delete"></i>
      </button>
    `;
  }

  // --- Helper: centralizar llamadas a servicios con manejo de errores ---
  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      this.helper.handleApiError(error);
      throw error;
    }
  }

  // --- Toggle processing state con etiqueta dinámica ---
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

  /* ---------- VALIDACIÓN (JustValidate) ---------- */
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
      this.validator = null;
    }

    const JV =
      window.JustValidate ||
      (typeof JustValidate !== "undefined" ? JustValidate : null);
    if (!JV) {
      formEl.addEventListener(
        "submit",
        (e) => {
          if (!formEl.checkValidity()) {
            e.preventDefault();
            formEl.reportValidity();
            return;
          }
          e.preventDefault();
          this._guardar();
        },
        { once: true }
      );
      return;
    }

    this.validator = new JV(this.elementos.form, {
      errorFieldCssClass: "is-invalid",
      errorLabelCssClass: "invalid-feedback",
      errorLabelStyle: { display: "block", marginTop: ".25rem" },
      focusInvalidField: true,
    });

    const nameSel = this.elementos.nombreInput;
    if (document.querySelector(nameSel)) {
      this.validator.addField(nameSel, [
        { rule: "required", errorMessage: "La descripción es obligatoria" },
        { rule: "minLength", value: 3, errorMessage: "Mínimo 3 caracteres" },
        {
          rule: "maxLength",
          value: 100,
          errorMessage: "Máximo 100 caracteres",
        },
      ]);
    }

    this.validator.onSuccess((ev) => {
      ev.preventDefault();
      this._guardar();
    });
  }
}

// --- Inicialización ---
const tipoModuloOperativo = new TipoModuloOperativo();
window.tipoModuloOperativo = tipoModuloOperativo;
