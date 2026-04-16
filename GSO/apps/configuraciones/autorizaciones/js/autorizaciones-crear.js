import { TipoAutorizacionesService } from "../../configuracion_general/api/tipoAutorizacionesService.js";
import { UsuarioService } from "../../users/api/UsuarioService.js";
import { UsuarioModeloAutorizacion } from "../api/userAutorizationModel.js";
import { ModeloAutorizacionesService } from "../api/autorizacionesService.js";
import { Helper } from "../../helper/helper.js";
import { SedeService } from "../../sedes/api/sedesService.js";


class AutorizacionesCreate {
  constructor() {
    // --- Servicios ---
    this.tipoAutorizacionesService = new TipoAutorizacionesService();
    this.sedeService = new SedeService();
    this.usuarioService = new UsuarioService();
    this.usuarioModeloService = new UsuarioModeloAutorizacion();
    this.modeloService = new ModeloAutorizacionesService();
    this.helper = new Helper();

    // --- Dual ListBox ---
    this.disponiblesBox = null;
    this.asignadosBox = null;

    // --- Estado ---
    this.userId = null; // Usuario en sesión
    this.isEditing = false;
    this.currentModelId = null;
    this.validator = null;
    this.isProcessing = false;

    // --- Selectores ---
    this.elementos = {
      form: "#formEdicionCompleta",
      descripcion: "#authorizationModelDescription",
      tipoAutorizacion: "#tipoAutorizacionSelect",
      sociedad: "#sociedadSelect",
      disponibles: "#listBoxDisponibles",
      asignados: "#listBoxAsignados",
      status: "#status",
      btnGuardar: "#btnGuardarEdicion",
      tituloPagina: "#paginaTitulo", // Selector para el título de la página
    };

    this._init();
  }

  // --- MÉTODO MODIFICADO ---
  _init() {
    document.addEventListener("DOMContentLoaded", async () => {
      
      try {
        this._initializeDualListBox();

        // Cargar combos y sesión primero, es necesario para poblar el formulario.
        await this._loadCombosAndSession();

        // Verificar si estamos en modo edición
        const urlParams = new URLSearchParams(window.location.search);
        const modelId = urlParams.get("id");

        if (modelId) {
          await this._loadModelForEditing(Number(modelId));
        } else {
          // document.querySelector(this.elementos.status).checked = true;
        }

        // La validación se inicializa después de que todo esté cargado y posiblemente poblado.
        this._initValidation();
        this._setupEventListeners();
      } catch (e) {
        console.error("Error fatal durante la inicialización:", e);
        // this.helper.MessageError(
        //   "Ocurrió un error al cargar la página. Por favor, recargue."
        // );
      }
    });
  }

  // --- ListBox ---
  _initializeDualListBox() {
    this.disponiblesBox = new ej.dropdowns.ListBox({
      dataSource: [],
      fields: { text: "userName", value: "userId" },
      height: "330px",
      scope: this.elementos.asignados,
      toolbarSettings: {
        items: [
          "moveUp",
          "moveDown",
          "moveTo",
          "moveFrom",
          "moveAllTo",
          "moveAllFrom",
        ],
      },
      noRecordsTemplate:
        '<div class="e-list-nrt"><span>No hay usuarios disponibles</span></div>',
      actionComplete: (args) => {

        if (Array.isArray(args.items) || this.getAssignedUserIds.length > 0) {
          this._clearAssignedListError();
        }
      },
    });
    this.disponiblesBox.appendTo(this.elementos.disponibles);

    this.asignadosBox = new ej.dropdowns.ListBox({
      dataSource: [],
      fields: { text: "userName", value: "userId" },
      height: "330px",
      noRecordsTemplate:
        '<div class="e-list-nrt"><span>No hay usuarios asignados</span></div>',
    });
    this.asignadosBox.appendTo(this.elementos.asignados);
  }

