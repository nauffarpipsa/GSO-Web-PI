import { Helper } from "../../helper/helper.js";
import { SociedadService } from "../../sociedades/api/sociedadesService.js";
import { DireccionesService } from "../../direcciones/api/direccionesService.js";
import { CountryService } from "../../country/api/countryService.js";
import { DepartmentService } from "../../department/api/departmentService.js";
import { MunicipalityService } from "../../municipality/api/municipalityService.js";
import { UsuarioService } from "../../users/api/usuarioService.js";
import { UnidadInventarioService } from "../../configuracion_general/api/unidadInventarioService.js";
import { UnidadVentaService } from "../../configuracion_general/api/unidadVentasService.js";
import { SedeService } from "../api/sedesService.js";

export class SedesCreate {
    constructor() {
        this.service = new SedeService();
        this.sociedadService = new SociedadService();
        this.helper = new Helper();
        this.direccionesService = new DireccionesService();
        this.countryService = new CountryService();
        this.departmentService = new DepartmentService();
        this.municipalityService = new MunicipalityService();
        this.usuarioService = new UsuarioService();
        this.unidadInventarioService = new UnidadInventarioService();
        this.unidadVentaService = new UnidadVentaService();

        this.mode = "create";
        this.sedeId = null;
        this.isProcessing = false;
        this.userId = null;

        this.elementos = {
            form: "#formEdicionCompleta",
            formTitle: "#formSedeTitle",
            //sede
            description: "#LegalName",
            costCenter: "#costCenter",
            unidadInventario: "#unidadInventario",
            unidadVenta: "#unidadVenta",
            managerId: "#managerId",
            companyId: "#companyId",
            //direccion
            direccion1Input: "#addressLine1",
            direccion2Input: "#addressLine2",
            countryId: "#countryId",
            departmentId: "#departmentId",
            municipalityId: "#municipalityId",
            codigoPostalInput: "#postalCode",
            Phone: "#phone",
            calleInput: "#street",
            avenidaInput: "#ave",
            saveButton: "#btnGuardarEdicion",
            backButton: "#btnVolver",
            SalesUnitId: 0,
            salesUnitSapCode: "#salesUnitSapCode",
            InventoryUnitId: 0,
            inventoryUnitSapCode: "#inventoryUnitSapCode",
        };
    }

    /**
     * Punto de entrada para inicializar la lógica del formulario.
     */
    async init() {
        this._determineMode();
        this._setupEventListeners();
        const sessionData = await this.usuarioService.getSessionData();
        this.userId = sessionData.userId;

        await this._loadDropdownData();

        if (this.mode === "edit") {
            const title = `Editar Sede #${this.sedeId}`;
            document.title = title;
            document.querySelector(
                this.elementos.formTitle
            ).innerHTML = `<i class="ki-duotone ki-edit fs-2 me-2"><span class="path1"></span><span class="path2"></span></i> ${title}`;
            await this._loadSedeData();
        } else {
            const title = "Crear Nueva Sede";
            document.title = title;
            document.querySelector(
                this.elementos.formTitle
            ).innerHTML = `<i class="ki-duotone ki-plus fs-2 me-2"></i> ${title}`;
        }
    }

    async _loadDropdownData() {
        // Aquí puedes cargar datos para los dropdowns si es necesario
        try {
            const countriesResponse = await this.countryService.getAll();
            const countries = countriesResponse.dataResult || [];
            const countrySelect = document.querySelector(this.elementos.countryId);
            countrySelect.innerHTML =
                '<option value="">Seleccionar un país...</option>';
            countries.forEach((country) => {
                const option = document.createElement("option");
                option.value = country.countryId;
                option.textContent = country.name;
                countrySelect.appendChild(option);
            });


            const companyResponse = await this.sociedadService.getAll();
            const companies = companyResponse.dataResult || [];
            const companySelect = document.querySelector(this.elementos.companyId);
            companySelect.innerHTML =
                '<option value="">Seleccionar un sociedad...</option>';
            companies.forEach((country) => {
                const option = document.createElement("option");
                option.value = country.companyId;
                option.textContent = country.legalName;
                companySelect.appendChild(option);
            });


            const usersResponse = await this.usuarioService.getAll();
            const users = usersResponse.dataResult || [];
            const userSelect = document.querySelector(this.elementos.managerId);
            userSelect.innerHTML =
                '<option value="">Seleccionar un usuario...</option>';
            users.forEach((user) => {
                const option = document.createElement("option");
                option.value = user.userId;
                option.textContent = user.firstName + " " + user.lastName;
                userSelect.appendChild(option);
            });
        } catch (error) {
            // this.helper.handleApiError(error);
        }
    }

