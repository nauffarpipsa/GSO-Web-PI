<?php include("../../Login/validar_sesion.php");
?>
<!DOCTYPE html>
<html lang="es">
  <!--begin::Head-->
  <head>
    <base href="../../" />
    <title>Nueva Cotización - Nauffar Germany</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="shortcut icon" href="assets/media/logos/ico.ico" />
    <!--begin::Fonts(mandatory for all pages)-->
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Inter:300,400,500,600,700" />
    <!--end::Fonts-->
    <!--begin::Vendor Stylesheets(used for this page only)-->
    <link href="assets/plugins/custom/datatables/datatables.bundle.css" rel="stylesheet" type="text/css" />
    <!--end::Vendor Stylesheets-->
    <!--begin::Global Stylesheets Bundle(mandatory for all pages)-->
    <link href="assets/plugins/global/plugins.bundle.css" rel="stylesheet" type="text/css" />
    <link href="assets/css/style.bundle.css" rel="stylesheet" type="text/css" />
    <!--end::Global Stylesheets Bundle-->
  </head>
  <!--end::Head-->
  <!--begin::Body-->
  <body id="kt_app_body" data-kt-app-layout="light-sidebar" data-kt-app-header-fixed="true" data-kt-app-sidebar-enabled="true" data-kt-app-sidebar-fixed="true" data-kt-app-sidebar-hoverable="true" data-kt-app-sidebar-push-header="true" data-kt-app-sidebar-push-toolbar="true" data-kt-app-sidebar-push-footer="true" data-kt-app-toolbar-enabled="true" class="app-default">
    <!--begin::Theme mode setup on page load-->
    <script>
      var defaultThemeMode = "light";
      var themeMode;
      if (document.documentElement) {
        if (document.documentElement.hasAttribute("data-bs-theme-mode")) {
          themeMode = document.documentElement.getAttribute("data-bs-theme-mode");
        } else {
          if (localStorage.getItem("data-bs-theme") !== null) {
            themeMode = localStorage.getItem("data-bs-theme");
          } else {
            themeMode = defaultThemeMode;
          }
        }
        if (themeMode === "system") {
          themeMode = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
        }
        document.documentElement.setAttribute("data-bs-theme", themeMode);
      }
    </script>
    <!--end::Theme mode setup on page load-->
    <!--begin::App-->
    <div class="d-flex flex-column flex-root app-root" id="kt_app_root">
      <!--begin::Page-->
      <div class="app-page flex-column flex-column-fluid" id="kt_app_page">
        <!--begin::Header-->
        <div id="kt_app_header" class="app-header">
          <!--begin::Header container-->
          <div class="app-container container-fluid d-flex align-items-stretch justify-content-between" id="kt_app_header_container">
            <!--begin::sidebar mobile toggle-->
            <div class="d-flex align-items-center d-lg-none ms-n3 me-2" title="Show sidebar menu">
              <div class="btn btn-icon btn-active-color-primary w-35px h-35px" id="kt_app_sidebar_mobile_toggle">
                <i class="ki-duotone ki-abstract-14 fs-1">
                  <span class="path1"></span>
                  <span class="path2"></span>
                </i>
              </div>
            </div>
            <!--end::sidebar mobile toggle-->
            <!--begin::Mobile logo-->
            <div class="d-flex align-items-center flex-grow-1 flex-lg-grow-0">
              <?php include("../../Navigation/MobileLogo.php"); ?>
            </div>
            <!--end::Mobile logo-->
            <!--begin::Header wrapper-->
            <div class="d-flex align-items-stretch justify-content-between flex-lg-grow-1" id="kt_app_header_wrapper">
              <!--begin::Menu wrapper-->
              <?php include("../../Navigation/MenuHeader.php"); ?>
              <!--end::Menu wrapper-->
              <!--begin::Navbar-->
              <div class="app-navbar flex-shrink-0">
                <?php include("../../Navigation/LoginHeader.php"); ?>
              </div>
              <!--end::Navbar-->
            </div>
            <!--end::Header wrapper-->
          </div>
          <!--end::Header container-->
        </div>
        <!--end::Header-->
        <!--begin::Wrapper-->
        <div class="app-wrapper flex-column flex-row-fluid" id="kt_app_wrapper">
          <!--begin::Sidebar-->
          <div id="kt_app_sidebar" class="app-sidebar flex-column" data-kt-drawer="true" data-kt-drawer-name="app-sidebar" data-kt-drawer-activate="{default: true, lg: false}" data-kt-drawer-overlay="true" data-kt-drawer-width="225px" data-kt-drawer-direction="start" data-kt-drawer-toggle="#kt_app_sidebar_mobile_toggle">
            <!--begin::Logo-->
            <div class="app-sidebar-logo px-6" id="kt_app_sidebar_logo">
              <?php include("../../Navigation/Logo.html"); ?>
            </div>
            <!--end::Logo-->
            <!--begin::sidebar menu-->
            <div class="app-sidebar-menu overflow-hidden flex-column-fluid">
              <?php include("../../Navigation/Menu.php"); ?>
            </div>
            <!--end::sidebar menu-->
          </div>
          <!--end::Sidebar-->
          <!--begin::Main-->
          <div class="app-main flex-column flex-row-fluid" id="kt_app_main">
            <!--begin::Content wrapper-->
            <div class="d-flex flex-column flex-column-fluid">
              <!--begin::Toolbar-->
              <div id="kt_app_toolbar" class="app-toolbar py-3 py-lg-6">
                <!--begin::Toolbar container-->
                <div id="kt_app_toolbar_container" class="app-container container-xxl d-flex flex-stack">
                  <!--begin::Page title-->
                  <div class="page-title d-flex flex-column justify-content-center flex-wrap me-3">
                    <!--begin::Title-->
                    <h1 class="page-heading d-flex text-gray-900 fw-bold fs-3 flex-column justify-content-center my-0">
                      Nueva Cotización
                    </h1>
                    <!--end::Title-->
                    <!--begin::Breadcrumb-->
                    <ul class="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0 pt-1">
                      <li class="breadcrumb-item text-muted">
                        <a href="index.php" class="text-muted text-hover-primary">Home</a>
                      </li>
                      <li class="breadcrumb-item">
                        <span class="bullet bg-gray-500 w-5px h-2px"></span>
                      </li>
                      <li class="breadcrumb-item text-muted">Cotizaciones</li>
                      <li class="breadcrumb-item">
                        <span class="bullet bg-gray-500 w-5px h-2px"></span>
                      </li>
                      <li class="breadcrumb-item text-muted">Nueva Cotización</li>
                    </ul>
                    <!--end::Breadcrumb-->
                  </div>
                  <!--end::Page title-->
                  <!--begin::Actions-->
                  <div class="d-flex align-items-center gap-2 gap-lg-3">
                    <a href="apps/Cotizaciones/Cotizaciones.php" class="btn btn-secondary">
                      <i class="ki-duotone ki-arrow-left fs-2"></i>
                      Volver
                    </a>
                    <button type="button" class="btn btn-success" onclick="guardarCotizacion()">
                      <i class="ki-duotone ki-check fs-2"></i>
                      Guardar
                    </button>
                  </div>
                  <!--end::Actions-->
                </div>
                <!--end::Toolbar container-->
              </div>
              <!--end::Toolbar-->
              <!--begin::Content-->
              <div id="kt_app_content" class="app-content flex-column-fluid">
                <!--begin::Content container-->
                <div id="kt_app_content_container" class="app-container container-xxl">
                  
                  <!-- CABECERA DE LA COTIZACIÓN -->
                  <div class="card card-flush mb-6">
                    <div class="card-header">
                      <h3 class="card-title">Datos Generales</h3>
                    </div>
                    <div class="card-body">
                      <div class="row g-6">
                        <!-- Columna Izquierda -->
                        <div class="col-lg-6">
                          <div class="row g-4">
                            <div class="col-md-6">
                              <label class="form-label required">Número de Cotización</label>
                              <input type="text" class="form-control" value="COT-2024-001" readonly />
                            </div>
                            <div class="col-md-6">
                              <label class="form-label required">Fecha</label>
                              <input type="date" class="form-control" value="<?php echo date('Y-m-d'); ?>" />
                            </div>
                            <div class="col-md-6">
                              <label class="form-label required">Cliente</label>
                              <select class="form-select" data-control="select2" data-placeholder="Seleccionar cliente">
                                <option></option>
                                <option value="1">Empresa ABC S.A.</option>
                                <option value="2">Corporación XYZ Ltda.</option>
                                <option value="3">Industrias DEF S.A.</option>
                              </select>
                            </div>
                          </div>
                        </div>
                        <!-- Columna Derecha -->
                        <div class="col-lg-6">
                          <div class="row g-4">
                            <div class="col-md-6">
                              <label class="form-label">Condiciones de Pago</label>
                              <select class="form-select" data-control="select2" data-placeholder="Seleccionar condiciones">
                                <option></option>
                                <option value="contado">Contado</option>
                                <option value="30dias">30 días</option>
                                <option value="60dias">60 días</option>
                                <option value="90dias">90 días</option>
                              </select>
                            </div>
                                                         <div class="col-md-6">
                               <label class="form-label">Vendedor</label>
                               <select class="form-select" data-control="select2" data-placeholder="Seleccionar vendedor">
                                 <option></option>
                                 <option value="1">Juan Pérez</option>
                                 <option value="2">María González</option>
                                 <option value="3">Carlos López</option>
                               </select>
                             </div>
                             <div class="col-md-6">
                               <div class="form-check form-check-custom form-check-solid">
                                 <input class="form-check-input" type="checkbox" id="exonerado_checkbox" />
                                 <label class="form-check-label" for="exonerado_checkbox">
                                   Exonerado
                                 </label>
                               </div>
                             </div>
                           </div>
                         </div>
                       </div>
                       <div class="card-header">
                         <h3 class="card-title">Datos Logísticos</h3>
                       </div>
                       <div class="card-body">
                         <div class="row g-6">
                           <!-- Columna Izquierda -->
                           <div class="col-lg-6">
                             <div class="row g-4">
                               <div class="col-md-6">
                                 <label class="form-label required">Sede Cotiza</label>
                                 <select class="form-select" data-control="select2" data-placeholder="Seleccionar almacén">
                                   <option></option>
                                   <option value="1">Almacén Central</option>
                                   <option value="2">Almacén Norte</option>
                                   <option value="3">Almacén Sur</option>
                                 </select>
                               </div>
                               <div class="col-md-6">
                                 <label class="form-label required">Sede Despacho</label>
                                 <select class="form-select" data-control="select2" data-placeholder="Seleccionar almacén">
                                   <option></option>
                                   <option value="1">Almacén Central</option>
                                   <option value="2">Almacén Norte</option>
                                   <option value="3">Almacén Sur</option>
                                 </select>
                               </div>
                             </div>
                           </div>
                           <!-- Columna Derecha -->
                           <div class="col-lg-6">
                             <div class="row g-4">
                               <div class="col-12">
                                 <label class="form-label">Observaciones</label>
                                 <textarea class="form-control" rows="3" placeholder="Ingrese observaciones adicionales..."></textarea>
                               </div>
                             </div>
                           </div>
                         </div>
                                              </div>
                     </div>
                   </div>

                   <!-- CAMPOS EXONERADO (OCULTO POR DEFECTO) -->
                   <div class="card card-flush mb-6" id="exonerado_fields" style="display: none;">
                     <div class="card-header">
                       <h3 class="card-title">Datos de Exoneración</h3>
                     </div>
                     <div class="card-body">
                       <div class="row g-6">
                         <div class="col-md-4">
                           <label class="form-label required">Orden de Compra</label>
                           <input type="text" class="form-control" placeholder="Ingrese número de orden de compra" />
                         </div>
                         <div class="col-md-4">
                           <label class="form-label required">Constancia</label>
                           <input type="text" class="form-control" placeholder="Ingrese constancia" />
                         </div>
                         <div class="col-md-4">
                           <label class="form-label required">Identificador SAG</label>
                           <input type="text" class="form-control" placeholder="Ingrese identificador SAG" />
                         </div>
                       </div>
                     </div>
                   </div>

                   <!-- DETALLE DE LA COTIZACIÓN CON TABS -->
                  <div class="card card-flush">
                    <div class="card-header">
                      <h3 class="card-title">Detalle de la Cotización</h3>
                    </div>
                    <div class="card-body">
                      <!--begin::Tabs wrapper-->
                      <div class="nav nav-tabs nav-line-tabs nav-line-tabs-2x mb-5 fs-6">
                        <a class="nav-link active" data-bs-toggle="tab" href="#kt_tab_productos">
                          <i class="ki-duotone ki-box fs-2 me-2"></i>
                          Productos
                        </a>
                        <a class="nav-link" data-bs-toggle="tab" href="#kt_tab_servicios">
                          <i class="ki-duotone ki-gear fs-2 me-2"></i>
                          Servicios
                        </a>
                        <a class="nav-link" data-bs-toggle="tab" href="#kt_tab_condiciones">
                          <i class="ki-duotone ki-document fs-2 me-2"></i>
                          Condiciones
                        </a>
                        <a class="nav-link" data-bs-toggle="tab" href="#kt_tab_adjuntos">
                          <i class="ki-duotone ki-paperclip fs-2 me-2"></i>
                          Adjuntos
                        </a>
                      </div>
                      <!--end::Tabs wrapper-->

                      <!--begin::Tab content-->
                      <div class="tab-content" id="myTabContent">
                        <!--begin::Tab pane-->
                        <div class="tab-pane fade show active" id="kt_tab_productos" role="tabpanel">
                          <div class="d-flex justify-content-between align-items-center mb-4">
                            <h4 class="mb-0">Productos</h4>
                            <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modal_agregar_producto">
                              <i class="ki-duotone ki-plus fs-2"></i>
                              Agregar Producto
                            </button>
                          </div>
                          
                          <!-- Tabla de Productos -->
                          <div class="table-responsive">
                            <table class="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3">
                              <thead>
                                <tr class="fw-bold text-muted">
                                  <th class="w-25px">
                                    <div class="form-check form-check-sm form-check-custom form-check-solid">
                                      <input class="form-check-input" type="checkbox" value="1" />
                                    </div>
                                  </th>
                                  <th class="min-w-150px">Producto</th>
                                  <th class="min-w-100px">Cantidad</th>
                                  <th class="min-w-100px">Precio Unit.</th>
                                  <th class="min-w-100px">Descuento</th>
                                  <th class="min-w-100px">Subtotal</th>
                                  <th class="min-w-100px">Acciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td>
                                    <div class="form-check form-check-sm form-check-custom form-check-solid">
                                      <input class="form-check-input" type="checkbox" value="1" />
                                    </div>
                                  </td>
                                  <td>
                                    <div class="d-flex align-items-center">
                                      <div class="symbol symbol-45px me-5">
                                        <img src="assets/media/products/1.png" alt="" />
                                      </div>
                                      <div class="d-flex justify-content-start flex-column">
                                        <a href="#" class="text-dark fw-bold text-hover-primary mb-1 fs-6">Laptop HP Pavilion</a>
                                        <span class="text-muted fw-semibold d-block fs-7">Código: LAP-001</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <input type="number" class="form-control form-control-sm" value="2" min="1" />
                                  </td>
                                  <td>
                                    <input type="number" class="form-control form-control-sm" value="1200.00" step="0.01" />
                                  </td>
                                  <td>
                                    <input type="number" class="form-control form-control-sm" value="5.00" step="0.01" />
                                  </td>
                                  <td>
                                    <span class="fw-bold">$2,280.00</span>
                                  </td>
                                  <td>
                                    <button type="button" class="btn btn-icon btn-sm btn-light-danger">
                                      <i class="ki-duotone ki-trash fs-2"></i>
                                    </button>
                                  </td>
                                </tr>
                                <tr>
                                  <td>
                                    <div class="form-check form-check-sm form-check-custom form-check-solid">
                                      <input class="form-check-input" type="checkbox" value="1" />
                                    </div>
                                  </td>
                                  <td>
                                    <div class="d-flex align-items-center">
                                      <div class="symbol symbol-45px me-5">
                                        <img src="assets/media/products/2.png" alt="" />
                                      </div>
                                      <div class="d-flex justify-content-start flex-column">
                                        <a href="#" class="text-dark fw-bold text-hover-primary mb-1 fs-6">Mouse Inalámbrico</a>
                                        <span class="text-muted fw-semibold d-block fs-7">Código: MOU-002</span>
                                      </div>
                                    </div>
                                  </td>
                                  <td>
                                    <input type="number" class="form-control form-control-sm" value="5" min="1" />
                                  </td>
                                  <td>
                                    <input type="number" class="form-control form-control-sm" value="25.00" step="0.01" />
                                  </td>
                                  <td>
                                    <input type="number" class="form-control form-control-sm" value="0.00" step="0.01" />
                                  </td>
                                  <td>
                                    <span class="fw-bold">$125.00</span>
                                  </td>
                                  <td>
                                    <button type="button" class="btn btn-icon btn-sm btn-light-danger">
                                      <i class="ki-duotone ki-trash fs-2"></i>
                                    </button>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                        <!--end::Tab pane-->

                        <!--begin::Tab pane-->
                        <div class="tab-pane fade" id="kt_tab_servicios" role="tabpanel">
                          <div class="d-flex justify-content-between align-items-center mb-4">
                            <h4 class="mb-0">Servicios</h4>
                            <button type="button" class="btn btn-primary" data-bs-toggle="modal" data-bs-target="#modal_agregar_servicio">
                              <i class="ki-duotone ki-plus fs-2"></i>
                              Agregar Servicio
                            </button>
                          </div>
                          
                          <!-- Tabla de Servicios -->
                          <div class="table-responsive">
                            <table class="table table-row-bordered table-row-gray-100 align-middle gs-0 gy-3">
                              <thead>
                                <tr class="fw-bold text-muted">
                                  <th class="w-25px">
                                    <div class="form-check form-check-sm form-check-custom form-check-solid">
                                      <input class="form-check-input" type="checkbox" value="1" />
                                    </div>
                                  </th>
                                  <th class="min-w-200px">Servicio</th>
                                  <th class="min-w-100px">Cantidad</th>
                                  <th class="min-w-100px">Precio Unit.</th>
                                  <th class="min-w-100px">Subtotal</th>
                                  <th class="min-w-100px">Acciones</th>
                                </tr>
                              </thead>
                              <tbody>
                                <tr>
                                  <td>
                                    <div class="form-check form-check-sm form-check-custom form-check-solid">
                                      <input class="form-check-input" type="checkbox" value="1" />
                                    </div>
                                  </td>
                                  <td>
                                    <div class="d-flex justify-content-start flex-column">
                                      <a href="#" class="text-dark fw-bold text-hover-primary mb-1 fs-6">Instalación de Software</a>
                                      <span class="text-muted fw-semibold d-block fs-7">Servicio técnico especializado</span>
                                    </div>
                                  </td>
                                  <td>
                                    <input type="number" class="form-control form-control-sm" value="1" min="1" />
                                  </td>
                                  <td>
                                    <input type="number" class="form-control form-control-sm" value="150.00" step="0.01" />
                                  </td>
                                  <td>
                                    <span class="fw-bold">$150.00</span>
                                  </td>
                                  <td>
                                    <button type="button" class="btn btn-icon btn-sm btn-light-danger">
                                      <i class="ki-duotone ki-trash fs-2"></i>
                                    </button>
                                  </td>
                                </tr>
                              </tbody>
                            </table>
                          </div>
                        </div>
                        <!--end::Tab pane-->

                        <!--begin::Tab pane-->
                        <div class="tab-pane fade" id="kt_tab_condiciones" role="tabpanel">
                          <div class="row g-6">
                            <div class="col-lg-6">
                              <h4 class="mb-4">Condiciones Comerciales</h4>
                              <div class="mb-4">
                                <label class="form-label">Condiciones de Entrega</label>
                                <textarea class="form-control" rows="3" placeholder="Especificar condiciones de entrega...">Entrega en 5 días hábiles después de la confirmación del pedido.</textarea>
                              </div>
                              <div class="mb-4">
                                <label class="form-label">Condiciones de Pago</label>
                                <textarea class="form-control" rows="3" placeholder="Especificar condiciones de pago...">Pago al contado o transferencia bancaria.</textarea>
                              </div>
                              <div class="mb-4">
                                <label class="form-label">Garantía</label>
                                <textarea class="form-control" rows="3" placeholder="Especificar términos de garantía...">Garantía de 12 meses para productos y 3 meses para servicios.</textarea>
                              </div>
                            </div>
                            <div class="col-lg-6">
                              <h4 class="mb-4">Resumen de Costos</h4>
                              <div class="card card-flush bg-light-primary">
                                <div class="card-body">
                                  <div class="d-flex justify-content-between mb-2">
                                    <span class="fw-semibold">Subtotal Productos:</span>
                                    <span class="fw-bold">$2,405.00</span>
                                  </div>
                                  <div class="d-flex justify-content-between mb-2">
                                    <span class="fw-semibold">Subtotal Servicios:</span>
                                    <span class="fw-bold">$150.00</span>
                                  </div>
                                  <div class="d-flex justify-content-between mb-2">
                                    <span class="fw-semibold">Descuento:</span>
                                    <span class="fw-bold text-danger">-$120.25</span>
                                  </div>
                                  <div class="d-flex justify-content-between mb-2">
                                    <span class="fw-semibold">IGV (18%):</span>
                                    <span class="fw-bold">$438.26</span>
                                  </div>
                                  <hr>
                                  <div class="d-flex justify-content-between">
                                    <span class="fw-bold fs-5">Total:</span>
                                    <span class="fw-bold fs-5">$2,873.01</span>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <!--end::Tab pane-->

                        <!--begin::Tab pane-->
                        <div class="tab-pane fade" id="kt_tab_adjuntos" role="tabpanel">
                          <div class="d-flex justify-content-between align-items-center mb-4">
                            <h4 class="mb-0">Documentos Adjuntos</h4>
                            <button type="button" class="btn btn-primary" onclick="document.getElementById('fileInput').click()">
                              <i class="ki-duotone ki-plus fs-2"></i>
                              Adjuntar Archivo
                            </button>
                            <input type="file" id="fileInput" style="display: none;" multiple />
                          </div>
                          
                          <div class="row g-4">
                            <div class="col-md-6">
                              <div class="card card-flush border border-dashed">
                                <div class="card-body">
                                  <div class="d-flex align-items-center">
                                    <div class="symbol symbol-50px me-4">
                                      <i class="ki-duotone ki-file fs-2x text-primary"></i>
                                    </div>
                                    <div class="d-flex flex-column flex-grow-1">
                                      <a href="#" class="text-dark fw-bold text-hover-primary mb-1">Especificaciones_Tecnicas.pdf</a>
                                      <span class="text-muted fw-semibold d-block fs-7">PDF • 2.5 MB</span>
                                    </div>
                                    <button type="button" class="btn btn-icon btn-sm btn-light-danger">
                                      <i class="ki-duotone ki-trash fs-2"></i>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                            <div class="col-md-6">
                              <div class="card card-flush border border-dashed">
                                <div class="card-body">
                                  <div class="d-flex align-items-center">
                                    <div class="symbol symbol-50px me-4">
                                      <i class="ki-duotone ki-file fs-2x text-success"></i>
                                    </div>
                                    <div class="d-flex flex-column flex-grow-1">
                                      <a href="#" class="text-dark fw-bold text-hover-primary mb-1">Catalogo_Productos.xlsx</a>
                                      <span class="text-muted fw-semibold d-block fs-7">Excel • 1.8 MB</span>
                                    </div>
                                    <button type="button" class="btn btn-icon btn-sm btn-light-danger">
                                      <i class="ki-duotone ki-trash fs-2"></i>
                                    </button>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                        <!--end::Tab pane-->
                      </div>
                      <!--end::Tab content-->
                    </div>
                  </div>
                </div>
                <!--end::Content container-->
              </div>
              <!--end::Content-->
            </div>
            <!--end::Content wrapper-->
          </div>
          <!--end::Main-->
        </div>
        <!--end::Wrapper-->
      </div>
      <!--end::Page-->
    </div>
    <!--end::App-->

    <!-- Modal para Agregar Producto -->
    <div class="modal fade" id="modal_agregar_producto" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered mw-650px">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Agregar Producto</h2>
            <div class="btn btn-icon btn-sm btn-active-light-primary ms-2" data-bs-dismiss="modal" aria-label="Close">
              <i class="ki-duotone ki-cross fs-1">
                <span class="path1"></span>
                <span class="path2"></span>
              </i>
            </div>
          </div>
          <div class="modal-body">
            <div class="row g-4">
              <div class="col-12">
                <label class="form-label required">Buscar Producto</label>
                <select class="form-select" data-control="select2" data-placeholder="Seleccionar producto">
                  <option></option>
                  <option value="1">Laptop HP Pavilion - $1,200.00</option>
                  <option value="2">Mouse Inalámbrico - $25.00</option>
                  <option value="3">Teclado Mecánico - $80.00</option>
                  <option value="4">Monitor 24" - $300.00</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label required">Cantidad</label>
                <input type="number" class="form-control" value="1" min="1" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Descuento (%)</label>
                <input type="number" class="form-control" value="0" min="0" max="100" step="0.01" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary">Agregar Producto</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Modal para Agregar Servicio -->
    <div class="modal fade" id="modal_agregar_servicio" tabindex="-1" aria-hidden="true">
      <div class="modal-dialog modal-dialog-centered mw-650px">
        <div class="modal-content">
          <div class="modal-header">
            <h2>Agregar Servicio</h2>
            <div class="btn btn-icon btn-sm btn-active-light-primary ms-2" data-bs-dismiss="modal" aria-label="Close">
              <i class="ki-duotone ki-cross fs-1">
                <span class="path1"></span>
                <span class="path2"></span>
              </i>
            </div>
          </div>
          <div class="modal-body">
            <div class="row g-4">
              <div class="col-12">
                <label class="form-label required">Servicio</label>
                <select class="form-select" data-control="select2" data-placeholder="Seleccionar servicio">
                  <option></option>
                  <option value="1">Instalación de Software - $150.00</option>
                  <option value="2">Mantenimiento Preventivo - $200.00</option>
                  <option value="3">Capacitación - $300.00</option>
                  <option value="4">Soporte Técnico - $100.00</option>
                </select>
              </div>
              <div class="col-md-6">
                <label class="form-label required">Cantidad</label>
                <input type="number" class="form-control" value="1" min="1" />
              </div>
              <div class="col-md-6">
                <label class="form-label">Precio Unitario</label>
                <input type="number" class="form-control" value="0" step="0.01" />
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button type="button" class="btn btn-light" data-bs-dismiss="modal">Cancelar</button>
            <button type="button" class="btn btn-primary">Agregar Servicio</button>
          </div>
        </div>
      </div>
    </div>

    <!--begin::Javascript-->
    <script>var hostUrl = "assets/";</script>
    <!--begin::Global Javascript Bundle(mandatory for all pages)-->
    <script src="assets/plugins/global/plugins.bundle.js"></script>
    <script src="assets/js/scripts.bundle.js"></script>
    <!--end::Global Javascript Bundle-->
    <!--begin::Vendors Javascript(used for this page only)-->
    <script src="assets/plugins/custom/datatables/datatables.bundle.js"></script>
    <!--end::Vendors Javascript-->
    <!--begin::Custom Javascript(used for this page only)-->
    <script>
      // Función para guardar la cotización
      function guardarCotizacion() {
        // Aquí iría la lógica para guardar la cotización
        alert('Cotización guardada exitosamente');
      }

      // Función para calcular subtotales
      function calcularSubtotal() {
        // Aquí iría la lógica para calcular subtotales
      }

             // Función para mostrar/ocultar campos de exoneración
       function toggleExoneradoFields() {
         const checkbox = document.getElementById('exonerado_checkbox');
         const exoneradoFields = document.getElementById('exonerado_fields');
         
         if (checkbox.checked) {
           exoneradoFields.style.display = 'block';
         } else {
           exoneradoFields.style.display = 'none';
         }
       }

       // Inicializar componentes
       document.addEventListener('DOMContentLoaded', function() {
         // Inicializar Select2
         $('[data-control="select2"]').select2();
         
         // Inicializar tooltips
         var tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
         var tooltipList = tooltipTriggerList.map(function (tooltipTriggerEl) {
           return new bootstrap.Tooltip(tooltipTriggerEl);
         });

         // Agregar evento al checkbox de exonerado
         document.getElementById('exonerado_checkbox').addEventListener('change', toggleExoneradoFields);
       });
    </script>
    <!--end::Custom Javascript-->
    <!--end::Javascript-->
  </body>
  <!--end::Body-->
</html>
