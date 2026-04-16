import { Helper } from "../../helper/helper.js";
import { AccesoService } from "../api/accesoService.js";
import { AccionesService } from "../api/accionesService.js";
import { AccessXActionService } from "../../accessos/api/accesoXactionService.js";

export class Acceso {
  constructor() {
    this.service = new AccesoService();
    this.helper = new Helper();
    this.accionesService = new AccionesService();
    this.accessXActionService = new AccessXActionService();
    this.grid = null;
    this.registroActualId = null;
    this.modoEdicion = false;
    this.isProcessing = false;
    this.validator = null;

    this.allAvailableActions = [];
    this.existingRelations = [];
    this.accessFatherId = 0;

    this.elementos = {
      grid: "#accesosGrid",
      modal: "#modalAcceso",
      modalTitle: "#modalAccesoTitle",
      form: "#formAcceso",
      nombreInput: "#accesoNombre",
      statusSwitch: "#accesoStatus",
      accionesContainer: "#accesoAccionesContainer",
      fatherField: "#fatherField",
      fatherInput: "#accesoFatherId",
      btnAgregar: "#btnAgregarAcceso",
      btnGuardar: "#btnGuardarAcceso",
      btnCancelar: "#btnCancelarAcceso",
      btnClose: "#btnCloseAcceso",
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
        { field: "accessId", headerText: "ID", width: 80, textAlign: "Center" },
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

  // --- Carga datos del Grid ---
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
      console.error("Error cargando Accesos:", err);
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
      modalEl.addEventListener("shown.bs.modal", async () => {
        document.querySelector(this.elementos.nombreInput)?.focus();
        await this._loadActionsCheckboxes();
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
        document.querySelector(this.elementos.accionesContainer).innerHTML =
          "Cargando acciones...";
        document.querySelector(this.elementos.fatherField).style.display = 'none';
        document.querySelector(this.elementos.fatherInput).value = '';
        this.modoEdicion = false;
        this.registroActualId = null;
        this.accessFatherId = 0;
        this.allAvailableActions = [];
        this.existingRelations = []; // Limpiar las relaciones existentes al cerrar
      });
    }
  }

  // --- Mostrar modal ---
  _showModal(isEdit = false, registro = null, fatherId = null) {
    this.modoEdicion = isEdit;
    this.registroActualId = registro?.accessId ?? null;
    this.accessFatherId = fatherId || 0;
    console.log("   Acceso a editar:", fatherId);
    const formEl = document.querySelector(this.elementos.form);
    formEl.reset();
    document.querySelector(this.elementos.modalTitle).textContent = isEdit
      ? "Editar Acceso"
      : (fatherId ? "Agregar Acceso Hijo" : "Agregar Acceso");

    if (isEdit && registro) {
      document.querySelector(this.elementos.nombreInput).value =
        registro.description ?? "";
      document.querySelector(this.elementos.statusSwitch).checked =
        registro.active ?? false;
    } else {
      document.querySelector(this.elementos.statusSwitch).checked = true;
    }

    // Manejar campo padre
    if (fatherId) {
      const fatherDesc = this.grid.dataSource.find(item => item.accessId === fatherId)?.description || 'Desconocido';
      document.querySelector(this.elementos.fatherInput).value = fatherDesc;
      document.querySelector(this.elementos.fatherField).style.display = 'block';
    } else {
      document.querySelector(this.elementos.fatherField).style.display = 'none';
      document.querySelector(this.elementos.fatherInput).value = '';
    }

    this._initValidation();
    const modal = new bootstrap.Modal(
      document.querySelector(this.elementos.modal)
    );
    modal.show();
  }

