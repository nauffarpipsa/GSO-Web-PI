
import { Helper } from "../../helper/helper.js";
import { UsuarioService } from "../../users/api/usuarioService.js";
import { CountryService } from "../../country/api/countryService.js";
import { DepartmentService } from "../../department/api/departmentService.js";
import { MunicipalityService } from "../../municipality/api/municipalityService.js";
import { DireccionesService } from "../../direcciones/api/direccionesService.js";
import { SociedadService } from "../api/sociedadesService.js";

export class SociedadesCreate {
  constructor() {
    this.service = new SociedadService();
    this.usuarioService = new UsuarioService();
    this.countryService = new CountryService();
    this.departmentService = new DepartmentService();
    this.municipalityService = new MunicipalityService();
    this.direccionesService = new DireccionesService();
    this.helper = new Helper();

    this.mode = "create";
    this.sociedadId = 0;
    this.isProcessing = false;
    this.userId = null;
    this.validator = null;

    this.elementos = {
      form: "#formEdicionCompleta",
      formTitle: "#formSedeTitle",

      nombreLegalInput: "#LegalName",
      rtnInput: "#RTN",
      managerId: "#managerId",
      correoInput: "#email",
      websiteInput: "#Website",
      logoPathInput: "#logoPathInput",
      monedaAltInput: "#ExternalCurrency",
      codigoContable1Input: "#accountingCodeOne",
      codigoContable2Input: "#accountingCodeTwo",
      sapCodeInput: "#sapCode",

      addressId: 0,
      direccion1Input: "#addressLine1",
      direccion2Input: "#addressLine2",
      countryId: "#countryId",
      departmentId: "#departmentId",
      // municipalityId: "#municipalityId",
      codigoPostalInput: "#postalCode",
      phoneInput: "#phone",
      calleInput: "#street",
      avenidaInput: "#ave",

      saveButton: "#btnGuardarEdicion",
      backButton: "#btnVolver",
    };
  }

  async init() {
    this._determineModeInformation(); // trae el id si es edición
    await this._loadUserInformation(); // carga info del usuario (userId)
    await this._loadDropdownData(); // carga dropdowns (países y usuarios)
    await this._initValidation(); // inicializa la validación (usa DOM actual)
    this._setupEventListeners(); // configura listeners (usa requestSubmit)
    await this._determineMode(); // ajusta el modo y carga datos si es edición
  }

  async _loadUserInformation() {
    try {
      const sessionData = await this.usuarioService.getSessionData();
      this.userId = sessionData?.userId ?? null;
    } catch (err) {
      this.userId = null;
      // no bloqueamos la UI por esto
    }
  }

  async _determineMode() {
    if (this.mode === "edit") {
      const title = `Editar Sede #${this.sociedadId}`;
      document.title = title;
      const titleEl = document.querySelector(this.elementos.formTitle);
      if (titleEl)
        titleEl.innerHTML = `<i class="ki-duotone ki-edit fs-2 me-2">...</i> ${title}`;
      await this._loadSedeData();
    } else {
      const title = "Crear Nueva Sede";
      document.title = title;
      const titleEl = document.querySelector(this.elementos.formTitle);
      if (titleEl)
        titleEl.innerHTML = `<i class="ki-duotone ki-plus fs-2 me-2"></i> ${title}`;
    }
  }

  async _loadDropdownData() {
    try {
      const countriesResponse = await this.countryService.getAll();
      const countries = countriesResponse.dataResult || [];
      const countrySelect = document.querySelector(this.elementos.countryId);
      if (countrySelect) {
        countrySelect.innerHTML =
          '<option value="">Seleccionar un país...</option>';
        countries.forEach((country) => {
          const option = document.createElement("option");
          option.value = country.countryId;
          option.textContent = country.name;
          countrySelect.appendChild(option);
        });
      }

      const usersResponse = await this.usuarioService.getAll();
      const users = usersResponse.dataResult || [];
      const userSelect = document.querySelector(this.elementos.managerId);
      if (userSelect) {
        userSelect.innerHTML =
          '<option value="">Seleccionar un usuario...</option>';
        users.forEach((user) => {
          const option = document.createElement("option");
          option.value = user.userId;
          option.textContent = `${user.firstName} ${user.lastName}`;
          userSelect.appendChild(option);
        });
      }
    } catch (error) {
      this.helper.handleApiError(error);
    }
  }

