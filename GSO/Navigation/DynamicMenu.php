<?php
// Usar configuración segura de sesión (HttpOnly cookies)
if (session_status() === PHP_SESSION_NONE) {
    require_once __DIR__ . '/../Login/session_config.php';
}

// Verificar si el usuario está logueado
if (!isset($_SESSION['user'])) {
    echo '<div class="menu-item"><div class="menu-content"><span class="menu-title text-muted">No hay sesión activa</span></div></div>';
    exit;
}

// Mapeo de roles a iconos y URLs
$roleConfig = [
    'Ventas' => [
        'icon' => 'ki-duotone ki-basket fs-2',
        'iconPath' => '<span class="path1"></span><span class="path2"></span><span class="path3"></span>',
        'accessMap' => [
            'Cotizaciones' => 'apps/Cotizaciones/Cotizaciones.php',
            'Clientes' => 'authentication/general/maintenance.html',
            'Pedidos de Venta' => 'authentication/general/maintenance.html',
            'Pedido de Venta Contra Entrega' => 'authentication/general/maintenance.html',
            'Aplicar Pago' => 'authentication/general/maintenance.html',
            'Depositos' => 'authentication/general/maintenance.html',
            'Gestion de Anulacion' => 'authentication/general/maintenance.html',
            'Configuracion de Rutas' => 'authentication/general/maintenance.html'
        ]
    ],
    'Aprobador' => [
        'icon' => 'ki-duotone ki-document fs-2',
        'iconPath' => '<span class="path1"></span><span class="path2"></span>',
        'accessMap' => [
            'Documentos' => 'apps/autorizaciones/documentos/documentos.php'
        ]
    ],
    'Impresiones' => [
        'icon' => 'ki-duotone ki-printer fs-2',
        'iconPath' => '<span class="path1"></span><span class="path2"></span>',
        'accessMap' => [
            'Etiquetas' => 'apps/Impresiones/Etiquetas/Etiquetas.php',
            'Reimpresion' => 'apps/Impresiones/Reimpresion/Documentos.php'
        ]
    ],
    'Consumo de ODatas' => [
        'icon' => 'ki-duotone ki-abstract-26 fs-2',
        'iconPath' => '<span class="path1"></span><span class="path2"></span>',
        'accessMap' => [
            'Consumir OData' => 'apps/OData/ODatas.php'
        ]
        ],
    'Prestamos' => [
        'icon' => 'ki-duotone ki-bank',
        'iconPath' => '<span class="path1"></span><span class="path2"></span>',
        'accessMap' => [
            'Maestro Prestamos' => 'apps/Prestamos/Maestro_Prestamos/Prestamos.php',
            'Configuracion General' => 'apps/Prestamos/Configuracion_General/index.php',
            // Acceso con hijos: clave = descripción del acceso, valor = array descripción hijo => URL
            'Reportes' => [
                'Prestamos Atrasados' => 'apps/Prestamos/Reportes/PrestamosAtrasados.php',
                'Prestamo Cuota del Mes' => 'apps/Prestamos/Reportes/CuotaDelMes.php',
                'Saldos Lineas de creditos' => 'apps/Prestamos/Reportes/SaldosLineasCreditos.php',
                'Reporte por condicion de prestamo' => 'apps/Prestamos/Reportes/CapitalInteresPrestamo.php',
                'Facturas Pendientes de Pago' => 'apps/Prestamos/Reportes/FacturasPendientesPago.php',
                'Facturas de Interes no Provisionado' => 'apps/Prestamos/Reportes/FacturasInteresNoProvisionado.php',
                'Saldo Capital' => 'apps/Prestamos/Reportes/Saldos.php',
                'Detalle de Pagos' => 'apps/Prestamos/Reportes/DetallePagos.php'
            ]
        ]
    ]
    ,
    'Import/Export' => [
        'icon' => 'ki-duotone ki-ship',
        'iconPath' => '<span class="path1"></span><span class="path2"></span>',
        'accessMap' => [
            'Pedidos' => 'authentication/general/maintenance.html'
        ]
    ],
    'Creditos' => [
        'icon' => 'ki-duotone ki-wallet fs-2',
        'iconPath' => '<span class="path1"></span><span class="path2"></span>',
        'accessMap' => [
            'Reportes' => [
                'Estados de Cuenta' => 'apps/Creditos/Reportes/report-selector.php?accessName=Estados de Cuenta'
            ],
            'Tareas' => 'apps/Tareas/Maestro_Tareas/Tareas.php',
        ]   
    ],
    'Configuraciones' => [
        'icon' => 'ki-duotone ki-setting-2 fs-3',
        'iconPath' => '<span class="path1"></span><span class="path2"></span>',
        'accessMap' => [
            'Configuraciones Generales' => 'apps/configuraciones/configuracion_general/configuracion_general.php',
            'Sociedades' => 'apps/configuraciones/Sociedades/sociedades-grid.php',
            'Sedes' => 'apps/configuraciones/Sedes/sedes-grid.php',
            'Autorizaciones' => 'apps/configuraciones/autorizaciones/autorizaciones.php',
            'Usuarios' => 'apps/configuraciones/users/usuario.php',
            'Roles' => 'apps/configuraciones/Roles/Roles.php',
            'Sesiones Activas' => 'admin/sesiones-activas.php',
            'Anuncios' => 'admin/anuncios.php',
            
        ]
    ]
];

