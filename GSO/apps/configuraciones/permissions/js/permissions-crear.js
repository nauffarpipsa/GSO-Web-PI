import { Helper } from "../../helper/helper.js";
import { AccesoService } from "../../accessos/api/accesoService.js";
import { AccessXActionService } from "../../accessos/api/accesoXactionService.js";
import { PermissionService } from "../api/permissionService.js";
import { UsuarioService } from "../../users/api/usuarioService.js";
import { CountryService } from "../../country/api/countryService.js";

export class PermissionForm {
  constructor() {
    this.service = new PermissionService();
    this.countryService = new CountryService();
    this.accesoService = new AccesoService();
    this.accessXActionService = new AccessXActionService();
    this.userService = new UsuarioService();
    this.helper = new Helper();

    this.userId = null;
    this.isProcessing = false;
    this.treeObj = null;
    this.treeData = [];
    this.existingPermissions = [];
    this.selectedCountry = null;
    this.permissionsByCountry = {}; // { 'HN': [{accessId, actionId}, ...], ... }
    this.dirtyCountries = new Set();

    // Mapas para jerarquía y sincronización
    this.allAccessData = [];
    this.accessChildrenMap = new Map();     // parentAccessId → [childAccessIds]
    this.accessParentMap = new Map();       // childAccessId → parentAccessId
    this.accessActionsMap = new Map();      // accessId → [actionIds]

    this.isUpdatingTree = false; // Evitar recursión infinita

    this.elementos = {
      form: "#formEdicionCompleta",
      formTitle: "#formPermissionTitle",
      userNameInput: "#userName",
      countriesSelect: "#contries",
      treeViewContainer: "#tree",
      saveButton: "#btnGuardarEdicion",
      backButton: "#btnVolver",
    };
  }

  /* -------------------------
     Inicialización
     ------------------------- */
  async init() {
    this._determineUserId();
    this._setupEventListeners();
    await this._loadTreeView();
    // Load all existing permissions for the user into memory so country switches do not hit backend
    try {
      await this._loadAllUserPermissions();
    } catch (e) {
      console.warn('No pude precargar permisos del usuario:', e);
    }

    const title = `Asignar Permisos a Usuario #${this.userId}`;
    document.title = title;
    document.querySelector(
      this.elementos.formTitle
    ).innerHTML = `<i class="ki-duotone ki-edit fs-2 me-2">...</i> ${title}`;

    // Load read-only user name (independent from country selection)
    await this._loadUserName();

    // Ensure save button stays disabled until a country is selected
    const saveBtn = document.querySelector(this.elementos.saveButton);
    if (saveBtn) saveBtn.disabled = true;
    await this._loadCountries();
  }