  async loadDepartmentData() {
    try {
      const countryEl = document.querySelector(this.elementos.countryId);
      const countryId = countryEl ? countryEl.value : null;
      const departmentsResponse = await this.departmentService.getById(
        countryId
      );
      const departments = departmentsResponse.dataResult || [];
      const departmentSelect = document.querySelector(
        this.elementos.departmentId
      );
      if (departmentSelect) {
        departmentSelect.innerHTML =
          '<option value="">Seleccionar un estado...</option>';
        departments.forEach((dept) => {
          const option = document.createElement("option");
          option.value = dept.departmentId;
          option.textContent = dept.description;
          departmentSelect.appendChild(option);
        });
      }
    } catch (error) {
      this.helper.handleApiError(error);
    }
  }

  _determineModeInformation() {
    const params = new URLSearchParams(window.location.search);
    const id = params.get("id");
    if (id) {
      this.mode = "edit";
      this.sociedadId = id;
    }
  }

  async _loadSedeData() {
    try {
      const response = await this.service.getById(this.sociedadId);
      const responseDireccion = await this.direccionesService.getById(response.dataResult.addressId);
      if (response && response.dataResult) {
        this._populateForm(response.dataResult, responseDireccion.dataResult);
      } else {
        throw new Error("No se encontraron datos para esta sociedad.");
      }
    } catch (error) {
      this.helper.handleApiError(error);
      const saveBtn = document.querySelector(this.elementos.saveButton);
      if (saveBtn) saveBtn.disabled = true;
    }
  }

  async _populateForm(data, dataDireccion) {
    // Usamos safe selectors (si el elemento existe, lo llenamos)
    const setIfExists = (selector, value) => {
      const el = document.querySelector(selector);
      if (!el) return;
      // para selects: asigna value; para inputs: value
      if ("value" in el) el.value = value ?? "";
    };

    setIfExists(this.elementos.nombreLegalInput, data.legalName ?? "");
    setIfExists(this.elementos.rtnInput, data.taxId ?? "");

    setIfExists(
      this.elementos.managerId,
      data.personInChargeId ?? data.managerId ?? ""
    );
    setIfExists(this.elementos.correoInput, data.email ?? "");
    setIfExists(this.elementos.websiteInput, data.website ?? "");
    setIfExists(this.elementos.logoPathInput, data.logoPath ?? "");
    setIfExists(this.elementos.monedaAltInput, data.externalCurrency ?? "");
    setIfExists(
      this.elementos.codigoContable1Input,
      data.accountingCodeOne ?? ""
    );
    setIfExists(
      this.elementos.codigoContable2Input,
      data.accountingCodeTwo ?? ""
    );
    setIfExists(
      this.elementos.sapCodeInput,
      data.sapCode ?? ""
    );
    this.elementos.addressId = dataDireccion.addressId;

    setIfExists(
      this.elementos.direccion1Input,
      dataDireccion.addressLine1 ?? ""
    );
    setIfExists(
      this.elementos.direccion2Input,
      dataDireccion.addressLine2 ?? ""
    );
    setIfExists(this.elementos.countryId, dataDireccion.countryId ?? "");
    // Si vienen país/department/municipality ids, puedes cargar dependientes
    if (dataDireccion.countryId) {
      const countryEl = document.querySelector(this.elementos.countryId);
      if (countryEl) countryEl.value = dataDireccion.countryId;
    }

    await this.loadDepartmentData();

    setIfExists(this.elementos.departmentId, dataDireccion.stateProvince ?? "");
    // setIfExists(this.elementos.municipalityId, data.municipalityId ?? "");
    setIfExists(
      this.elementos.codigoPostalInput,
      dataDireccion.postalCode ?? ""
    );
    setIfExists(this.elementos.phoneInput, dataDireccion.phone ?? "");
    setIfExists(this.elementos.calleInput, dataDireccion.street ?? "");
    setIfExists(this.elementos.avenidaInput, dataDireccion.avenue ?? "");
  }

  _setupEventListeners() {
    const countrySelect = document.querySelector(this.elementos.countryId);
    const departmentSelect = document.querySelector(
      this.elementos.departmentId
    );

    countrySelect?.addEventListener("change", () => {
      this.loadDepartmentData();
    });

    // departmentSelect?.addEventListener("change", () => {
    //   this.loadMunicipalityData();
    // });

    // El botón "Guardar" disparará el submit del form (para que JustValidate capture)
    const saveBtn = document.querySelector(this.elementos.saveButton);
    const formEl = document.querySelector(this.elementos.form);
    if (saveBtn && formEl) {
      saveBtn.addEventListener("click", (e) => {
        e.preventDefault();
        // requestSubmit() dispara el submit del form respetando handlers
        if (typeof formEl.requestSubmit === "function") {
          formEl.requestSubmit();
        } else {
          // fallback para navegadores viejos
          formEl.dispatchEvent(new Event("submit", { cancelable: true }));
        }
      });
    }

    document
      .querySelector(this.elementos.backButton)
      ?.addEventListener("click", () => window.history.back());
  }

