/**
 * Syncfusion JavaScript Implementation
 * Configuración y ejemplos de uso de Syncfusion
 */

// Configuración global de Syncfusion
const SYNCFUSION_CONFIG = {
    // Tu licencia de prueba de Essential JS 2
    licenseKey: 'ORg4AjUWIQA/Gnt3VVhhQlJDfVddXGNWfFN0QHNfdV11flVDcDwsT3RfQFhjTn9Xd0RhWXtdeHJVRmtfUQ==',
    // Licencia Community como respaldo
    communityLicense: 'ORg4AjUWIQA/Gnt3VVhhQlJDfV5AQmBIYVp/TGpJfl96cVxMZVVBJAtUQF1hTH5Ud0FiXH1ZcnRVRWZeWkd2',
    // Configuración de temas
    theme: 'bootstrap5',
    // Configuración de idioma
    locale: 'es-ES'
};

// Inicialización de Syncfusion
(function() {
    'use strict';
    
    // Función para registrar licencia con respaldo
    function registerLicenseWithFallback() {
        if (typeof ej === 'undefined') {
            console.error('Syncfusion no está disponible');
            return false;
        }
        
        try {
            // Intentar con licencia de prueba
            ej.base.registerLicense(SYNCFUSION_CONFIG.licenseKey);
            console.log('✅ Licencia de prueba registrada correctamente');
            return true;
        } catch (error) {
            console.warn('⚠️ Error con licencia de prueba:', error.message);
            
            try {
                // Intentar con licencia Community como respaldo
                ej.base.registerLicense(SYNCFUSION_CONFIG.communityLicense);
                console.log('✅ Licencia Community registrada como respaldo');
                return true;
            } catch (fallbackError) {
                console.error('❌ Error con licencia Community:', fallbackError.message);
                return false;
            }
        }
    }
    
    // Esperar a que Syncfusion esté disponible
    if (typeof ej !== 'undefined') {
        // Registrar licencia con respaldo
        registerLicenseWithFallback();
        
        // Configurar tema global (método actualizado)
        if (ej.base.setTheme) {
            ej.base.setTheme(SYNCFUSION_CONFIG.theme);
        } else {
            // Método alternativo para versiones más recientes
            document.body.classList.add('e-' + SYNCFUSION_CONFIG.theme);
        }
        
        console.log('Syncfusion inicializado correctamente');
    } else {
        console.error('Syncfusion no está disponible. Verifica que el script se haya cargado correctamente.');
    }
})();

/**
 * EJEMPLOS DE COMPONENTES SYNCFUSION
 */

// 1. GRID (Tabla de datos)
function initializeDataGrid() {
    if (typeof ej === 'undefined' || typeof ej.grids === 'undefined') {
        console.error('Syncfusion Grid no está disponible');
        return;
    }
    
    const grid = new ej.grids.Grid({
        dataSource: [
            { OrderID: 10248, CustomerID: 'VINET', Freight: 32.38, ShipCountry: 'France' },
            { OrderID: 10249, CustomerID: 'TOMSP', Freight: 11.61, ShipCountry: 'Germany' },
            { OrderID: 10250, CustomerID: 'HANAR', Freight: 65.83, ShipCountry: 'Brazil' }
        ],
        columns: [
            { field: 'OrderID', headerText: 'Order ID', width: 120, textAlign: 'Right' },
            { field: 'CustomerID', headerText: 'Customer ID', width: 150 },
            { field: 'Freight', headerText: 'Freight', width: 120, format: 'C2' },
            { field: 'ShipCountry', headerText: 'Ship Country', width: 150 }
        ],
        allowPaging: true,
        allowSorting: true,
        allowFiltering: true,
        toolbar: ['Search', 'Add', 'Edit', 'Delete', 'Update', 'Cancel'],
        editSettings: { allowEditing: true, allowAdding: true, allowDeleting: true }
    });
    
    grid.appendTo('#grid-container');
}

// 2. CHART (Gráficos)
function initializeChart() {
    if (typeof ej === 'undefined' || typeof ej.charts === 'undefined') {
        console.error('Syncfusion Charts no está disponible');
        return;
    }
    
    const chart = new ej.charts.Chart({
        primaryXAxis: {
            valueType: 'Category',
            title: 'Meses'
        },
        primaryYAxis: {
            title: 'Ventas (Miles)'
        },
        chartArea: { border: { width: 0 } },
        series: [
            {
                dataSource: [
                    { x: 'Enero', y: 35 }, { x: 'Febrero', y: 28 },
                    { x: 'Marzo', y: 34 }, { x: 'Abril', y: 32 },
                    { x: 'Mayo', y: 40 }, { x: 'Junio', y: 32 }
                ],
                xName: 'x', yName: 'y',
                type: 'Column',
                name: 'Ventas 2024'
            }
        ],
        title: 'Ventas Mensuales',
        tooltip: { enable: true }
    });
    
    chart.appendTo('#chart-container');
}

