import { Helper } from "../../helper/helper.js";
import { RolService } from "../api/rolService.js";

class Roles {
  constructor() {
    this.service = new RolService();
    this.helper = new Helper();
    this.grid = null;

    this.elementos = {
      gridContainer: "#prestamosGrid",
      searchInput: "#rolSearch",
      addButton: "#btnNewBranch",
    };


    this.urls = {
      create: "apps/configuraciones/roles/roles-crear.php",
      edit: `apps/configuraciones/roles/roles-crear.php`,
    };

    this.searchTimeout = null;
  }

  /**
   * Punto de entrada para inicializar el componente.
   */
  async init() {
    this._createGrid();
    this._setupEventListeners();
    await this._loadData();
    this._validateCreatePermission();
  }

  // En tu clase Roles

  async _loadData() {
    try {
      const ACCESS_NAME = 'Roles';
      const EDIT_ACTION_ID = 2;

      if (!window.permissionHelper) {

        if (this.grid) this.grid.hideColumns("Acciones");
        const response = await this.service.getAll();
        if (this.grid) this.grid.dataSource = response.dataResult || [];
        return;
      }

      const userCanEdit = await window.permissionHelper.hasAction(ACCESS_NAME, EDIT_ACTION_ID);
      const userHasAnyAction = userCanEdit;

      if (this.grid) {
        if (userHasAnyAction) {
          this.grid.showColumns("Acciones");
        } else {
          this.grid.hideColumns("Acciones");
        }
      }

      const response = await this.service.getAll();
      let rawData = response.dataResult || [];

      const datosConPermisos = rawData.map(item => ({
        ...item,
        canEdit: userCanEdit,
      }));

      if (this.grid) {
        this.grid.dataSource = datosConPermisos;
      }

    } catch (error) {
      // this.helper.handleApiError(error);
    }
  }

  async _validateCreatePermission() {

    if (!window.permissionHelper) {
      console.warn("PermissionHelper no está disponible. Saltando validación de permisos.");
      return;
    }

    const ACCESS_NAME = 'Roles';
    const CREATE_ACTION_ID = 1;
    const buttonId = this.elementos.addButton;

    await window.permissionHelper.toggleElementByPermission(
      buttonId,
      ACCESS_NAME,
      CREATE_ACTION_ID
    );

  }

  /**
   * Crea e inicializa la instancia de la grilla de Syncfusion.
   * @param {Array} dataSource - Los datos a mostrar en la grilla.
   */
  _createGrid(dataSource) {
    if (typeof ej === "undefined" || !ej.grids) {
      console.error("Librería Syncfusion Grid no está cargada.");
      this.helper.ToastDanger("No se pudo cargar el componente de la tabla.");
      return;
    }

    const gridConfig = {
      dataSource: dataSource,
      columns: this._getColumns(),
      allowPaging: true,
      allowSorting: true,
      allowFiltering: true,
      pageSettings: { pageSize: 10, pageSizes: [10, 20, 50] },
      filterSettings: { type: "Menu" },
      locale: "es-ES",
      height: "100%",
      width: "100%",
      recordDoubleClick: (args) => this._navegarAEdicion(args.data.prestamoId),
    };

    this.grid = new ej.grids.Grid(gridConfig);
    this.grid.appendTo(this.elementos.gridContainer);
  }

  /**
   * Define las columnas para la grilla.
   * @returns {Array} Configuración de las columnas.
   */
  _getColumns() {
    return [
      {
        field: "roleId",
        headerText: "# Id Rol",
        width: 120,
        isPrimaryKey: true,
      },
      { field: "description", headerText: "Rol", width: 220 },
      {
        field: "status",
        headerText: "Estado",
        width: 100,
        textAlign: "Center",
        template: this._estadoTemplate.bind(this),
      },
      {
        headerText: "Acciones",
        width: 120,
        textAlign: "Center",
        template: this._getAccionesTemplate.bind(this),
        allowSorting: false,
        allowFiltering: false,
      },
    ];
  }

  _estadoTemplate(data) {
    const statusText = !data.status ? "Activo" : "Inactivo";
    const statusClass = !data.status ? "success" : "danger";
    return `<span class="badge badge-light-${statusClass}">${statusText}</span>`;
  }

  /**
   * Genera el HTML para los botones de acción usando data-attributes.
   * @param {object} data - Los datos de la fila actual.
   * @returns {string} El HTML del botón.
   */
  _getAccionesTemplate(data) {
    const id = data.roleId;
    let html = '';

    // Mostrar el botón de editar solo si tiene permiso (incluso si la columna está visible)
    if (data.canEdit) {
      html += `
            <button class="e-btn e-flat e-primary e-small btn-editar" data-id="${id}" title="Editar rol">
                <i class="e-icons e-edit"></i>
            </button>
        `;
    }

    // Si no tiene permiso, devuelve una cadena vacía ('')
    return html;
  }

  /**
   * Configura todos los event listeners de la página.
   */
  _setupEventListeners() {
    document
      .querySelector(this.elementos.addButton)
      ?.addEventListener("click", () => this._navegarACrear());

    const searchInput = document.querySelector(this.elementos.searchInput);
    searchInput?.addEventListener("input", (e) => {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.grid.search(e.target.value);
      }, 300);
    });

    const gridContainer = document.querySelector(this.elementos.gridContainer);
    gridContainer?.addEventListener("click", (event) => {
      const editButton = event.target.closest(".btn-editar");
      if (editButton) {
        const id = editButton.dataset.id;
        this._navegarAEdicion(id);
      }
    });
  }

  /**
   * Redirige a la página de creación.
   */
  _navegarACrear() {
    window.location.href = this.urls.create;
  }

  /**
   * Redirige a la página de edición de un préstamo específico.
   * @param {string|number} id - El ID del préstamo a editar.
   */
  _navegarAEdicion(id) {
    if (!id) return;
    window.location.href = `${this.urls.edit}?id=${id}`;
  }
}

// ===================================================================
// GESTOR DE TEMA (Separado de la lógica de la grilla)
// Recomendación: Mover este bloque a un archivo global (ej. app.js)
// ===================================================================
class ThemeManager {
  constructor() {
    this.observe();
  }

  applyTheme() {
    const theme = this.detectTheme();
  }

  detectTheme() {
    const body = document.body;
    const html = document.documentElement;
    return (
      body.getAttribute("data-bs-theme") ||
      body.getAttribute("data-kt-app-theme") ||
      html.getAttribute("data-bs-theme") ||
      html.getAttribute("data-kt-app-theme") ||
      "light"
    );
  }

  observe() {
    const observer = new MutationObserver((mutations) => {
      for (const mutation of mutations) {
        if (
          mutation.type === "attributes" &&
          (mutation.attributeName.includes("data-bs-theme") ||
            mutation.attributeName.includes("data-kt-app-theme"))
        ) {
          this.applyTheme();
          break;
        }
      }
    });

    observer.observe(document.documentElement, {
      attributes: true,
      subtree: true,
    });
  }
}

// ========================================
// INICIALIZACIÓN
// ========================================
document.addEventListener("DOMContentLoaded", () => {
  try {
    new ThemeManager();
    const rolesPage = new Roles();
    rolesPage.init();
  } catch (error) {
    console.error("Error fatal al inicializar la página de roles:", error);
    // Podemos usar el helper aquí también si es necesario para un error global
    const helper = new Helper();
    helper.MessageError("Ocurrió un error crítico al cargar la página.");
  }
});
const helper = new PermissionHelper();
window.permissionHelper = helper;