    async loadDepartmentData() {
        try {
            const countryId = document.querySelector(this.elementos.countryId).value;
            const departmentsResponse = await this.departmentService.getById(
                countryId
            );
            const departments = departmentsResponse.dataResult || [];
            const departmentSelect = document.querySelector(
                this.elementos.departmentId
            );
            departmentSelect.innerHTML =
                '<option value="">Seleccionar un estado...</option>';
            departments.forEach((dept) => {
                const option = document.createElement("option");
                option.value = dept.departmentId;
                option.textContent = dept.description;
                departmentSelect.appendChild(option);
            });
        } catch (error) {
            // this.helper.handleApiError(error);
        }
    }

    async loadMunicipalityData(id) {
        try {
            const departmentId =
                document.querySelector(this.elementos.departmentId).value || id;
            const countryId = document.querySelector(this.elementos.countryId).value;
            const municipalitiesResponse = await this.municipalityService.getById(
                countryId,
                departmentId
            );
            const municipalities = municipalitiesResponse.dataResult || [];
            const municipalitySelect = document.querySelector(
                this.elementos.municipalityId
            );
            municipalitySelect.innerHTML =
                '<option value="">Seleccionar un municipio...</option>';
            municipalities.forEach((municipality) => {
                const option = document.createElement("option");
                option.value = municipality.municipalityId;
                option.textContent = municipality.description;
                municipalitySelect.appendChild(option);
            });
        } catch (error) {
            // this.helper.handleApiError(error);
        }
    }

    _determineMode() {
        const params = new URLSearchParams(window.location.search);
        const id = params.get("id");
        if (id) {
            this.mode = "edit";
            this.sedeId = id;
        }
    }

    /**
     * Carga los datos de la sede existente y rellena el formulario.
     */
    async _loadSedeData() {
        try {
            const response = await this.service.getById(this.sedeId);
            const responseDireccion = await this.direccionesService.getById(
                response.dataResult[0].addressId
            );
            if (response && response.dataResult) {
                this._populateForm(
                    response.dataResult[0],
                    responseDireccion.dataResult
                );
            } else {
                throw new Error("No se encontraron datos para esta sede.");
            }
        } catch (error) {
            // this.helper.handleApiError(error);
            // Opcional: deshabilitar el formulario si no se pueden cargar los datos
            document.querySelector(this.elementos.saveButton).disabled = true;
        }
    }

    /**
     * Rellena los campos del formulario con los datos proporcionados.
     * @param {object} data - Los datos de la sede.
     */
    async _populateForm(data, direccionData) {

        document.querySelector(this.elementos.description).value =
            data.description || "";
        document.querySelector(this.elementos.costCenter).value =
            data.costCenter || "";
        document.querySelector(this.elementos.managerId).value =
            data.managerId || "";
        document.querySelector(this.elementos.companyId).value =
            data.companyId || "";
        document.querySelector(this.elementos.countryId).value =
            data.countryId || "";

        if (data.countryId) {
            await this.chargeDDL(data.departmentId);
        }

        document.querySelector(this.elementos.departmentId).value =
            data.departmentId.toString();
        document.querySelector(this.elementos.municipalityId).value =
            data.municipalityId.toString();

        // Los demás campos
        document.querySelector(this.elementos.direccion1Input).value =
            direccionData.addressLine1 || "";
        document.querySelector(this.elementos.direccion2Input).value =
            direccionData.addressLine2 || "";
        document.querySelector(this.elementos.codigoPostalInput).value =
            direccionData.postalCode || "";
        document.querySelector(this.elementos.calleInput).value =
            direccionData.street || "";
        document.querySelector(this.elementos.avenidaInput).value =
            direccionData.avenue || "";
        // document.querySelector(this.elementos.Phone).value =
        //   direccionData.phone || "00000000";

        this.elementos.InventoryUnitId = data.inventoryUnitId || 0;
        document.querySelector(this.elementos.unidadInventario).value =
            data.inventoryUnit || "";
        document.querySelector(this.elementos.inventoryUnitSapCode).value =
            data.inventoryUnitSapCode || "";

        this.elementos.SalesUnitId = data.salesUnitId || 0;
        document.querySelector(this.elementos.unidadVenta).value =
            data.salesUnit || "";
        document.querySelector(this.elementos.salesUnitSapCode).value =
            data.salesUnitSapCode || "";
    }

    async chargeDDL(id) {
        await this.loadDepartmentData();
        await this.loadMunicipalityData(id);
    }