// 3. CALENDAR (Calendario)
function initializeCalendar() {
    if (typeof ej === 'undefined' || typeof ej.calendars === 'undefined') {
        console.error('Syncfusion Calendar no está disponible');
        return;
    }
    
    const calendar = new ej.calendars.Calendar({
        placeholder: 'Selecciona una fecha',
        format: 'dd/MM/yyyy',
        value: new Date(),
        change: function(args) {
            console.log('Fecha seleccionada:', args.value);
        }
    });
    
    calendar.appendTo('#calendar-container');
}

// 4. DROPDOWN LIST
function initializeDropdown() {
    if (typeof ej === 'undefined' || typeof ej.dropdowns === 'undefined') {
        console.error('Syncfusion Dropdown no está disponible');
        return;
    }
    
    const dropdown = new ej.dropdowns.DropDownList({
        dataSource: [
            { text: 'Opción 1', value: '1' },
            { text: 'Opción 2', value: '2' },
            { text: 'Opción 3', value: '3' }
        ],
        fields: { text: 'text', value: 'value' },
        placeholder: 'Selecciona una opción',
        change: function(args) {
            console.log('Opción seleccionada:', args.value);
        }
    });
    
    dropdown.appendTo('#dropdown-container');
}

// 5. DIALOG (Modal)
function initializeDialog() {
    if (typeof ej === 'undefined' || typeof ej.popups === 'undefined') {
        console.error('Syncfusion Dialog no está disponible');
        return;
    }
    
    const dialog = new ej.popups.Dialog({
        width: '400px',
        target: document.body,
        visible: false,
        content: `
            <div style="padding: 20px;">
                <h3>Confirmación</h3>
                <p>¿Estás seguro de que quieres continuar?</p>
                <div style="text-align: right; margin-top: 20px;">
                    <button id="btn-cancel" class="btn btn-secondary">Cancelar</button>
                    <button id="btn-confirm" class="btn btn-primary">Confirmar</button>
                </div>
            </div>
        `,
        buttons: [
            { click: function() { dialog.hide(); }, buttonModel: { content: 'Cancelar', isPrimary: false } },
            { click: function() { 
                console.log('Acción confirmada');
                dialog.hide();
            }, buttonModel: { content: 'Confirmar', isPrimary: true } }
        ]
    });
    
    dialog.appendTo('#dialog-container');
    return dialog;
}

// 6. FILE UPLOAD
function initializeFileUpload() {
    if (typeof ej === 'undefined' || typeof ej.inputs === 'undefined') {
        console.error('Syncfusion File Upload no está disponible');
        return;
    }
    
    const uploadObj = new ej.inputs.Uploader({
        path: '/upload',
        autoUpload: true,
        multiple: true,
        allowedExtensions: '.jpg,.jpeg,.png,.pdf,.doc,.docx',
        maxFileSize: 10485760, // 10MB
        success: function(args) {
            console.log('Archivo subido:', args.file.name);
        },
        failure: function(args) {
            console.error('Error al subir:', args.error);
        }
    });
    
    uploadObj.appendTo('#fileupload-container');
}

// 7. RICH TEXT EDITOR
function initializeRichTextEditor() {
    if (typeof ej === 'undefined' || typeof ej.richtexteditor === 'undefined') {
        console.error('Syncfusion Rich Text Editor no está disponible');
        return;
    }
    
    const rteObj = new ej.richtexteditor.RichTextEditor({
        height: 300,
        value: '<p>Escribe tu contenido aquí...</p>',
        toolbarSettings: {
            items: ['Bold', 'Italic', 'Underline', 'StrikeThrough',
                   'FontName', 'FontSize', 'FontColor', 'BackgroundColor',
                   'LowerCase', 'UpperCase', '|',
                   'Formats', 'Alignments', 'OrderedList', 'UnorderedList',
                   'Outdent', 'Indent', '|', 'CreateLink', 'Image', '|',
                   'ClearFormat', 'Print', 'SourceCode', 'FullScreen', '|', 'Undo', 'Redo']
        }
    });
    
    rteObj.appendTo('#rte-container');
}

// 8. SCHEDULER (Calendario de eventos)
function initializeScheduler() {
    if (typeof ej === 'undefined' || typeof ej.schedule === 'undefined') {
        console.error('Syncfusion Scheduler no está disponible');
        return;
    }
    
    const scheduler = new ej.schedule.Schedule({
        height: '550px',
        selectedDate: new Date(),
        eventSettings: {
            dataSource: [
                {
                    Id: 1,
                    Subject: 'Reunión de proyecto',
                    StartTime: new Date(2024, 0, 15, 10, 0),
                    EndTime: new Date(2024, 0, 15, 12, 0)
                },
                {
                    Id: 2,
                    Subject: 'Presentación cliente',
                    StartTime: new Date(2024, 0, 16, 14, 0),
                    EndTime: new Date(2024, 0, 16, 16, 0)
                }
            ]
        }
    });
    
    scheduler.appendTo('#scheduler-container');
}

