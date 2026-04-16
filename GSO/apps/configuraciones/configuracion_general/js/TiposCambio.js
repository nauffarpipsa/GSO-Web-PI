import { Helper } from "../../helper/helper.js";
import { CountryService } from "../../country/api/countryService.js";
import { SociedadService } from "../../sociedades/api/sociedadesService.js";
import { UsuarioService } from "../../users/api/usuarioService.js";
import { ExchangeRateService } from "../api/exchangeRateService.js";

export class TiposCambio {
  constructor() {
    this.service = new ExchangeRateService();
    this.countryService = new CountryService();
    this.usuarioService = new UsuarioService();
    this.sociedadService = new SociedadService();
    this.helper = new Helper();
    this.grid = null;
    this.registroActualId = null;
    this.modoEdicion = false;
    this.isProcessing = false;
    this.validator = null;
    this.modalInstance = null;
    this.userId = null;

    this.elementos = {
      grid: "#tiposCambioGrid",
      modal: "#modalTiposCambio",
      modalTitle: "#modalTiposCambioTitle",
      form: "#formTiposCambio",
      dateInput: "#tipoCambioDate",
      rateInput: "#tipoCambioRate",
      companyIdInput: "#companyId",
      countryInput: "#tipoCambioCountry",
      currencyInput: "#tipoCambioCurrency",
      statusSwitch: "#tipoCambioStatus",
      btnAgregar: "#btnAgregarTipoCambio",
      btnGuardar: "#btnGuardarTipoCambio",
      btnCancelar: "#btnCancelarTipoCambio",
      btnClose: "#btnCloseTipoCambio",
    };

    this._init();
  }

  _init() {
    document.addEventListener("DOMContentLoaded", () => {

      const gridElement = document.querySelector(this.elementos.grid);
      const modalElement = document.querySelector(this.elementos.modal);

      if (gridElement) {
        this._createGrid();
        this._loadData();
        this._setupEventListeners();
        this._loadCompany();
        this._loadCountry();

        if (modalElement) {
          this.modalInstance = new bootstrap.Modal(modalElement);
        } else {
          console.error("Error Crítico: El elemento del modal '#modalTiposCambio' no fue encontrado en el DOM.");
        }
      } else {
        console.error("Error Crítico: El contenedor del grid '#tiposCambioGrid' no fue encontrado.");
      }
    });

  }

