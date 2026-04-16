
import { Helper } from "../../helper/helper.js";
import { RolService } from "../api/rolService.js";
import { AccesoService } from "../../accessos/api/accesoService.js";
import { AccessXActionService } from "../../accessos/api/accesoXactionService.js";
import { RolXAccessService } from "../api/rolXAccessService.js";
import { RolAccessActionService } from "../../rolAccessAction/js/rolAccessActionService.js";
import { CountryService } from "../../country/api/countryService.js";

export class RolForm {
  constructor() {
    this.service = new RolService();
    this.accesoService = new AccesoService();
    this.accessXActionService = new AccessXActionService();
    this.rolAccessService = new RolXAccessService();
    this.rolAccessActionService = new RolAccessActionService();
    this.countryService = new CountryService();
    this.helper = new Helper();

    this.mode = "create";
    this.rolId = null;
    this.isProcessing = false;
    this.treeObj = null;
    this.treeData = [];
    this.existingPermissions = [];

    // NUEVO: Mapas para sincronización de jerarquía
    this.allAccessData = []; // Datos completos de accesos
    this.accessChildrenMap = new Map(); // parentAccessId → [childAccessIds]
    this.accessParentMap = new Map(); // childAccessId → parentAccessId
    this.accessActionsMap = new Map(); // accessId → [actionIds]

    this.isUpdatingTree = false; // Flag para evitar loops

    this.elementos = {
      form: "#formEdicionCompleta",
      formTitle: "#formSedeTitle",
      nombreRolInput: "#LegalName",
      treeViewContainer: "#tree",
      saveButton: "#btnGuardarEdicion",
      backButton: "#btnVolver",
    };
  }

  /* -------------------------
     Inicialización
     ------------------------- */
  async init() {
    this._determineMode();
    this._setupEventListeners();

    await this._loadTreeView();

    if (this.mode === "edit") {
      const title = `Editar Rol #${this.rolId}`;
      document.title = title;
      document.querySelector(
        this.elementos.formTitle
      ).innerHTML = `<i class="ki-duotone ki-edit fs-2 me-2">...</i> ${title}`;

      await this._loadRolData();
    } else {
      const title = "Crear Nuevo Rol";
      document.title = title;
      document.querySelector(
        this.elementos.formTitle
      ).innerHTML = `<i class="ki-duotone ki-plus fs-2 me-2"></i> ${title}`;
    }
  }

 