// 9. KANBAN (Tablero Kanban)
function initializeKanban() {
    if (typeof ej === 'undefined' || typeof ej.kanban === 'undefined') {
        console.error('Syncfusion Kanban no está disponible');
        return;
    }
    
    const kanban = new ej.kanban.Kanban({
        dataSource: [
            { Id: 1, Title: 'Tarea 1', Status: 'Open', Summary: 'Descripción de la tarea 1' },
            { Id: 2, Title: 'Tarea 2', Status: 'InProgress', Summary: 'Descripción de la tarea 2' },
            { Id: 3, Title: 'Tarea 3', Status: 'Testing', Summary: 'Descripción de la tarea 3' },
            { Id: 4, Title: 'Tarea 4', Status: 'Close', Summary: 'Descripción de la tarea 4' }
        ],
        columns: [
            { headerText: 'Pendiente', keyField: 'Open' },
            { headerText: 'En Progreso', keyField: 'InProgress' },
            { headerText: 'En Pruebas', keyField: 'Testing' },
            { headerText: 'Completado', keyField: 'Close' }
        ],
        cardSettings: {
            contentField: 'Summary',
            headerField: 'Title'
        }
    });
    
    kanban.appendTo('#kanban-container');
}

// 10. TREE GRID (Tabla jerárquica)
function initializeTreeGrid() {
    if (typeof ej === 'undefined' || typeof ej.treegrid === 'undefined') {
        console.error('Syncfusion Tree Grid no está disponible');
        return;
    }
    
    const treegrid = new ej.treegrid.TreeGrid({
        dataSource: [
            {
                taskID: 1, taskName: 'Planificación', startDate: '02/03/2017', duration: 5,
                progress: 100, priority: 'Normal', approved: false,
                subtasks: [
                    { taskID: 2, taskName: 'Plan de proyecto', startDate: '02/03/2017', duration: 5, progress: 100, priority: 'Low', approved: true },
                    { taskID: 3, taskName: 'Análisis de recursos', startDate: '02/03/2017', duration: 5, progress: 100, priority: 'Critical', approved: false }
                ]
            },
            {
                taskID: 4, taskName: 'Diseño', startDate: '02/10/2017', duration: 3,
                progress: 86, priority: 'High', approved: false,
                subtasks: [
                    { taskID: 5, taskName: 'Arquitectura de software', startDate: '02/10/2017', duration: 3, progress: 86, priority: 'Critical', approved: false },
                    { taskID: 6, taskName: 'Diseño de interfaz', startDate: '02/10/2017', duration: 3, progress: 86, priority: 'Low', approved: true }
                ]
            }
        ],
        childMapping: 'subtasks',
        treeColumnIndex: 1,
        columns: [
            { field: 'taskID', headerText: 'Task ID', width: 90, textAlign: 'Right' },
            { field: 'taskName', headerText: 'Task Name', width: 180 },
            { field: 'startDate', headerText: 'Start Date', width: 90, textAlign: 'Right', type: 'date', format: 'yMd' },
            { field: 'duration', headerText: 'Duration', width: 80, textAlign: 'Right' },
            { field: 'progress', headerText: 'Progress', width: 80, textAlign: 'Right' },
            { field: 'priority', headerText: 'Priority', width: 90 }
        ]
    });
    
    treegrid.appendTo('#treegrid-container');
}

// FUNCIÓN PARA INICIALIZAR TODOS LOS COMPONENTES
function initializeAllComponents() {
    // Verificar si los contenedores existen antes de inicializar
    if (document.getElementById('grid-container')) {
        initializeDataGrid();
    }
    
    if (document.getElementById('chart-container')) {
        initializeChart();
    }
    
    if (document.getElementById('calendar-container')) {
        initializeCalendar();
    }
    
    if (document.getElementById('dropdown-container')) {
        initializeDropdown();
    }
    
    if (document.getElementById('fileupload-container')) {
        initializeFileUpload();
    }
    
    if (document.getElementById('rte-container')) {
        initializeRichTextEditor();
    }
    
    if (document.getElementById('scheduler-container')) {
        initializeScheduler();
    }
    
    if (document.getElementById('kanban-container')) {
        initializeKanban();
    }
    
    if (document.getElementById('treegrid-container')) {
        initializeTreeGrid();
    }
}

// EXPORTAR FUNCIONES PARA USO GLOBAL
window.SyncfusionComponents = {
    initializeAll: initializeAllComponents,
    grid: initializeDataGrid,
    chart: initializeChart,
    calendar: initializeCalendar,
    dropdown: initializeDropdown,
    dialog: initializeDialog,
    fileUpload: initializeFileUpload,
    richTextEditor: initializeRichTextEditor,
    scheduler: initializeScheduler,
    kanban: initializeKanban,
    treeGrid: initializeTreeGrid
};

// Inicializar cuando el DOM esté listo y Syncfusion esté disponible
function waitForSyncfusion() {
    if (typeof ej !== 'undefined' && typeof ej.grids !== 'undefined') {
        initializeAllComponents();
    } else {
        setTimeout(waitForSyncfusion, 100);
    }
}

document.addEventListener('DOMContentLoaded', function() {
    waitForSyncfusion();
}); 