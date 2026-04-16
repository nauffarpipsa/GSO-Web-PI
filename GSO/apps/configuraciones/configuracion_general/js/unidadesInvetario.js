import { UnidadInventarioService } from "../api/unidadInventarioService.js";
import { Helper } from "../../helper/Helper.js";
import { SedeService } from "../../sedes/api/sedesService.js";


export class UnidadInventario {
  constructor() {
    this.service = new UnidadInventarioService();
    this.sociedadService = new SedeService();

    this.helper = new Helper();
    this.grid = null;
    this.registroActualId = null;
    this.modoEdicion = false;
    this.isProcessing = false;
    this.validator = null;

    this.elementos = {
      grid: "#unidadesInventarioGrid",
      modal: "#modalUnidadInventario",
      modalTitle: "#modalUnidadInventarioTitle",
      form: "#formUnidadInventario",
      nombreInput: "#unidadInventarioNombre",
      sapCodeInput: "#sapCodeU",      
      empresaSelect: "#unidadInventarioEmpresa",
      statusSwitch: "#unidadInventarioStatus",
      btnAgregar: "#btnAgregarUnidadInventario",
      btnGuardar: "#btnGuardarUnidadInventario",
      btnCancelar: "#btnCancelarUnidadInventario",
      btnClose: "#btnCloseUnidadInventario",
    };

    this._init();
  }

  // --- Inicialización general ---
  _init() {
    document.addEventListener("DOMContentLoaded", () => {
      if (document.querySelector(this.elementos.grid)) {
        this._createGrid();
        this._loadData();
        this._setupEventListeners();
      }
    });
  }

