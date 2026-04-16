export class Helper {
  MessageSucces(message) {
    Swal.fire({
      text: message,
      icon: "success",
      buttonsStyling: false,
      confirmButtonText: "Ok, got it!",
      customClass: {
        confirmButton: "btn btn-primary",
      },
    });
  }

  MessageWarning(message) {
    Swal.fire({
      text: message,
      icon: "warning",
      buttonsStyling: false,
      confirmButtonText: "Ok, got it!",
      customClass: {
        confirmButton: "btn btn-primary",
      },
    });
  }

  MessageError(message) {
    Swal.fire({
      text: message,
      icon: "error",
      buttonsStyling: false,
      confirmButtonText: "Ok, got it!",
      customClass: {
        confirmButton: "btn btn-primary",
      },
    });
  }

  async MessageQuestion(message) {
    var result;
    await Swal.fire({
      title: "Advertencia?",
      text: message,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#30d64cff",
      cancelButtonColor: "#d33",
      confirmButtonText: "Si!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        this.result = result.isConfirmed;
      }
      return this.result;
    });
    return this.result;
  }

  ToastSucces(message) {
    toastr.options = {
      closeButton: false,
      debug: false,
      newestOnTop: false,
      progressBar: true,
      positionClass: "toastr-top-right",
      preventDuplicates: false,
      onclick: null,
      showDuration: "300",
      hideDuration: "1000",
      timeOut: "5000",
      extendedTimeOut: "1000",
      showEasing: "swing",
      hideEasing: "linear",
      showMethod: "fadeIn",
      hideMethod: "fadeOut",
    };

    toastr.success(message);
  }

  ToastWarning(message) {
    toastr.options = {
      closeButton: false,
      debug: false,
      newestOnTop: false,
      progressBar: true,
      positionClass: "toastr-top-right",
      preventDuplicates: false,
      onclick: null,
      showDuration: "300",
      hideDuration: "1000",
      timeOut: "5000",
      extendedTimeOut: "1000",
      showEasing: "swing",
      hideEasing: "linear",
      showMethod: "fadeIn",
      hideMethod: "fadeOut",
    };

    toastr.warning(message);
  }

  ToastInfo(message) {
    toastr.options = {
      closeButton: false,
      debug: false,
      newestOnTop: false,
      progressBar: true,
      positionClass: "toastr-top-right",
      preventDuplicates: false,
      onclick: null,
      showDuration: "300",
      hideDuration: "1000",
      timeOut: "5000",
      extendedTimeOut: "1000",
      showEasing: "swing",
      hideEasing: "linear",
      showMethod: "fadeIn",
      hideMethod: "fadeOut",
    };

    toastr.info(message);
  }

  ToastDanger(message) {
    toastr.options = {
      closeButton: false,
      debug: false,
      newestOnTop: false,
      progressBar: true,
      positionClass: "toastr-top-right",
      preventDuplicates: false,
      onclick: null,
      showDuration: "300",
      hideDuration: "1000",
      timeOut: "5000",
      extendedTimeOut: "1000",
      showEasing: "swing",
      hideEasing: "linear",
      showMethod: "fadeIn",
      hideMethod: "fadeOut",
    };

    toastr.error(message);
  }

  handleApiError(err) {

    try {
      if (err && err.name === "ApiError") {
        const status = err.status || 0;
        const message = err.message || "Ocurrió un error";

        switch (status) {
          case 0:
            this.MessageError(
              "No se pudo conectar con el servidor. Verifique su conexión."
            );
            break;
          case 400:
            this.MessageWarning(message);
            break;
          case 401:
            this.MessageWarning(
              "Sesión expirada o no autorizada. Inicie sesión nuevamente."
            );
            break;
          case 403:
            this.ToastInfo(
              message || "No tiene permisos para realizar esta acción."
            );
            break;
          case 404:
            this.ToastInfo(message || "Recurso no encontrado.");
            break;
          case 409:
            this.MessageWarning(message || "Conflicto en la operación.");
            break;
          case 500:
          default:
            this.MessageError(
              message ||
              "Error interno del servidor. Contacte al administrador."
            );
            break;
        }
        return;
      }

      if (err && err.isAxiosError) {
        if (err.response) {
          const msg =
            err.response.data?.messageResult ||
            err.response.statusText ||
            "Error en la petición";
          this.MessageError(msg);
        } else if (err.request) {
          this.MessageError(
            "No hubo respuesta del servidor. Revise su conexión."
          );
        } else {
          this.MessageError(err.message || "Error inesperado de cliente");
        }
        return;
      }

      this.MessageError(err?.message || "Se produjo un error inesperado.");
    } catch (handlerErr) {
      console.error("Error manejando el error:", handlerErr);
      this.MessageError("Error inesperado al mostrar el error.");
    }
  }



}

// Configurar locale español para Syncfusion
ej.base.setCulture("es-ES");
ej.base.setCurrencyCode("HNL");

