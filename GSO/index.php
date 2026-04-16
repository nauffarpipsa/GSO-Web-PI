<?php include 'Login/validar_sesion.php';
include 'utilities/websocket-init.php';
?>
<script src="Login/sessionMonitor.js"></script>
<!DOCTYPE html>

<html lang="es">
<!--begin::Head-->
<head>
	<title>Procesadora de Plásticos Pipsa</title>
	<meta charset="utf-8" />
	<link rel="shortcut icon" href="assets/media/logos/ico.ico" />
	<!--begin::Fonts(mandatory for all pages)-->
	<link rel="stylesheet" href="https://fonts.googleapis.com/css?family=Inter:300,400,500,600,700" />
	<!--end::Fonts-->
	<!--begin::Vendor Stylesheets(used for this page only)-->
	<link href="assets/plugins/custom/fullcalendar/fullcalendar.bundle.css" rel="stylesheet" type="text/css" />
	<link href="assets/plugins/custom/datatables/datatables.bundle.css" rel="stylesheet" type="text/css" />
	<!--end::Vendor Stylesheets-->
	<!--begin::Global Stylesheets Bundle(mandatory for all pages)-->
	<link href="assets/plugins/global/plugins.bundle.css" rel="stylesheet" type="text/css" />
	<link href="assets/css/style.bundle.css" rel="stylesheet" type="text/css" />
	<!--end::Global Stylesheets Bundle-->
	<script>
		// Frame-busting to prevent site from being loaded within a frame without permission (click-jacking) if (window.top != window.self) { window.top.location.replace(window.self.location.href); }
	</script>
	

</head>
<!--end::Head-->
<!--begin::Body-->