  // --- Grid ---
  _createGrid() {
    const gridConfig = {
      dataSource: [],
      columns: [
        {
          field: "inventoryUnitId",
          headerText: "ID",
          width: 80,
          textAlign: "Center",
        },
        { field: "description", headerText: "Descripción", width: 250 },
        { field: "companyName", headerText: "Empresa", width: 200 },
        {
          field: "status",
          headerText: "Estado",
          width: 100,
          textAlign: "Center",
          template: this._estadoTemplate.bind(this),
        },
        {
          field: "acciones",
          headerText: "Acciones",
          width: 150,
          textAlign: "Center",
          template: this._accionesTemplate.bind(this),
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

  // --- Grid templates (nombres estandarizados) ---
  _estadoTemplate(data) {
    const statusText = data.status ? "Activo" : "Inactivo";
    const statusClass = data.status ? "success" : "danger";
    return `<span class="badge badge-light-${statusClass}">${statusText}</span>`;
  }

  // --- Carga datos ---
  async _loadData() {
    try {
      //await this._loadCompaniesDropdown();
      const response = await this._safeCall(() => this.service.getAll());
      this.grid.dataSource = response.dataResult || [];
    } catch (err) {
      console.error("Error al cargar Unidades de Inventario:", err);
    }
  }

  // --- Listeners globales ---
  _setupEventListeners() {
    document
      .querySelector(this.elementos.btnAgregar)
      ?.addEventListener("click", () => this._showModal(false));

    const saveBtn = document.querySelector(this.elementos.btnGuardar);
    const formEl = document.querySelector(this.elementos.form);
    if (saveBtn && formEl) {
      saveBtn.addEventListener("click", (e) => {
        e.preventDefault();
        formEl.requestSubmit();
      });
    }

    [this.elementos.btnCancelar, this.elementos.btnClose].forEach((sel) => {
      document
        .querySelector(sel)
        ?.addEventListener("click", () => this.cerrarModal());
    });

    const modalEl = document.querySelector(this.elementos.modal);
    if (modalEl) {
      modalEl.addEventListener("shown.bs.modal", () => {
        document.querySelector(this.elementos.nombreInput)?.focus();
      });

      modalEl.addEventListener("hidden.bs.modal", () => {
        if (this.validator) this.validator.destroy();
        this.validator = null;
        document
          .querySelectorAll(".invalid-feedback")
          .forEach((el) => el.remove());
        document
          .querySelectorAll(".is-invalid")
          .forEach((el) => el.classList.remove("is-invalid"));
        document.querySelector(this.elementos.form)?.reset();
        this.modoEdicion = false;
        this.registroActualId = null;
      });
    }
  }

  // --- Mostrar modal ---
  async _showModal(isEdit = false, registro = null) {
    this.modoEdicion = isEdit;
    this.registroActualId = registro?.inventoryUnitId ?? null;

    const formEl = document.querySelector(this.elementos.form);
    formEl.reset();

    document.querySelector(this.elementos.modalTitle).textContent = isEdit
      ? "Editar Unidad de Inventario"
      : "Agregar Unidad de Inventario";


       // Cargar el dropdown de empresas ANTES de mostrar el modal
    await this._loadCompaniesDropdown();
     if (isEdit && registro) {
      document.querySelector(this.elementos.nombreInput).value =
        registro.description ?? "";
      document.querySelector(this.elementos.sapCodeInput).value =
        registro.sapCode || "";
      document.querySelector(this.elementos.empresaSelect).value =
        registro.companyId ?? "";
      document.querySelector(this.elementos.statusSwitch).checked =
        registro.status ?? false;
    } else {
      document.querySelector(this.elementos.statusSwitch).checked = true;
    }

    this._initValidation();
    const modal = new bootstrap.Modal(
      document.querySelector(this.elementos.modal)
    );
    modal.show();
  }

  // Wrappers públicos
  agregar() {
    this._showModal(false);
  }

  editar(id) {
    const registro = this.grid.dataSource.find(
      (item) => item.inventoryUnitId === id
    );
    if (!registro) {
      console.error("No se encontró el registro para editar.");
      return;
    }
    this._showModal(true, registro);
  }

  // --- Eliminar ---
  async eliminar(id) {
    if (this.isProcessing) return;
    try {
      const confirmado = await this.helper.MessageQuestion(
        "¿Está seguro de que desea inhabilitar este registro?"
      );
      if (!confirmado) return;

      this._toggleProcessingState(true, "Eliminando");
      await this._safeCall(() => this.service.delete(id));
      await this._loadData();
      this.helper.MessageSucces("Registro inhabilitar correctamente");
    } catch (error) {
      console.error("Error al eliminar el registro:", error);
    } finally {
      this._toggleProcessingState(false);
    }
  }

  // --- Guardar ---
  async _guardar() {
    if (this.isProcessing) return;
    this._toggleProcessingState(
      true,
      this.modoEdicion ? "Actualizando" : "Guardando"
    );

    const data = {
      description: (
        document.querySelector(this.elementos.nombreInput)?.value || ""
      ).trim(),
      sapCode: (
        document.querySelector(this.elementos.sapCodeInput)?.value || ""
      ).trim(),
      companyId: parseInt(
        document.querySelector(this.elementos.empresaSelect)?.value,
        10
      ),
      status: document.querySelector(this.elementos.statusSwitch).checked,
    };

    try {
      let response;
      if (this.modoEdicion) {
        data.inventoryUnitId = this.registroActualId;
        response = await this._safeCall(() => this.service.update(data));
      } else {
        response = await this._safeCall(() => this.service.create(data));
      }

      if (response && response.statusResult) {
        this.cerrarModal();
        await this._loadData();
        this.helper.MessageSucces(
          response.messageResult || "Guardado correctamente"
        );
      } else {
        this.helper.MessageError(response?.messageResult || "Error al guardar");
      }
    } catch (error) {
      console.error("Error al guardar:", error);
    } finally {
      this._toggleProcessingState(false);
    }
  }

  // --- Cerrar modal ---
  cerrarModal() {
    const modalElement = document.querySelector(this.elementos.modal);
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) modal.hide();
  }

  // --- Grid templates ---
  _accionesTemplate(data) {
    return `
          <button class="e-btn e-flat e-primary e-small" onclick="unidadInventario.editar(${data.inventoryUnitId})" title="Editar">
        <i class="e-icons e-edit"></i>
      </button>
      <button class="e-btn e-flat e-danger e-small" onclick="unidadInventario.eliminar(${data.inventoryUnitId})" title="Eliminar">
        <i class="e-icons e-delete"></i>
      </button>
    `;
  }

  // --- Lógica específica del componente ---
  async _loadCompaniesDropdown() {
    const select = document.querySelector(this.elementos.empresaSelect);
    select.innerHTML = '<option value="">Cargando empresas...</option>';
    select.disabled = true;

    try {
      const response = await this._safeCall(() => this.service.getCompanies());
      select.innerHTML =
        '<option value="" disabled selected>Seleccione una empresa</option>';
      (response.dataResult || []).forEach((company) => {
        const option = document.createElement("option");
        option.value = company.companyId;
        option.textContent = company.legalName;
        select.appendChild(option);
      });
    } catch (error) {
      select.innerHTML = '<option value="">Error al cargar empresas</option>';
      console.error("Error al cargar empresas:", error);
      // Opcional: mostrar un mensaje de error al usuario
      // this.helper.MessageError("No se pudieron cargar las empresas.");
    } finally {
      select.disabled = false;
    }
  }

  // --- Helpers ---
  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      this.helper.handleApiError(error);
      throw error;
    }
  }

  _toggleProcessingState(isProcessing, label = "Guardar") {
    this.isProcessing = isProcessing;
    const btnGuardar = document.querySelector(this.elementos.btnGuardar);
    if (btnGuardar) {
      btnGuardar.disabled = isProcessing;
      btnGuardar.innerHTML = isProcessing
        ? `<span class="spinner-border spinner-border-sm"></span> ${label}...`
        : "Guardar";
    }
  }

  // --- Validación ---
  _initValidation() {
    const formEl = document.querySelector(this.elementos.form);
    if (!formEl) return;
    formEl.setAttribute("novalidate", "true");

    if (this.validator) this.validator.destroy();

    const JV = window.JustValidate;
    if (!JV) return;

    this.validator = new JV(this.elementos.form, {
      errorFieldCssClass: "is-invalid",
      errorLabelCssClass: "invalid-feedback",
      errorLabelStyle: { display: "block" },
    });

    this.validator
      .addField(this.elementos.nombreInput, [
        { rule: "required", errorMessage: "La descripción es obligatoria" },
        { rule: "minLength", value: 3, errorMessage: "Mínimo 3 caracteres" },
      ])
      .addField(this.elementos.sapCodeInput, [
        { rule: "required", errorMessage: "El codigo de sap es obligatoria" },
        { rule: "minLength", value: 3, errorMessage: "Mínimo 3 caracteres" },
      ])
      .addField(this.elementos.empresaSelect, [
        { rule: "required", errorMessage: "Debe seleccionar una empresa" },
      ])
      .onSuccess((ev) => {
        ev.preventDefault();
        this._guardar();
      });
  }
}

// --- Inicialización ---
const unidadInventario = new UnidadInventario();
window.unidadInventario = unidadInventario;
