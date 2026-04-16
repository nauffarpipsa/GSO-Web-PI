<?php include("../../Login/validar_sesion.php"); ?>
<script src="../../Login/sessionMonitor.js"></script>
<!DOCTYPE html>
<html lang="es">
<head>
    <base href="../../" />
    <title>Consumir OData - Nauffar Germany</title>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link rel="shortcut icon" href="assets/media/logos/ico.ico" />
    <link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Inter:300,400,500,600,700" />
    <link href="assets/plugins/custom/datatables/datatables.bundle.css" rel="stylesheet" type="text/css" />
    <link href="assets/plugins/global/plugins.bundle.css" rel="stylesheet" type="text/css" />
    <link href="assets/css/style.bundle.css" rel="stylesheet" type="text/css" />
</head>
<body id="kt_app_body" data-kt-app-layout="light-sidebar" data-kt-app-header-fixed="true" data-kt-app-sidebar-enabled="true" data-kt-app-sidebar-fixed="true" data-kt-app-sidebar-hoverable="true" data-kt-app-sidebar-push-header="true" data-kt-app-sidebar-push-toolbar="true" data-kt-app-sidebar-push-footer="true" data-kt-app-toolbar-enabled="true" class="app-default">
    <!--begin::App-->
    <div class="d-flex flex-column flex-root app-root" id="kt_app_root">
        <!--begin::Page-->
        <div class="app-page flex-column flex-column-fluid" id="kt_app_page">
            <!--begin::Header-->
            <div id="kt_app_header" class="app-header">
                <div class="app-container container-fluid d-flex align-items-stretch justify-content-between" id="kt_app_header_container">
                    <div class="d-flex align-items-center d-lg-none ms-n3 me-2" title="Show sidebar menu">
                        <div class="btn btn-icon btn-active-color-primary w-35px h-35px" id="kt_app_sidebar_mobile_toggle">
                            <i class="ki-duotone ki-abstract-14 fs-1">
                                <span class="path1"></span>
                                <span class="path2"></span>
                            </i>
                        </div>
                    </div>
                    <div class="d-flex align-items-center flex-grow-1 flex-lg-grow-0">
                        <?php include("../../Navigation/MobileLogo.php"); ?>
                    </div>
                    <div class="d-flex align-items-stretch justify-content-between flex-lg-grow-1" id="kt_app_header_wrapper">
                        <?php include("../../Navigation/MenuHeader.php"); ?>
                        <div class="app-navbar flex-shrink-0">
                            <?php include("../../Navigation/LoginHeader.php"); ?>
                        </div>
                    </div>
                </div>
            </div>
            <!--end::Header-->
            <!--begin::Wrapper-->
            <div class="app-wrapper flex-column flex-row-fluid" id="kt_app_wrapper">
                <!--begin::Sidebar-->
                <div id="kt_app_sidebar" class="app-sidebar flex-column" data-kt-drawer="true" data-kt-drawer-name="app-sidebar" data-kt-drawer-activate="{default: true, lg: false}" data-kt-drawer-overlay="true" data-kt-drawer-width="225px" data-kt-drawer-direction="start" data-kt-drawer-toggle="#kt_app_sidebar_mobile_toggle">
                    <div class="app-sidebar-logo px-6" id="kt_app_sidebar_logo">
                        <?php include("../../Navigation/Logo.html"); ?>
                    </div>
                    <div class="app-sidebar-menu overflow-hidden flex-column-fluid">
                        <?php include("../../Navigation/Menu.php"); ?>
                    </div>
                </div>
                <!--end::Sidebar-->
                <!--begin::Main-->
                <div class="app-main flex-column flex-row-fluid" id="kt_app_main">
                    <!--begin::Content wrapper-->
                    <div class="d-flex flex-column flex-column-fluid">
                        <!--begin::Toolbar-->
                        <div id="kt_app_toolbar" class="app-toolbar py-3 py-lg-6">
                            <div id="kt_app_toolbar_container" class="app-container container-xxl d-flex flex-stack">
                                <div class="page-title d-flex flex-column justify-content-center flex-wrap me-3">
                                    <h1 class="page-heading d-flex text-dark fw-bold fs-3 flex-column justify-content-center my-0">Consumir OData</h1>
                                </div>
                            </div>
                        </div>
                        <!--end::Toolbar-->
                        <!--begin::Content-->
                        <div id="kt_app_content" class="app-content flex-column-fluid">
                            <div id="kt_app_content_container" class="app-container container-xxl">
                                <!--begin::Card-->
                                <div class="card">
                                    <!--begin::Card header-->
                                    <div class="card-header border-0 pt-6">
                                        <div class="card-title">
                                            <div class="d-flex align-items-center position-relative my-1">
                                                <i class="ki-duotone ki-magnifier fs-3 position-absolute ms-4">
                                                    <span class="path1"></span>
                                                    <span class="path2"></span>
                                                </i>
                                                <input type="text" id="odataUrl" class="form-control form-control-solid w-250px ps-12" placeholder="Ingrese URL OData" />
                                            </div>
                                        </div>
                                        <div class="card-toolbar">
                                            <div class="d-flex justify-content-end" data-kt-user-table-toolbar="base">
                                                <button type="button" class="btn btn-primary" onclick="fetchOData()">
                                                    <i class="ki-duotone ki-cloud-download fs-2">
                                                        <span class="path1"></span>
                                                        <span class="path2"></span>
                                                    </i>
                                                    Consumir OData
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                    <!--end::Card header-->
                                    <!--begin::Card body-->
                                    <div class="card-body py-4">
                                        <!--begin::Table container-->
                                        <div class="table-responsive">
                                            <table class="table align-middle table-row-dashed fs-6 gy-5" id="kt_odata_table">
                                                <thead>
                                                    <tr class="text-start text-muted fw-bold fs-7 text-uppercase gs-0">
                                                        <!-- Las columnas se generarán dinámicamente -->
                                                    </tr>
                                                </thead>
                                                <tbody class="text-gray-600 fw-semibold">
                                                    <!-- Los datos se generarán dinámicamente -->
                                                </tbody>
                                            </table>
                                        </div>
                                        <!--end::Table container-->
                                    </div>
                                    <!--end::Card body-->
                                </div>
                                <!--end::Card-->
                            </div>
                        </div>
                        <!--end::Content-->
                    </div>
                    <!--end::Content wrapper-->
                </div>
                <!--end:::Main-->
            </div>
            <!--end::Wrapper-->
        </div>
        <!--end::Page-->
    </div>
    <!--end::App-->

    <!--begin::Javascript-->
    <script src="assets/plugins/global/plugins.bundle.js"></script>
    <script src="assets/js/scripts.bundle.js"></script>
    <script src="assets/plugins/custom/datatables/datatables.bundle.js"></script>
    <script>
        // Función para mostrar loading
        function showLoading() {
            const loadingDiv = document.createElement('div');
            loadingDiv.id = 'loading-overlay';
            loadingDiv.style.position = 'fixed';
            loadingDiv.style.top = '0';
            loadingDiv.style.left = '0';
            loadingDiv.style.width = '100%';
            loadingDiv.style.height = '100%';
            loadingDiv.style.backgroundColor = 'rgba(0,0,0,0.5)';
            loadingDiv.style.display = 'flex';
            loadingDiv.style.justifyContent = 'center';
            loadingDiv.style.alignItems = 'center';
            loadingDiv.style.zIndex = '9999';
            
            const spinner = document.createElement('div');
            spinner.className = 'spinner-border text-primary';
            spinner.style.width = '3rem';
            spinner.style.height = '3rem';
            
            loadingDiv.appendChild(spinner);
            document.body.appendChild(loadingDiv);
        }

        // Función para ocultar loading
        function hideLoading() {
            const loadingDiv = document.getElementById('loading-overlay');
            if (loadingDiv) {
                loadingDiv.remove();
            }
        }

        function fetchOData() {
            console.log('Función fetchOData iniciada');
            const url = document.getElementById('odataUrl').value;
            console.log('URL ingresada:', url);
            
            if (!url) {
                alert('Por favor ingrese una URL OData válida');
                return;
            }

            // Mostrar loading
            showLoading();

            // Usar el proxy PHP
            const proxyUrl = 'apps/OData/proxy.php?url=' + encodeURIComponent(url);
            console.log('URL del proxy:', proxyUrl);

            fetch(proxyUrl)
            .then(response => {
                console.log('Respuesta recibida:', response);
                if (!response.ok) {
                    throw new Error('Error en la respuesta: ' + response.status);
                }
                return response.json();
            })
            .then(data => {
                console.log('Datos recibidos:', data);
                // Ocultar loading
                hideLoading();

                // Limpiar tabla existente
                const table = document.getElementById('kt_odata_table');
                const thead = table.querySelector('thead tr');
                const tbody = table.querySelector('tbody');
                thead.innerHTML = '';
                tbody.innerHTML = '';

                // Verificar si hay datos
                if (!data.d || !data.d.results || data.d.results.length === 0) {
                    alert('No se encontraron datos');
                    return;
                }

                // Obtener las claves del primer objeto para las columnas
                const firstItem = data.d.results[0];
                const columns = Object.keys(firstItem).filter(key => key !== '__metadata');

                // Crear encabezados de tabla
                columns.forEach(column => {
                    const th = document.createElement('th');
                    th.textContent = column;
                    thead.appendChild(th);
                });

                // Crear filas de datos
                data.d.results.forEach(item => {
                    const tr = document.createElement('tr');
                    columns.forEach(column => {
                        const td = document.createElement('td');
                        let value = item[column] || '';
                        
                        // Formatear fechas
                        if (column === 'CITV_FSTREQ_E_DT' && value.startsWith('/Date(')) {
                            const timestamp = parseInt(value.match(/\d+/)[0]);
                            const date = new Date(timestamp);
                            value = date.toLocaleDateString('es-ES', {
                                year: 'numeric',
                                month: '2-digit',
                                day: '2-digit'
                            });
                        }
                        
                        // Formatear números decimales
                        if (column.startsWith('KCZ') || column === 'KCTV_REQU_QTY_BU') {
                            value = parseFloat(value).toLocaleString('es-ES', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                            });
                        }
                        
                        td.textContent = value;
                        tr.appendChild(td);
                    });
                    tbody.appendChild(tr);
                });

                // Inicializar DataTable con configuración mejorada
                if ($.fn.DataTable.isDataTable('#kt_odata_table')) {
                    $('#kt_odata_table').DataTable().destroy();
                }
                $('#kt_odata_table').DataTable({
                    "language": {
                        "url": "assets/plugins/custom/datatables/i18n/Spanish.json"
                    },
                    "pageLength": 25,
                    "order": [[0, "desc"]],
                    "columnDefs": [
                        { 
                            "targets": [0], 
                            "type": "date",
                            "render": function(data) {
                                return data ? new Date(data).toLocaleDateString('es-ES') : '';
                            }
                        },
                        {
                            "targets": "_all",
                            "className": "text-end"
                        }
                    ],
                    "dom": '<"top"Bf>rt<"bottom"lip><"clear">',
                    "buttons": [
                        'copy', 'excel', 'pdf'
                    ]
                });
            })
            .catch(error => {
                console.error('Error completo:', error);
                hideLoading();
                alert('Error al cargar los datos: ' + error.message);
            });
        }

        // Agregar evento para probar la URL directamente
        document.addEventListener('DOMContentLoaded', function() {
            console.log('Página cargada');
            // Descomentar la siguiente línea para probar con la URL directamente
            document.getElementById('odataUrl').value = 'https://my431112.businessbydesign.cloud.sap/sap/byd/odata/ana_businessanalytics_analytics.svc/RPZ1225669FC96327A397BBE5QueryResults?$select=CITV_FSTREQ_E_DT,CDOC_UUID,CIPR_PRODUCT,TIPR_PRODUCT,KCZ9B5BE914E26DDD3803CCAB,KCZ89F554122B628400F61C00,KCTV_REQU_QTY_BU,KCZ35D17BF56FE4A96EE9A14B,KCZB6CA4C05E1160F786ED30A,KCZBF9E544C6FD849FA9C28C8,KCZ7990244715398DAF889A88,KCZ43448898688DFED120D243,KCZ9C5843DA6EC561EB4FA573&$top=999999&$format=json';
        });
    </script>
    <!--end::Javascript-->
</body>
</html>