  // --- Cargar combos y sesión (no cambia) ---
  async _loadCombosAndSession() {
    this.helper?.showSpinner?.();
    try {
      const [sessionData, tipos, sociedades] = await Promise.all([
        this.usuarioService.getSessionData(),
        this.tipoAutorizacionesService.getAll(),
        this.sedeService.getAll(),
      ]);

      this.userId = sessionData?.userId ?? null;

      if (tipos?.dataResult) {
        this._fillSelect(
          this.elementos.tipoAutorizacion,
          tipos.dataResult,
          "authorizationTypeId",
          "description"
        );
      }
      if (sociedades?.dataResult) {
        this._fillSelect(
          this.elementos.sociedad,
          sociedades.dataResult,
          "branchId",
          "description"
        );
      }
    } catch (err) {
      console.error("Error cargando combos y sesión:", err);
      // this.helper?.MessageError("Error al cargar los datos iniciales.");
      throw err; // Relanzar para detener la inicialización
    } finally {
      this.helper?.hideSpinner?.();
    }
  }

  _fillSelect(selector, data, valueField, textField) {
    const selectEl = document.querySelector(selector);
    if (!selectEl) return;
    selectEl.innerHTML = `<option value="">Seleccione una opción</option>`;
    data.forEach((item) => {
      const opt = document.createElement("option");
      opt.value = item[valueField];
      opt.textContent = item[textField];
      selectEl.appendChild(opt);
    });
  }

  // --- Eventos ---
  _setupEventListeners() {
    const btnGuardar = document.querySelector(this.elementos.btnGuardar);
    if (btnGuardar) {
      btnGuardar.addEventListener("click", (e) => {
        e.preventDefault();
        this._handleSubmit();
      });
    }

    const sociedadSelect = document.querySelector(this.elementos.sociedad);
    if (sociedadSelect) {
      sociedadSelect.addEventListener("change", (e) => {
        this._cargarUsuariosPorSociedad(e.target.value);
      });
    }
  }

  async _cargarUsuariosPorSociedad(sociedadId) {
    this.helper?.showSpinner?.();
    try {
      if (!sociedadId) {
        this.disponiblesBox.dataSource = [];
        return;
      }
      const usuariosResp = await this.usuarioService.getByCompanyId(sociedadId);
      const usuarios = (usuariosResp?.dataResult || []).map((u) => ({
        ...u,
        userName: `${u.firstName || ""} ${u.lastName || ""}`.trim(),
        userId: u.userId,
      }));

      // Al cargar usuarios por sociedad, debemos mantener los ya asignados en su lista.
      const assignedIds = new Set(this.getAssignedUserIds());
      this.disponiblesBox.dataSource = usuarios.filter(
        (u) => !assignedIds.has(u.userId)
      );
    } catch (error) {
      console.error("Error al cargar usuarios por sociedad:", error);
      this.helper?.MessageError("Error al cargar los usuarios de la sociedad.");
      this.disponiblesBox.dataSource = [];
    } finally {
      this.helper?.hideSpinner?.();
    }
  }

  _handleSubmit() {
    const formEl = document.querySelector(this.elementos.form);
    if (formEl) {
      formEl.dispatchEvent(
        new Event("submit", { cancelable: true, bubbles: true })
      );
    }
  }

  getAssignedUserIds() {
    if (this.asignadosBox && Array.isArray(this.asignadosBox.listData)) {
      return this.asignadosBox.listData.map((u) => u.userId);
    }
    return [];
  }

  // --- LÓGICA DE EDICIÓN ---

  /**
   * Orquesta la carga de datos para un modelo existente.
   * @param {number} modelId El ID del modelo a cargar.
   */
  async _loadModelForEditing(modelId) {
    this.helper?.showSpinner?.();
    try {
      this.isEditing = true;
      this.currentModelId = modelId;

      const tituloEl = document.querySelector(this.elementos.tituloPagina);
      if (tituloEl) tituloEl.textContent = "Editar Modelo de Autorización";
      const btnGuardarEl = document.querySelector(this.elementos.btnGuardar);
      if (btnGuardarEl) btnGuardarEl.textContent = "Actualizar Cambios";

      const [modeloResp, asignadosResp] = await Promise.all([
        this.modeloService.getById(modelId),
        this.usuarioModeloService.getByAuthorizationId(modelId), // Asumiendo que este método existe
      ]);

      const modelo = modeloResp?.dataResult;
      const asignados = asignadosResp?.dataResult;

      if (!modelo) {
        throw new Error(`El modelo con ID ${modelId} no fue encontrado.`);
      }

      document.querySelector(this.elementos.descripcion).value =
        modelo.description || "";
      document.querySelector(this.elementos.tipoAutorizacion).value =
        modelo.authorizationTypeId || "";
      document.querySelector(this.elementos.sociedad).value =
        modelo.brandId || "";
      document.querySelector(this.elementos.status).checked =
        modelo.status || false;

      await this._cargarUsuariosPorSociedad(modelo.brandId);

      if (asignados && asignados.length > 0) {
        const assignedUserIds = asignados.map((a) => a.authorizingUserId);
        this._moveUsersToAssigned(assignedUserIds);
      }
    } catch (error) {
      this.helper.MessageError(
        error.message || "No se pudo cargar el modelo para editar."
      );
      // Opcional: Redirigir si el modelo no existe
      // window.location.href = 'pagina-de-lista.php';
    } finally {
      this.helper?.hideSpinner?.();
    }
  }

