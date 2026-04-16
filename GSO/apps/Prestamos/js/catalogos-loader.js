/**
 * Cargador de catálogos para el módulo de Préstamos
 * Versión: 1.0.0
 * 
 * Este archivo maneja la carga dinámica de catálogos desde el endpoint único
 */

class CatalogosLoader {
    constructor() {
        this.catalogos = null;
        this.endpoint = 'apps/Prestamos/Maestro_Prestamos/api/prestamos-endpoints.php?action=getCatalogos';
        this.isLoading = false;
    }

    /**
     * Cargar todos los catálogos desde el endpoint
     * @returns {Promise<Object>} Promise con los catálogos
     */
    async cargarCatalogos() {
        if (this.catalogos && !this.isLoading) {
            return this.catalogos;
        }

        if (this.isLoading) {
            // Esperar a que termine la carga actual
            return new Promise((resolve) => {
                const checkLoaded = () => {
                    if (this.catalogos) {
                        resolve(this.catalogos);
                    } else {
                        setTimeout(checkLoaded, 100);
                    }
                };
                checkLoaded();
            });
        }

        this.isLoading = true;

        try {
            const response = await fetch(this.endpoint);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();
            
            if (!data.success) {
                throw new Error(data.message || 'Error en la respuesta del servidor');
            }

            this.catalogos = data.data;
            this.isLoading = false;
            
            return this.catalogos;

        } catch (error) {
            this.isLoading = false;
            console.error('Error al cargar catálogos:', error);
            throw error;
        }
    }

    /**
     * Obtener solo los bancos
     * @returns {Promise<Array>} Promise con array de bancos
     */
    async obtenerBancos() {
        const catalogos = await this.cargarCatalogos();
        return catalogos.bancos || [];
    }

    /**
     * Obtener solo las líneas de crédito
     * @returns {Promise<Array>} Promise con array de líneas de crédito
     */
    async obtenerLineasCredito() {
        const catalogos = await this.cargarCatalogos();
        return catalogos.lineasCredito || [];
    }

    /**
     * Obtener solo los tipos de cuota
     * @returns {Promise<Array>} Promise con array de tipos de cuota
     */
    async obtenerTiposCuota() {
        const catalogos = await this.cargarCatalogos();
        return catalogos.tiposCuota || [];
    }

    /**
     * Obtener solo las condiciones
     * @returns {Promise<Array>} Promise con array de condiciones
     */
    async obtenerCondiciones() {
        const catalogos = await this.cargarCatalogos();
        return catalogos.condiciones || [];
    }

    /**
     * Llenar un select con opciones
     * @param {string} selectId ID del elemento select
     * @param {Array} items Array de elementos
     * @param {string} valueField Campo a usar como valor
     * @param {string} textField Campo a usar como texto
     * @param {string} selectedValue Valor seleccionado por defecto
     */
    llenarSelect(selectId, items, valueField, textField, selectedValue = '') {
        const select = document.getElementById(selectId);
        if (!select) return;

        // Limpiar opciones existentes
        select.innerHTML = '<option value="">Seleccionar...</option>';

        // Agregar nuevas opciones
        items.forEach(item => {
            const option = document.createElement('option');
            option.value = item[valueField];
            option.textContent = item[textField];
            
            if (item[valueField] == selectedValue) {
                option.selected = true;
            }
            
            select.appendChild(option);
        });
    }

    /**
     * Llenar todos los comboboxes de una vez
     * @param {Object} config Configuración de los selects
     */
    async llenarTodosLosComboboxes(config) {
        try {
            const catalogos = await this.cargarCatalogos();
            
            // Llenar cada select según la configuración
            Object.keys(config).forEach(selectId => {
                const { tipo, valueField, textField, selectedValue } = config[selectId];
                const items = catalogos[tipo] || [];
                this.llenarSelect(selectId, items, valueField, textField, selectedValue);
            });

        } catch (error) {
            console.error('Error al llenar comboboxes:', error);
        }
    }

    /**
     * Refrescar catálogos (forzar nueva carga)
     */
    refrescarCatalogos() {
        this.catalogos = null;
        this.isLoading = false;
    }
}

// Instancia global del cargador de catálogos
window.catalogosLoader = new CatalogosLoader();

// Ejemplo de uso:
/*
// Configuración para llenar todos los comboboxes
const configComboboxes = {
    'editBanco': { tipo: 'bancos', valueField: 'bank_id', textField: 'bank_name' },
    'editLineaCredito': { tipo: 'lineasCredito', valueField: 'id', textField: 'line_Description' },
    'editCondicion': { tipo: 'condiciones', valueField: 'id', textField: 'descripcion' },
    'editTipoCuota': { tipo: 'tiposCuota', valueField: 'id', textField: 'description' }
};

// Llenar todos los comboboxes
catalogosLoader.llenarTodosLosComboboxes(configComboboxes);
*/
