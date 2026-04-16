import { TipoAutorizacion } from "./tipoAutorizaciones.js";
import { Acceso } from "./acceso.js";
import { Acciones } from "./acciones.js";
import { TiposCambio } from "./tiposCambio.js";
import { ReportConfiguration } from "./reportConfiguration.js";

class ConfiguracionGeneral {
  constructor() {
    this.tipoAutorizacion = null;
    this.tipoTransacciones = null;
    this.unidadVentas = null;
    this.UnidadInventario = null;
    this.TipoModuloOperativo = null;
    this.acceso = null;
    this.acciones = null;
    this.tipoCambio = null;
    this.reportConfiguration = null;
    this.init();
  }

  /**
   * Inicializa la pantalla de Configuración General
   */
  init() {
    document.addEventListener("DOMContentLoaded", () => {

      this.validateCreatePermissions();
      // --- Acciones ---
      if (document.querySelector("#accionesGrid")) {
        this.acciones = new Acciones();
      }

      // --- Accesos ---
      if (document.querySelector("#accesosGrid")) {
        this.acceso = new Acceso();
      }

      // --- Tipos de Autorización ---
      if (document.querySelector("#tiposAutorizacionGrid")) {
        this.tipoAutorizacion = new TipoAutorizacion();
      }

      // // --- Tipos de Transacciones ---
      // if (document.querySelector("#tiposTransaccionGrid")) {
      //   this.tipoTransacciones = new TipoTransacciones();
      // }

      // // --- Tipos de UnidadVentas ---
      // if (document.querySelector("#unidadesVentaGrid")) {
      //   this.unidadVentas = new UnidadVentas();
      // }

      // // --- Tipos de UnidadInventario ---
      // if (document.querySelector("#unidadesInventarioGrid")) {
      //   this.UnidadInventario = new UnidadInventario();
      // }

      // // --- Tipos de TipoModuloOperativo ---
      // if (document.querySelector("#tiposModulosOperativosGrid")) {
      //   this.TipoModuloOperativo = new TipoModuloOperativo();
      // }

      // --- Tipos de cambio ---
      if (document.querySelector("#tiposCambioGrid")) {
        this.tipoCambio = new TiposCambio();
      }

      if (document.querySelector("#reportConfigurationGrid")) {
        this.tipoCambio = new ReportConfiguration();
      }
    });
  }

  async validateCreatePermissions() {
    if (!window.permissionHelper) {
      console.warn("PermissionHelper no está disponible. Saltando validación de permisos.");
      return;
    }

    const CREATE_ACTION_ID = 1; // Ajusta este valor si tu ID de acción 'Crear' es diferente

    // Validar botón 'Agregar' para Acciones
    await window.permissionHelper.toggleElementByPermission(
      '#btnAgregarAccion', // El selector CSS del botón
      'Configuraciones Generales',         // Nombre del acceso (módulo)
      CREATE_ACTION_ID    // Identificador de la acción 'Crear'
    );

    // Validar botón 'Agregar' para Accesos
    await window.permissionHelper.toggleElementByPermission(
      '#btnAgregarAcceso',
      'Configuraciones Generales',
      CREATE_ACTION_ID
    );

    // Validar botón 'Agregar' para Tipos de Autorización
    await window.permissionHelper.toggleElementByPermission(
      '#btnAgregarTipoAutorizacion',
      'Configuraciones Generales',
      CREATE_ACTION_ID
    );

    // Validar botón 'Agregar' para Tipo de Cambio
    await window.permissionHelper.toggleElementByPermission(
      '#btnAgregarTipoCambio',
      'Configuraciones Generales',
      CREATE_ACTION_ID
    );
  }

}

// Instancia global accesible desde HTML
const configuracionGeneral = new ConfiguracionGeneral();
window.configuracionGeneral = configuracionGeneral;
const helper = new PermissionHelper();
window.permissionHelper = helper;