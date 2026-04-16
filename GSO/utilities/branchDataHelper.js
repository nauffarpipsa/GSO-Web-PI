/**
 * Helper para cargar datos de sucursales y ubicaciones en comboboxes
 * 
 * Especificación:
 * - Sede: Mostrar branch_description, valor branch_code
 * - Impresoras/Locations: Mostrar description, valor path
 */
class BranchDataHelper {
    
    /**
     * Cargar todas las sucursales en un combobox (para Sede)
     * @param {string} selectId - ID del elemento select
     * @param {string} placeholder - Texto placeholder
     */
    static async loadBranches(selectId, placeholder = 'Seleccione una sede') {
        try {
            const response = await fetch('utilities/getBranchData.php?type=branchs');
            const data = await response.json();
            
            if (data.success && data.data.branchs) {
                const select = document.getElementById(selectId);
                if (select) {
                    // Limpiar opciones existentes
                    select.innerHTML = '';
                    
                    // Agregar opción placeholder
                    const placeholderOption = document.createElement('option');
                    placeholderOption.value = '';
                    placeholderOption.textContent = placeholder;
                    placeholderOption.disabled = true;
                    placeholderOption.selected = true;
                    select.appendChild(placeholderOption);
                    
                    // Agregar opciones de sucursales
                    data.data.branchs.forEach(branch => {
                        const option = document.createElement('option');
                        option.value = branch.value;        // branch_code
                        option.textContent = branch.text;   // branch_description
                        select.appendChild(option);
                    });
                }
            }
        } catch (error) {
            console.error('Error al cargar sucursales:', error);
        }
    }
    
    /**
     * Cargar ubicaciones de una sucursal específica (para Impresoras)
     * @param {string} selectId - ID del elemento select
     * @param {string} branchCode - Código de la sucursal
     * @param {string} placeholder - Texto placeholder
     */
    static async loadLocationsByBranch(selectId, branchCode, placeholder = 'Seleccione una impresora') {
        try {
            const response = await fetch(`utilities/getBranchData.php?type=branch_locations&branch_code=${branchCode}`);
            const data = await response.json();
            
            if (data.success && data.data.locations) {
                const select = document.getElementById(selectId);
                if (select) {
                    // Limpiar opciones existentes
                    select.innerHTML = '';
                    
                    // Agregar opción placeholder
                    const placeholderOption = document.createElement('option');
                    placeholderOption.value = '';
                    placeholderOption.textContent = placeholder;
                    placeholderOption.disabled = true;
                    placeholderOption.selected = true;
                    select.appendChild(placeholderOption);
                    
                    // Agregar opciones de ubicaciones
                    data.data.locations.forEach(location => {
                        const option = document.createElement('option');
                        option.value = location.value;      // path
                        option.textContent = location.text; // description
                        select.appendChild(option);
                    });
                }
            }
        } catch (error) {
            console.error('Error al cargar ubicaciones:', error);
        }
    }
    
    /**
     * Cargar todas las ubicaciones disponibles (para Impresoras)
     * @param {string} selectId - ID del elemento select
     * @param {string} placeholder - Texto placeholder
     */
    static async loadAllLocations(selectId, placeholder = 'Seleccione una impresora') {
        try {
            const response = await fetch('utilities/getBranchData.php?type=locations');
            const data = await response.json();
            
            if (data.success && data.data.locations) {
                const select = document.getElementById(selectId);
                if (select) {
                    // Limpiar opciones existentes
                    select.innerHTML = '';
                    
                    // Agregar opción placeholder
                    const placeholderOption = document.createElement('option');
                    placeholderOption.value = '';
                    placeholderOption.textContent = placeholder;
                    placeholderOption.disabled = true;
                    placeholderOption.selected = true;
                    select.appendChild(placeholderOption);
                    
                    // Agregar opciones de ubicaciones
                    data.data.locations.forEach(location => {
                        const option = document.createElement('option');
                        option.value = location.value;      // path
                        option.textContent = location.text; // description
                        select.appendChild(option);
                    });
                }
            }
        } catch (error) {
            console.error('Error al cargar ubicaciones:', error);
        }
    }
    
    /**
     * Configurar dependencia entre combobox de sucursales y ubicaciones
     * @param {string} branchSelectId - ID del select de sucursales (Sede)
     * @param {string} locationSelectId - ID del select de ubicaciones (Impresoras)
     */
    static setupBranchLocationDependency(branchSelectId, locationSelectId) {
        const branchSelect = document.getElementById(branchSelectId);
        const locationSelect = document.getElementById(locationSelectId);
        
        if (branchSelect && locationSelect) {
            branchSelect.addEventListener('change', function() {
                const selectedBranchCode = this.value;
                
                if (selectedBranchCode) {
                    // Cargar ubicaciones de la sucursal seleccionada
                    BranchDataHelper.loadLocationsByBranch(locationSelectId, selectedBranchCode);
                } else {
                    // Limpiar ubicaciones si no hay sucursal seleccionada
                    locationSelect.innerHTML = '';
                    const placeholderOption = document.createElement('option');
                    placeholderOption.value = '';
                    placeholderOption.textContent = 'Seleccione una impresora';
                    placeholderOption.disabled = true;
                    placeholderOption.selected = true;
                    locationSelect.appendChild(placeholderOption);
                }
            });
        }
    }
    
    /**
     * Obtener datos de sucursales y ubicaciones como objeto
     * @returns {Promise<Object>} Datos de sucursales y ubicaciones
     */
    static async getBranchData() {
        try {
            const response = await fetch('utilities/getBranchData.php?type=all');
            const data = await response.json();
            return data.success ? data.data : null;
        } catch (error) {
            console.error('Error al obtener datos de sucursales:', error);
            return null;
        }
    }
    
    /**
     * Obtener el valor seleccionado de un combobox
     * @param {string} selectId - ID del elemento select
     * @returns {string} Valor seleccionado o cadena vacía
     */
    static getSelectedValue(selectId) {
        const select = document.getElementById(selectId);
        return select ? select.value : '';
    }
    
    /**
     * Obtener el texto seleccionado de un combobox
     * @param {string} selectId - ID del elemento select
     * @returns {string} Texto seleccionado o cadena vacía
     */
    static getSelectedText(selectId) {
        const select = document.getElementById(selectId);
        return select ? select.options[select.selectedIndex].text : '';
    }
}

// Ejemplo de uso:
/*
// Cargar sucursales en combobox de Sede
BranchDataHelper.loadBranches('sede-select', 'Seleccione una sede');

// Cargar ubicaciones de una sucursal específica en combobox de Impresoras
BranchDataHelper.loadLocationsByBranch('impresora-select', '1015500', 'Seleccione una impresora');

// Configurar dependencia entre comboboxes
BranchDataHelper.setupBranchLocationDependency('sede-select', 'impresora-select');

// Obtener valores seleccionados
const sedeSeleccionada = BranchDataHelper.getSelectedValue('sede-select');     // branch_code
const impresoraSeleccionada = BranchDataHelper.getSelectedValue('impresora-select'); // path

// Obtener textos seleccionados
const sedeTexto = BranchDataHelper.getSelectedText('sede-select');           // branch_description
const impresoraTexto = BranchDataHelper.getSelectedText('impresora-select'); // description
*/ 