  _determineMode() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      this.mode = "edit";
      this.rolId = id;
    }
  }

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

  /* -------------------------
     Carga TreeView (GET /api/accesses)
     NUEVO: Construye mapas de relación
     ------------------------- */
  async _loadTreeView() {
    try {
      let response = await this.accesoService.getAll();
      response = response.dataResult.filter(acc => acc.active == true);
      const data = this._unwrapResponse(response);

      const accessesArray = Array.isArray(data)
        ? data
        : data?.data || data?.accessList || [];

      // NUEVO: Guardar todos los datos de accesos
      this.allAccessData = accessesArray;

      // NUEVO: Construir mapas de relación padre-hijo
      this._buildAccessRelationMaps(accessesArray);

      // NUEVO: Construir árbol visual plano (sin nidos)
      this.treeData = this._mapApiToTreeData(accessesArray || []);

      this.treeObj = new ej.navigations.TreeView({
        fields: {
          dataSource: this.treeData,
          id: "id",
          parentID: "pid",
          text: "text",
          hasChildren: "hasChild",
        },
        showCheckBox: true,
        nodeChecked: (args) => {
          this._handleNodeChecked(args);
        },
        nodeUnchecked: (args) => {
          this._handleNodeUnchecked(args);
        }
      });

      this.treeObj.appendTo(this.elementos.treeViewContainer);
    } catch (error) {
      this.helper.handleApiError(error);
    }
  }

  /* -------------------------
     NUEVO: Construir mapas de relación
     ------------------------- */
  _buildAccessRelationMaps(accessesArray) {
    this.accessChildrenMap.clear();
    this.accessParentMap.clear();
    this.accessActionsMap.clear();

    accessesArray.forEach(access => {
      const accessId = access.accessId;
      const parentId = access.accessFatherId || 0;

      // Mapear acciones para este acceso
      const actionIds = (access.actions || []).map(a => a.actionId);
      this.accessActionsMap.set(accessId, actionIds);

      // Mapear relación padre-hijo
      if (parentId !== 0) {
        this.accessParentMap.set(accessId, parentId);

        if (!this.accessChildrenMap.has(parentId)) {
          this.accessChildrenMap.set(parentId, []);
        }
        this.accessChildrenMap.get(parentId).push(accessId);
      }
    });

  }

  /* -------------------------
     NUEVO: Mapeo plano sin nidos
     Todas las actions solo bajo access, nunca access bajo access
     ------------------------- */
  _mapApiToTreeData(accessesArray = []) {
    const treeData = [];

    // Primero: todos los access como nodos
    accessesArray.forEach(access => {
      const accessId = access.accessId ?? access.id;
      const parentId = access.accessFatherId || 0;

      treeData.push({
        id: `access-${accessId}`,
        pid: parentId === 0 ? null : `access-${parentId}`,   // ← ¡Aquí está el cambio clave!
        text: access.description ?? `Access ${accessId}`,
        hasChild: true,  // puede tener actions o hijos
        type: 'access',
        active: !!access.active
      });

      // Actions como hijos directos del access
      const actions = Array.isArray(access.actions) ? access.actions : [];
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

  /* -------------------------
     NUEVO: Manejo de selección
     Sincronización bidireccional
     ------------------------- */
  _handleNodeChecked(args) {
    if (this.isUpdatingTree) return;
    this.isUpdatingTree = true;

    try {
      const nodeId = args.node?.id || args.nodeId;
      if (!nodeId) return;

      if (nodeId.startsWith("access-")) {
        const accessId = parseInt(nodeId.replace("access-", ""), 10);

        // 1. Marcar todas las actions de este access
        this._checkActionsOfAccess(accessId);

        // 2. Marcar todos los descendientes (hijos, nietos, etc.)
        this._checkAllDescendants(accessId);

        // 3. Marcar ascendientes (padres)
        this._checkAccessParents(accessId);
      }
      else if (nodeId.startsWith("action-")) {
        const actionNode = this.treeData.find(n => n.id === nodeId);
        if (actionNode?.pid?.startsWith("access-")) {
          const parentAccessId = parseInt(actionNode.pid.replace("access-", ""), 10);

          // Marcar el access padre
          this._checkNode(`access-${parentAccessId}`);

          // Marcar todos los ascendientes
          this._checkAccessParents(parentAccessId);
        }
      }

      this.treeObj.dataBind();
    } finally {
      this.isUpdatingTree = false;
    }
  }

  _checkAllDescendants(accessId) {
    // Marcar este access (por si acaso)
    this._checkNode(`access-${accessId}`);

    // Marcar sus actions
    this._checkActionsOfAccess(accessId);

    // Marcar hijos recursivamente
    const children = this.accessChildrenMap.get(accessId) || [];
    children.forEach(childId => {
      this._checkNode(`access-${childId}`);
      this._checkAllDescendants(childId);
    });
  }

  _uncheckAllDescendants(accessId) {
    this._uncheckActionsOfAccess(accessId);

    const children = this.accessChildrenMap.get(accessId) || [];
    children.forEach(childId => {
      this._uncheckNode(`access-${childId}`);
      this._uncheckAllDescendants(childId);
    });
  }

  _handleNodeUnchecked(args) {
    if (this.isUpdatingTree) return;
    this.isUpdatingTree = true;

    try {
      const nodeId = args.node?.id || args.nodeId;
      if (!nodeId) return;

      if (nodeId.startsWith("access-")) {
        const accessId = parseInt(nodeId.replace("access-", ""), 10);

        // 1. Desmarcar todas las actions de este access
        this._uncheckActionsOfAccess(accessId);

        // 2. Desmarcar todos los descendientes
        this._uncheckAllDescendants(accessId);

        // 3. Desmarcar ascendientes SOLO si ya no tienen nada marcado
        this._uncheckAccessParentsIfNeeded(accessId);
      }
      else if (nodeId.startsWith("action-")) {
        const actionNode = this.treeData.find(n => n.id === nodeId);
        if (actionNode?.pid?.startsWith("access-")) {
          const parentAccessId = parseInt(actionNode.pid.replace("access-", ""), 10);

          // Verificar si el access padre ya no tiene ninguna action marcada
          this._uncheckAccessIfNoActionsChecked(parentAccessId);
        }
      }

      this.treeObj.dataBind();
    } finally {
      this.isUpdatingTree = false;
    }
  }

  /* -------------------------
     Sincronización Descendente (Access → Hijos)
     ------------------------- */
  _checkAccessChildren(parentAccessId) {
    const children = this.accessChildrenMap.get(parentAccessId) || [];

    children.forEach(childAccessId => {
      // Marcar el access hijo
      this._checkNode(`access-${childAccessId}`);

      // Marcar todas sus acciones
      this._checkActionsOfAccess(childAccessId);

      // Recursivamente marcar sus hijos
      this._checkAccessChildren(childAccessId);
    });
  }

  _uncheckAccessChildren(parentAccessId) {
    const children = this.accessChildrenMap.get(parentAccessId) || [];

    children.forEach(childAccessId => {
      // Desmarcar el access hijo
      this._uncheckNode(`access-${childAccessId}`);

      // Desmarcar todas sus acciones
      this._uncheckActionsOfAccess(childAccessId);

      // Recursivamente desmarcar sus hijos
      this._uncheckAccessChildren(childAccessId);
    });
  }

  /* -------------------------
     Sincronización Ascendente (Access → Padres)
     ------------------------- */
  _checkAccessParents(childAccessId) {
    const parentAccessId = this.accessParentMap.get(childAccessId);

    if (!parentAccessId || parentAccessId === 0) return;

    // Marcar el padre
    this._checkNode(`access-${parentAccessId}`);

    // Recursivamente marcar los padres del padre
    this._checkAccessParents(parentAccessId);
  }

  _uncheckAccessParentsIfNeeded(childAccessId) {
    const parentAccessId = this.accessParentMap.get(childAccessId);

    if (!parentAccessId || parentAccessId === 0) return;

    // Verificar si el padre tiene OTROS hijos marcados
    const siblings = this.accessChildrenMap.get(parentAccessId) || [];
    const hasOtherCheckedSiblings = siblings.some(siblingId =>
      siblingId !== childAccessId && this._isNodeChecked(`access-${siblingId}`)
    );

    if (!hasOtherCheckedSiblings) {
      // Desmarcar el padre solo si no tiene otros hijos marcados
      this._uncheckNode(`access-${parentAccessId}`);

      // Recursivamente desmarcar los padres del padre
      this._uncheckAccessParentsIfNeeded(parentAccessId);
    }
  }

  /* -------------------------
     Sincronización Actions ↔ Access
     ------------------------- */
  _checkActionsOfAccess(accessId) {
    const actionIds = this.accessActionsMap.get(accessId) || [];
    actionIds.forEach(actionId => {
      this._checkNode(`action-${actionId}`);
    });
  }

  _uncheckActionsOfAccess(accessId) {
    const actionIds = this.accessActionsMap.get(accessId) || [];
    actionIds.forEach(actionId => {
      this._uncheckNode(`action-${actionId}`);
    });
  }

  _uncheckAccessIfNoActionsChecked(accessId) {
    const actionIds = this.accessActionsMap.get(accessId) || [];
    const hasCheckedActions = actionIds.some(actionId =>
      this._isNodeChecked(`action-${actionId}`)
    );

    if (!hasCheckedActions) {
      this._uncheckNode(`access-${accessId}`);

      // Recursivamente deseleccionar el padre del access
      this._uncheckAccessParentsIfNeeded(accessId);
    }
  }

  /* -------------------------
     Utilidades de nodos
     ------------------------- */
  _checkNode(nodeId) {
    if (!this.treeObj) return;
    const checkedNodes = this.treeObj.checkedNodes || [];
    if (!checkedNodes.includes(nodeId)) {
      checkedNodes.push(nodeId);
      this.treeObj.checkedNodes = checkedNodes;
    }
  }

  _uncheckNode(nodeId) {
    if (!this.treeObj) return;
    const checkedNodes = this.treeObj.checkedNodes || [];
    const index = checkedNodes.indexOf(nodeId);
    if (index > -1) {
      checkedNodes.splice(index, 1);
      this.treeObj.checkedNodes = checkedNodes;
    }
  }

  _isNodeChecked(nodeId) {
    if (!this.treeObj) return false;
    const checkedNodes = this.treeObj.checkedNodes || [];
    return checkedNodes.includes(nodeId);
  }

  /* -------------------------
     Carga datos del rol
     MEJORADO para soportar jerarquía
     ------------------------- */
  async _loadRolData() {
    try {
      this.helper.ToastInfo("Cargando datos del rol...");
      const response = await this.rolAccessService.getByRol(this.rolId);
      const data = this._unwrapResponse(response);

      const rolPayload = data;

      if (!rolPayload || !Array.isArray(rolPayload) || rolPayload.length === 0)
        throw new Error("Respuesta inválida del endpoint de rol.");

      document.querySelector(this.elementos.nombreRolInput).value =
        rolPayload[0].rolDescription ?? "";

      const accessMap = new Map();
      rolPayload.forEach((item) => {
        const accessList = item.accessList || [];
        accessList.forEach((acc) => {
          const accessId = acc.accessId;
          if (!accessMap.has(accessId)) {
            accessMap.set(accessId, {
              ...acc,
              actions: [...(acc.actions || [])],
            });
          } else {
            const existing = accessMap.get(accessId);
            const newActions = acc.actions || [];
            newActions.forEach((newAct) => {
              if (
                !existing.actions.some((e) => e.actionId === newAct.actionId)
              ) {
                existing.actions.push(newAct);
              }
            });
            existing.active = existing.active || acc.active;
          }
        });
      });

      const accessList = Array.from(accessMap.values());
      const checkedNodeIds = [];

      // Cargar permisos
      accessList.forEach(acc => {
        if (acc.accessId) {
          if (acc.active) {
            checkedNodeIds.push(`access-${acc.accessId}`);
          }
          if (Array.isArray(acc.actions)) {
            acc.actions.forEach((act) => {
              const aId = act.actionId ?? act.id;
              if (aId && act.active) {
                checkedNodeIds.push(`action-${aId}`);
              }
            });
          }
        }
      });

      if (this.treeObj) {
        this.isUpdatingTree = true;
        this.treeObj.checkedNodes = checkedNodeIds;
        this.treeObj.dataBind();
        this.isUpdatingTree = false;
      }

      this.existingPermissions = accessList.map((acc) => ({
        accessId: acc.accessId,
        active: acc.active,
        actions: acc.actions ? acc.actions.map((act) => act.actionId) : [],
      }));
    } catch (error) {
      this.helper.handleApiError(error);
      document.querySelector(this.elementos.saveButton).disabled = true;
    }
  }

  _setupEventListeners() {
    document
      .querySelector(this.elementos.saveButton)
      ?.addEventListener("click", (e) => {
        e.preventDefault();
        this._handleSave();
      });

    document
      .querySelector(this.elementos.backButton)
      ?.addEventListener("click", () => window.history.back());
  }

  async _handleSave() {
    if (this.isProcessing) return;

    this._clearValidationErrors();
    if (!this._validateForm()) {
      this.helper.ToastWarning("Por favor, corrige los errores marcados.");
      return;
    }

    this._toggleProcessingState(true);

    const userId = this.userId;

    try {
      const rolePayload = this._getRolePayload();

      let roleResp = null;
      if (this.mode === "edit") {
        if (this.rolId) {
          await this._eliminarTodosAccesosRol(this.rolId);
        }

        roleResp = await (this.service.updateRole
          ? this.service.updateRole(this.rolId, rolePayload).catch(() => null)
          : this.service.update(rolePayload).catch(() => null));
      } else {
        roleResp = await this.service.create(rolePayload);
      }

      const roleData = this._unwrapResponse(roleResp);
      const createdRoleId =
        roleData?.roleId ?? roleData?.id ?? roleData?.rolId ?? this.rolId;

      if (!createdRoleId) {
        if (!this.rolId)
          throw new Error("No se obtuvo roleId tras crear/actualizar el rol.");
      } else {
        this.rolId = createdRoleId;
      }

      const permissionsPayload = this._getPermissionsPayload();

      await this._saveRolePermissionsDetailed(permissionsPayload, userId);

      this.helper.MessageSucces("¡Rol y permisos guardados correctamente!");
      setTimeout(() => {
        window.location.href = "apps/configuraciones/roles/roles.php";
      }, 1500);
    } catch (err) {
      console.error(err);
      this.helper.handleApiError(err);
    } finally {
      this._toggleProcessingState(false);
    }
  }

  async _eliminarTodosAccesosRol(rolId) {
    try {
      await this._eliminarRolAccessActions(rolId);
      await this.rolAccessService.delete(rolId);
    } catch (error) {
      console.error("Error al eliminar accesos antiguos:", error);
    }
  }

  async _eliminarRolAccessActions(rolId) {
    try {
      const response = await this.rolAccessActionService.Delete(rolId);
      if (response && response.statusResult === true) {
        // Success
      } else {
        console.warn(`No se pudo eliminar RolAccessAction para rol ${rolId}`, response);
      }
    } catch (error) {
      console.error(`Error al eliminar RolAccessAction para rol ${rolId}:`, error);
    }
  }

  async _upsertRolAccessEntries(accesses) {
    if (!this.rolId) throw new Error("No roleId para upsert RolAccess.");
    const results = [];
    const BATCH = 10;

    for (let i = 0; i < accesses.length; i += BATCH) {
      const batch = accesses.slice(i, i + BATCH);
      const promises = batch.map(async (acc) => {
        try {
          const existingResp = await this.rolAccessService.getByRolAccess(
            this.rolId,
            acc.accessId
          );
          const existing = this._unwrapResponse(existingResp);

          let r;
          if (existing && existing.id) {
            const body = {
              ...existing,
              active: acc.active === undefined ? true : !!acc.active,
            };
            r = await this.rolAccessService.update(body);
          } else {
            const body = {
              id: 0,
              rolId: parseInt(this.rolId, 10),
              accessId: acc.accessId,
              active: acc.active === undefined ? true : !!acc.active,
            };
            r = await this.rolAccessService.create(body);
          }

          const data = this._unwrapResponse(r);
          const rolAccessId = data?.id ?? data?.Id ?? null;
          return { accessId: acc.accessId, rolAccessId, success: true, raw: r };
        } catch (err) {
          return {
            accessId: acc.accessId,
            rolAccessId: null,
            success: false,
            error: err,
          };
        }
      });

      const settled = await Promise.all(promises);
      results.push(...settled);
    }

    return results;
  }

  _getRolePayload() {
    const description = document
      .querySelector(this.elementos.nombreRolInput)
      .value.trim();

    const payload = {
      roleId: this.mode === "edit" ? parseInt(this.rolId, 10) : 0,
      applicationId: 4,
      description,
      active: true,
    };
    return payload;
  }

  _getPermissionsPayload() {
    const checkedNodeIds =
      this.treeObj && typeof this.treeObj.getCheckedNodes === "function"
        ? this.treeObj.getCheckedNodes()
        : (this.treeObj && this.treeObj.checkedNodes) || [];

    const accessMap = {};

    checkedNodeIds.forEach((nodeId) => {
      if (!nodeId) return;

      if (nodeId.startsWith("access-")) {
        const accessId = parseInt(nodeId.replace("access-", ""), 10);
        if (!accessMap[nodeId]) {
          accessMap[nodeId] = { accessId, active: true, actions: [] };
        } else {
          accessMap[nodeId].active = true;
        }
      }

      if (nodeId.startsWith("action-")) {
        const actionId = parseInt(nodeId.replace("action-", ""), 10);

        // Encontrar el acceso padre de esta acción
        const actionNode = this.treeData.find(n => n.id === nodeId);
        if (actionNode && actionNode.pid && actionNode.pid.startsWith("access-")) {
          const parentAccessId = parseInt(actionNode.pid.replace("access-", ""), 10);
          const parentNodeKey = `access-${parentAccessId}`;

          if (!accessMap[parentNodeKey]) {
            accessMap[parentNodeKey] = {
              accessId: parentAccessId,
              active: true,
              actions: [],
            };
          }

          if (
            !accessMap[parentNodeKey].actions.some((act) => act.actionId === actionId)
          ) {
            accessMap[parentNodeKey].actions.push({ actionId, active: true });
          }
        }
      }
    });

    // Asegurar que si hay acciones, el access está activo
    Object.values(accessMap).forEach((acc) => {
      if (acc.actions.length > 0) acc.active = true;
    });

    return Object.values(accessMap);
  }

  async _saveRolePermissionsDetailed(accessEntries, userId) {
    if (!this.rolId)
      throw new Error("No roleId disponible para guardar permisos.");

    this.helper.ToastInfo("Guardando relaciones RolAccess y acciones...");

    const upsertResults = await this._upsertRolAccessEntries(accessEntries);
    const failedUpserts = upsertResults.filter((r) => !r.success);
    if (failedUpserts.length) {
      console.warn("Algunos RolAccess no se upsertaron:", failedUpserts);
      this.helper.ToastWarning(
        "Algunos accesos no pudieron guardarse; continuando con los demás."
      );
    }

    const updateResults = [];
    for (const acc of accessEntries) {
      try {
        const res = await this._replaceActionsForRolAccess(
          acc.accessId,
          acc.actions || [],
          userId
        );
        updateResults.push(res);
      } catch (err) {
        updateResults.push({ accessId: acc.accessId, error: err });
      }
    }

    const failedUpdates = updateResults.filter(
      (r) => r.failed && r.failed.length
    );
    if (failedUpdates.length) {
      console.warn(
        "Fallaron algunas actualizaciones de acciones:",
        failedUpdates
      );
      this.helper.ToastWarning(
        "Ocurrieron errores actualizando algunas acciones. Revisa la consola para más detalles."
      );
    } else {
      this.helper.MessageSucces(
        "Acciones actualizadas correctamente por access."
      );
    }

    return { upsertResults, updateResults };
  }

  async _ensureRolAccessEntries(accesses) {
    if (!this.rolId) throw new Error("No roleId para asegurar RolAccess.");
    const results = [];
    const BATCH = 10;

    for (let i = 0; i < accesses.length; i += BATCH) {
      const batch = accesses.slice(i, i + BATCH);

      const promises = batch.map(async (acc) => {
        if (!acc.active) {
          return {
            accessId: acc.accessId,
            rolAccessId: null,
            success: false,
            skipped: true,
            message: "Acceso inactivo, no se envió petición",
          };
        }

        const body = {
          id: 0,
          rolId: parseInt(this.rolId),
          accessId: acc.accessId,
          active: acc.active,
          CountryCode: "HN",
        };

        try {
          const r = await this.rolAccessService.create(body);
          const data = this._unwrapResponse(r);
          const rolAccessId = data?.id ?? data?.Id ?? null;
          return { accessId: acc.accessId, rolAccessId, success: true, raw: r };
        } catch (err) {
          return {
            accessId: acc.accessId,
            rolAccessId: null,
            success: false,
            error: err,
          };
        }
      });

      const settled = await Promise.all(promises);
      results.push(...settled);
    }

    return results;
  }

  async _replaceActionsForRolAccess(accessId, actionsArray, userId) {
    const result = { accessId, created: [], failed: [] };

    const actionIds = (actionsArray || [])
      .map((a) => (typeof a === "number" ? a : a.actionId ?? a.id ?? null))
      .filter(Boolean);

    if (actionIds.length === 0) {
      return result;
    }

    try {
      const resp = await this.rolAccessActionService.replaceActions(
        parseInt(this.rolId),
        accessId,
        actionIds,
        userId,
      );

      if (resp && resp.statusResult === true) {
        actionIds.forEach((aId) =>
          result.created.push({ actionId: aId, ok: true, resp })
        );
      } else {
        const errorMessage = resp?.messageResult || "Error en ReplaceActions";
        throw new Error(errorMessage);
      }
    } catch (err) {
      console.error(
        `Error reemplazando acciones para access ${accessId}:`,
        err
      );
      actionIds.forEach((aId) =>
        result.failed.push({ actionId: aId, ok: false, err })
      );
    }

    return result;
  }

  _validateForm() {
    let isValid = true;
    const nombreRol = document
      .querySelector(this.elementos.nombreRolInput)
      .value.trim();
    if (nombreRol === "") {
      this._showValidationError(
        this.elementos.nombreRolInput,
        "El nombre del rol es obligatorio."
      );
      isValid = false;
    }

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
  const rolForm = new RolForm();
  rolForm.init();
});