  _determineUserId() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      this.userId = id;
    } else {
      throw new Error("No se proporcionó ID de usuario en la URL.");
    }
  }

  async _loadUserName() {
    try {
      const userResponse = await this.userService.getById(this.userId);
      const userData = this._unwrapResponse(userResponse);
      const userNameInput = document.querySelector(this.elementos.userNameInput);
      userNameInput.value = `${userData?.firstName || ""} ${userData?.lastName || ""}`;
      userNameInput.disabled = true;
    } catch (err) {
      console.warn('No pude cargar el nombre de usuario:', err);
    }
  }

  /* -------------------------
     Helpers para formatos de respuesta
     ------------------------- */
  _unwrapResponse(resp) {
    if (!resp) return null;
    if (Array.isArray(resp)) return resp;
    if (typeof resp !== "object") return resp;
    if (resp.data !== undefined) return resp.data;
    if (resp.dataResult !== undefined) return resp.dataResult;
    if (resp.result !== undefined) return resp.result;
    if (resp.payload !== undefined) return resp.payload;
    if (resp.isCorrect !== undefined && resp.data !== undefined)
      return resp.data;
    if (resp.data && resp.data.data !== undefined) return resp.data.data;
    return resp;
  }

  async _loadCountries() {
    try {
      const response = await this.countryService.getByUserCompany(this.userId);
      const countries = this._unwrapResponse(response);

      const selectElement = document.getElementById("contries");
      if (selectElement) {
        selectElement.innerHTML = '<option value="">Seleccionar país</option>';
        // Use the country code when available (countryCode, code, iso), otherwise fall back to id
        countries.forEach(country => {
          const option = document.createElement("option");
          const code = (country.countryId || "").toString();
          option.value = code;
          option.textContent = country.name || country.description || code;
          selectElement.appendChild(option);
        });
        // Reset selected country
        this.selectedCountry = null;
        selectElement.value = "";
        console.debug('Countries loaded for user', this.userId, countries);


        // // if has countries, preselect the first one
        if (countries.length > 0) {
          this.selectedCountry = (countries[0].countryId || "").toString();
          selectElement.value = this.selectedCountry;
          this._applyStoredPermissionsToTree(this.selectedCountry);
          const saveBtn = document.querySelector(this.elementos.saveButton);
          if (saveBtn) saveBtn.disabled = false;

        }

      }
    } catch (error) {
      this.helper.handleApiError(error);
    }
  }

  async _loadTreeView() {
    try {
      let response = await this.accesoService.getAll();
      response = response.dataResult.filter(acc => acc.active == true);
      const data = this._unwrapResponse(response);

      const accessesArray = Array.isArray(data)
        ? data
        : data?.data || data?.accessList || [];

      this.allAccessData = accessesArray;
      this._buildAccessRelationMaps(accessesArray);

      this.treeData = this._mapApiToTreeData(accessesArray);

      this.treeObj = new ej.navigations.TreeView({
        fields: {
          dataSource: this.treeData,
          id: "id",
          parentID: "pid",
          text: "text",
          hasChildren: "hasChild",
        },
        showCheckBox: true,
        nodeChecked: (args) => this._handleNodeChecked(args),
        nodeUnchecked: (args) => this._handleNodeUnchecked(args),
      });

      this.treeObj.appendTo(this.elementos.treeViewContainer);
    } catch (error) {
      this.helper.handleApiError(error);
    }
  }

  _buildAccessRelationMaps(accessesArray) {
    this.accessChildrenMap.clear();
    this.accessParentMap.clear();
    this.accessActionsMap.clear();

    accessesArray.forEach(access => {
      const accessId = access.accessId;
      const parentId = access.accessFatherId || 0;

      // Acciones directas de este access
      const actionIds = (access.actions || []).map(a => a.actionId);
      this.accessActionsMap.set(accessId, actionIds);

      // Relación padre-hijo lógica
      if (parentId !== 0) {
        this.accessParentMap.set(accessId, parentId);
        if (!this.accessChildrenMap.has(parentId)) {
          this.accessChildrenMap.set(parentId, []);
        }
        this.accessChildrenMap.get(parentId).push(accessId);
      }
    });
  }

  _mapApiToTreeData(apiData = []) {
    const treeData = [];

    apiData.forEach(access => {
      const accessId = access.accessId ?? access.id;
      const parentId = access.accessFatherId || 0;
      const actions = Array.isArray(access.actions) ? access.actions : [];

      // Access (raíz o hijo)
      treeData.push({
        id: `access-${accessId}`,
        pid: parentId === 0 ? null : `access-${parentId}`,
        text: access.description ?? `Access ${accessId}`,
        hasChild: actions.length > 0 || (this.accessChildrenMap.get(accessId)?.length > 0),
        type: 'access',
        active: !!access.active
      });

      // Actions directas bajo su access
      actions.forEach(action => {
        const actionId = action.actionId ?? action.id;
        treeData.push({
          id: `action-${actionId}`,
          pid: `access-${accessId}`,
          text: action.description ?? `Action ${actionId}`,
          type: 'action',
          active: !!action.active
        });
      });
    });

    return treeData;
  }

  _handleNodeChecked(args) {
    if (this.isUpdatingTree) return;
    this.isUpdatingTree = true;

    try {
      const nodeId = args.node?.id || args.nodeId;
      if (!nodeId) return;

      if (nodeId.startsWith("access-")) {
        const accessId = parseInt(nodeId.replace("access-", ""), 10);
        this._checkAccessChildren(accessId);
        this._checkActionsOfAccess(accessId);
        this._checkAccessParents(accessId);
      }
      else if (nodeId.startsWith("action-")) {
        const actionNode = this.treeData.find(n => n.id === nodeId);
        if (actionNode?.pid?.startsWith("access-")) {
          const parentAccessId = parseInt(actionNode.pid.replace("access-", ""), 10);
          this._checkNode(`access-${parentAccessId}`);
          this._checkAccessParents(parentAccessId);
        }
      }

      this.treeObj.dataBind();
    } finally {
      this.isUpdatingTree = false;
    }
  }

  _handleNodeUnchecked(args) {
    if (this.isUpdatingTree) return;
    this.isUpdatingTree = true;

    try {
      const nodeId = args.node?.id || args.nodeId;
      if (!nodeId) return;

      if (nodeId.startsWith("access-")) {
        const accessId = parseInt(nodeId.replace("access-", ""), 10);
        this._uncheckAccessChildren(accessId);
        this._uncheckActionsOfAccess(accessId);
        this._uncheckAccessParentsIfNeeded(accessId);
      }
      else if (nodeId.startsWith("action-")) {
        const actionNode = this.treeData.find(n => n.id === nodeId);
        if (actionNode?.pid?.startsWith("access-")) {
          const parentAccessId = parseInt(actionNode.pid.replace("access-", ""), 10);
          this._uncheckAccessIfNoActionsChecked(parentAccessId);
        }
      }

      this.treeObj.dataBind();
    } finally {
      this.isUpdatingTree = false;
    }
  }

  // Descendentes
  _checkAccessChildren(parentAccessId) {
    const children = this.accessChildrenMap.get(parentAccessId) || [];
    children.forEach(childId => {
      this._checkNode(`access-${childId}`);
      this._checkActionsOfAccess(childId);
      this._checkAccessChildren(childId);
    });
  }

  _uncheckAccessChildren(parentAccessId) {
    const children = this.accessChildrenMap.get(parentAccessId) || [];
    children.forEach(childId => {
      this._uncheckNode(`access-${childId}`);
      this._uncheckActionsOfAccess(childId);
      this._uncheckAccessChildren(childId);
    });
  }

  // Ascendentes
  _checkAccessParents(childAccessId) {
    const parentId = this.accessParentMap.get(childAccessId);
    if (!parentId || parentId === 0) return;
    this._checkNode(`access-${parentId}`);
    this._checkAccessParents(parentId);
  }

  _uncheckAccessParentsIfNeeded(childAccessId) {
    const parentId = this.accessParentMap.get(childAccessId);
    if (!parentId || parentId === 0) return;

    const siblings = this.accessChildrenMap.get(parentId) || [];
    const hasOtherChecked = siblings.some(sib =>
      sib !== childAccessId && this._isNodeChecked(`access-${sib}`)
    );

    if (!hasOtherChecked) {
      this._uncheckNode(`access-${parentId}`);
      this._uncheckAccessParentsIfNeeded(parentId);
    }
  }

  // Actions ↔ Access
  _checkActionsOfAccess(accessId) {
    const actionIds = this.accessActionsMap.get(accessId) || [];
    actionIds.forEach(aid => this._checkNode(`action-${aid}`));
  }

  _uncheckActionsOfAccess(accessId) {
    const actionIds = this.accessActionsMap.get(accessId) || [];
    actionIds.forEach(aid => this._uncheckNode(`action-${aid}`));
  }

  _uncheckAccessIfNoActionsChecked(accessId) {
    const actionIds = this.accessActionsMap.get(accessId) || [];
    const hasAnyActionChecked = actionIds.some(aid => this._isNodeChecked(`action-${aid}`));

    if (!hasAnyActionChecked) {
      this._uncheckNode(`access-${accessId}`);
      this._uncheckAccessParentsIfNeeded(accessId);
    }
  }

  // Utilidades nodo
  _checkNode(nodeId) {
    if (!this.treeObj) return;
    let checked = this.treeObj.checkedNodes || [];
    if (!checked.includes(nodeId)) {
      checked.push(nodeId);
      this.treeObj.checkedNodes = checked;
    }
  }

  _uncheckNode(nodeId) {
    if (!this.treeObj) return;
    let checked = this.treeObj.checkedNodes || [];
    const idx = checked.indexOf(nodeId);
    if (idx !== -1) {
      checked.splice(idx, 1);
      this.treeObj.checkedNodes = checked;
    }
  }

  _isNodeChecked(nodeId) {
    if (!this.treeObj) return false;
    return (this.treeObj.checkedNodes || []).includes(nodeId);
  }

  /* -------------------------
     Carga datos de permisos y usuario
     ------------------------- */
  async _loadAllUserPermissions() {
    try {
      const permsResponse = await this.service.getById(this.userId);
      const allPerms = this._unwrapResponse(permsResponse) || [];
      // Group into permissionsByCountry
      const map = {};
      (allPerms || []).forEach(p => {
        const code = (p.countryCode || p.CountryCode || p.country || p.Country || '').toString().toUpperCase();
        if (!code) return;
        if (!map[code]) map[code] = [];
        map[code].push({ accessId: p.accessId, actionId: p.actionId });
      });
      // Deduplicate
      Object.keys(map).forEach(c => this._setStoredPermissionsForCountry(c, map[c]));
      console.debug('Loaded permissionsByCountry from server:', this.permissionsByCountry);
      // Loaded from server are initial state—clear dirty flags
      this.dirtyCountries.clear();
    } catch (err) {
      console.warn('Error loading all permissions', err);
    }
  }

  _setupEventListeners() {
    document
      .querySelector(this.elementos.saveButton)
      ?.addEventListener("click", (e) => {
        e.preventDefault();
        this._handleSave();
      });

    // Country selection must change the permission context dynamically
    document
      .querySelector(this.elementos.countriesSelect)
      ?.addEventListener('change', (e) => {
        // Before switching, persist current selections to memory
        try { this._storeCurrentSelectionsFromTree(); } catch (err) { console.warn(err); }

        this.selectedCountry = (e.target.value || '').toString().trim().toUpperCase();
        const saveBtn = document.querySelector(this.elementos.saveButton);
        if (!this.selectedCountry) {
          this.helper.ToastWarning('Seleccione un país antes de continuar.');
          if (saveBtn) saveBtn.disabled = true;
          this._clearTreeChecks();
          return;
        }
        if (saveBtn) saveBtn.disabled = false;

        // Apply in-memory selections for this country (no backend call)
        this._applyStoredPermissionsToTree(this.selectedCountry);
      });

    document
      .querySelector(this.elementos.backButton)
      ?.addEventListener("click", () => window.history.back());
  }

  _clearTreeChecks() {
    this.existingPermissions = [];
    if (this.treeObj) {
      this.treeObj.checkedNodes = [];
      try { this.treeObj.dataBind(); } catch (e) { /* ignore */ }
    }
  }

  /* -------------------------
     In-memory permissions management
     ------------------------- */
  _getStoredPermissionsForCountry(countryCode) {
    if (!countryCode) return [];
    const c = countryCode.toString().trim().toUpperCase();
    return this.permissionsByCountry[c] ? Array.from(this.permissionsByCountry[c]) : [];
  }

  _setStoredPermissionsForCountry(countryCode, items) {
    if (!countryCode) return;
    const c = countryCode.toString().trim().toUpperCase();
    // store as set of strings 'access-<id>:action-<id>' for easy dedupe
    const set = new Set();
    (items || []).forEach(i => {
      if (i && i.accessId && i.actionId) set.add(`${i.accessId}:${i.actionId}`);
    });
    this.permissionsByCountry[c] = Array.from(set).map(s => {
      const [accessId, actionId] = s.split(':').map(Number);
      return { accessId, actionId };
    });
    this.dirtyCountries.add(c);
  }

  _storeCurrentSelectionsFromTree() {
    if (!this.selectedCountry) return;
    const entries = this._getPermissionsPayload(); // returns grouped access->actions
    const flat = [];
    entries.forEach(e => {
      (e.actions || []).forEach(a => {
        flat.push({ accessId: e.accessId, actionId: a.actionId });
      });
    });
    this._setStoredPermissionsForCountry(this.selectedCountry, flat);
  }

  _applyStoredPermissionsToTree(countryCode) {
    if (!this.treeObj) return;
    const stored = this._getStoredPermissionsForCountry(countryCode);
    const checkedIds = [];

    // Solo marcamos las actions → la propagación ascendente se encarga del resto
    stored.forEach(s => {
      if (s.actionId) checkedIds.push(`action-${s.actionId}`);
    });

    this.isUpdatingTree = true;
    this.treeObj.checkedNodes = checkedIds;
    this.treeObj.dataBind();
    this.isUpdatingTree = false;
  }

  _getPermissionsPayload() {
    const checkedNodeIds = this.treeObj?.checkedNodes || [];

    const accessMap = {};

    checkedNodeIds.forEach(nodeId => {
      if (nodeId.startsWith("action-")) {
        const actionId = parseInt(nodeId.replace("action-", ""), 10);
        const actionNode = this.treeData.find(n => n.id === nodeId);
        const parentId = actionNode?.pid;
        if (!parentId || !parentId.startsWith("access-")) return;

        const accessId = parseInt(parentId.replace("access-", ""), 10);
        if (!accessMap[accessId]) {
          accessMap[accessId] = { accessId, actions: [] };
        }
        if (!accessMap[accessId].actions.some(a => a.actionId === actionId)) {
          accessMap[accessId].actions.push({ actionId, active: true });
        }
      }
      // Si un access está checked sin actions → lo ignoramos (solo guardamos actions)
    });

    return Object.values(accessMap).map(entry => ({
      ...entry,
      CountryCode: this.selectedCountry || ''
    }));
  }

  /* -------------------------
     Flujo Guardado: desactivar viejos y crear nuevos permisos
     ------------------------- */
  async _handleSave() {
    if (this.isProcessing) return;

    // Allow saving if there are stored permissions across any country, even if no country is currently selected
    const hasStored = Object.keys(this.permissionsByCountry || {}).some(c => (this.permissionsByCountry[c] || []).length > 0);
    if (!this.selectedCountry && !hasStored) {
      this.helper.ToastWarning('Seleccione un país antes de guardar o agregue permisos a al menos un país.');
      return;
    }

    this._clearValidationErrors();
    if (!this._validateForm()) {
      this.helper.ToastWarning("Por favor, corrige los errores marcados.");
      return;
    }


    this._toggleProcessingState(true);

    try {
      // Persist current UI selections into in-memory country store
      this._storeCurrentSelectionsFromTree();

      // Build flattened entries from all countries stored in memory
      const allEntries = [];
      Object.entries(this.permissionsByCountry).forEach(([country, list]) => {
        (list || []).forEach(item => {
          allEntries.push({ accessId: item.accessId, actionId: item.actionId, CountryCode: country });
        });
      });

      console.debug('Saving all country-scoped permissions:', allEntries);

      // Delete all existing server-side permissions once, then insert all entries
      await this._saveAllFlattenedPermissions(allEntries);

      this.helper.MessageSucces("¡Permisos guardados correctamente!");
      setTimeout(() => {
        window.location.href = "apps/configuraciones/users/usuario.php"; // Ajustar a lista de usuarios
      }, 1500);
    } catch (err) {
      console.error(err);
      this.helper.handleApiError(err);
    } finally {
      this._toggleProcessingState(false);
    }
  }

  /* -------------------------
     Desactivar todos los permisos del usuariof
     ------------------------- */
  async _deactivateAllForUser() {
    try {
      const permsResponse = await this.service.getAll();
      const allPerms = this._unwrapResponse(permsResponse);
      const userPerms = (allPerms || []).filter(p => {
        const code = (p.countryCode || p.CountryCode || p.country || p.Country || '').toString();
        return p.UserId == this.userId && p.Active && code.toUpperCase() === this.selectedCountry.toString().toUpperCase();
      });

      for (const perm of userPerms) {
        await this.service.Delete(perm.UserAccessActionId); // Deactivate only for selected country
      }
    } catch (error) {
      console.error("Error al desactivar permisos:", error);
      // No fatal, continuar
    }
  }

  async _saveAllFlattenedPermissions(flatEntries) {
    this.helper.ToastInfo('Guardando permisos (por país)...');
    // First, delete all existing permissions for the user (single call)
    try {
      await this.service.Delete(this.userId);
    } catch (e) {
      console.warn('Error calling Delete(userId) before saving:', e);
    }

    const results = [];
    const BATCH = 20;

    for (let i = 0; i < flatEntries.length; i += BATCH) {
      const batch = flatEntries.slice(i, i + BATCH);
      const promises = batch.map(async (entry) => {
        const body = {
          UserAccessActionId: 0,
          UserId: parseInt(this.userId, 10),
          AccessId: entry.accessId,
          ActionId: entry.actionId,
          Active: true,
          CountryCode: (entry.CountryCode || entry.country || '').toString().trim().toUpperCase(),
        };
        console.debug('Creating permission (batch):', body);
        try {
          const r = await this.service.create(body);
          return { success: true, raw: r };
        } catch (err) {
          return { success: false, error: err, entry };
        }
      });

      const settled = await Promise.all(promises);
      results.push(...settled);
    }

    const failed = results.filter(r => !r.success);
    if (failed.length) {
      console.warn('Algunos permisos no se crearon:', failed);
      this.helper.ToastWarning('Algunos permisos no pudieron guardarse; revisa la consola.');
    } else {
      this.helper.MessageSucces('Permisos creados correctamente.');
      // Mark countries as not dirty
      this.dirtyCountries.clear();
    }

    return results;
  }

  /* -------------------------
     Validaciones y utilidades
     ------------------------- */
  _validateForm() {
    let isValid = true;
    // Require that at least one permission exists overall (per-country) or current country is selected and has permissions
    const totalSelected = Object.values(this.permissionsByCountry || {}).reduce((acc, list) => acc + (list ? list.length : 0), 0);
    if (!this.selectedCountry && totalSelected === 0) {
      this.helper.ToastWarning('Debe seleccionar un país o agregar permisos a algún país antes de guardar.');
      isValid = false;
    }

    // Nombre usuario es read-only, no validar vacío

    const checked =
      (this.treeObj && typeof this.treeObj.getCheckedNodes === "function"
        ? this.treeObj.getCheckedNodes()
        : this.treeObj && this.treeObj.checkedNodes) || [];

    if (!checked.length) {
      this.helper.ToastWarning("Debe seleccionar al menos un permiso.");
      isValid = false;
    }
    return isValid;
  }

  _showValidationError(selector, message) {
    const field = document.querySelector(selector);
    if (!field) return;
    field.classList.add("is-invalid");

    const errorDiv = document.createElement("div");
    errorDiv.className = "invalid-feedback";
    errorDiv.textContent = message;

    field.parentNode.insertBefore(errorDiv, field.nextSibling);
  }

  _clearValidationErrors() {
    document
      .querySelectorAll(".is-invalid")
      .forEach((el) => el.classList.remove("is-invalid"));
    document.querySelectorAll(".invalid-feedback").forEach((el) => el.remove());
  }

  _toggleProcessingState(isProcessing) {
    this.isProcessing = isProcessing;
    const saveButton = document.querySelector(this.elementos.saveButton);
    if (saveButton) {
      saveButton.disabled = isProcessing;
      saveButton.innerHTML = isProcessing
        ? '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...'
        : "Guardar Cambios";
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  const permissionForm = new PermissionForm();
  permissionForm.init();
});