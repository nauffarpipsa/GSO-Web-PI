import { Helper } from "../../helper/helper.js";
import { UsuarioService } from "../api/usuarioService.js";

export class Usuario {
  constructor() {
    this.service = new UsuarioService();
    this.helper = new Helper();
    this.grid = null;

    this.elementos = {
      grid: "#userGrid",
      btnAgregar: "#btnUser",
      searchInput: "#userSearch",
    };

    this.init();
  }

  init() {
    document.addEventListener("DOMContentLoaded", () => {
      const gridElement = document.querySelector(this.elementos.grid);
      if (gridElement) {
        this._createGrid();
        this._validateCreatePermission();
        this._setupEventListeners();
        this._loadData();
      }
    });
  }

  async _validateCreatePermission() {
    const ACCESS_NAME = 'Usuarios';
    const CREATE_ACTION_ID = 1;

    if (window.permissionHelper) {
      await window.permissionHelper.toggleElementByPermission(
        this.elementos.btnAgregar,
        ACCESS_NAME,
        CREATE_ACTION_ID
      );
    }
  }

  _createGrid() {
    const gridConfig = {
      dataSource: [],
      columns: [
        { field: "userId", headerText: "ID", width: 80, textAlign: "Center" },
        {
          field: "buyerCode",
          headerText: "Id Comprador",
          width: 100,
          textAlign: "Center",
        },
        {
          field: "supplierCode",
          headerText: "Id Vendedor",
          width: 100,
          textAlign: "Center",
        },
        {
          field: "firstName", // Mostrar firstName como nombre completo
          headerText: "Nombre Completo",
          width: 250,
          textAlign: "Left",
          template: (data) => {
            const fullName = `${data.firstName || ""} ${data.lastName || ""
              }`.trim();
            return fullName || "Nombre no disponible";
          },
        },
        {
          field: "phone",
          headerText: "Teléfono",
          width: 150,
          textAlign: "Left",
        },
        { field: "email", headerText: "Email", width: 200, textAlign: "Left" },
        {
          field: "status",
          headerText: "Estado",
          width: 120,
          textAlign: "Center",
          template: (data) => this._getEstadoTemplate(data),
        },
        {
          field: "acciones",
          headerText: "Acciones",
          width: 200,
          textAlign: "Center",
          template: this._getAccionesTemplate.bind(this),
        },
      ],
      allowPaging: true,
      allowSorting: true,
      allowFiltering: true,
      pageSettings: { pageSize: 10, pageSizes: [5, 10, 15, 20] },
      filterSettings: { type: "Menu" },
      height: "auto",
    };

    this.grid = new ej.grids.Grid(gridConfig);
    this.grid.appendTo(this.elementos.grid);
  }

  // Template para mostrar estado como etiqueta
  _getEstadoTemplate(data) {
    const statusText = data.status ? "Activo" : "Inactivo";
    const statusClass = data.status ? "success" : "danger";
    return `<span class="badge bg-${statusClass}">${statusText}</span>`;
  }

  async _loadData() {
    try {
      this.grid.showSpinner();

      const ACCESS_NAME = 'Usuarios';
      const EDIT_ACTION_ID = 2; // Para Permisos y Editar
      const DELETE_ACTION_ID = 3; // Para Cambiar Estado

      if (!window.permissionHelper) {
        console.error("PermissionHelper no está disponible.");
        if (this.grid) this.grid.hideColumns("Acciones");
        const response = await this.service.getAll();
        if (this.grid) this.grid.dataSource = response.dataResult || [];
        return;
      }

      const userCanEdit = await window.permissionHelper.hasAction(ACCESS_NAME, EDIT_ACTION_ID);
      const userCanDelete = await window.permissionHelper.hasAction(ACCESS_NAME, DELETE_ACTION_ID);
      const userHasAnyAction = userCanEdit || userCanDelete;

      if (this.grid) {
        if (userHasAnyAction) {
          this.grid.showColumns("Acciones");
        } else {
          this.grid.hideColumns("Acciones");
        }
      }

      const response = await this.service.getAll();
      const rawData = response.dataResult || [];

      const datosConPermisos = rawData.map(item => ({
        ...item,
        canEdit: userCanEdit,
        canDelete: userCanDelete
      }));

      if (this.grid) this.grid.dataSource = datosConPermisos;

    } catch (error) {
      console.error("Error al cargar usuarios:", error);
      // this.helper.MessageError("Error al cargar la lista de usuarios");
    } finally {
      if (this.grid) this.grid.hideSpinner();
    }
  }