    /**
     * Configura los listeners de eventos, como el clic del botón de guardar.
     */
    _setupEventListeners() {
        const saveButton = document.querySelector(this.elementos.saveButton);
        // const backButton = document.querySelector(this.elementos.backButton);
        const countrySelect = document.querySelector(this.elementos.countryId);
        const departmentSelect = document.querySelector(
            this.elementos.departmentId
        );

        countrySelect.addEventListener("change", () => {
            this.loadDepartmentData();
        });

        departmentSelect.addEventListener("change", () => {
            this.loadMunicipalityData();
        });

        saveButton.addEventListener("click", (event) => {
            event.preventDefault();
            this._handleSave();
        });

        // // <-- CAMBIO AQUÍ: Listener para el botón de volver
        // backButton.addEventListener("click", () => {
        //     window.history.back();
        // });
    }

    /**
     * Orquesta el proceso de guardado: valida, recolecta datos y llama al servicio.
     */
    async _handleSave() {
        if (this.isProcessing) return;

        this._clearValidationErrors();

        if (!this._validateForm()) {
            this.helper.ToastWarning(
                "Por favor, corrige los errores marcados en el formulario."
            );
            return;
        }

        this._toggleProcessingState(true);
        const formData = this._getFormData();

        try {
            var response;
            if (this.mode === "edit") {
                await this._handleDireccionSave(formData);
                response = await this.service.update(formData);
                await this._handleUnidadVentasSave(formData);
                await this._handleUnidadInventarioSave(formData);
            } else {
                await this._handleDireccionSave(formData);
                response = await this.service.create(formData);
                formData.branchId = response.dataResult.branchId;
                await this._handleUnidadVentasSave(formData);
                await this._handleUnidadInventarioSave(formData);
            }
            this.helper.MessageSucces(response.messageResult);

            setTimeout(
                () =>
                    (window.location.href = "apps/configuraciones/sedes/sedes-grid.php"),
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
                stateProvince: formData.state,
                phone: "9999-9999",
                pbx: "pbx",
                postalCode: formData.zipCode,
                street: formData.street,
                avenue: formData.avenue,
                updatedBy: this.userId,
            };

            let direccionResponse;

            if (this.mode === "edit" && formData.addressId) {
                direccion.addressId = formData.addressId;
                direccionResponse = await this.direccionesService.update(direccion);
            } else {
                direccion.createdBy = this.userId;
                direccionResponse = await this.direccionesService.create(direccion);
                formData.addressId = direccionResponse.dataResult.addressId;
            }
        } catch (error) {
            this.helper.handleApiError(error);
        }
    }

    async _handleUnidadVentasSave(formData) {
        try {

            let unidadVentas = {
                SalesUnitId: this.elementos.SalesUnitId,
                SapCode: formData.salesUnitSapCode || "N/A",
                description: formData.unidadVenta || "N/A",
                branchId: formData.branchId,
                createdBy: this.userId,
            };
            if (this.mode === "edit") {
                this.unidadVentaService.update(unidadVentas);
            } else {
                this.unidadVentaService.create(unidadVentas);
            }
        } catch (error) {
            this.helper.handleApiError(error);
        }
    }

    async _handleUnidadInventarioSave(formData) {
        try {

            let unidadInventario = {
                InventoryUnitId: this.elementos.InventoryUnitId,
                SapCode: formData.inventoryUnitSapCode || "N/A",
                description: formData.unidadInventario || "N/A",
                branchId: formData.branchId ,
                createdBy: this.userId,
            };

            if (this.mode === "edit") {
                this.unidadInventarioService.update(unidadInventario);
            } else {
                this.unidadInventarioService.create(unidadInventario);
            }
        } catch (error) {
            this.helper.handleApiError(error);
        }
    }

    /**
     * Recolecta los datos de los campos del formulario y los devuelve como un objeto.
     * @returns {object}
     */
    _getFormData() {
        return {
            branchId: this.sedeId || 0,
            description: document
                .querySelector(this.elementos.description)
                .value.trim(),
            costCenter: document
                .querySelector(this.elementos.costCenter)
                .value.trim(),
            managerId: document.querySelector(this.elementos.managerId).value,
            companyId: document.querySelector(this.elementos.companyId).value,
            addressLine1: document
                .querySelector(this.elementos.direccion1Input)
                .value.trim(),
            addressLine2: document
                .querySelector(this.elementos.direccion2Input)
                .value.trim(),
            countryId: document.querySelector(this.elementos.countryId).value,
            municipalityId: document.querySelector(this.elementos.municipalityId)
                .value,
            state: document.querySelector(this.elementos.departmentId).value.trim(),
            zipCode: document
                .querySelector(this.elementos.codigoPostalInput)
                .value.trim(),
            // phone: document.querySelector(this.elementos.Phone).value.trim(),
            street: document.querySelector(this.elementos.calleInput).value.trim(),
            avenue: document.querySelector(this.elementos.avenidaInput).value.trim(),

            unidadInventario: document
                .querySelector(this.elementos.unidadInventario)
                .value.trim(),
            inventoryUnitSapCode: document
                .querySelector(this.elementos.inventoryUnitSapCode)
                .value.trim(),

            unidadVenta: document
                .querySelector(this.elementos.unidadVenta)
                .value.trim(),
            salesUnitSapCode: document
                .querySelector(this.elementos.salesUnitSapCode)
                .value.trim(),
        };
    }

