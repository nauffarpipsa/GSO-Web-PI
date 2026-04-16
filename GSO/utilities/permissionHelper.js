/**
 * PermissionHelper.js - Helper para verificar permisos desde JavaScript
 * Permite verificar acciones de usuarios en el lado del cliente
 */

class PermissionHelper {
    constructor() {
        this.permissions = null;
        this.loading = false;
    }

    /**
     * Cargar permisos desde el servidor
     * @returns {Promise<Object>} Promesa que se resuelve con los permisos normalizados
     */
    async loadPermissions() {
        if (this.loading) {
            return this.waitForLoad();
        }

        if (this.permissions !== null) {
            return this.permissions;
        }

        this.loading = true;

        try {
            const response = await fetch('/Corporativo/GSO/utilities/getPermissions.php', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                },
                credentials: 'same-origin'
            });

            if (!response.ok) {
                throw new Error('Error al cargar permisos');
            }

            const data = await response.json();
            this.normalizePermissions(data);
            this.permissions = data;
            this.loading = false;
            return this.permissions;
        } catch (error) {
            this.loading = false;
            throw error;
        }
    }

    /**
     * Normaliza la estructura de permisos recibida del servidor.
     * @param {Object} data
     */
    normalizePermissions(data) {
        if (!data || typeof data !== 'object') {
            this.permissions = { success: false, authenticated: false };
            return;
        }

        if (!Array.isArray(data.allAccesses)) {
            data.allAccesses = [];
        }

        if (!data.accessActions || typeof data.accessActions !== 'object') {
            data.accessActions = {};
            return;
        }

        Object.keys(data.accessActions).forEach(accessName => {
            data.accessActions[accessName] = this.normalizeAccessEntry(data.accessActions[accessName]);
        });
    }

    /**
     * Normaliza una entrada de acciones por acceso.
     * @param {Object|Array} access
     * @returns {{byId: Object, byKey: Object, actions: Array}}
     */
    normalizeAccessEntry(access) {
        const normalized = {
            byId: {},
            byKey: {},
            actions: []
        };

        if (!access) {
            return normalized;
        }

        let rawActions = [];

        if (Array.isArray(access)) {
            rawActions = access;
        } else {
            if (Array.isArray(access.actions)) {
                rawActions = access.actions;
            } else if (access.actions && typeof access.actions === 'object') {
                rawActions = Object.values(access.actions);
            } else if (access.byId && typeof access.byId === 'object') {
                rawActions = Object.values(access.byId);
            } else if (access.byKey && typeof access.byKey === 'object') {
                rawActions = Object.values(access.byKey);
            }
        }

        const seenDescriptions = new Map();

        rawActions.forEach(action => {
            if (!action || typeof action !== 'object') {
                return;
            }

            const entry = {
                actionId: action.actionId != null ? action.actionId : null,
                description: action.description ?? '',
                active: action.active === true
            };

            const idKey = entry.actionId != null ? String(entry.actionId) : null;
            const descKey = entry.description ? this.normalizeActionKey(entry.description) : null;

            if (descKey && seenDescriptions.has(descKey)) {
                const existing = seenDescriptions.get(descKey);
                existing.active = existing.active || entry.active;
                if (existing.actionId == null && entry.actionId != null) {
                    existing.actionId = entry.actionId;
                }
                if (idKey !== null) {
                    normalized.byId[idKey] = existing;
                }
                normalized.byKey[descKey] = existing;
            } else {
                const storedEntry = { ...entry };
                normalized.actions.push(storedEntry);

                if (descKey) {
                    seenDescriptions.set(descKey, storedEntry);
                    normalized.byKey[descKey] = storedEntry;
                }
                if (idKey !== null) {
                    normalized.byId[idKey] = storedEntry;
                }
            }
        });

        return normalized;
    }

    /**
     * Normaliza una cadena de acción.
     * @param {string} name
     * @returns {string}
     */
    normalizeActionKey(name) {
        return name ? name.toString().trim().toLowerCase() : '';
    }

    /**
     * Esperar a que termine de cargar.
     * @returns {Promise<Object|null>}
     */
    async waitForLoad() {
        while (this.loading) {
            await new Promise(resolve => setTimeout(resolve, 100));
        }
        return this.permissions;
    }

    /**
     * Verificar si el usuario tiene un acceso específico.
     * @param {string} accessName
     * @returns {Promise<boolean>}
     */
    async hasAccess(accessName) {
        const permissions = await this.loadPermissions();

        return permissions.allAccesses.some(access =>
            access.description === accessName && access.active === true
        );
    }

    /**
     * Obtiene el objeto de acceso normalizado.
     * @param {string} accessName
     * @returns {Promise<Object|null>}
     */
    async getNormalizedAccess(accessName) {
        const permissions = await this.loadPermissions();

        if (!permissions.accessActions || !permissions.accessActions[accessName]) {
            return null;
        }

        return permissions.accessActions[accessName];
    }

    /**
     * Busca una acción dentro de un acceso.
     * @param {Object} access
     * @param {number|string} actionIdentifier
     * @returns {Object|null}
     */
    findAction(access, actionIdentifier) {
        if (!access) {
            return null;
        }

        if (typeof actionIdentifier === 'number' || (typeof actionIdentifier === 'string' && /^\d+$/.test(actionIdentifier))) {
            const key = String(actionIdentifier);
            if (access.byId && access.byId[key]) {
                return access.byId[key];
            }
        }

        if (typeof actionIdentifier === 'string') {
            const normalized = this.normalizeActionKey(actionIdentifier);
            if (normalized && access.byKey && access.byKey[normalized]) {
                return access.byKey[normalized];
            }
        }

        if (Array.isArray(access.actions)) {
            return access.actions.find(action => {
                if (typeof actionIdentifier === 'string') {
                    return this.normalizeActionKey(action.description) === this.normalizeActionKey(actionIdentifier);
                }
                if (action.actionId != null) {
                    return String(action.actionId) === String(actionIdentifier);
                }
                return false;
            }) ?? null;
        }

        return null;
    }

    /**
     * Verificar si el usuario tiene una acción específica.
     * @param {string} accessName
     * @param {number|string} actionIdentifier
     * @returns {Promise<boolean>}
     */
    async hasAction(accessName, actionIdentifier) {
        const access = await this.getNormalizedAccess(accessName);
        if (!access) {
            return false;
        }

        const action = this.findAction(access, actionIdentifier);
        return !!(action && action.active === true);
    }

    /**
     * Verificar si el usuario tiene una acción por nombre.
     * @param {string} accessName
     * @param {string} actionName
     * @returns {Promise<boolean>}
     */
    async hasActionByName(accessName, actionName) {
        return this.hasAction(accessName, actionName);
    }

    /**
     * Verificar si puede crear (acción "Crear").
     */
    async canCreate(accessName) {
        return this.hasActionByName(accessName, 'Crear');
    }

    /**
     * Verificar si puede editar (acción "Editar").
     */
    async canEdit(accessName) {
        return this.hasActionByName(accessName, 'Editar');
    }

    /**
     * Verificar si puede eliminar (acción "Eliminar").
     */
    async canDelete(accessName) {
        return this.hasActionByName(accessName, 'Eliminar');
    }

     /**
     * Verificar si puede Aprobar (acción "Aprobador").
     */
     async canApprove(accessName) {
        return this.hasActionByName(accessName, 'Aprobar');
    }

     /**
     * Verificar si puede Aplicar Pagos (acción "Aplicar Pagos").
     */
     async canApplyPayments(accessName) {
        return this.hasActionByName(accessName, 'Aplicar Pagos');
    }


    /**
     * Obtener todas las acciones de un acceso.
     * @param {string} accessName
     * @returns {Promise<Array>}
     */
    async getAccessActions(accessName) {
        const access = await this.getNormalizedAccess(accessName);
        return access ? access.actions : [];
    }

    /**
     * Mostrar/ocultar elemento según permisos.
     * @param {string|HTMLElement} element
     * @param {string} accessName
     * @param {number|string} actionIdentifier
     */
    async toggleElementByPermission(element, accessName, actionIdentifier) {
        const hasPermission = await this.hasAction(accessName, actionIdentifier);
        const el = typeof element === 'string' ? document.querySelector(element) : element;

        if (el) {
            el.style.display = hasPermission ? '' : 'none';
        }
    }

    /**
     * Habilitar/deshabilitar elemento según permisos.
     * @param {string|HTMLElement} element
     * @param {string} accessName
     * @param {number|string} actionIdentifier
     */
    async toggleElementDisabled(element, accessName, actionIdentifier) {
        const hasPermission = await this.hasAction(accessName, actionIdentifier);
        const el = typeof element === 'string' ? document.querySelector(element) : element;

        if (el) {
            el.disabled = !hasPermission;
        }
    }

    /**
     * Obtener permisos en cache (después de cargar).
     */
    getPermissions() {
        return this.permissions;
    }
}

// Crear instancia global
window.permissionHelper = new PermissionHelper();