  _getFormData() {
    const q = (selector) => {
      const el = document.querySelector(selector);
      return el ? (el.value ?? "").toString().trim() : "";
    };

    return {
      companyId: this.sociedadId,
      legalName: q(this.elementos.nombreLegalInput),
      taxId: q(this.elementos.rtnInput),
      managerId: q(this.elementos.managerId),
      email: q(this.elementos.correoInput),
      website: q(this.elementos.websiteInput),
      logoPath: q(this.elementos.logoPathInput),
      externalCurrency: q(this.elementos.monedaAltInput),
      accountingCodeOne: q(this.elementos.codigoContable1Input),
      accountingCodeTwo: q(this.elementos.codigoContable2Input),
      sapCode: q(this.elementos.sapCodeInput),

      addressId: this.elementos.addressId,
      addressLine1: q(this.elementos.direccion1Input),
      addressLine2: q(this.elementos.direccion2Input),

      countryId: q(this.elementos.countryId),
      departmentId: q(this.elementos.departmentId),
      // municipalityId: q(this.elementos.municipalityId),
      postalCode: q(this.elementos.codigoPostalInput),
      phone: q(this.elementos.phoneInput),
      street: q(this.elementos.calleInput),
      avenue: q(this.elementos.avenidaInput),
    };
  }


  _getFormDataCompany(formData) {
    return {
      companyId: this.sociedadId,
      legalName: formData.legalName,
      taxId: formData.taxId,
      managerId: formData.managerId,
      email: formData.email,
      website: formData.website,
      logoPath: formData.logoPath,
      externalCurrency: formData.externalCurrency,
      accountingCodeOne: formData.accountingCodeOne,
      accountingCodeTwo: formData.accountingCodeTwo,
      sapCode: formData.sapCode,
    }
  }

  async _handleSave() {
    if (this.isProcessing) return;

    this._toggleProcessingState(true);
    const allData = this._getFormData();
    const formData = this._getFormDataCompany(allData);

    try {
      let response;

      if (this.mode === "edit") {
        allData.societyId = this.sociedadId;
        await this._handleDireccionSave(allData);
        response = await this.service.update(formData);
      } else {
        await this._handleDireccionSave(allData);
        formData.addressId = allData.addressId;
        response = await this.service.create(formData);
      }

      this.helper.MessageSucces(response.messageResult);

      setTimeout(
        () =>
          (window.location.href =
            "apps/configuraciones/Sociedades/sociedades-grid.php"),
        1500
      );
    } catch (error) {
      this.helper.handleApiError(error);
    } finally {
      this._toggleProcessingState(false);
    }
  }

  async _handleDireccionSave(formData) {
    try {
      let direccion = {
        addressLine1: formData.addressLine1,
        addressLine2: formData.addressLine2,
        countryId: formData.countryId,
        stateProvince: formData.departmentId,
        phone: formData.phone,
        pbx: "pbx",
        postalCode: formData.postalCode,
        street: formData.street,
        avenue: formData.avenue,
        updatedBy: this.userId,
        address: "address",
      };

      let direccionResponse;

      // Nota: aquí usas this.direccionesService — asegúrate de inicializarlo en el constructor si lo necesitas.
      if (this.mode === "edit") {
        direccion.addressId = formData.addressId;
        direccionResponse = await this.direccionesService.update(direccion);
      } else if (this.direccionesService) {
        direccion.createdBy = this.userId;
        direccionResponse = await this.direccionesService.create(direccion);
        formData.addressId = direccionResponse.dataResult.addressId;
      }
    } catch (error) {
      this.helper.handleApiError(error);
    }
  }