<body id="kt_app_body" data-kt-app-layout="light-sidebar" data-kt-app-header-fixed="true"
	data-kt-app-sidebar-enabled="true" data-kt-app-sidebar-fixed="true" data-kt-app-sidebar-hoverable="true"
	data-kt-app-sidebar-push-header="true" data-kt-app-sidebar-push-toolbar="true"
	data-kt-app-sidebar-push-footer="true" data-kt-app-toolbar-enabled="true" class="app-default">
	<!--begin::Theme mode setup on page load-->
	<script>
		var defaultThemeMode = "light";
		var themeMode;
		if (document.documentElement) {
			if (document.documentElement.hasAttribute("data-bs-theme-mode")) {
				themeMode =
					document.documentElement.getAttribute("data-bs-theme-mode");
			} else {
				if (localStorage.getItem("data-bs-theme") !== null) {
					themeMode = localStorage.getItem("data-bs-theme");
				} else {
					themeMode = defaultThemeMode;
				}
			}
			if (themeMode === "system") {
				themeMode = window.matchMedia("(prefers-color-scheme: dark)").matches
					? "dark"
					: "light";
			}
			document.documentElement.setAttribute("data-bs-theme", themeMode);
		}
	</script>
	<!--end::Theme mode setup on page load-->
	<!--begin::App-->
	<div class="d-flex flex-column flex-root app-root" id="kt_app_root" >
		<!--begin::Page-->
		<div class="app-page flex-column flex-column-fluid" id="kt_app_page">
			<!--begin::Header-->
			<div id="kt_app_header" class="app-header">
				<!--begin::Header container-->
				<div class="app-container container-fluid d-flex align-items-stretch justify-content-between"
					id="kt_app_header_container">
					<!--begin::sidebar mobile toggle-->
					<div class="d-flex align-items-center d-lg-none ms-n3 me-2" title="Show sidebar menu">
						<div class="btn btn-icon btn-active-color-primary w-35px h-35px"
							id="kt_app_sidebar_mobile_toggle">
							<i class="ki-duotone ki-abstract-14 fs-1">
								<span class="path1"></span>
								<span class="path2"></span>
							</i>
						</div>
					</div>
					<!--end::sidebar mobile toggle-->
					<!--begin::Mobile logo-->
					<div class="d-flex align-items-center flex-grow-1 flex-lg-grow-0">
						<a href="index.php" class="d-lg-none">
							<img alt="Logo" src="assets/media/logos/images.svg"
								class="theme-light-show h-30px" />
							<img alt="Logo" src="assets/media/logos/images.svg"
								class="theme-dark-show h-30px" />
						</a>
					</div>
					<!--end::Mobile logo-->
					<!--begin::Header wrapper-->
					<div class="d-flex align-items-stretch justify-content-between flex-lg-grow-1"
						id="kt_app_header_wrapper" >
						<!--begin::Menu wrapper-->
						<?php
               
			  			 include("../GSO/Navigation/MenuHeader.php");
 						?>
							<!--end::Menu-->
						</div>
						<!--end::Menu wrapper-->
						<!--begin::Navbar-->
						<div class="app-navbar flex-shrink-0" >
						<?php
               
			  			 include("../GSO/Navigation/LoginHeader.php");
 						?>
						</div>
						<!--end::Navbar-->
					</div>
					<!--end::Header wrapper-->
				</div>
				<!--end::Header container-->
			</div>
			<!--end::Header-->
			<!--begin::Wrapper-->
			<div class="app-wrapper flex-column flex-row-fluid" id="kt_app_wrapper" >
				<!--begin::Sidebar-->
				<div id="kt_app_sidebar" class="app-sidebar flex-column" data-kt-drawer="true"
					data-kt-drawer-name="app-sidebar" data-kt-drawer-activate="{default: true, lg: false}"
					data-kt-drawer-overlay="true" data-kt-drawer-width="225px" data-kt-drawer-direction="start"
					data-kt-drawer-toggle="#kt_app_sidebar_mobile_toggle">
					<!--begin::Logo-->
					<div class="app-sidebar-logo px-6" id="kt_app_sidebar_logo">
					<?php
               
			  			 include("../GSO/Navigation/Logo.html");
 					?>
					</div>
					<!--end::Logo-->
					<!--begin::sidebar menu-->
					<div class="app-sidebar-menu overflow-hidden flex-column-fluid" >
					<?php
               
			   					include("../GSO/Navigation/Menu.php");
			 		?>
					</div>
					<!--end::sidebar menu-->
					<!--begin::Footer-->
					<div class="app-sidebar-footer flex-column-auto pt-2 pb-6 px-6" id="kt_app_sidebar_footer">
						<a href="https://preview.keenthemes.com/html/keen/docs"
							class="btn btn-flex flex-center btn-custom btn-primary overflow-hidden text-nowrap px-0 h-40px w-100"
							data-bs-toggle="tooltip" data-bs-trigger="hover" data-bs-dismiss-="click"
							title="200+ in-house components and 3rd-party plugins">
							<span class="btn-label">Docs & Components</span>
							<i class="ki-duotone ki-document btn-icon fs-2 m-0">
								<span class="path1"></span>
								<span class="path2"></span>
							</i>
						</a>
					</div>
					<!--end::Footer-->
				</div>
				<!--end::Sidebar-->
				<!--begin::Main-->
				<div class="app-main flex-column flex-row-fluid" id="kt_app_main">
					<!--begin::Content wrapper-->
					<div class="d-flex flex-column flex-column-fluid">
						<!--begin::Toolbar-->
						<div id="kt_app_toolbar" class="app-toolbar py-3 py-lg-6">
							<!--begin::Toolbar container-->
							<div id="kt_app_toolbar_container" class="app-container container-fluid d-flex flex-stack">
								<!--begin::Page title-->
								<div class="page-title d-flex flex-column justify-content-center flex-wrap me-3">
									<!--begin::Title-->
									<h1
										class="page-heading d-flex text-gray-900 fw-bold fs-3 flex-column justify-content-center my-0">
										Default
									</h1>
									<!--end::Title-->
									<!--begin::Breadcrumb-->
									<ul class="breadcrumb breadcrumb-separatorless fw-semibold fs-7 my-0 pt-1">
										<!--begin::Item-->
										<li class="breadcrumb-item text-muted">
											<a href="index.php" class="text-muted text-hover-primary">Home</a>
										</li>
										<!--end::Item-->
										<!--begin::Item-->
										<li class="breadcrumb-item">
											<span class="bullet bg-gray-500 w-5px h-2px"></span>
										</li>
										<!--end::Item-->
										<!--begin::Item-->
										<li class="breadcrumb-item text-muted">Dashboards</li>
										<!--end::Item-->
									</ul>
									<!--end::Breadcrumb-->
								</div>
								<!--end::Page title-->
								<!--begin::Actions-->
								<div class="d-flex align-items-center gap-2 gap-lg-3">
									<!--begin::Filter menu-->
									<div class="d-flex">
										<select name="campaign-type" data-control="select2" data-hide-search="true"
											class="form-select form-select-sm bg-body border-body w-175px">
											<option value="Twitter" selected="selected">
												Select Campaign
											</option>
											<option value="Twitter">Twitter Campaign</option>
											<option value="Twitter">Facebook Campaign</option>
											<option value="Twitter">Adword Campaign</option>
											<option value="Twitter">Carbon Campaign</option>
										</select>
										<a href="#" class="btn btn-icon btn-sm btn-success flex-shrink-0 ms-4"
											data-bs-toggle="modal" data-bs-target="#kt_modal_create_campaign">
											<i class="ki-duotone ki-plus fs-2"></i>
										</a>
									</div>
									<!--end::Filter menu-->
									<!--begin::Secondary button-->
									<!--end::Secondary button-->
									<!--begin::Primary button-->
									<!--end::Primary button-->
								</div>
								<!--end::Actions-->
							</div>
							<!--end::Toolbar container-->
						</div>
						<!--end::Toolbar-->
						<!--begin::Content-->
						<div id="kt_app_content" class="app-content flex-column-fluid">
							<!--begin::Content container-->
							<div id="kt_app_content_container" class="app-container container-fluid">
								<!--begin::Maintenance Page-->
								<div class="d-flex flex-column flex-center text-center p-10">
									<!--begin::Wrapper-->
									<div class="card card-flush w-lg-650px py-5">
										<div class="card-body py-15 py-lg-20">
											<!--begin::Title-->
											<h1 class="fw-bolder fs-2hx text-gray-900 mb-4">Inicio en mantenimiento...</h1>
											<!--end::Title-->
											<!--begin::Illustration-->
											<div class="mb-3">
												<img src="assets/media/auth/maintenance.png" class="mw-100 mh-300px theme-light-show" alt="" />
												<img src="assets/media/auth/maintenance-dark.png" class="mw-100 mh-300px theme-dark-show" alt="" />
											</div>
											<!--end::Illustration-->
										</div>
									</div>
									<!--end::Wrapper-->
								</div>
								<!--end::Maintenance Page-->
							</div>
							<!--end::Content container-->
						</div>
						<!--end::Content-->
					</div>
					<!--end::Content wrapper-->
					<!--begin::Footer-->
					<div id="kt_app_footer" class="app-footer">
						<!--begin::Footer container-->
						<div
							class="app-container container-fluid d-flex flex-column flex-md-row flex-center flex-md-stack py-3">
							<!--begin::Copyright-->
							<div class="text-gray-900 order-2 order-md-1">
								<span class="text-muted fw-semibold me-1">2024&copy;</span>
								<a href="https://keenthemes.com" target="_blank"
									class="text-gray-800 text-hover-primary">Keenthemes</a>
							</div>
							<!--end::Copyright-->
							<!--begin::Menu-->
							<ul class="menu menu-gray-600 menu-hover-primary fw-semibold order-1">
								<li class="menu-item">
									<a href="https://keenthemes.com" target="_blank" class="menu-link px-2">About</a>
								</li>
								<li class="menu-item">
									<a href="https://devs.keenthemes.com" target="_blank"
										class="menu-link px-2">Support</a>
								</li>
							</ul>
							<!--end::Menu-->
						</div>
						<!--end::Footer container-->
					</div>
					<!--end::Footer-->
				</div>
				<!--end::Page-->
			</div>
			<!--end::App-->
			<!--end::Modals-->
			<!--begin::Javascript-->
			<script>
				var hostUrl = "assets/";
			</script>
			<!--begin::Global Javascript Bundle(mandatory for all pages)-->
			<script src="assets/plugins/global/plugins.bundle.js"></script>
			<script src="assets/js/scripts.bundle.js"></script>
			<!--end::Global Javascript Bundle-->
			<!--end::Javascript-->
		</body>
		<!--end::Body-->

		</html>