// Reponer acceso de Combinaciones en Operaciones
$roleConfig['Operaciones de Inventario'] = [
    'icon' => 'ki-duotone ki-element-11 fs-2',
    'iconPath' => '<span class="path1"></span><span class="path2"></span><span class="path3"></span><span class="path4"></span>',
    'accessMap' => [
        'Combinaciones' => 'apps/Operaciones/Combinaciones/index.php',
    ],
];

/**
 * Genera el HTML de un item de acceso: enlace simple o submenú acordeón si tiene children.
 * $accessMapEntry puede ser string (URL) o array (descripción hijo => URL).
 */
function renderAccessItem($access, $accessMapEntry) {
    $accessName = $access['description'];
    $children = isset($access['children']) && is_array($access['children']) ? $access['children'] : [];
    $hasChildren = count($children) > 0;
    $childMap = is_array($accessMapEntry) ? $accessMapEntry : [];

    if (!$hasChildren) {
        $url = is_string($accessMapEntry) ? $accessMapEntry : '#';
        return '
                            <div class="menu-item">
                                <a class="menu-link" href="' . htmlspecialchars($url) . '">
                                    <span class="menu-bullet">
                                        <span class="bullet bullet-dot"></span>
                                    </span>
                                    <span class="menu-title">' . htmlspecialchars($accessName) . '</span>
                                </a>
                            </div>';
    }

    // Tiene hijos: renderizar como acordeón
    $html = '
                            <div data-kt-menu-trigger="click" class="menu-item menu-accordion">
                                <span class="menu-link">
                                    <span class="menu-bullet">
                                        <span class="bullet bullet-dot"></span>
                                    </span>
                                    <span class="menu-title">' . htmlspecialchars($accessName) . '</span>
                                    <span class="menu-arrow"></span>
                                </span>
                                <div class="menu-sub menu-sub-accordion">';
    foreach ($children as $child) {
        if (empty($child['active'])) {
            continue;
        }
        $childName = $child['description'];
        $childUrl = isset($childMap[$childName]) ? $childMap[$childName] : '#';
        $html .= '
                            <div class="menu-item">
                                <a class="menu-link" href="' . htmlspecialchars($childUrl) . '">
                                    <span class="menu-bullet">
                                        <span class="bullet bullet-dot"></span>
                                    </span>
                                    <span class="menu-title">' . htmlspecialchars($childName) . '</span>
                                </a>
                            </div>';
    }
    $html .= '
                                </div>
                            </div>';
    return $html;
}

// Función para generar el menú dinámicamente
function generateDynamicMenu() {
    global $roleConfig;
    
    $menuHtml = '';
    
    // Menú Home (siempre visible)
    $menuHtml .= '
    <div class="menu-item">
        <a class="menu-link" href="index.php">
            <span class="menu-icon">
                <i class="ki-duotone ki-home fs-2">
                    <span class="path1"></span>
                    <span class="path2"></span>
                </i>
            </span>
            <span class="menu-title">Home</span>
        </a>
    </div>';
    
    // Menú Recientes (siempre visible)
    $menuHtml .= '
    <div data-kt-menu-trigger="click" class="menu-item here show menu-accordion">
        <span class="menu-link">
            <span class="menu-icon">
                <i class="ki-duotone ki-clock fs-2">
                    <span class="path1"></span>
                    <span class="path2"></span>
                </i>
            </span>
            <span class="menu-title">Recientes</span>
            <span class="menu-arrow"></span>
        </span>
        <div class="menu-sub menu-sub-accordion" id="recientes-menu">
            <!-- Los elementos se cargarán dinámicamente con JavaScript -->
        </div>
    </div>';
    
    // Separador
    $menuHtml .= '
    <div class="menu-item pt-5">
        <div class="menu-content">
            <span class="menu-heading fw-bold text-uppercase fs-7">Opciones</span>
        </div>
    </div>';
    
    // Generar menús basados en roles del usuario
    if (isset($_SESSION['roles']) && is_array($_SESSION['roles'])) {
        foreach ($_SESSION['roles'] as $role) {
            if ($role['active'] && isset($role['access']) && is_array($role['access'])) {
                $roleName = $role['description'];
                
                // Verificar si existe configuración para este rol
                if (isset($roleConfig[$roleName])) {
                    $config = $roleConfig[$roleName];
                    
                    $menuHtml .= '
                    <div data-kt-menu-trigger="click" class="menu-item menu-accordion">
                        <span class="menu-link">
                            <span class="menu-icon">
                                <i class="' . $config['icon'] . '">
                                    ' . $config['iconPath'] . '
                                </i>
                            </span>
                            <span class="menu-title">' . htmlspecialchars($roleName) . '</span>
                            <span class="menu-arrow"></span>
                        </span>
                        <div class="menu-sub menu-sub-accordion">';
                    
                    // Generar submenús basados en accesos (soporta hijos desde la respuesta del API)
                    foreach ($role['access'] as $access) {
                        if (empty($access['active'])) {
                            continue;
                        }
                        $accessName = $access['description'];
                        $accessMapEntry = isset($config['accessMap'][$accessName]) ? $config['accessMap'][$accessName] : '#';
                        $menuHtml .= renderAccessItem($access, $accessMapEntry);
                    }
                    
                    $menuHtml .= '
                        </div>
                    </div>';
                }
            }
        }
    }
    
    return $menuHtml;
}

// Generar y mostrar el menú
echo generateDynamicMenu();
?> 