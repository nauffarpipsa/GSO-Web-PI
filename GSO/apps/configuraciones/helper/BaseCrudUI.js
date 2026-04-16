// BaseCrudUI.js
// Clase base para UIs CRUD con modal + grid + validation (JustValidate) + safeCall
export class BaseCrudUI {
  constructor() {
    this.service = this.getService(); // subclass must implement
    this.helper = this.getHelper
      ? this.getHelper()
      : window.Helper
      ? new window.Helper()
      : null;
    this.grid = null;
    this.validator = null;
    this.isProcessing = false;
    this.modoEdicion = false;
    this.registroActualId = null;

    this.elementos = this.getSelectors(); // subclass must implement
  }

  // -------------------------
  // Métodos que el subclass debe implementar
  // -------------------------
  getService() {
    throw new Error("getService() must be implemented by subclass");
  }
  getSelectors() {
    throw new Error("getSelectors() must be implemented by subclass");
  }
  getGridColumns() {
    return [];
  } // opcionalmente sobreescribir
  getValidationFields() {
    return [];
  } // [{ s: selector, rules: [...] }]
  getFormData() {
    throw new Error("getFormData() must be implemented by subclass");
  }
  populateForm(data) {
    /* fill form inputs */
  }
  onSaved(response) {
    /* optional hook after save */
  }

  // -------------------------
  // Inicialización
  // -------------------------
  init() {
    document.addEventListener("DOMContentLoaded", () => {
      if (!document.querySelector(this.elementos.grid)) return;
      this._createGrid();
      this._loadData();
      this._setupEventListeners();
      // validation will be initialised when opening modal
    });
  }

  // -------------------------
  // Grid
  // -------------------------
  _createGrid() {
    const gridConfig = {
      dataSource: [],
      columns: this.getGridColumns(),
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
      const resp = await this._safeCall(() => this.service.getAll());
      if (this.grid) this.grid.dataSource = resp.dataResult || [];
    } catch (err) {
      /* _safeCall ya maneja helper.handleApiError */
    }
  }