  _createGrid() {
    const gridConfig = {
      dataSource: [],
      columns: [
        { field: "exchangeRateId", headerText: "ID", width: 80, textAlign: "Center" },
        { field: "date", headerText: "Fecha", type: 'date', format: 'dd/MM/yyyy', width: 120 },
        { field: "countryId", headerText: "País", width: 150 },
        { field: "currencyCode", headerText: "Moneda", width: 100, textAlign: "Center" },
        { field: "rate", headerText: "Tasa", width: 120, format: 'N4', textAlign: "Right" },
        { field: "status", headerText: "Estado", width: 100, textAlign: "Center", template: this._estadoTemplate.bind(this) },
        { field: "acciones", headerText: "Acciones", width: 150, textAlign: "Center", template: this._accionesTemplate.bind(this) },
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

  async _loadData() {
    try {
      const ACCESS_NAME = 'Configuraciones Generales';
      const EDIT_ACTION_ID = 2;
      const DELETE_ACTION_ID = 3;

      if (!window.permissionHelper) {
        console.error("PermissionHelper no está disponible. Ocultando columna de acciones.");
        this.grid.hideColumns("Acciones");
        const response = await this._safeCall(() => this.service.getAll());
        this.grid.dataSource = response.dataResult || [];
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

      const response = await this._safeCall(() => this.service.getAll());
      let rawData = response.dataResult || [];


      const datosConPermisos = rawData.map(item => ({
        ...item,
        canEdit: userCanEdit,
        canDelete: userCanDelete
      }));


      this.grid.dataSource = datosConPermisos;


      const sessionData = await this.usuarioService.getSessionData();
      this.userId = sessionData?.userId ?? null;

    } catch (err) {
      console.error("Error cargando Tipos de Cambio:", err);
    }
  }

  async _loadCompany() {
    const sociedadesResponse = await this.sociedadService.getAll();
    const sociedades = sociedadesResponse.dataResult || [];
    const companyId = document.querySelector(this.elementos.companyIdInput);
    companyId.innerHTML =
      '<option value="">Seleccionar una sociedad...</option>';
    sociedades.forEach((sociedad) => {
      const option = document.createElement("option");
      option.value = sociedad.companyId;
      option.textContent = sociedad.legalName;
      companyId.appendChild(option);
    });
  }

  async _loadCountry() {
    try {
      const countriesResponse = await this._safeCall(() => this.countryService.getAll());
      const countries = countriesResponse.dataResult || [];
      const countrySelect = document.querySelector(this.elementos.countryInput);

      if (countrySelect) {
        countrySelect.innerHTML = '<option value="">Seleccionar un país...</option>';
        countries.forEach((country) => {
          const option = document.createElement("option");
          option.value = country.countryId;
          option.textContent = country.name;
          option.dataset.currency = country.currency;
          countrySelect.appendChild(option);
        });
      }
    } catch (err) {
      console.error("Error cargando la lista de Países:", err);
      this.helper.MessageError("No se pudo cargar la lista de países.");
    }
  }

  _setupEventListeners() {
    document
      .querySelector(this.elementos.btnAgregar)
      ?.addEventListener("click", () => this._showModal(false));

    document.querySelector(this.elementos.form)
      ?.addEventListener("submit", (e) => {
        e.preventDefault();
        this._guardar();
      });

    [this.elementos.btnCancelar, this.elementos.btnClose].forEach((sel) => {
      document
        .querySelector(sel)
        ?.addEventListener("click", () => this.cerrarModal());
    });


    const countrySelect = document.querySelector(this.elementos.countryInput);
    if (countrySelect) {
      countrySelect.addEventListener('change', (event) => {
        const selectedOption = event.target.options[event.target.selectedIndex];
        const currencyCode = selectedOption.dataset.currency || '';

        const currencyInput = document.querySelector(this.elementos.currencyInput);
        if (currencyInput) {
          currencyInput.value = currencyCode;
        }
      });
    }

    const modalEl = document.querySelector(this.elementos.modal);
    if (modalEl) {
      modalEl.addEventListener("shown.bs.modal", () => {
        document.querySelector(this.elementos.dateInput)?.focus();
      });
      modalEl.addEventListener("hidden.bs.modal", () => {
        this.validator?.destroy();
        this.validator = null;
        document.querySelector(this.elementos.form)?.reset();
        this.modoEdicion = false;
        this.registroActualId = null;
      });
    }
  }

  _showModal(isEdit = false, registro = null) {
    this.modoEdicion = isEdit;
    this.registroActualId = registro?.exchangeRateId ?? null;

    const formEl = document.querySelector(this.elementos.form);
    formEl.reset();
    document.querySelector(this.elementos.modalTitle).textContent = isEdit
      ? "Editar Tipo de Cambio"
      : "Agregar Tipo de Cambio";

    if (isEdit && registro) {
      document.querySelector(this.elementos.dateInput).value = registro.date ? new Date(registro.date).toISOString().split('T')[0] : '';
      document.querySelector(this.elementos.rateInput).value = registro.rate ?? 0;
      document.querySelector(this.elementos.countryInput).value = registro.countryId ?? "";
      document.querySelector(this.elementos.companyIdInput).value = registro.companyId ?? "";
      document.querySelector(this.elementos.currencyInput).value = registro.currencyCode ?? "";
      document.querySelector(this.elementos.statusSwitch).checked = registro.status ?? false;
    } else {
      document.querySelector(this.elementos.statusSwitch).checked = true;
    }

    this._initValidation();


    if (this.modalInstance) {
      this.modalInstance.show();
    } else {
      console.error("La instancia del modal no está inicializada. No se puede mostrar.");
    }
  }

  editar(id) {
    const registro = this.grid.dataSource.find((item) => item.exchangeRateId === id);
    if (!registro) {
      console.error("No se encontró el registro para editar.");
      return;
    }
    this._showModal(true, registro);
  }

  cerrarModal() {

    if (this.modalInstance) {
      this.modalInstance.hide();
    }
  }

  async eliminar(id) {
    if (this.isProcessing) return;

    const registro = this.grid.dataSource.find((item) => item.exchangeRateId === id);
    if (!registro) {
      this.helper.MessageError("No se pudo encontrar el registro.");
      return;
    }

    try {
      const confirmado = await this.helper.MessageQuestion("¿Está seguro de que desea inhabilitar este registro?");
      if (!confirmado) return;

      this._toggleProcessingState(true, "Inhabilitando");
      registro.status = false;
      await this._safeCall(() => this.service.update(registro));
      await this._loadData();
      this.helper.MessageSucces("Registro inhabilitado correctamente");
    } catch (error) {
      console.error("Error al inhabilitar el registro:", error);
    } finally {
      this._toggleProcessingState(false);
    }
  }

  async _guardar() {
    this.validator.validate().then(async ({ isValid }) => {
      if (!this.validator.isValid) return;

      if (this.isProcessing) return;
      this._toggleProcessingState(true, this.modoEdicion ? "Actualizando" : "Guardando");

      const data = {
        CompanyId: document.querySelector(this.elementos.companyIdInput).value,
        date: new Date(document.querySelector(this.elementos.dateInput).value).toISOString(),
        rate: parseFloat(document.querySelector(this.elementos.rateInput).value || 0),
        countryId: document.querySelector(this.elementos.countryInput).value,
        currencyCode: document.querySelector(this.elementos.currencyInput).value.trim(),
        status: document.querySelector(this.elementos.statusSwitch).checked,
        createdBy: this.userId
      };

      try {
        let response;
        if (this.modoEdicion) {
          data.exchangeRateId = this.registroActualId;
          response = await this._safeCall(() => this.service.update(data));
        } else {
          response = await this._safeCall(() => this.service.create(data));
        }

        if (response && response.statusResult) {
          this.cerrarModal();
          await this._loadData();
          this.helper.MessageSucces(response.messageResult || "Guardado correctamente");
        } else {
          this.helper.MessageError(response?.messageResult || "Error al guardar");
        }
      } catch (error) {
        console.error("Error al guardar:", error);
      } finally {
        this._toggleProcessingState(false);
      }
    });
  }

  _estadoTemplate(data) {
    const statusText = data.status ? "Activo" : "Inactivo";
    const statusClass = data.status ? "success" : "danger";
    return `<span class="badge badge-light-${statusClass}">${statusText}</span>`;
  }

  _accionesTemplate(data) {

    let html = '';

    if (data.canEdit) {
      html += `
            <button class="e-btn e-flat e-primary e-small" 
                    onclick="tiposCambio.editar(${data.exchangeRateId})" 
                    title="Editar">
                <i class="e-icons e-edit"></i>
            </button>
        `;
    }

    if (data.canDelete) {
      html += `
            <button class="e-btn e-flat e-danger e-small" 
                    onclick="tiposCambio.eliminar(${data.exchangeRateId})" 
                    title="Inhabilitar">
                <i class="e-icons e-delete"></i>
            </button>
        `;
    }

    return html;
  }

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

  _initValidation() {
    if (this.validator) this.validator.destroy();

    this.validator = new JustValidate(this.elementos.form, {
      errorFieldCssClass: "is-invalid",
      errorLabelCssClass: "invalid-feedback",
      errorLabelStyle: { display: "block" },
      validateBeforeSubmitting: true,
    });

    this.validator
      .addField(this.elementos.dateInput, [{ rule: "required", errorMessage: "La fecha es obligatoria" }])
      .addField(this.elementos.rateInput, [
        { rule: "required", errorMessage: "La tasa es obligatoria" },
        { rule: "number", errorMessage: "Debe ser un valor numérico" },
        {
          validator: (value) => parseFloat(value) > 0,
          errorMessage: 'La tasa debe ser mayor que cero',
        },
      ])
      .addField(this.elementos.countryInput, [{ rule: "required", errorMessage: "El país es obligatorio" }])
      .addField(this.elementos.companyIdInput, [{ rule: "required", errorMessage: "La sociedad es obligatorio" }])
      .addField(this.elementos.currencyInput, [
        { rule: "required", errorMessage: "La moneda es obligatoria" },
        { rule: 'minLength', value: 3, errorMessage: 'Debe tener 3 caracteres' },
        { rule: 'maxLength', value: 3, errorMessage: 'Debe tener 3 caracteres' },
      ]);
  }
}

const tiposCambio = new TiposCambio();
window.tiposCambio = tiposCambio;