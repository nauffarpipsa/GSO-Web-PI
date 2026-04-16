import { UsuarioService } from "../api/usuarioService.js";
import { RolService } from "../../roles/api/rolService.js";
import { UsuarioSucursalService } from "../api/usuarioSucursalService.js";
import { Helper } from "../../helper/helper.js";
import { UsuarioRolService } from "../api/usuarioRolService.js";
import { SedeService } from "../../sedes/api/sedesService.js";

export class UsuarioCrear {
  constructor() {
    this.service = new UsuarioService();
    this.rolService = new RolService();
    this.usuarioSucursalService = new UsuarioSucursalService();
    this.sedeService = new SedeService();
    this.usuarioRolService = new UsuarioRolService();
    this.helper = new Helper();

    this.mode = "create";
    this.userId = null;
    this.sessionUserId = null;
    this.isProcessing = false;
    this.contriesList = [];

    this.elementos = {
      form: "#formEdicionCompleta",
      formTitle: ".card-title h2",
      firstName: "#firstName",
      lastName: "#lastName",
      phone: "#phone",
      email: "#email",
      buyerCode: "#buyerCode",
      supplierCode: "#supplierCode",
      status: "#status",
      btnGuardar: "#btnGuardarEdicion",
      btnVolver: " ", // Botón de volver

      // Dual Listbox
      rolesDisponibles: "#listBoxRolesDisponibles",
      rolesAsignados: "#listBoxRolesAsignados",
      sociedadesDisponibles: "#listBoxSucursalesDisponibles",
      sociedadesAsignadas: "#listBoxSucursalesAsignadas",
    };

    this.rolesDisponiblesBox = null;
    this.rolesAsignadosBox = null;
    this.sociedadesDisponiblesBox = null;
    this.sociedadesAsignadasBox = null;
  }

  /**
   * Punto de entrada para inicializar la lógica del formulario.
   */
  async init() {
    this._determineMode();
    await this._loadUserInformation();
    this._initializeDualListBoxes();
    this._setupEventListeners();
    await this._loadDropdownData();

    if (this.mode === "edit") {
      await this._loadUsuarioData();
    } else {
      this._setCreateModeTitle();
    }
  }

