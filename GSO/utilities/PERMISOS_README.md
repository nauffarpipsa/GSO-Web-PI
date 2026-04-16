# Sistema de Permisos con Acciones

## Descripción
Sistema completo para manejar permisos basados en roles, accesos y acciones específicas (CRUD y más).

## Estructura de Permisos

### Acciones Comunes (por descripción)
- **Listar** → acceso implícito al módulo
- **Crear**
- **Editar**
- **Eliminar**
- **Acciones personalizadas** (ej. *Aprobar*, *Exportar*, etc.)

> ⚠️ Los IDs pueden cambiar entre módulos. Usa siempre la **descripción** de la acción para validar permisos.

---

## Uso en PHP

### 1. Incluir el Helper

```php
<?php
require_once '../utilities/PermissionHelper.php';
?>
```

### 2. Verificar Acciones Específicas

#### Por ID de Acción
```php
<?php
// Verificar por descripción (recomendado)
if (PermissionHelper::hasAction('Roles', 'Crear')) {
    // Mostrar botón de crear rol
}

if (PermissionHelper::hasAction('Usuarios', 'Editar')) {
    // Mostrar botón de editar usuario
}

if (PermissionHelper::hasAction('Sociedades', 'Eliminar')) {
    // Mostrar botón de eliminar sociedad
}

// También puedes usar IDs si tu módulo los mantiene estables
if (PermissionHelper::hasAction('Roles', 10)) { // ID personalizado "Aprobar"
    // Mostrar botón Aprobar
}
?>
```

#### Usando Funciones de Conveniencia
```php
<?php
if (canCreate('Usuarios')) {
    // Puede crear usuarios
}

if (canEdit('Sociedades')) {
    // Puede editar sociedades
}

if (canDelete('Autorizaciones')) {
    // Puede eliminar autorizaciones
}
?>
```

### 3. Obtener Todas las Acciones de un Acceso

```php
<?php
$rolesActions = PermissionHelper::getAccessActions('Roles');

foreach ($rolesActions as $action) {
    echo "Acción ID: " . $action['actionId'] . "\n";
    echo "Descripción: " . $action['description'] . "\n";
    echo "Activa: " . ($action['active'] ? 'Sí' : 'No') . "\n";
}
?>
```

### 4. Ejemplo Completo en una Página PHP

```php
<?php
require_once '../utilities/PermissionHelper.php';
require_once '../Login/validar_sesion.php';

// Verificar si tiene acceso al módulo
if (!hasAccess('Roles')) {
    header('Location: /sin-acceso.html');
    exit;
}
?>

<!DOCTYPE html>
<html>
<head>
    <title>Gestión de Roles</title>
</head>
<body>
    <h1>Roles</h1>
    
<?php if (canCreate('Roles')): ?>
        <button id="btnCrear">Crear Rol</button>
    <?php endif; ?>
    
    <table>
        <thead>
            <tr>
                <th>ID</th>
                <th>Nombre</th>
                <?php if (canEdit('Roles') || canDelete('Roles')): ?>
                    <th>Acciones</th>
                <?php endif; ?>
            </tr>
        </thead>
        <tbody>
            <!-- Datos aquí -->
            <tr>
                <td>1</td>
                <td>Administrador</td>
                <td>
                    <?php if (canEdit('Roles')): ?>
                        <button>Editar</button>
                    <?php endif; ?>
                    
                    <?php if (canDelete('Roles')): ?>
                        <button>Eliminar</button>
                    <?php endif; ?>
                </td>
            </tr>
        </tbody>
    </table>
</body>
</html>
```

---

## Uso en JavaScript

### 1. Incluir el Helper

```html
<script src="/Corporativo/GSO/utilities/permissionHelper.js"></script>
```

### 2. Cargar y Verificar Permisos

