export class ReportService {
    constructor() {
        // En lugar de apuntar directamente a C#, apuntamos a nuestro PHP local.
        // Asumimos que el front se ejecuta desde /Corporativo/GSO/...
        const basePath = window.location.pathname.substring(0, window.location.pathname.indexOf('/GSO/') + 5);
        
        this.api = axios.create({
            baseURL: `${basePath}apps/Creditos/api/`,
            headers: {
                "Content-Type": "application/json"
            }
        });
    }

    async getAccessIdByName(name) {
        try {
            
            if (!window.permissionHelper) {
                console.error("permissionHelper no está disponible.");
                return null;
            }

            const permissions = await window.permissionHelper.loadPermissions();
            

            if (permissions && Array.isArray(permissions.allAccesses)) {
                // Función recursiva para buscar el acceso en cualquier nivel del árbol
                const findAccessRecursively = (accessList, targetName) => {
                    for (const access of accessList) {
                        if (access.description && access.description.trim().toLowerCase() === targetName.trim().toLowerCase()) {
                            return access;
                        }
                        if (access.children && Array.isArray(access.children)) {
                            const found = findAccessRecursively(access.children, targetName);
                            if (found) return found;
                        }
                    }
                    return null;
                };

                const access = findAccessRecursively(permissions.allAccesses, name);
                
                // Extraer el accessId, que el backend usualmente expone en esta misma colección
                return access ? access.accessId : null;
            } else {
                console.error("No se pudo cargar la colección de accesos correctamente.", permissions);
                return null;
            }
        } catch (error) {
            console.error("Error al obtener Access ID vía permissionHelper:", error);
            throw error;
        }
    }

    /**
     * Obtiene la lista de reportes asociados a un accessId llamando al endpoint PHP
     * @param {number} accessId
     */
    async getReportsByAccessId(accessId) {
        try {
            // Llamamos a nuestro endpoint PHP pasándole el Action por parámetros y el ID por POST (body)
            const response = await this.api.post("creditos-endpoints.php", { accessId: accessId }, {
                params: { action: 'getReportsByAccessId' }
            });
            return response.data; // Mantenemos .data y de allí la vista saca el statusResult y dataResult
        } catch (error) {
            console.error("Error al obtener reportes del API:", error);
            throw error;
        }
    }
}