  /**
   * Mueve usuarios de la lista de disponibles a la de asignados.
   * @param {number[]} userIds Los IDs de los usuarios a mover.
   */
  _moveUsersToAssigned(userIds) {
    if (!this.disponiblesBox?.dataSource || !Array.isArray(userIds)) return;

    const usersToMove = [];
    const remainingUsers = [];
    const userIdsSet = new Set(userIds);

    this.disponiblesBox.dataSource.forEach((user) => {
      if (userIdsSet.has(user.userId)) {
        usersToMove.push(user);
      } else {
        remainingUsers.push(user);
      }
    });

    this.disponiblesBox.dataSource = remainingUsers;
    this.asignadosBox.dataSource = [
      ...this.asignadosBox.dataSource,
      ...usersToMove,
    ];


  }

  // --- Guardar ---
  async _guardar() {
    if (this.isProcessing) return;

    try {
      this._toggleProcessing(
        true,
        this.isEditing ? "Actualizando" : "Guardando"
      );

      const descripcion = document
        .querySelector(this.elementos.descripcion)
        ?.value.trim();
      const tipoAutorizacionId = document.querySelector(
        this.elementos.tipoAutorizacion
      )?.value;
      const sociedadId = document.querySelector(this.elementos.sociedad)?.value;
      const usuariosAsignados = this.getAssignedUserIds();
      const status = document.querySelector(this.elementos.status)?.checked;

      let modelId;
      if (this.isEditing) {
        const updatePayload = {
          authorizationModelId: this.currentModelId,
          description: descripcion,
          authorizationTypeId: parseInt(tipoAutorizacionId),
          brandId: parseInt(sociedadId),
          status: status,
          updatedBy: this.userId ?? 0,
        };
        await this.modeloService.update(updatePayload);
        modelId = this.currentModelId;

        // La lógica de actualizar usuarios es más compleja, a menudo implica borrar y recrear.
        await this._updateUserAssignments(
          modelId,
          usuariosAsignados,
          sociedadId
        );
        this.helper.MessageSucces("Modelo actualizado correctamente");
      } else {
        const createPayload = {
          description: descripcion,
          authorizationTypeId: parseInt(tipoAutorizacionId),
          brandId: parseInt(sociedadId),
          status: status,
          createdBy: this.userId ?? 0,
        };
        const createResponse = await this.modeloService.create(createPayload);
        modelId = createResponse?.dataResult?.authorizationModelId;

        if (!modelId) throw new Error("No se obtuvo ID del modelo creado.");

        await this._createUserAssignments(
          modelId,
          usuariosAsignados,
          sociedadId
        );
        this.helper.MessageSucces("Modelo creado correctamente");
      }

      window.location.href =
        "apps/configuraciones/autorizaciones/autorizaciones.php";
    } catch (err) {
      console.error("Error en _guardar:", err);
      this.helper.handleApiError(err);
    } finally {
      this._toggleProcessing(false);
    }
  }

  async _createUserAssignments(modelId, userIds, branchId) {
    const promises = userIds.map((userId) => {
      const payload = {
        authorizationModelId: modelId,
        authorizingUserId: userId,
        brandId: branchId,
        status: true,
        createdBy: this.userId ?? 0,
      };
      return this.usuarioModeloService.create(payload);
    });
    await Promise.all(promises);
  }