  _setupEventListeners() {
    document
      .querySelector(this.elementos.btnAgregar)
      ?.addEventListener("click", () => {
        window.location.href = "apps/configuraciones/users/usuario-crear.php";
      });

    const searchInput = document.querySelector(this.elementos.searchInput);
    searchInput?.addEventListener("input", (e) => {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = setTimeout(() => {
        this.grid.search(e.target.value);
      }, 300);
    });
  }

  _getAccionesTemplate(data) {
    let html = '<div class="d-flex justify-content-center gap-2">';

    if (data.canEdit) {
      html += `
            <button class="btn btn-outline-primary btn-sm" 
                    onclick="usuario.permisos(${data.userId})" 
                    title="Permisos">
              <i class="ki-duotone ki-eye">
                <span class="path1"></span><span class="path2"></span><span class="path3"></span>
              </i>
            </button>
            <button class="btn btn-outline-primary btn-sm" 
                    onclick="usuario.editar(${data.userId})" 
                    title="Editar">
              <i class="fas fa-edit"></i>
            </button>
        `;
    }

    if (data.canDelete) {
      html += `
            <button class="btn btn-outline-${data.status ? "warning" : "success"} btn-sm" 
                    onclick="usuario.cambiarEstado(${data.userId}, ${data.status})" 
                    title="${data.status ? "Desactivar" : "Activar"}">
              <i class="fas ${data.status ? "fa-times" : "fa-check"}"></i>
            </button>
        `;
    }

    html += '</div>';
    return html;
  }

  editar(id) {
    window.location.href = `apps/configuraciones/users/usuario-crear.php?id=${id}`;
  }

  permisos(id) {
    window.location.href = `apps/configuraciones/permissions/permissions-crear.php?id=${id}`;
  }

  // Función para cambiar solo el estado (inhabilitar/habilitar)
  async cambiarEstado(id, currentState) {
    try {
      const nuevoEstado = !currentState;
      const accion = nuevoEstado ? "activar" : "desactivar";

      const confirmado = await this.helper.MessageQuestion(
        `¿Está seguro de ${accion} este usuario?`
      );
      if (!confirmado) return;

      // Obtener los datos actuales del usuario
      const usuarioActual = this.grid.dataSource.find((u) => u.userId === id);
      if (!usuarioActual) {
        throw new Error("Usuario no encontrado en el grid");
      }

      // Preparar los datos para actualizar solo el estado
      const dataToUpdate = {
        userId: id,
        firstName: usuarioActual.firstName,
        lastName: usuarioActual.lastName,
        phone: usuarioActual.phone || "",
        email: usuarioActual.email || "",
        buyerCode: usuarioActual.buyerCode || "",
        supplierCode: usuarioActual.supplierCode || "",
        status: nuevoEstado,
      };

      await this.service.update(dataToUpdate);
      await this._loadData();

      const mensaje = nuevoEstado
        ? "Usuario activado correctamente"
        : "Usuario desactivado correctamente";
      this.helper.MessageSucces(mensaje);
    } catch (error) {
      console.error("Error al cambiar estado del usuario:", error);
      this.helper.MessageError("No se pudo cambiar el estado del usuario");
    }
  }

  // Función para eliminación definitiva (si se necesita)
  async eliminarDefinitivo(id) {
    try {
      const confirmado = await this.helper.MessageQuestion(
        "¿Está seguro de eliminar permanentemente este usuario? Esta acción no se puede deshacer."
      );
      if (!confirmado) return;

      await this.service.delete(id);
      await this._loadData();
      this.helper.MessageSucces("Usuario eliminado permanentemente");
    } catch (error) {
      console.error("Error al eliminar usuario:", error);
      this.helper.MessageError("No se pudo eliminar el usuario");
    }
  }

  // Mantener la función eliminar original para compatibilidad (renombrarla)
  eliminar(id) {
    // Esta función ahora llama a cambiarEstado en lugar de eliminar permanentemente
    this.cambiarEstado(id, true); // true porque asumimos que si está activo, lo vamos a desactivar
  }
}

// Instancia global
const usuario = new Usuario();
window.usuario = usuario;
