import { Helper } from "../../helper/helper.js";
import { SedeService } from "../api/sedesService.js";

class SedesGrid {
  constructor() {
    this.service = new SedeService();
    this.helper = new Helper();
    this.grid = null;

    this.elementos = {
      gridContainer: "#sedesGrid",
      searchInput: "#SedeSearch",
      addButton: "#btnNewBranch",
    };

    this.urls = {
      create: "apps/configuraciones/sedes/sedes-crear.php",
      edit: `apps/configuraciones/sedes/sedes-crear.php`,
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
    const ACCESS_NAME = 'Sedes';
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
      const ACCESS_NAME = 'Sedes';
      const EDIT_ACTION_ID = 2;

      if (!window.permissionHelper) {
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
      //  this.helper.handleApiError(error);
    }
  }

  _createGrid() {
    if (typeof ej === "undefined" || !ej.grids) {
      console.error("Librería Syncfusion Grid no está cargada.");
      this.helper.ToastDanger("No se pudo cargar el componente de la tabla.");
      return;
    }

    const gridConfig = {
      dataSource: [],
      columns: this._getColumns(),
      allowPaging: true,
      allowSorting: true,
      allowFiltering: true,
      pageSettings: { pageSize: 10, pageSizes: [10, 20, 50] },
      filterSettings: { type: "Menu" },
      locale: "es-ES",
      height: "100%",
      width: "100%",
      recordDoubleClick: (args) => {
        if(args.data.canEdit) this._navegarAEdicion(args.data.branchId)
      },
    };

    this.grid = new ej.grids.Grid(gridConfig);
    this.grid.appendTo(this.elementos.gridContainer);
  }

  _getColumns() {
    return [
      {
        field: "branchId",
        headerText: "# Sede",
        width: 120,
        isPrimaryKey: true,
      },
      { field: "description", headerText: "Nombre", width: 220 },
      { field: "companyName", headerText: "Sociedad", width: 220 },
      { field: "managerName", headerText: "Encargado", width: 200 },
      { field: "countryName", headerText: "País", width: 150 },
      { field: "departmentName", headerText: "Departamento", width: 150 },
      { field: "municipalityName", headerText: "Municipio", width: 150 },
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

  _getAccionesTemplate(data) {
    let html = '';

    if (data.canEdit) {
      const id = data.branchId;
      html += `
        <button class="e-btn e-flat e-primary e-small btn-editar" data-id="${id}" title="Editar Sede">
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
    window.location.href = `${this.urls.edit}?id=${id}`; 
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
    const sedesPage = new SedesGrid();
    sedesPage.init();
  } catch (error) {
    console.error("Error fatal al inicializar la página de sedes:", error);
    const helper = new Helper();
    helper.MessageError("Ocurrió un error crítico al cargar la página.");
  }
});
const helper = new PermissionHelper();
window.permissionHelper = helper;