    // ...existing code...
    /**
     * Valida los campos requeridos del formulario.
     * @returns {boolean} - True si el formulario es válido, false en caso contrario.
     */
    _validateForm() {
        let isValid = true;

        // Validar nombre de la sede
        const nombreSede = document
            .querySelector(this.elementos.description)
            .value.trim();

        if (nombreSede === "") {
            this._showValidationError(
                this.elementos.description,
                "El nombre de la sede es obligatorio."
            );
            isValid = false;
        }

        const costCenter = document
            .querySelector(this.elementos.costCenter)
            .value.trim();

        if (costCenter === "") {
            this._showValidationError(
                this.elementos.costCenter,
                "El centro de costo es obligatorio."
            );
            isValid = false;
        }

        // Validar encargado de sede
        const encargado = document.querySelector(this.elementos.managerId).value;

        if (encargado === "") {
            this._showValidationError(
                this.elementos.managerId,
                "Debe seleccionar un encargado."
            );
            isValid = false;
        }

        // Validar sede
        const sede = document.querySelector(this.elementos.companyId).value;
        if (sede === "") {
            this._showValidationError(
                this.elementos.companyId,
                "Debe seleccionar una sede."
            );
            isValid = false;
        }

        // Validar dirección 1
        const direccion1 = document
            .querySelector(this.elementos.direccion1Input)
            .value.trim();
        if (direccion1 === "") {
            this._showValidationError(
                this.elementos.direccion1Input,
                "La dirección 1 es obligatoria."
            );
            isValid = false;
        }

        // Validar país
        const pais = document.querySelector(this.elementos.countryId).value;
        if (pais === "") {
            this._showValidationError(
                this.elementos.countryId,
                "Debe seleccionar un país."
            );
            isValid = false;
        }

        // const Phone = document.querySelector(this.elementos.Phone).value;
        // if (Phone === "") {
        //   this._showValidationError(
        //     this.elementos.Phone,
        //     "Debe seleccionar un teléfono."
        //   );
        //   isValid = false;
        // }
        const PostalCode = document.querySelector(
            this.elementos.codigoPostalInput
        ).value;
        if (PostalCode === "") {
            this._showValidationError(
                this.elementos.codigoPostalInput,
                "Debe seleccionar un código postal."
            );
            isValid = false;
        }

        // Validar estado
        const estado = document
            .querySelector(this.elementos.departmentId)
            .value.trim();
        if (estado === "") {
            this._showValidationError(
                this.elementos.departmentId,
                "El estado es obligatorio."
            );
            isValid = false;
        }

        return isValid;
    }
    // ...existing code...

    /**
     * Muestra un mensaje de error de validación debajo de un campo específico.
     * @param {string} selector - El selector del campo del formulario.
     * @param {string} message - El mensaje de error a mostrar.
     */
    _showValidationError(selector, message) {
        const field = document.querySelector(selector);
        field.classList.add("is-invalid");

        const errorDiv = document.createElement("div");
        errorDiv.className = "invalid-feedback"; // Bootstrap se encargará de mostrarlo
        errorDiv.textContent = message;

        // Insertar el mensaje después del campo
        field.parentNode.insertBefore(errorDiv, field.nextSibling);
    }

    /**
     * Elimina todos los mensajes de error de validación del formulario.
     */
    _clearValidationErrors() {
        document
            .querySelectorAll(".is-invalid")
            .forEach((el) => el.classList.remove("is-invalid"));
        document.querySelectorAll(".invalid-feedback").forEach((el) => el.remove());
    }

    /**
     * Habilita/deshabilita el botón de guardado y muestra un spinner.
     * @param {boolean} isProcessing - El estado de procesamiento.
     */
    _toggleProcessingState(isProcessing) {
        this.isProcessing = isProcessing;
        const saveButton = document.querySelector(this.elementos.saveButton);
        if (saveButton) {
            saveButton.disabled = isProcessing;
            saveButton.innerHTML = isProcessing ?
                '<span class="spinner-border spinner-border-sm" role="status" aria-hidden="true"></span> Guardando...' :
                "Guardar Cambios";
        }
    }
}

// --- INICIALIZACIÓN ---
document.addEventListener("DOMContentLoaded", () => {
    const sedeCreate = new SedesCreate();
    sedeCreate.init();
});