  // -------------------------
  // Eventos globales
  // -------------------------
  _setupEventListeners() {
    // Agregar nuevo registro → llamamos directamente al modal (no dependemos de this.agregar)
    document
      .querySelector(this.elementos.btnAgregar)
      ?.addEventListener("click", () => {
        this._showModal(false);
      });

    // Delegación para editar/eliminar desde los botones del grid (se espera data-record)
    const gridContainer = document.querySelector(this.elementos.grid);
    if (gridContainer) {
      const self = this; // referencia segura a la instancia

      gridContainer.addEventListener("click", (e) => {
        // Edit
        const editBtn = e.target.closest(".btn-edit");
        if (editBtn) {
          const recStr = editBtn.getAttribute("data-record");
          if (recStr) {
            try {
              const registro = JSON.parse(decodeURIComponent(recStr));
              if (typeof self.editar === "function") {
                self.editar(registro);
              } else {
                // fallback: abrir modal con el registro
                self._showModal(true, registro);
              }
            } catch (err) {
              console.error("Error parseando data-record (edit):", err, recStr);
            }
          } else {
            // si usas data-id en vez de data-record, puedes implementar fallback aquí
            const id = editBtn.dataset.id ?? editBtn.getAttribute("data-id");
            if (id) {
              if (typeof self.editar === "function") {
                self.editar(Number(id));
              } else {
                const registro = self._findRecordById(Number(id));
                if (registro) self._showModal(true, registro);
              }
            }
          }
          return;
        }

        // Delete
        const deleteBtn = e.target.closest(".btn-delete");
        if (deleteBtn) {
          const recStr = deleteBtn.getAttribute("data-record");
          if (recStr) {
            try {
              const registro = JSON.parse(decodeURIComponent(recStr));
              // llamar eliminar con el objeto completo (el método eliminar del base acepta id o registro)
              if (typeof self.eliminar === "function") {
                self.eliminar(registro);
              } else if (typeof self.onDelete === "function") {
                self.onDelete(registro);
              } else {
                console.warn(
                  "No existe eliminar() ni onDelete(); implementa uno de ellos para manejar la eliminación."
                );
              }
            } catch (err) {
              console.error(
                "Error parseando data-record (delete):",
                err,
                recStr
              );
            }
          } else {
            const id =
              deleteBtn.dataset.id ?? deleteBtn.getAttribute("data-id");
            if (id) {
              if (typeof self.eliminar === "function") {
                self.eliminar(Number(id));
              } else if (typeof self.onDelete === "function") {
                self.onDelete(Number(id));
              }
            }
          }
          return;
        }
      });
    }

    // Botón Guardar -> dispara submit del form para que JustValidate lo capture
    const saveBtn = document.querySelector(this.elementos.btnGuardar);
    const formEl = document.querySelector(this.elementos.form);
    if (saveBtn && formEl) {
      saveBtn.addEventListener("click", (e) => {
        e.preventDefault();
        if (typeof formEl.requestSubmit === "function") {
          formEl.requestSubmit();
        } else {
          formEl.dispatchEvent(new Event("submit", { cancelable: true }));
        }
      });
    }

    // Cancelar / Close
    [this.elementos.btnCancelar, this.elementos.btnClose].forEach((sel) => {
      document
        .querySelector(sel)
        ?.addEventListener("click", () => this.cerrarModal());
    });

    // Modal lifecycle: autofocus y limpieza al cerrar
    const modalEl = document.querySelector(this.elementos.modal);
    if (modalEl) {
      modalEl.addEventListener("shown.bs.modal", () => {
        const first = document.querySelector(
          this.elementos.firstInputFocus ?? this.elementos.nombreInput
        );
        if (first) first.focus();
      });

      modalEl.addEventListener("hidden.bs.modal", () => {
        if (this.validator && typeof this.validator.destroy === "function") {
          try {
            this.validator.destroy();
          } catch (e) {
            /* ignore */
          }
          this.validator = null;
        }
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

  // -------------------------
  // Modal & mostrar/editar
  // -------------------------
  _showModal(isEdit = false, registro = null) {
    this.modoEdicion = isEdit;
    this.registroActualId =
      registro?.id ?? registro?.authorizationTypeId ?? null;

    const formEl = document.querySelector(this.elementos.form);
    if (!formEl) return;

    formEl.reset();
    if (isEdit && registro) this.populateForm(registro);
    else {
      // default values if subclass provides
      if (typeof this.setDefaultFormValues === "function")
        this.setDefaultFormValues();
    }

    // init validation now that form exists
    this._initValidation();

    const modal = new bootstrap.Modal(
      document.querySelector(this.elementos.modal)
    );
    modal.show();
  }

  cerrarModal() {
    const modalElement = document.querySelector(this.elementos.modal);
    const modal = bootstrap.Modal.getInstance(modalElement);
    if (modal) modal.hide();
  }

  // -------------------------
  // Eliminar (común) - acepta id o registro completo
  // -------------------------
  async eliminar(idOrRecord) {
    if (this.isProcessing) return;
    // extraer id si nos pasaron el registro completo
    const id =
      typeof idOrRecord === "object"
        ? idOrRecord.authorizationTypeId ?? idOrRecord.id
        : idOrRecord;
    if (!id) {
      console.warn(
        "Eliminar: no se pudo resolver id del parámetro:",
        idOrRecord
      );
      return;
    }

    try {
      const confirmado = await this.helper.MessageQuestion?.(
        "¿Está seguro de que desea eliminar este registro?"
      );
      if (!confirmado) return;
      this._toggleProcessingState(true, "Eliminando");
      await this._safeCall(() => this.service.delete(id));
      await this._loadData();
      this.helper.MessageSucces?.("Registro eliminado correctamente");
    } catch (err) {
      console.error("Error eliminar:", err);
    } finally {
      this._toggleProcessingState(false);
    }
  }

  // -------------------------
  // Guardar (create/update) - usa hooks del subclass
  // -------------------------
  async _guardar() {
    if (this.isProcessing) return;
    this._toggleProcessingState(
      true,
      this.modoEdicion ? "Actualizando" : "Guardando"
    );

    const data = this.getFormData(); // subclass debe implementar
    try {
      let resp;
      if (this.modoEdicion) {
        resp = await this._safeCall(() => this.service.update(data));
      } else {
        resp = await this._safeCall(() => this.service.create(data));
      }

      if (resp && resp.statusResult) {
        // cerrar modal
        const modalEl = document.querySelector(this.elementos.modal);
        const modal = bootstrap.Modal.getInstance(modalEl);
        if (modal) modal.hide();

        // reload grid
        await this._loadData();
        this.helper.MessageSucces?.(resp.messageResult || "Operación exitosa");
        if (typeof this.onSaved === "function") this.onSaved(resp);
      } else {
        this.helper.MessageError?.(
          resp?.messageResult || "Error en la operación"
        );
      }
    } catch (err) {
      console.error("Error guardar:", err);
    } finally {
      this._toggleProcessingState(false);
    }
  }

  // -------------------------
  // Validation (JustValidate) + fallback
  // -------------------------
  _initValidation() {
    const formEl = document.querySelector(this.elementos.form);
    if (!formEl) return;
    formEl.setAttribute("novalidate", "true");

    if (this.validator && typeof this.validator.destroy === "function") {
      try {
        this.validator.destroy();
      } catch (e) {}
      this.validator = null;
    }

    const JV =
      window.JustValidate ||
      (typeof JustValidate !== "undefined" ? JustValidate : null);
    if (!JV) {
      formEl.addEventListener(
        "submit",
        (e) => {
          if (!formEl.checkValidity()) {
            e.preventDefault();
            formEl.reportValidity();
            return;
          }
          e.preventDefault();
          this._guardar();
        },
        { once: true }
      );
      return;
    }

    this.validator = new JV(this.elementos.form, {
      errorFieldCssClass: "is-invalid",
      errorLabelCssClass: "invalid-feedback",
      errorLabelStyle: { display: "block", marginTop: ".25rem" },
      focusInvalidField: true,
    });

    // añadir campos desde la configuración que el subclass devuelve
    const fields = this.getValidationFields() || [];
    fields.forEach((f) => {
      if (document.querySelector(f.s)) this.validator.addField(f.s, f.rules);
    });

    this.validator.onSuccess((ev) => {
      ev.preventDefault();
      this._guardar();
    });
  }

  // -------------------------
  // Utilities
  // -------------------------
  async _safeCall(fn) {
    try {
      return await fn();
    } catch (error) {
      if (this.helper && typeof this.helper.handleApiError === "function")
        this.helper.handleApiError(error);
      throw error;
    }
  }

  _toggleProcessingState(isProcessing, label = "Guardar") {
    this.isProcessing = isProcessing;
    const btn = document.querySelector(this.elementos.btnGuardar);
    if (!btn) return;
    btn.disabled = isProcessing;
    btn.innerHTML = isProcessing
      ? `<span class="spinner-border spinner-border-sm"></span> ${label}...`
      : "Guardar";
  }

  // helper: buscar registro por id en grid.dataSource (fallback si usas data-id)
  _findRecordById(id) {
    if (!this.grid || !Array.isArray(this.grid.dataSource)) return null;
    const ds = this.grid.dataSource;
    for (const item of ds) {
      for (const key of Object.keys(item)) {
        if (key.toLowerCase().endsWith("id")) {
          if (String(item[key]) === String(id)) return item;
        }
      }
    }
    return null;
  }
}
