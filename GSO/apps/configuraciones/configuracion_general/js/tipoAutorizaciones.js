 
import { Helper } from "../../helper/helper.js";
import { TipoAutorizacionesService } from "../api/tipoAutorizacionesService.js";


export class TipoAutorizacion {
  constructor() {
    this.service = new TipoAutorizacionesService();
    this.helper = new Helper();
    this.grid = null;
    this.registroActualId = null;
    this.modoEdicion = false;
    this.isProcessing = false;
    this.validator = null;

    this.elementos = {
      grid: "#tiposAutorizacionGrid",
      modal: "#modalTipoAutorizacion",
      modalTitle: "#modalTipoAutorizacionTitle",
      form: "#formTipoAutorizacion",
      nombreInput: "#tipoAutorizacionNombre",
      idOperationInput: "#idOperation",
      statusSwitch: "#tipoAutorizacionStatus",
      btnAgregar: "#btnAgregarTipoAutorizacion",
      btnGuardar: "#btnGuardarTipoAutorizacion",
      btnCancelar: "#btnCancelarTipoAutorizacion",
      btnClose: "#btnCancelarTipoAutorizacion",
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
        // No inicializamos validator globalmente aquí: lo hacemos al abrir modal
      }
    });
  }

  // --- Grid ---
  _createGrid() {
    const gridConfig = {
      dataSource: [],
      columns: [
        {
          field: "authorizationTypeId",
          headerText: "ID",
          width: 80,
          textAlign: "Center",
        },
        {
          field: "description",
          headerText: "registro",
          width: 250,
          textAlign: "Left",
        },
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
      const ACCESS_NAME = 'Configuraciones Generales';
      const EDIT_ACTION_ID = 2;
      const DELETE_ACTION_ID = 3;

      if (!window.permissionHelper) {
        console.error("PermissionHelper no está disponible.");
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

    } catch (err) {
      console.error("Error cargando Tipo de Autorizacion:", err);
    }
  }

  // --- Listeners globales (no modal) ---
  _setupEventListeners() {
    // Agregar
    document
      .querySelector(this.elementos.btnAgregar)
      ?.addEventListener("click", () => this._showModal(false));

    // Botón Guardar -> dispara submit del formulario (JustValidate lo interceptará)
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
        const first = document.querySelector(this.elementos.nombreInput);
        if (first) first.focus();
      });

      modalEl.addEventListener("hidden.bs.modal", () => {
        // destruir validator si existe y limpiar errores visuales
        if (this.validator && typeof this.validator.destroy === "function") {
          try {
            this.validator.destroy();
          } catch (e) {
            /* ignore */
          }
          this.validator = null;
        }
        // limpiar clases/labels
        document
          .querySelectorAll(".invalid-feedback")
          .forEach((el) => el.remove());
        document
          .querySelectorAll(".is-invalid")
          .forEach((el) => el.classList.remove("is-invalid"));
        // reset estado modal
        document.querySelector(this.elementos.form)?.reset();
        this.modoEdicion = false;
        this.registroActualId = null;
      });
    }
  }

  // --- Mostrar modal (centraliza agregar/editar) ---
  _showModal(isEdit = false, registro = null) {
    this.modoEdicion = isEdit;
    this.registroActualId = registro?.authorizationTypeId ?? null;

    const formEl = document.querySelector(this.elementos.form);
    if (!formEl) return;

    formEl.reset();
    document.querySelector(this.elementos.modalTitle).textContent = isEdit
      ? "Editar registro"
      : "Agregar registro";

    if (isEdit && registro) {
      document.querySelector(this.elementos.nombreInput).value =
        registro.description ?? "";
      document.querySelector(this.elementos.idOperationInput).value = registro.idOperation ?? "";

      document.querySelector(this.elementos.statusSwitch).checked =
        registro.status ?? false;
    }

    // Inicializar validación cada vez que abrimos modal (asegura presencia de elementos)
    this._initValidation();

    const modal = new bootstrap.Modal(
      document.querySelector(this.elementos.modal)
    );
    modal.show();
  }

  // wrappers públicos para compatibilidad con templates del grid
  agregar() {
    this._showModal(false);
  }

  editar(id) {
    const registro = this.grid.dataSource.find(
      (item) => item.authorizationTypeId === id
    );
    if (!registro) {
      console.error("No se encontró el registro para editar.");
      return;
    }
    this._showModal(true, registro);
  }

  // --- Eliminar con confirm y uso de _safeCall ---
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
      console.error("Error al eliminar registro:", error);
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
      IdOperation: (
        document.querySelector(this.elementos.idOperationInput)?.value || ""
      ).trim(),
      status: document.querySelector(this.elementos.statusSwitch).checked,
    };
    console.log(data)

    try {
      let response;
      if (this.modoEdicion) {
        data.authorizationTypeId = this.registroActualId;
        response = await this._safeCall(() => this.service.update(data));
      } else {
        response = await this._safeCall(() => this.service.create(data));
      }

      if (response && response.statusResult) {
        // Cerrar modal y recargar grid
        const modalElement = document.querySelector(this.elementos.modal);
        const modal = bootstrap.Modal.getInstance(modalElement);
        if (modal) modal.hide();

        await this._loadData();
        this.helper.MessageSucces(
          response.messageResult || "Guardado correctamente"
        );
      } else {
        this.helper.MessageError(response?.messageResult || "Error al guardar");
        console.error("Error en servicio:", response);
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
    const statusText = data.status ? "Activo" : "Inactivo";
    const statusClass = data.status ? "success" : "danger";
    return `<span class="badge badge-light-${statusClass}">${statusText}</span>`;
  }

  _accionesTemplate(data) {
    let html = '';

    // Si tiene permiso para EDITAR
    if (data.canEdit) {
      html += `
            <button class="e-btn e-flat e-primary e-small" onclick="tipoAutorizacion.editar(${data.authorizationTypeId})" title="Editar">
                <i class="e-icons e-edit"></i>
            </button>
        `;
    }

    // Si tiene permiso para ELIMINAR
    if (data.canDelete) {
      html += `
            <button class="e-btn e-flat e-danger e-small" onclick="tipoAutorizacion.eliminar(${data.authorizationTypeId})" title="Eliminar">
                <i class="e-icons e-delete"></i>
            </button>
        `;
    }

    return html;
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

    // deshabilitar validación nativa del navegador
    formEl.setAttribute("novalidate", "true");

    // destruir validator previo si existe (por si abriste/cerraste modal antes)
    if (this.validator && typeof this.validator.destroy === "function") {
      try {
        this.validator.destroy();
      } catch (e) {
        /* ignore */
      }
      this.validator = null;
    }

    // resolver JustValidate (CDN -> window.JustValidate; si usas bundler importa JustValidate arriba)
    const JV =
      window.JustValidate ||
      (typeof JustValidate !== "undefined" ? JustValidate : null);
    if (!JV) {
      // fallback sencillo con HTML5 native validation
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

    // nueva instancia JustValidate
    this.validator = new JV(this.elementos.form, {
      errorFieldCssClass: "is-invalid",
      errorLabelCssClass: "invalid-feedback",
      errorLabelStyle: { display: "block", marginTop: ".25rem" },
      focusInvalidField: true,
    });

    // agregar regla(s) si el input existe
    const nameSel = this.elementos.nombreInput;
    const idOpSel = this.elementos.idOperationInput;

    if (document.querySelector(nameSel)) {
      this.validator.addField(nameSel, [
        { rule: "required", errorMessage: "El nombre es obligatorio" },
        { rule: "minLength", value: 3, errorMessage: "Mínimo 3 caracteres" },
        {
          rule: "maxLength",
          value: 100,
          errorMessage: "Máximo 100 caracteres",
        },
      ]);

    }

    if (document.querySelector(idOpSel)) {
      this.validator.addField(idOpSel, [
        { rule: "required", errorMessage: "El Id Operativo es obligatorio" },
        { rule: "number", errorMessage: "El valor debe ser numérico" },
        {
          validator: (value) => Number(value) > 0,
          errorMessage: 'El valor debe ser mayor que cero'
        }
      ]);
    }

    // onSuccess -> JustValidate previene el submit nativo
    this.validator.onSuccess((ev) => {
      ev.preventDefault();
      this._guardar();
    });
  }
}

// Instancia global
const tipoAutorizacion = new TipoAutorizacion();
window.tipoAutorizacion = tipoAutorizacion;
