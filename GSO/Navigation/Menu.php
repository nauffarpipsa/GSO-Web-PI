<!DOCTYPE html>
<html lang="es">

<!--<div class="app-sidebar-menu overflow-hidden flex-column-fluid" style="border-color: black; border: solid;">-->
    <!--begin::Menu wrapper-->
    <div id="kt_app_sidebar_menu_wrapper" class="app-sidebar-wrapper">
        <!--begin::Scroll wrapper-->
        <div id="kt_app_sidebar_menu_scroll" class="hover-scroll-y my-5 mx-3" data-kt-scroll="true"
            data-kt-scroll-activate="true" data-kt-scroll-height="auto"
            data-kt-scroll-dependencies="#kt_app_sidebar_logo, #kt_app_sidebar_footer"
            data-kt-scroll-wrappers="#kt_app_sidebar_menu" data-kt-scroll-offset="5px"
            data-kt-scroll-save-state="true">
            <!--begin::Menu-->
            <div class="menu menu-column menu-rounded menu-sub-indention fw-semibold"
                id="#kt_app_sidebar_menu" data-kt-menu="true" data-kt-menu-expand="false">
                <?php include 'DynamicMenu.php'; ?>
            </div>
            <!--end::Menu-->
        </div>
        <!--end::Scroll wrapper-->
    </div>
    <!--end::Menu wrapper-->
<!--</div>-->
<script>
    // Configuración de páginas disponibles para el menú de recientes
    const paginasDisponibles = {
        'index.php': 'Home',
        'apps/Cotizaciones/Cotizaciones.php': 'Cotizaciones',
        'apps/OData/ODatas.php': 'Consumir OData',
        'apps/autorizaciones/documentos/documentos.php': 'Documentos',
        'apps/Impresiones/Etiquetas/Etiquetas.php': 'Etiquetas',
        'dashboards/ecommerce.html': 'eCommerce',
        'dashboards/marketing.html': 'Marketing',
        'dashboards/social.html': 'Social',
        'dashboards/bidding.html': 'Bidding',
        'dashboards/online-courses.html': 'Online Courses',
        'dashboards/logistics.html': 'Logistics'
    };

    // Función para guardar una página visitada
    function guardarPaginaVisitada(url, titulo) {
        let paginasRecientes = JSON.parse(localStorage.getItem('paginasRecientes') || '[]');
        
        // Remover si ya existe
        paginasRecientes = paginasRecientes.filter(pagina => pagina.url !== url);
        
        // Agregar al inicio
        paginasRecientes.unshift({ url: url, titulo: titulo, fecha: new Date().toISOString() });
        
        // Mantener solo las 5 más recientes
        paginasRecientes = paginasRecientes.slice(0, 5);
        
        localStorage.setItem('paginasRecientes', JSON.stringify(paginasRecientes));
    }

    // Función para cargar el menú de recientes
    function cargarMenuRecientes() {
        const menuRecientes = document.getElementById('recientes-menu');
        if (!menuRecientes) return;

        const paginasRecientes = JSON.parse(localStorage.getItem('paginasRecientes') || '[]');
        
        if (paginasRecientes.length === 0) {
            // Mostrar mensaje si no hay páginas recientes
            menuRecientes.innerHTML = `
                <div class="menu-item">
                    <div class="menu-content">
                        <span class="menu-title text-muted">No hay páginas recientes</span>
                    </div>
                </div>
            `;
            return;
        }

        menuRecientes.innerHTML = '';
        
        paginasRecientes.forEach(pagina => {
            const menuItem = document.createElement('div');
            menuItem.className = 'menu-item';
            menuItem.innerHTML = `
                <a class="menu-link" href="${pagina.url}">
                    <span class="menu-bullet">
                        <span class="bullet bullet-dot"></span>
                    </span>
                    <span class="menu-title">${pagina.titulo}</span>
                </a>
            `;
            menuRecientes.appendChild(menuItem);
        });
    }

    // Función para detectar y guardar la página actual
    function detectarPaginaActual() {
        const currentPath = window.location.pathname;
        const currentUrl = window.location.href;
        
        // Buscar la página actual en las páginas disponibles
        for (const [url, titulo] of Object.entries(paginasDisponibles)) {
            if (currentPath.includes(url) || currentUrl.includes(url)) {
                guardarPaginaVisitada(url, titulo);
                break;
            }
        }
    }

    document.addEventListener('DOMContentLoaded', function() {
        // Detectar y guardar la página actual
        detectarPaginaActual();
        
        // Cargar el menú de recientes
        cargarMenuRecientes();
        
        // Obtener la URL actual
        const currentPath = window.location.pathname;
        
        // Buscar todos los enlaces del menú
        const menuLinks = document.querySelectorAll('.menu-link[href]');
        
        // Iterar sobre los enlaces
        menuLinks.forEach(link => {
            const href = link.getAttribute('href');
            // Si la URL actual contiene la ruta del enlace
            if (currentPath.includes(href)) {
                // Marcar el enlace como activo
                link.classList.add('active');
                
                // Marcar el elemento padre del menú como activo
                const parentMenuItem = link.closest('.menu-item');
                if (parentMenuItem) {
                    parentMenuItem.classList.add('active');
                }
                
                // Marcar el elemento padre del submenú como activo
                const parentSubMenu = link.closest('.menu-sub');
                if (parentSubMenu) {
                    parentSubMenu.classList.add('show');
                }
                
                // Marcar el elemento padre del menú principal como activo
                const parentMainMenu = link.closest('.menu-accordion');
                if (parentMainMenu) {
                    parentMainMenu.classList.add('show');
                    // Marcar el span.menu-link del menú principal como activo
                    const mainMenuLink = parentMainMenu.querySelector('span.menu-link');
                    if (mainMenuLink) {
                        mainMenuLink.classList.add('active');
                    }
                }
            }
        });
    });

    // Actualizar el menú cuando se navega a una nueva página
    window.addEventListener('beforeunload', function() {
        detectarPaginaActual();
    });
</script>