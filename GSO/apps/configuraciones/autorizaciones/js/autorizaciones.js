class Autorizacion {
  constructor() {
    this.api = axios.create({
      baseURL: "http://localhost:5054/api",
      headers: { "Content-Type": "application/json" },
    });

    // --- PROPIEDADES ---
    this.grid = null; // Objeto de la tabla Syncfusion
    this.registroActualId = null; // ID del registro que se está editando
    this.modoEdicion = false; // Flag para saber si se está creando o editando
    this.isProcessing = false; // Flag para evitar doble envío en formularios

    // --- CONFIGURACIÓN ---
    this.apiBaseUrl =
      "apps/configuraciones/configuracion_General/api/configuracion-endpoints.php";
    this.elementos = {
      grid: "#autorizacionGrid",
      btnAgregar: "#btnAutorizacion",
      // modal: "#modalTipoAutorizacion",
    };

    // Iniciar el módulo
    this.init();
  }

  /**
   * Inicializa el módulo, crea la tabla y configura los eventos.
   */
  init() {
    // Espera a que el DOM esté completamente cargado.
    document.addEventListener("DOMContentLoaded", () => {
      if (document.querySelector(this.elementos.grid)) {
        this._createGrid();
        this._loadData();
        this._setupEventListeners();
      } else {
        console.error("El contenedor del grid no fue encontrado.");
      }
    });
  }

  // --- MÉTODOS PRIVADOS (Lógica interna) ---

  /**
   * Crea y configura la instancia de la tabla Syncfusion.
   */
  _createGrid() {
    const gridConfig = {
      dataSource: [],
      columns: [
        {
          field: "authorizationModelId",
          headerText: "ID",
          width: 80,
          textAlign: "Center",
        },
        {
          field: "description",
          headerText: "Autorizacion",
          width: 250,
          textAlign: "Left",
        },
        {
          field: "authorizationTypeDescription",
          headerText: "Tipo de Autorizacion",
          width: 250,
          textAlign: "Left",
        },
        {
          field: "status",
          headerText: "Estado",
          width: 100,
          textAlign: "Center",
          template: this._getEstadoTemplate.bind(this),
        },
        {
          field: "acciones",
          headerText: "Acciones",
          width: 80,
          textAlign: "Center",
          template: this._getAccionesTemplate.bind(this),
        },
      ],
      allowPaging: true,
      allowSorting: true,
      allowFiltering: true,
      pageSettings: {
        pageSize: 10,
        pageSizes: [5, 10, 15, 20],
      },
      filterSettings: {
        type: "Menu",
      },
      height: "auto",
    };

    this.grid = new ej.grids.Grid(gridConfig);
    this.grid.appendTo(this.elementos.grid);
  }

  /**
   * Carga los datos de los tipos de autorización desde la API y los muestra en la tabla.
   */
  async _loadData() {
    try {
      const data = await this._makeApiCall("getTiposAutorizacion");

      if (data && this.grid) {
        this.grid.dataSource = data;
      } else {
        console.error("No se recibieron datos válidos");
      }
    } catch (error) {
      console.error("Error de conexión al cargar datos:", error);
    }
  }

  /**
   * Configura los listeners para los botones del modal y la tabla.
   */
  _setupEventListeners() {
    // Botón para abrir modal en modo "Agregar"
    document
      .querySelector(this.elementos.btnAgregar)
      .addEventListener("click", () => this.agregar());

    // Listener para todo el grid
    const gridEl = document.querySelector(this.elementos.grid);
    if (gridEl) {
      gridEl.addEventListener("click", (e) => {
        // Encontrar el botón que fue clickeado, si existe
        const button = e.target.closest("button[data-action]");
        if (!button) return;

        const action = button.dataset.action; // 'edit' o 'delete'
        const id = Number(button.dataset.id); // el ID del registro

        if (action === "edit") {
          this.editar(id);
        }
       });
    }
  }

  /**
   * Realiza una llamada a la API.
   * @param {string} action - La acción a ejecutar en el endpoint.
   * @param {object} [data=null] - Los datos a enviar en el cuerpo de la petición.
   * @returns {Promise<object>} - La respuesta de la API en formato JSON.
   */
  async _makeApiCall(action, data = null) {
    try {
      const response = await this.api.get("/AuthorizationModel/Get");
      return response.data.dataResult; // Aquí regresas lo que necesitas
    } catch (error) {
      console.error("Error en la API:", error);
      throw error; // para que lo capture el _loadData
    }
  }

  // --- MÉTODOS DE TEMPLATE PARA LA TABLA ---

  /**
   * Genera el HTML para la columna de "Estado".
   * @param {object} data - Fila de datos.
   * @returns {string} - HTML del badge de estado.
   */
  _getEstadoTemplate(data) {
    const statusClass = data.status ? "activo" : "inactivo";
    const statusText = data.status ? "Activo" : "Inactivo";
    return `<span class="badge badge-light-${
      data.status ? "success" : "danger"
    }">${statusText}</span>`;
  }

  /**
   * Genera el HTML para la columna de "Acciones".
   * @param {object} data - Fila de datos.
   * @returns {string} - HTML del botón de editar.
   */
  _getAccionesTemplate(data) {
    return `
            <button class="btn btn-icon btn-active-light-primary w-30px h-30px" 
                    data-action="edit" data-id="${data.authorizationModelId}" title="Editar">
                <i class="ki-duotone ki-pencil fs-3"><span class="path1"></span><span class="path2"></span></i>
            </button>
            
        `;
  }

  // Redirige a la pantalla de crear Autorizacion
  agregar() {
    window.location.href =
      "apps/configuraciones/autorizaciones/autorizaciones-crear.php";
  }

  editar(id) {
    // Se construye la URL con un parámetro de consulta "?id="
    window.location.href = `apps/configuraciones/autorizaciones/autorizaciones-crear.php?id=${id}`;
  }

  /**
   * Habilita o deshabilita los botones del modal para evitar envíos múltiples.
   * @param {boolean} isProcessing - True para deshabilitar, false para habilitar.
   */
  _toggleProcessingState(isProcessing) {
    this.isProcessing = isProcessing;
    const btnGuardar = document.querySelector(this.elementos.btnGuardar);
    if (btnGuardar) {
      if (isProcessing) {
        btnGuardar.disabled = true;
        btnGuardar.innerHTML =
          '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...';
      } else {
        btnGuardar.disabled = false;
        btnGuardar.innerHTML = "Guardar";
      }
    }
  }
}

// Crear una instancia global de la clase para que pueda ser accedida desde el HTML (para el botón de editar)
const autorizacionInstance = new Autorizacion();