  // --- Cargar y mostrar checkboxes de acciones ---
  async _loadActionsCheckboxes() {
    const container = document.querySelector(this.elementos.accionesContainer);
    container.innerHTML = "Cargando acciones...";

    try {
      // 1. Obtener todas las acciones activas disponibles
      const actionsResponse = await this._safeCall(() =>
        this.accionesService.getAll()
      );
      this.allAvailableActions = (actionsResponse.dataResult || []).filter(
        (action) => action.active
      );

      // 2. Si estamos en modo edición, intentar obtener las relaciones ya existentes
      if (this.modoEdicion && this.registroActualId) {
        try {
          const accessActionsResponse = await this.accessXActionService.getById(this.registroActualId);
          this.existingRelations = accessActionsResponse.dataResult || [];
        } catch (error) {
          if (error.response && error.response.status === 404) {
            console.warn(
              `No se encontraron relaciones para el Access ID ${this.registroActualId}.`
            );
            this.existingRelations = [];
          } else {
            throw error;
          }
        }
      } else {
        this.existingRelations = [];
      }

      // 3. Renderizar los checkboxes
      if (this.allAvailableActions.length === 0) {
        container.innerHTML =
          "<p>No hay acciones activas disponibles para asignar.</p>";
        return;
      }

      const activeRelationActionIds = new Set(
        this.existingRelations
          .filter((rel) => rel.active)
          .map((rel) => rel.actionId)
      );

      container.innerHTML = "";
      this.allAvailableActions.forEach((action) => {
        const isChecked = activeRelationActionIds.has(action.actionId);
        const div = document.createElement("div");
        div.className = "form-check";
        div.innerHTML = `
          <input class="form-check-input" type="checkbox" value="${action.actionId
          }" id="action-${action.actionId}" ${isChecked ? "checked" : ""}>
          <label class="form-check-label" for="action-${action.actionId}">
            ${action.description}
          </label>
        `;
        container.appendChild(div);
      });
    } catch (error) {
      console.error("Error al cargar las acciones:", error);
      container.innerHTML =
        "<p class='text-danger'>Error al cargar las acciones.</p>";
    }
  }

  // Wrappers públicos
  agregar() {
    this._showModal(false);
  }

  agregarHijo(fatherId) {
    this._showModal(false, null, fatherId);
  }

  editar(id) {
    const registro = this.grid.dataSource.find((item) => item.accessId === id);
    if (!registro) {
      console.error("No se encontró el registro para editar.");
      // this.helper.MessageError("No se encontró el registro para editar.");
      return;
    }
    this._showModal(true, registro);
  }

