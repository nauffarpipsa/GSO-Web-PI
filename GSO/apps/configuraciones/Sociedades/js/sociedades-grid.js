import { Helper } from "../../helper/helper.js";
import { SociedadService } from "../api/sociedadesService.js";

class SociedadesGrid {
  constructor() {
    this.service = new SociedadService();
    this.helper = new Helper();
    this.grid = null;

    this.elementos = {
      gridContainer: "#sociedadesGrid",
      searchInput: "#companySearch",
      addButton: "#btnNewCompany",
    };

    this.urls = {
      create: "apps/configuraciones/sociedades/sociedades-crear.php",
      edit: (id) =>
        `apps/configuraciones/sociedades/sociedades-crear.php?id=${id}`,
    };

    this.searchTimeout = null;
  }

  async init() {
    this._createGrid();
    this._validateCreatePermission();
    this._setupEventListeners();
    await this._loadData();
  }

  async _validateCreatePermission() {
    const ACCESS_NAME = 'Sociedades';
    const CREATE_ACTION_ID = 1;

    if (window.permissionHelper) {
      await window.permissionHelper.toggleElementByPermission(
        this.elementos.addButton,
        ACCESS_NAME,
        CREATE_ACTION_ID
      );
    }
  }

  async _loadData() {
    try {
      const ACCESS_NAME = 'Sociedades';
      const EDIT_ACTION_ID = 2;

      if (!window.permissionHelper) {
        console.error("PermissionHelper no está disponible.");
        if (this.grid) this.grid.hideColumns("Acciones");
        const response = await this.service.getAll();
        if(this.grid) this.grid.dataSource = response.dataResult || [];
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

  _createGrid() {
    if (typeof ej === "undefined" || !ej.grids) {
      this.helper.ToastDanger("No se pudo cargar el componente de la tabla.");
      return;
    }

    const gridConfig = {
      dataSource: [],
      columns: this._getColumns(),
      allowPaging: true,
      allowSorting: true,
      pageSettings: { pageSize: 10, pageSizes: [10, 20, 50] },
      locale: "es-ES",
      height: "100%",
      width: "100%",
      recordDoubleClick: (args) => {
        if (args.data.canEdit) {
            this._navegarAEdicion(args.data.companyId);
        }
      },
    };

    this.grid = new ej.grids.Grid(gridConfig);
    this.grid.appendTo(this.elementos.gridContainer);
  }

  _getColumns() {
    return [
      {
        field: "companyId",
        headerText: "# Sociedad",
        width: 120,
        isPrimaryKey: true,
      },
      { field: "legalName", headerText: "Nombre Legal", width: 250 },
      { field: "managerName", headerText: "Encargado", width: 200 },
      { field: "countryName", headerText: "País", width: 150 },
      { field: "taxId", headerText: "RTN", width: 150 },
      { field: "email", headerText: "Correo", width: 200 },
      {
        headerText: "Acciones",
        width: 120,
        textAlign: "Center",
        template: this._getAccionesTemplate.bind(this),
        allowSorting: false,
      },
    ];
  }

  _getAccionesTemplate(data) {
    let html = '';

    if (data.canEdit) {
      html += `
        <button class="e-btn e-flat e-primary e-small btn-editar" data-id="${data.companyId}" title="Editar Sociedad">
          <i class="e-icons e-edit"></i>
        </button>
      `;
    }
    
    return html;
  }

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

  _navegarACrear() {
    window.location.href = this.urls.create;
  }

  _navegarAEdicion(id) {
    if (!id) return;
    window.location.href = this.urls.edit(id);
  }
}

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

document.addEventListener("DOMContentLoaded", () => {
  try {
    new ThemeManager();
    const sociedadesPage = new SociedadesGrid();
    sociedadesPage.init();
  } catch (error) {
    console.error("Error fatal al inicializar la página de Sociedades:", error);
  }
});