```javascript
// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', async function() {
    // Cargar permisos
    await permissionHelper.loadPermissions();
    
    // Verificar si puede crear
    const puedeCrear = await permissionHelper.canCreate('Roles');
    if (puedeCrear) {
        document.getElementById('btnCrear').style.display = 'block';
    }
    
    // Verificar si puede editar
    const puedeEditar = await permissionHelper.canEdit('Roles');
    if (!puedeEditar) {
        document.getElementById('btnEditar').disabled = true;
    }
    
    // Verificar si puede eliminar
    const puedeEliminar = await permissionHelper.canDelete('Roles');
    if (puedeEliminar) {
        document.getElementById('btnEliminar').style.display = 'block';
    }
});
```

### 3. Verificar Acciones Específicas

```javascript
// Por nombre de acción
const puedeCrear = await permissionHelper.hasAction('Usuarios', 'Crear');
const puedeEditar = await permissionHelper.hasAction('Usuarios', 'Editar');
const puedeEliminar = await permissionHelper.hasAction('Usuarios', 'Eliminar');
```

### 4. Mostrar/Ocultar Elementos Automáticamente

```javascript
// Ocultar botón de crear si no tiene permiso
await permissionHelper.toggleElementByPermission('#btnCrear', 'Roles', 'Crear');

// Deshabilitar botón de editar si no tiene permiso
await permissionHelper.toggleElementDisabled('#btnEditar', 'Roles', 'Editar');
```

### 5. Obtener Todas las Acciones

```javascript
const acciones = await permissionHelper.getAccessActions('Roles');

acciones.forEach(accion => {
    console.log(`Acción ID: ${accion.actionId}`);
    console.log(`Descripción: ${accion.description}`);
    console.log(`Activa: ${accion.active}`);
});
```

### 6. Ejemplo Completo con Syncfusion Grid

```javascript
document.addEventListener('DOMContentLoaded', async function() {
    // Cargar permisos
    await permissionHelper.loadPermissions();
    
    // Verificar permisos
    const puedeCrear = await permissionHelper.canCreate('Roles');
    const puedeEditar = await permissionHelper.canEdit('Roles');
    const puedeEliminar = await permissionHelper.canDelete('Roles');
    
    // Configurar toolbar del grid según permisos
    const toolbar = [];
    if (puedeCrear) toolbar.push('Add');
    if (puedeEditar) toolbar.push('Edit');
    if (puedeEliminar) toolbar.push('Delete');
    toolbar.push('Search');
    
    // Configurar grid
    const grid = new ej.grids.Grid({
        toolbar: toolbar,
        editSettings: {
            allowAdding: puedeCrear,
            allowEditing: puedeEditar,
            allowDeleting: puedeEliminar
        },
        // ... resto de configuración
    });
    
    grid.appendTo('#Grid');
});
```

---

## Ejemplos de Casos de Uso Comunes

### 1. Módulo de Usuarios

```php
<?php
require_once '../utilities/PermissionHelper.php';

// Verificar acceso al módulo
if (!hasAccess('Usuarios')) {
    die('Sin acceso');
}

// En el HTML
?>
<?php if (canCreate('Usuarios')): ?>
    <button onclick="crearUsuario()">Nuevo Usuario</button>
<?php endif; ?>

<script>
async function crearUsuario() {
    if (await permissionHelper.canCreate('Usuarios')) {
        // Abrir modal de crear
    } else {
        alert('No tienes permiso para crear usuarios');
    }
}

async function editarUsuario(id) {
    if (await permissionHelper.canEdit('Usuarios')) {
        // Abrir modal de editar
    } else {
        alert('No tienes permiso para editar usuarios');
    }
}

async function eliminarUsuario(id) {
    if (await permissionHelper.canDelete('Usuarios')) {
        // Confirmar y eliminar
    } else {
        alert('No tienes permiso para eliminar usuarios');
    }
}
</script>
```

### 2. API Endpoints con Verificación