  // --- Eliminar (Borrado Lógico) ---
  async eliminar(id) {
    if (this.isProcessing) return;
    try {
      const confirmado = await this.helper.MessageQuestion(
        "¿Está seguro de que desea inhabilitar este registro?"
      );
      if (!confirmado) return;

      const registroAEliminar = this.grid.dataSource.find(
        (item) => item.accessId === id
      );
      if (!registroAEliminar) {
        console.error("No se encontró el registro para inhabilitar.");
        this.helper.MessageError("Error: Registro no encontrado.");
        return;
      }

      registroAEliminar.active = false;
      this._toggleProcessingState(true, "Inhabilitando");

      await this._safeCall(() => this.service.update(registroAEliminar));
      await this._loadData();
      this.helper.MessageSucces("Registro inhabilitado correctamente");
    } catch (error) {
      console.error("Error al inhabilitar el registro:", error);
      this.helper.MessageError("Error al inhabilitar el registro.");
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

    const dataAcceso = {
      description: (
        document.querySelector(this.elementos.nombreInput)?.value || ""
      ).trim(),
      active: document.querySelector(this.elementos.statusSwitch).checked,
      applicationId: 4,
      accessFatherId: this.accessFatherId,
    };

    let accessResponse;
    try {
      // 1. Guardar el registro de Acceso principal
      if (this.modoEdicion) {
        dataAcceso.accessId = this.registroActualId;
        accessResponse = await this._safeCall(() =>
          this.service.update(dataAcceso)
        );
      } else {
        accessResponse = await this._safeCall(() =>
          this.service.create(dataAcceso)
        );
      }

      if (accessResponse && accessResponse.statusResult) {
        const savedAccessId = this.modoEdicion
          ? this.registroActualId
          : accessResponse.dataResult?.accessId || accessResponse.dataResult;
        if (!savedAccessId) {
          throw new Error("No se pudo obtener el ID del Acceso guardado.");
        }

        // 2. Procesar las relaciones AccessXAction
        const apiPromises = [];

        for (const action of this.allAvailableActions) {
          const checkbox = document.querySelector(`#action-${action.actionId}`);
          const isCurrentlySelected = checkbox.checked;

          const existingRelation = this.existingRelations.find(
            (rel) => rel.actionId === action.actionId
          );

          if (existingRelation) {
            if (isCurrentlySelected !== existingRelation.active) {
              const updatePayload = {
                accessXActionsId: existingRelation.accessXActionsId,
                accessId: savedAccessId,
                actionId: action.actionId,
                active: isCurrentlySelected,
              };
              apiPromises.push(
                this._safeCall(() =>
                  this.accessXActionService.update(updatePayload)
                )
              );
            }
          } else if (isCurrentlySelected) {
            const createPayload = {
              accessId: savedAccessId,
              actionId: action.actionId,
            };
            apiPromises.push(
              this._safeCall(() =>
                this.accessXActionService.create(createPayload)
              )
            );
          }
        }

        // 3. Ejecutar todas las llamadas a la API en paralelo
        if (apiPromises.length > 0) {
          await Promise.all(apiPromises);
        }

        this.cerrarModal();
        await this._loadData();
        this.helper.MessageSucces(
          accessResponse.messageResult || "Guardado correctamente"
        );
      } else {
        this.helper.MessageError(
          accessResponse?.messageResult || "Error al guardar el acceso."
        );
      }
    } catch (error) {
      console.error("Error al guardar:", error);
      this.helper.MessageError("Error al guardar el acceso o sus acciones.");
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

  _accionesTemplate(data) {
    let html = '';

    // Si tiene permiso para EDITAR
    if (data.canEdit) {
      html += `
            <button class="e-btn e-flat e-primary e-small" onclick="acceso.editar(${data.accessId})" title="Editar">
                <i class="e-icons e-edit"></i>
            </button>
        `;
    }

    // Botón Agregar hijo (si puede editar)
    if (data.canEdit) {
      html += `
            <button class="e-btn e-flat e-info e-small" onclick="acceso.agregarHijo(${data.accessId})" title="Agregar hijo">
                <i class="e-icons e-plus"></i>
            </button>
        `;
    }

    // Si tiene permiso para ELIMINAR/INHABILITAR
    if (data.canDelete) {
      html += `
            <button class="e-btn e-flat e-danger e-small" onclick="acceso.eliminar(${data.accessId})" title="Inhabilitar">
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

  // --- MÉTODO MODIFICADO ---
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
      // AÑADIDO: Validación para el contenedor de acciones
      .addField(this.elementos.accionesContainer, [
        {
          // Regla personalizada que se ejecuta como una función
          rule: 'function',
          // La función validadora
          validator: () => {
            // Si no hay acciones disponibles para elegir, la validación pasa.
            if (this.allAvailableActions.length === 0) {
              return true;
            }
            // Contamos cuántos checkboxes están marcados
            const selectedActions = document.querySelectorAll(
              `${this.elementos.accionesContainer} input[type="checkbox"]:checked`
            );
            // La validación es exitosa si hay más de 0 checkboxes marcados
            return selectedActions.length > 0;
          },
          errorMessage: 'Debe seleccionar al menos una acción',
        },
      ])
      .onSuccess((ev) => {
        ev.preventDefault();
        this._guardar();
      });
  }
}

// --- Inicialización ---
const acceso = new Acceso();
window.acceso = acceso;
const helper = new PermissionHelper();
window.permissionHelper = helper;