  _determineMode() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      this.mode = "edit";
      this.userId = id;
    }
  }

  async _loadUserInformation() {
    try {
      const sessionData = await this.service.getSessionData();
      this.sessionUserId = sessionData?.userId ?? null;
    } catch (err) {
      this.sessionUserId = null;
      console.warn("No se pudo obtener el ID de sesión:", err);
    }
  }

  _initializeDualListBoxes() {

    try {

      this.rolesDisponiblesBox = new ej.dropdowns.ListBox({
        dataSource: [],
        fields: { text: "description", value: "roleId" },
        height: "330px",
        scope: this.elementos.rolesAsignados,
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
          '<div class="e-list-nrt"><span>No hay roles disponibles</span></div>',
      });
      this.rolesDisponiblesBox.appendTo(this.elementos.rolesDisponibles);

      // Roles Asignados (derecha)
      this.rolesAsignadosBox = new ej.dropdowns.ListBox({
        dataSource: [],
        fields: { text: "description", value: "roleId" },
        height: "330px",
        noRecordsTemplate:
          '<div class="e-list-nrt"><span>No hay roles asignados</span></div>',
      });
      this.rolesAsignadosBox.appendTo(this.elementos.rolesAsignados);

      // --- SOCIEDADES ---
      // Sociedades Disponibles (izquierda)
      this.sociedadesDisponiblesBox = new ej.dropdowns.ListBox({
        dataSource: [],
        fields: { text: "description", value: "branchId" },
        height: "330px",
        scope: this.elementos.sociedadesAsignadas,
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
          '<div class="e-list-nrt"><span>No hay sociedades disponibles</span></div>',
      });
      this.sociedadesDisponiblesBox.appendTo(
        this.elementos.sociedadesDisponibles
      );

      // Sociedades Asignadas (derecha)
      this.sociedadesAsignadasBox = new ej.dropdowns.ListBox({
        dataSource: [],
        fields: { text: "description", value: "branchId" },
        height: "330px",
        noRecordsTemplate:
          '<div class="e-list-nrt"><span>No hay sociedades asignadas</span></div>',
      });
      this.sociedadesAsignadasBox.appendTo(this.elementos.sociedadesAsignadas);

    } catch (error) {

    }
  }

  async _loadDropdownData() {
    try {
      this.helper?.showSpinner?.();

      // Cargar roles
      const rolesResponse = await this.rolService.getAll();
      const roles = rolesResponse?.dataResult || [];
      this.rolesDisponiblesBox.dataSource = roles;

      // Cargar sociedades
      const sociedadesResponse = await this.sedeService.getAll();
      const sociedades = sociedadesResponse?.dataResult || [];
      this.sociedadesDisponiblesBox.dataSource = sociedades;
    } catch (error) {
      // console.error("Error al cargar datos iniciales:", error);
      //  this.helper.handleApiError(error);
    } finally {
      // this.helper?.hideSpinner?.();
    }
  }

  /**
   * Carga los datos del usuario existente y rellena el formulario.
   */
  async _loadUsuarioData() {
    try {
      const response = await this.service.getById(this.userId);
      if (response && response.dataResult) {
        const userData = response.dataResult;
        this._populateForm(userData);
        await this._loadUsuarioAsignaciones();
        this._setEditModeTitle();
      } else {
        throw new Error("No se encontraron datos para este usuario.");
      }
    } catch (error) {
      console.error("Error al cargar datos del usuario:", error);
      this.helper?.handleApiError?.(error);
      document.querySelector(this.elementos.btnGuardar).disabled = true;
    }
  }

  /**
   * Rellena los campos del formulario con los datos proporcionados.
   */
  _populateForm(data) {
    document.querySelector(this.elementos.firstName).value =
      data.firstName || "";
    document.querySelector(this.elementos.lastName).value = data.lastName || "";
    document.querySelector(this.elementos.phone).value = data.phone || "";
    document.querySelector(this.elementos.email).value = data.email || "";
    document.querySelector(this.elementos.buyerCode).value =
      data.buyerCode || "";
    document.querySelector(this.elementos.supplierCode).value =
      data.supplierCode || "";
    document.querySelector(this.elementos.status).checked =
      data.status || false;
  }

  async _loadUsuarioAsignaciones() {
    try {
      this.helper?.showSpinner?.();

      // Cargar roles asignados
      const assignedRoles = await this._obtenerRolesUsuario(this.userId);
      this._moverRolesAsignados(assignedRoles);

      // Cargar sociedades asignadas
      const assignedCompanies = await this._obtenerSociedadesUsuario(
        this.userId
      );
      this._moverSociedadesAsignadas(assignedCompanies);
    } catch (error) {
      console.error("Error al cargar asignaciones del usuario:", error);
      this.helper?.MessageError?.(
        "Error al cargar las asignaciones del usuario"
      );
    } finally {
      this.helper?.hideSpinner?.();
    }
  }

  async _obtenerRolesUsuario(userId) {
    try {
      const allUserRoles = await this.usuarioRolService.getAll();
      const userRoles = (allUserRoles?.dataResult || []).filter(
        (r) => r.userId === Number(userId) && r.active
      );
      return userRoles.map((r) => r.rolId);
    } catch (error) {
      console.error("Error al obtener roles del usuario:", error);
      return [];
    }
  }

  async _obtenerSociedadesUsuario(userId) {
    try {
      const allUserCompanies = await this.usuarioSucursalService.getAll();
      const userCompanies = (allUserCompanies?.dataResult || []).filter(
        (c) => c.userId === Number(userId) && c.status
      );
      return userCompanies.map((c) => c.companyId);
    } catch (error) {
      console.error("Error al obtener sociedades del usuario:", error);
      return [];
    }
  }

  _moverRolesAsignados(roleIds) {
    if (!this.rolesDisponiblesBox?.dataSource || !Array.isArray(roleIds))
      return;

    const rolesToMove = this.rolesDisponiblesBox.dataSource.filter((role) =>
      roleIds.includes(Number(role.roleId))
    );

    rolesToMove.forEach((role) => {
      const sourceIndex = this.rolesDisponiblesBox.dataSource.findIndex(
        (r) => r.roleId === role.roleId
      );
      if (sourceIndex !== -1) {
        this.rolesDisponiblesBox.dataSource.splice(sourceIndex, 1);
      }

      if (!this.rolesAsignadosBox.dataSource) {
        this.rolesAsignadosBox.dataSource = [];
      }
      this.rolesAsignadosBox.dataSource.push(role);
    });

    if (this.rolesDisponiblesBox.refresh) this.rolesDisponiblesBox.refresh();
    if (this.rolesAsignadosBox.refresh) this.rolesAsignadosBox.refresh();
  }

  _moverSociedadesAsignadas(companyIds) {
    if (
      !this.sociedadesDisponiblesBox?.dataSource ||
      !Array.isArray(companyIds)
    )
      return;

    const companiesToMove = this.sociedadesDisponiblesBox.dataSource.filter(
      (company) => companyIds.includes(Number(company.branchId))
    );

    companiesToMove.forEach((company) => {
      const sourceIndex = this.sociedadesDisponiblesBox.dataSource.findIndex(
        (c) => c.branchId === company.branchId
      );
      if (sourceIndex !== -1) {
        this.sociedadesDisponiblesBox.dataSource.splice(sourceIndex, 1);
      }

      if (!this.sociedadesAsignadasBox.dataSource) {
        this.sociedadesAsignadasBox.dataSource = [];
      }
      this.sociedadesAsignadasBox.dataSource.push(company);
    });

    if (this.sociedadesDisponiblesBox.refresh)
      this.sociedadesDisponiblesBox.refresh();
    if (this.sociedadesAsignadasBox.refresh)
      this.sociedadesAsignadasBox.refresh();
  }

  _setEditModeTitle() {
    const title = `Editar Usuario #${this.userId}`;
    document.title = title;
    document.querySelector(
      this.elementos.formTitle
    ).innerHTML = `<i class="ki-duotone ki-edit fs-2 me-2"><span class="path1"></span><span class="path2"></span></i> ${title}`;
  }

  _setCreateModeTitle() {
    const title = "Crear Nuevo Usuario";
    document.title = title;
    document.querySelector(
      this.elementos.formTitle
    ).innerHTML = `<i class="ki-duotone ki-plus fs-2 me-2"></i> ${title}`;
  }

  /**
   * Configura los listeners de eventos, como el clic del botón de guardar.
   */
  _setupEventListeners() {
    const saveButton = document.querySelector(this.elementos.btnGuardar);
    // const backButton = document.querySelector(this.elementos.btnVolver);

    saveButton?.addEventListener("click", (event) => {
      event.preventDefault();
      this._handleSave();
    });

    // // Listener para el botón de volver
    // backButton?.addEventListener("click", (event) => {
    //   event.preventDefault();
    //   window.history.back();
    // });
  }

  /**
   * Orquesta el proceso de guardado: valida, recolecta datos y llama al servicio.
   */
  async _handleSave() {
    if (this.isProcessing) return;

    this._clearValidationErrors();

    if (!this._validateForm()) {
      this.helper?.ToastWarning?.(
        "Por favor, corrige los errores marcados en el formulario."
      );
      return;
    }

    this._toggleProcessingState(true);
    const formData = this._getFormData();

    try {
      let response;
      if (this.mode === "edit") {
        response = await this.service.update(formData);
        await this._actualizarAsignacionesUsuario(this.userId);
      } else {
        response = await this.service.create(formData);
        const newUserId = response?.dataResult?.userId;
        if (newUserId) {
          await this._asignarAsignacionesUsuario(newUserId);
        }
      }

      this.helper?.MessageSucces?.(
        response.messageResult ||
        (this.mode === "edit"
          ? "Usuario actualizado correctamente"
          : "Usuario creado correctamente")
      );

      // Redirigir a la lista de usuarios después de guardar
      setTimeout(() => {
        // window.location.href = "apps/configuraciones/users/usuario.php";
      }, 1500);
    } catch (error) {
      console.error("Error al guardar usuario:", error);
      this.helper?.handleApiError?.(error);
    } finally {
      this._toggleProcessingState(false);
    }
  }

  /**
   * Recolecta los datos de los campos del formulario y los devuelve como un objeto.
   */
  _getFormData() {
    return {
      userId: this.mode === "edit" ? this.userId : 0,
      firstName: document.querySelector(this.elementos.firstName).value.trim(),
      lastName: document.querySelector(this.elementos.lastName).value.trim(),
      phone: document.querySelector(this.elementos.phone)?.value.trim() || "",
      email: document.querySelector(this.elementos.email)?.value.trim() || "",
      buyerCode:
        document.querySelector(this.elementos.buyerCode)?.value.trim() || "",
      supplierCode:
        document.querySelector(this.elementos.supplierCode)?.value.trim() || "",
      status: document.querySelector(this.elementos.status)?.checked || false,
    };
  }

  /**
   * Valida los campos requeridos del formulario.
   */
  _validateForm() {
    let isValid = true;

    // Validar nombre
    const firstName = document
      .querySelector(this.elementos.firstName)
      .value.trim();
    if (firstName === "") {
      this._showValidationError(
        this.elementos.firstName,
        "El nombre es obligatorio."
      );
      isValid = false;
    }

    // Validar apellido
    const lastName = document
      .querySelector(this.elementos.lastName)
      .value.trim();
    if (lastName === "") {
      this._showValidationError(
        this.elementos.lastName,
        "El apellido es obligatorio."
      );
      isValid = false;
    }

    // Validar email
    const email = document.querySelector(this.elementos.email).value.trim();
    if (email === "") {
      this._showValidationError(
        this.elementos.email,
        "El correo electrónico es obligatorio."
      );
      isValid = false;
    } else if (!this._isValidEmail(email)) {
      this._showValidationError(
        this.elementos.email,
        "El formato del correo electrónico no es válido."
      );
      isValid = false;
    }

    // Validar que haya al menos un rol asignado
    const assignedSucursalIds = this._getAssignedSucursalIds();
    if (assignedSucursalIds.length === 0) {
      this._showValidationError(
        this.elementos.sociedadesAsignadas,
        "Debe asignar al menos una sucursal al usuario."
      );
      isValid = false;
    }

    const assignedRoleIds = this._getAssignedRoleIds();
    if (assignedRoleIds.length === 0) {
      this._showValidationError(
        this.elementos.rolesAsignados,
        "Debe asignar al menos un rol al usuario."
      );
      isValid = false;
    }

    return isValid;
  }

  _isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Muestra un mensaje de error de validación debajo de un campo específico.
   */
  _showValidationError(selector, message) {
    const field = document.querySelector(selector);
    if (!field) return;

    field.classList.add("is-invalid");

    const errorDiv = document.createElement("div");
    errorDiv.className = "invalid-feedback";
    errorDiv.textContent = message;

    // Insertar el mensaje después del campo
    const parent = field.parentNode;
    if (parent) {
      parent.insertBefore(errorDiv, field.nextSibling);
    }
  }

  /**
   * Elimina todos los mensajes de error de validación del formulario.
   */
  _clearValidationErrors() {
    document
      .querySelectorAll(".is-invalid")
      .forEach((el) => el.classList.remove("is-invalid"));
    document.querySelectorAll(".invalid-feedback").forEach((el) => el.remove());
  }

  /**
   * Habilita/deshabilita el botón de guardado y muestra un spinner.
   */
  _toggleProcessingState(isProcessing) {
    this.isProcessing = isProcessing;
    const saveButton = document.querySelector(this.elementos.btnGuardar);
    if (saveButton) {
      saveButton.disabled = isProcessing;
      saveButton.innerHTML = isProcessing
        ? '<span class="spinner-border spinner-border-sm me-2"></span> Guardando...'
        : "Guardar Cambios";
    }
  }

  // --- UTILIDADES ---
  _getAssignedRoleIds() {

    // Usar listData si está disponible (más confiable)
    if (this.rolesAsignadosBox && this.rolesAsignadosBox.listData) {
      const assignedRoles = this.rolesAsignadosBox.listData
        .filter((role) => role && role.roleId)
        .map((role) => Number(role.roleId));

      return assignedRoles;
    }

    // Fallback: usar dataSource
    if (
      this.rolesAsignadosBox &&
      Array.isArray(this.rolesAsignadosBox.dataSource)
    ) {
      const assignedRoles = this.rolesAsignadosBox.dataSource
        .filter((role) => role && role.roleId)
        .map((role) => Number(role.roleId));

      return assignedRoles;
    }

    return [];
  }

  _getAssignedSucursalIds() {
    // Usar listData si está disponible (más confiable)
    if (this.sociedadesAsignadasBox && this.sociedadesAsignadasBox.listData) {
      const assignedCompanies = this.sociedadesAsignadasBox.listData
        .filter((sociedad) => sociedad && sociedad.branchId)
        .map((sociedad) => Number(sociedad.branchId));
      this.contriesList = this.sociedadesAsignadasBox.listData.map((sociedad) => sociedad.countryId);
      return assignedCompanies;
    }

    // Fallback: usar dataSource
    if (
      this.sociedadesAsignadasBox &&
      Array.isArray(this.sociedadesAsignadasBox.dataSource)
    ) {
      const assignedCompanies = this.sociedadesAsignadasBox.dataSource
        .filter((sociedad) => sociedad && sociedad.branchId)
        .map((sociedad) => Number(sociedad.branchId));

      return assignedCompanies;
    }

    return [];
  }

  // --- ACTUALIZAR ASIGNACIONES ---
  async _actualizarAsignacionesUsuario(userId) {
    // Actualizar sociedades
    const assignedCompanyIds = this._getAssignedSucursalIds();
    await this._actualizarSociedadesUsuario(userId, assignedCompanyIds);

    // Actualizar roles
    const assignedRoleIds = this._getAssignedRoleIds();
    await this._actualizarRolesUsuario(userId, assignedRoleIds);

  }

  async _actualizarRolesUsuario(userId, newRoleIds) {
    try {
      // Eliminar todas las relaciones actuales
      await this._eliminarTodosRolesUsuario(userId);
      // Crear las nuevas
      await this._crearRolesUsuario(userId, newRoleIds, this.contriesList);
    } catch (error) {
      console.error("Error al actualizar roles:", error);
      throw error;
    }
  }

  async _eliminarTodosRolesUsuario(userId) {
    try {

      // Opción 1: Si tienes un endpoint que busca por userId
      const userRoles = await this.usuarioRolService.getAll();

      if (!userRoles || !userRoles.dataResult) {
        return;
      }

      // Filtrar solo los roles del usuario actual
      const rolesUsuario = userRoles.dataResult.filter(
        (role) => role.userId === Number(userId)
      );

      console.log("Roles del usuario:", rolesUsuario);

      if (rolesUsuario.length === 0) {
        return;
      }


      const deletePromises = rolesUsuario.map((role) => {
        return this.usuarioRolService.delete(role.id);
      });

      await Promise.all(deletePromises);
    } catch (error) {
      // Manejar error de not found
      if (
        error.response?.status === 404 ||
        error.message?.includes("not found")
      ) {

        return;
      }

      console.error("Error al eliminar roles antiguos:", error);
      throw error;
    }
  }

  async _crearRolesUsuario(userId, roleIds, contriesList) {
    if (!Array.isArray(roleIds) || roleIds.length === 0) return;
    if (!Array.isArray(contriesList) || contriesList.length === 0) return;

    const createPromises = [];

    contriesList.forEach((country) => {
      roleIds.forEach((rolId) => {
        const payload = {
          id: 0,
          CountryCode: country,
          userId: Number(userId),
          rolId: Number(rolId),
          active: true,
        };

        createPromises.push(
          this.usuarioRolService.create(payload)
        );
      });
    });


    await Promise.all(createPromises);
  }

  async _actualizarSociedadesUsuario(userId, newCompanyIds) {
    try {
      // Eliminar todas las relaciones actuales
      await this._eliminarTodasSociedadesUsuario(userId);
      // Crear las nuevas
      await this._crearSociedadesUsuario(userId, newCompanyIds);
    } catch (error) {
      console.error("Error al actualizar sociedades:", error);
      throw error;
    }
  }

  async _eliminarTodasSociedadesUsuario(userId) {
    try {

      // Opción 1: Si tienes un endpoint que busca por userId
      const userCompanies = await this.usuarioSucursalService.getAll();

      if (!userCompanies || !userCompanies.dataResult) {
        return;
      }

      // Filtrar solo las sociedades del usuario actual
      const companiesUsuario = userCompanies.dataResult.filter(
        (company) => company.userId === Number(userId)
      );

      if (companiesUsuario.length === 0) {
        return;
      }

      const deletePromises = await this.usuarioSucursalService.delete(companiesUsuario[0].userId);

      // const deletePromises = companiesUsuario.map((company) => {
      //   console.log("Eliminando sociedad userRefId:", company.userRefId);
      //   return this.usuarioSucursalService.delete(company.userRefId);
      // });

      // await Promise.all(deletePromises);
    } catch (error) {
      // Manejar error de not found
      if (
        error.response?.status === 404 ||
        error.message?.includes("not found")
      ) {
        return;
      }

      console.error("Error al eliminar sociedades antiguas:", error);
      throw error;
    }
  }

  async _crearSociedadesUsuario(userId, companyIds) {
    if (!Array.isArray(companyIds) || companyIds.length === 0) return;

    const createPromises = companyIds.map((companyId) => {
      const payload = {
        userId: Number(userId),
        companyId: Number(companyId),
        userRefId: Number(userId),
        status: true,
        createdBy: this.sessionUserId || 0,
        createdAt: new Date().toISOString(),
        updatedBy: 0,
        updatedAt: null,
      };
      return this.usuarioSucursalService.create(payload);
    });

    await Promise.all(createPromises);
  }

  // --- ASIGNAR ASIGNACIONES A NUEVO USUARIO ---
  async _asignarAsignacionesUsuario(newUserId) {

    const assignedCompanyIds = this._getAssignedSucursalIds();
    await this._crearSociedadesUsuario(newUserId, assignedCompanyIds);

    const assignedRoleIds = this._getAssignedRoleIds();
    await this._crearRolesUsuario(newUserId, assignedRoleIds, this.contriesList);

  }
}

// --- INICIALIZACIÓN ---
document.addEventListener("DOMContentLoaded", () => {
  const usuarioForm = new UsuarioCrear();
  usuarioForm.init();
});

// Instancia global
window.usuarioCrear = new UsuarioCrear();