  async _initValidation() {
    const formEl = document.querySelector(this.elementos.form);
    if (!formEl) return;

    const validate = new JustValidate(this.elementos.form, {
      errorFieldCssClass: "is-invalid",
      errorLabelCssClass: "invalid-feedback",
    });

    // Definimos reglas en un array y las añadimos solo si el selector existe en DOM
    const fields = [
      {
        s: this.elementos.nombreLegalInput,
        rules: [
          { rule: "required", errorMessage: "El nombre legal es obligatorio" },
        ],
      },
      {
        s: this.elementos.rtnInput,
        rules: [{ rule: "required", errorMessage: "El RTN es obligatorio" }],
      },
      {
        s: this.elementos.managerId,
        rules: [
          { rule: "required", errorMessage: "El encargado es obligatorio" },
        ],
      },
      {
        s: this.elementos.correoInput,
        rules: [
          { rule: "required", errorMessage: "El correo es obligatorio" },
          { rule: "email", errorMessage: "Correo inválido" },
        ],
      },
      {
        s: this.elementos.websiteInput,
        rules: [
          { rule: "required", errorMessage: "El sitio web es obligatorio" },
          {
            rule: "customRegexp",
            value: /^https?:\/\/.+\..+$/,
            errorMessage: "Debe ser un sitio web válido",
          },
        ],
      },
      {
        s: this.elementos.logoPathInput,
        rules: [{ rule: "required", errorMessage: "El logo es obligatorio" }],
      },
      {
        s: this.elementos.monedaAltInput,
        rules: [
          {
            rule: "required",
            errorMessage: "La moneda alternativa es obligatoria",
          },
        ],
      },
      {
        s: this.elementos.codigoContable1Input,
        rules: [
          {
            rule: "required",
            errorMessage: "El código contable principal es obligatorio",
          },
        ],
      },
      {
        s: this.elementos.codigoContable2Input,
        rules: [
          {
            rule: "required",
            errorMessage: "El código contable secundario es obligatorio",
          },
        ],
      },
      {
        s: this.elementos.sapCode,
        rules: [
          {
            rule: "required",
            errorMessage: "El código sap es obligatorio",
          },
        ],
      },
      {
        s: this.elementos.direccion1Input,
        rules: [
          { rule: "required", errorMessage: "La dirección 1 es obligatoria" },
        ],
      },
      //  { s: this.elementos.direccion2Input, rules: [{ rule: "required", errorMessage: "La dirección 2 es obligatoria" }] },
      {
        s: this.elementos.countryId,
        rules: [{ rule: "required", errorMessage: "El país es obligatorio" }],
      },
      {
        s: this.elementos.departmentId,
        rules: [
          { rule: "required", errorMessage: "El departamento es obligatorio" },
        ],
      },
      {
        s: this.elementos.codigoPostalInput,
        rules: [
          { rule: "required", errorMessage: "El código postal es obligatorio" },
          {
            rule: "minLength",
            value: 4,
            errorMessage: "Debe tener al menos 4 dígitos",
          },
        ],
      },
      {
        s: this.elementos.phoneInput,
        rules: [
          { rule: "required", errorMessage: "El teléfono es obligatorio" },
        ],
      },
      // { s: this.elementos.calleInput, rules: [{ rule: "required", errorMessage: "La calle es obligatoria" }] },
      // { s: this.elementos.avenidaInput, rules: [{ rule: "required", errorMessage: "La avenida es obligatoria" }] },
    ];

    fields.forEach((f) => {
      if (document.querySelector(f.s)) {
        validate.addField(f.s, f.rules);
      }
    });

    validate.onSuccess((event) => {
      event.preventDefault();
      this._handleSave();
    });

    this.validator = validate;
  }

  _showValidationError(selector, message) {
    const field = document.querySelector(selector);
    if (!field) return;
    field.classList.add("is-invalid");
    const errorDiv = document.createElement("div");
    errorDiv.className = "invalid-feedback";
    errorDiv.textContent = message;
    // evita duplicados
    const next = field.nextElementSibling;
    if (!next || !next.classList.contains("invalid-feedback")) {
      field.parentNode.insertBefore(errorDiv, field.nextSibling);
    }
  }

  _clearValidationErrors() {
    document
      .querySelectorAll(".is-invalid")
      .forEach((el) => el.classList.remove("is-invalid"));
    document.querySelectorAll(".invalid-feedback").forEach((el) => el.remove());
  }

  _toggleProcessingState(isProcessing) {
    this.isProcessing = isProcessing;
    const saveButton = document.querySelector(this.elementos.saveButton);
    if (saveButton) {
      saveButton.disabled = isProcessing;
      saveButton.innerHTML = isProcessing
        ? '<span class="spinner-border spinner-border-sm"></span> Guardando...'
        : '<i class="ki-duotone ki-check fs-2 me-2">...</i> Guardar Cambios';
    }
  }
}

// --- INICIALIZACIÓN ---
document.addEventListener("DOMContentLoaded", () => {
  const sociedadesCreate = new SociedadesCreate();
  sociedadesCreate.init();
});