```php
<?php
require_once '../../utilities/PermissionHelper.php';
session_start();

header('Content-Type: application/json');

$action = $_GET['action'] ?? '';

switch ($action) {
    case 'create':
        if (!canCreate('Roles')) {
            echo json_encode(['success' => false, 'message' => 'Sin permiso para crear']);
            exit;
        }
        // Crear rol
        break;
        
    case 'update':
        if (!canEdit('Roles')) {
            echo json_encode(['success' => false, 'message' => 'Sin permiso para editar']);
            exit;
        }
        // Actualizar rol
        break;
        
    case 'delete':
        if (!canDelete('Roles')) {
            echo json_encode(['success' => false, 'message' => 'Sin permiso para eliminar']);
            exit;
        }
        // Eliminar rol
        break;
}
?>
```

### 3. Acciones Personalizadas (más allá del CRUD)

```php
<?php
// Si tienes acciones personalizadas con IDs mayores a 4
if (hasAction('Requisas', 5)) { // Por ejemplo, "Aprobar"
    // Mostrar botón de aprobar
}

if (hasAction('Documentos', 6)) { // Por ejemplo, "Exportar"
    // Mostrar botón de exportar
}
?>
```

---

## API Reference

### PHP - PermissionHelper

| Método | Descripción | Parámetros | Retorno |
|--------|-------------|------------|---------|
| `hasAction($accessName, $actionId)` | Verifica si tiene acción (ID o nombre) | `string`, `int\\|string` | `bool` |
| `hasActionByName($accessName, $actionName)` | Verifica si tiene acción por nombre | `string`, `string` | `bool` |
| `canCreate($accessName)` | Verifica si puede crear | `string` | `bool` |
| `canEdit($accessName)` | Verifica si puede editar | `string` | `bool` |
| `canDelete($accessName)` | Verifica si puede eliminar | `string` | `bool` |
| `getAccessActions($accessName)` | Obtiene todas las acciones | `string` | `array` |
| `getAllAccessActions()` | Obtiene mapa completo | - | `array` |

### JavaScript - permissionHelper

| Método | Descripción | Parámetros | Retorno |
|--------|-------------|------------|---------|
| `loadPermissions()` | Carga permisos del servidor | - | `Promise<Object>` |
| `hasAction(accessName, actionId)` | Verifica acción por ID o nombre | `string`, `number\\|string` | `Promise<bool>` |
| `hasActionByName(accessName, actionName)` | Verifica acción por nombre | `string`, `string` | `Promise<bool>` |
| `canCreate(accessName)` | Verifica si puede crear | `string` | `Promise<bool>` |
| `canEdit(accessName)` | Verifica si puede editar | `string` | `Promise<bool>` |
| `canDelete(accessName)` | Verifica si puede eliminar | `string` | `Promise<bool>` |
| `getAccessActions(accessName)` | Obtiene todas las acciones | `string` | `Promise<Array>` |
| `toggleElementByPermission(element, accessName, actionId)` | Muestra/oculta elemento | `string\|Element`, `string`, `number` | `Promise<void>` |
| `toggleElementDisabled(element, accessName, actionId)` | Habilita/deshabilita elemento | `string\|Element`, `string`, `number` | `Promise<void>` |

---

## Notas Importantes

1. **Siempre verificar permisos en el servidor**: La verificación en JavaScript es solo para UX. La seguridad real debe estar en el servidor.

2. **Cache de permisos**: El helper JavaScript cachea los permisos después de la primera carga para mejorar el rendimiento.

3. **Acciones por descripción**: Usa preferentemente la descripción (`Crear`, `Editar`, `Eliminar`, etc.). Los IDs pueden cambiar sin previo aviso.

4. **Nombres exactos**: Los nombres de accesos deben coincidir exactamente con los del JSON (case-sensitive).

5. **Sesión activa**: Todos los métodos requieren que haya una sesión activa con permisos cargados.

