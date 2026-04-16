import { ReportService } from "../../api/reportService.js?v=1.1";

class ReportSelector {
    constructor() {
        this.service = new ReportService();
        this.container = document.getElementById("reports-container");
        this.accessName = new URLSearchParams(window.location.search).get("accessName");
    }

    async init() {
        try {
            // 1. Obtener ID del acceso por nombre
            const accessId = await this.service.getAccessIdByName(this.accessName);
            
            if (!accessId) {
                this._showError(`No se encontró el menú de acceso o no tienes permisos para: "${this.accessName}"`);
                return;
            }
             
            // 2. Obtener reportes asignados
            const response = await this.service.getReportsByAccessId(accessId);
            
            if (response.statusResult && response.dataResult && response.dataResult.length > 0) {
                this._renderReports(response.dataResult);
            } else {
                this._showError("No hay reportes configurados para este acceso o el servicio no retornó resultados.");
            }
        } catch (error) {
            console.error(error);
            this._showError("Error al conectar con el servidor de reportes.");
        }
    }

    _renderReports(reports) {
        this.container.innerHTML = ""; // Limpiar spinner

        reports.forEach(report => {
            const col = document.createElement("div");
            col.className = "col-md-4";
            
            // Usamos 'description' para el RDL. Para el título de la tarjeta y el visor, 
            // usamos el mismo nombre pero quitándole la extensión .rdl (ignorando mayúsculas/minúsculas)
            const rdlFile = report.description;
            const reportTitle = rdlFile.replace(/\.rdl$/i, "");

            col.innerHTML = `
                <div class="card shadow-sm border report-card h-100" data-rdl="${rdlFile}" data-title="${reportTitle}">
                    <div class="card-body d-flex flex-column align-items-center text-center py-10">
                        <div class="symbol symbol-65px symbol-circle mb-5">
                            <div class="symbol-label bg-light-primary">
                                <i class="ki-duotone ki-file-sheet fs-2tx text-primary">
                                    <span class="path1"></span><span class="path2"></span>
                                </i>
                            </div>
                        </div>
                        <h4 class="text-gray-800 fw-bold mb-1">${reportTitle}</h4>
                        <span class="text-muted fs-7">${rdlFile}</span>
                    </div>
                </div>
            `;

            col.querySelector(".report-card").addEventListener("click", () => {
                this._openReport(rdlFile, reportTitle);
            });

            this.container.appendChild(col);
        });
    }

    _openReport(rdl, title) {
        // Redirigir al visor con los parámetros dinámicos (ajustado para Corporativo)
        const url = `/Corporativo/GSO/utilities/report-viewer/report-viewer.php?report=${encodeURIComponent(rdl)}&title=${encodeURIComponent(title)}`;
        window.location.href = url;
    }

    _showError(message) {
        this.container.innerHTML = `
            <div class="col-12 text-center py-10">
                <div class="alert alert-dismissible bg-light-danger d-flex flex-center flex-column py-10 px-10 px-lg-20 mb-10">
                    <i class="ki-duotone ki-information-5 fs-5tx text-danger mb-5"><span class="path1"></span><span class="path2"></span><span class="path3"></span></i>
                    <div class="text-center">
                        <h1 class="fw-bold mb-5">Ops! Algo salió mal</h1>
                        <div class="separator separator-dashed border-danger opacity-25 mb-5"></div>
                        <div class="mb-9 text-gray-900">
                           ${message}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const selector = new ReportSelector();
    selector.init();
});