// Configuración de fecha y números en español
ej.base.L10n.load({
  "es-ES": {
    grid: {
      EmptyRecord: "No hay registros para mostrar",
      GroupDropArea: "Arrastre una columna aquí para agrupar",
      UnGroup: "Desagrupar",
      GroupDisable: "Agrupación deshabilitada para esta columna",
      FilterbarTitle: "Filtro de celda",
      EmptyDataSourceError:
        "DataSource no puede estar vacío al cargar inicialmente ya que las columnas se generan a partir de dataSource en AutoGenerate Column Grid",
      Add: "Agregar",
      Edit: "Editar",
      Cancel: "Cancelar",
      Update: "Actualizar",
      Delete: "Eliminar",
      Print: "Imprimir",
      Pdfexport: "Exportar PDF",
      Excelexport: "Exportar Excel",
      Wordexport: "Exportar Word",
      Csvexport: "Exportar CSV",
      Search: "Buscar",
      Columnchooser: "Selector de columnas",
      Save: "Guardar",
      Grid: "Tabla",
      ConfirmDelete: "¿Está seguro de que desea eliminar este registro?",
      CancelEdit: "¿Está seguro de que desea cancelar los cambios?",
      ChooseColumns: "Elegir columna",
      SearchColumns: "Buscar columnas",
      Matchs: "No se encontraron coincidencias",
      FilterButton: "Filtro",
      ClearButton: "Limpiar",
      StartsWith: "Comienza con",
      EndsWith: "Termina con",
      Contains: "Contiene",
      Equal: "Igual",
      NotEqual: "No igual",
      LessThan: "Menor que",
      LessThanOrEqual: "Menor o igual que",
      GreaterThan: "Mayor que",
      GreaterThanOrEqual: "Mayor o igual que",
      ChooseDate: "Elegir fecha",
      EnterValue: "Ingrese el valor",
      Copy: "Copiar",
      EditOperationAlert: "No se seleccionaron registros para editar",
      DeleteOperationAlert: "No se seleccionaron registros para eliminar",
      SaveButton: "Guardar",
      OKButton: "OK",
      CancelButton: "Cancelar",
      Yes: "Sí",
      No: "No",
      Close: "Cerrar",
      All: "Todo",
      AllPage: "Todas las páginas",
      CurrentPage: "Página actual",
      Custom: "Personalizado",
      CustomRange: "Rango personalizado",
      Rows: "Filas",
      Columns: "Columnas",
      Page: "Página",
      Of: "de",
      Next: "Siguiente",
      Previous: "Anterior",
      First: "Primero",
      Last: "Último",
      GoToPage: "Ir a página",
      PageSize: "Tamaño de página",
      Items: "Elementos",
      ItemsPerPage: "Elementos por página",
      TotalItems: "Total de elementos",
      TotalPages: "Total de páginas",
      Loading: "Cargando...",
      NoRecords: "No se encontraron registros",
      FilterMenu: "Menú de filtro",
      SortAscending: "Ordenar ascendente",
      SortDescending: "Ordenar descendente",
      ClearFilter: "Limpiar filtro",
      ClearSort: "Limpiar ordenamiento",
      True: "Verdadero",
      False: "Falso",
      SelectAll: "Seleccionar todo",
      UnSelectAll: "Deseleccionar todo",
      SelectRow: "Seleccionar fila",
      UnSelectRow: "Deseleccionar fila",
      SelectCell: "Seleccionar celda",
      UnSelectCell: "Deseleccionar celda",
      SelectColumn: "Seleccionar columna",
      UnSelectColumn: "Deseleccionar columna",
      SelectHeader: "Seleccionar encabezado",
      UnSelectHeader: "Deseleccionar encabezado",
      SelectAllCurrentPage: "Seleccionar todo en página actual",
      UnSelectAllCurrentPage: "Deseleccionar todo en página actual",
      SelectAllPages: "Seleccionar todo en todas las páginas",
      UnSelectAllPages: "Deseleccionar todo en todas las páginas",
      SelectRowRecCount: "Seleccionar fila {0}",
      UnSelectRowRecCount: "Deseleccionar fila {0}",
      SelectCellRecCount: "Seleccionar celda {0}",
      UnSelectCellRecCount: "Deseleccionar celda {0}",
      SelectColumnRecCount: "Seleccionar columna {0}",
      UnSelectColumnRecCount: "Deseleccionar columna {0}",
      SelectHeaderRecCount: "Seleccionar encabezado {0}",
      UnSelectHeaderRecCount: "Deseleccionar encabezado {0}",
      SelectAllCurrentPageRecCount:
        "Seleccionar todo en página actual ({0} registros)",
      UnSelectAllCurrentPageRecCount:
        "Deseleccionar todo en página actual ({0} registros)",
      SelectAllPagesRecCount:
        "Seleccionar todo en todas las páginas ({0} registros)",
      UnSelectAllPagesRecCount:
        "Deseleccionar todo en todas las páginas ({0} registros)",
    },
  },
});