  async _updateUserAssignments(modelId, newUserIds, branchId) {
    await this.usuarioModeloService.delete(modelId); // Asumiendo que este método existe
    await this._createUserAssignments(modelId, newUserIds, branchId);
  }

  _toggleProcessing(isProcessing, label = "Guardando") {
    this.isProcessing = isProcessing;
    const btnGuardar = document.querySelector(this.elementos.btnGuardar);
    if (btnGuardar) {
      btnGuardar.disabled = isProcessing;
      btnGuardar.innerHTML = isProcessing
        ? `<span class="spinner-border spinner-border-sm me-2"></span> ${label}...`
        : "Guardar Cambios";
    }
  }

  _initValidation() {
    // Destruir validator anterior si existe
    if (this.validator && typeof this.validator.destroy === "function") {
      try {
        this.validator.destroy();
      } catch (e) {
        console.warn("Error al destruir validator anterior:", e);
      }
    }

    const asignadosContainer = document.querySelector(this.elementos.asignados);
    const LIST_ERROR_CLASS = "list-box-error";

    const clearListError = () => {
      if (asignadosContainer) {
        const parent = asignadosContainer.closest(".dual-list-group");
        if (parent) parent.classList.remove(LIST_ERROR_CLASS);
      }
    };

    // Crear la instancia de JustValidate una sola vez
    this.validator = new window.JustValidate(this.elementos.form, {
      errorFieldCssClass: "is-invalid",
      errorLabelCssClass: "invalid-feedback",
      errorLabelStyle: { display: "block" },
    });

    // Aplicar validaciones y callbacks
    this.validator
      .addField(this.elementos.descripcion, [
        { rule: "required", errorMessage: "La descripción es obligatoria" },
        { rule: "minLength", value: 3, errorMessage: "Mínimo 3 caracteres" },
        {
          rule: "maxLength",
          value: 200,
          errorMessage: "Máximo 200 caracteres",
        },
      ])
      .addField(this.elementos.tipoAutorizacion, [
        { rule: "required", errorMessage: "Seleccione un tipo" },
      ])
      .addField(this.elementos.sociedad, [
        { rule: "required", errorMessage: "Seleccione una sociedad" },
      ])
      .addField(this.elementos.asignados, [
        // <-- Agregar la validación del listbox
        {
          rule: "function",
          validator: () => this.getAssignedUserIds().length > 0,
          errorMessage: "Debe asignar al menos un usuario",
        },
      ])
      .onSuccess((ev) => {
        ev.preventDefault();
        clearListError();
        this._guardar();
      })
      .onFail((e) => {
        // 'e' contiene los campos que fallaron: { "#selector": [mensaje1, mensaje2], ... }
        const hasAssignedError =
          e[this.elementos.asignados] && this.getAssignedUserIds().length === 0;

        if (hasAssignedError) {
          const parent = asignadosContainer?.closest(".dual-list-group");
          if (parent) parent.classList.add(LIST_ERROR_CLASS);

          if (asignadosContainer) {
            asignadosContainer.scrollIntoView({
              behavior: "smooth",
              block: "center",
              inline: "nearest",
            });
          }
        } else {
          clearListError();
        }

        this.helper.MessageError(
          "Por favor, corrija los errores en el formulario."
        );
      });
  }

  _clearAssignedListError() {
    const LIST_ERROR_CLASS = "list-box-error";
    const asignadosContainer = document.querySelector(this.elementos.asignados);

    if (asignadosContainer) {
      const parent = asignadosContainer.closest(".dual-list-group");
      if (parent) parent.classList.remove(LIST_ERROR_CLASS);
    }

    if (this.validator) {
      const fieldName = this.elementos.asignados;

      const userAssignedRule = {
        rule: "function",
        validator: () => this.getAssignedUserIds().length > 0,
        errorMessage: "Debe asignar al menos un usuario",
      };

      if (this.getAssignedUserIds().length > 0) {
        this.validator.removeField(fieldName);

        this.validator.addField(fieldName, [userAssignedRule]);
        this.validator.revalidateField(fieldName);

      }
    }
  }
}

// Inicialización
const autorizacionesCreate = new AutorizacionesCreate();
window.autorizacionesCreate = autorizacionesCreate;
