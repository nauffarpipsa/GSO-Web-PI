<?php
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

/**
 * Clase para manejar permisos basados en roles, accesos y acciones dinámicas.
 */
class PermissionHelper
{
    /**
     * Normaliza el nombre de una acción.
     */
    private static function normalizeActionKey($actionName)
    {
        return mb_strtolower(trim((string) $actionName), 'UTF-8');
    }

    /**
     * Determina si un arreglo es asociativo.
     */
    private static function isAssocArray($array)
    {
        if (!is_array($array)) {
            return false;
        }

        if (empty($array)) {
            return false;
        }

        return array_keys($array) !== range(0, count($array) - 1);
    }

    /**
     * Determina si la estructura de acciones está normalizada.
     */
    private static function isNormalizedActionMap($map)
    {
        return is_array($map)
            && isset($map['byId'])
            && isset($map['byKey'])
            && isset($map['actions']);
    }

    /**
     * Determina si la estructura de acciones es una lista legada.
     */
    private static function isLegacyActionList($map)
    {
        return is_array($map)
            && isset($map[0])
            && is_array($map[0])
            && array_key_exists('description', $map[0]);
    }

    /**
     * Normaliza estructura de acciones (por descripción e ID).
     */
    private static function normalizeActionMapStructure($map)
    {
        $normalized = [
            'byId' => [],
            'byKey' => [],
            'actions' => []
        ];

        $actionsList = [];

        if (isset($map['actions'])) {
            $actionsList = is_array($map['actions']) ? $map['actions'] : array_values((array) $map['actions']);
        } elseif (self::isLegacyActionList($map)) {
            $actionsList = $map;
        } elseif (isset($map['byId']) && is_array($map['byId'])) {
            $actionsList = array_values($map['byId']);
        } elseif (isset($map['byKey']) && is_array($map['byKey'])) {
            $actionsList = array_values($map['byKey']);
        }

        if (!is_array($actionsList)) {
            $actionsList = [];
        }

        $seenByDescription = [];

        foreach ($actionsList as $action) {
            if (!is_array($action)) {
                continue;
            }

            $entry = [
                'actionId' => $action['actionId'] ?? null,
                'description' => $action['description'] ?? '',
                'active' => isset($action['active']) ? (bool) $action['active'] : false
            ];

            $descKey = $entry['description'] !== '' ? self::normalizeActionKey($entry['description']) : null;
            $idKey = $entry['actionId'] !== null ? (string) $entry['actionId'] : null;

            if ($descKey !== null && isset($seenByDescription[$descKey])) {
                $index = $seenByDescription[$descKey];
                $existing = $normalized['actions'][$index];

                $existing['active'] = ($existing['active'] ?? false) || $entry['active'];
                if ($existing['actionId'] === null && $entry['actionId'] !== null) {
                    $existing['actionId'] = $entry['actionId'];
                }

                $normalized['actions'][$index] = $existing;
                if ($idKey !== null) {
                    $normalized['byId'][$idKey] = $existing;
                }
                $normalized['byKey'][$descKey] = $existing;
            } else {
                $normalized['actions'][] = $entry;
                $index = count($normalized['actions']) - 1;

                if ($descKey !== null) {
                    $seenByDescription[$descKey] = $index;
                    $normalized['byKey'][$descKey] = $entry;
                }

                if ($idKey !== null) {
                    $normalized['byId'][$idKey] = $entry;
                }
            }
        }

        return $normalized;
    }

    /**
     * Obtiene el mapa normalizado de acciones para un acceso.
     */
    private static function getAccessActionMap($accessName)
    {
        if (!isset($_SESSION['accessActions']) || !is_array($_SESSION['accessActions'])) {
            return null;
        }

        $map = $_SESSION['accessActions'][$accessName] ?? null;

        if (!$map) {
            return null;
        }

        if (!self::isNormalizedActionMap($map)) {
            $map = self::normalizeActionMapStructure($map);
            $_SESSION['accessActions'][$accessName] = $map;
        } else {
            if (!isset($map['actions']) || !is_array($map['actions'])) {
                $map['actions'] = [];
                $_SESSION['accessActions'][$accessName]['actions'] = [];
            } elseif (self::isAssocArray($map['actions'])) {
                $map['actions'] = array_values($map['actions']);
                $_SESSION['accessActions'][$accessName]['actions'] = $map['actions'];
            }
        }

        return $map;
    }

    /**
     * Verificar si el usuario tiene un rol específico.
     */
    public static function hasRole($roleName)
    {
        if (!isset($_SESSION['roles']) || !is_array($_SESSION['roles'])) {
            return false;
        }

        foreach ($_SESSION['roles'] as $role) {
            if (($role['description'] ?? null) === $roleName && ($role['active'] ?? false) === true) {
                return true;
            }
        }

        return false;
    }

    /**
     * Verificar si el usuario tiene un acceso específico.
     */
    public static function hasAccess($accessName)
    {
        if (!isset($_SESSION['allAccesses']) || !is_array($_SESSION['allAccesses'])) {
            return false;
        }

        foreach ($_SESSION['allAccesses'] as $access) {
            if (($access['description'] ?? null) === $accessName && ($access['active'] ?? false) === true) {
                return true;
            }
        }

        return false;
    }

    /**
     * Verificar si el usuario tiene acceso a una URL específica.
     */
    public static function hasUrlAccess($url)
    {
        $urlAccessMap = [
            'apps/Cotizaciones/Cotizaciones.php' => 'Cotizaciones',
            'apps/autorizaciones/documentos/documentos.php' => 'Documentos',
            'apps/OData/ODatas.php' => 'Consumir OData',
            'authentication/general/maintenance.html' => 'Etiquetas'
        ];

        foreach ($urlAccessMap as $mappedUrl => $accessName) {
            if (strpos($url, $mappedUrl) !== false) {
                return self::hasAccess($accessName);
            }
        }

        return true;
    }

    /**
     * Obtener todos los roles del usuario.
     */
    public static function getUserRoles()
    {
        return isset($_SESSION['roles']) ? $_SESSION['roles'] : [];
    }

    /**
     * Obtener todos los accesos del usuario.
     */
    public static function getUserAccesses()
    {
        return isset($_SESSION['allAccesses']) ? $_SESSION['allAccesses'] : [];
    }

    /**
     * Verificar si el usuario está autenticado.
     */
    public static function isAuthenticated()
    {
        return isset($_SESSION['user']);
    }

    /**
     * Obtener información del usuario actual.
     */
    public static function getCurrentUser()
    {
        return $_SESSION['user'] ?? null;
    }

    /**
     * Obtener el nombre del usuario actual.
     */
    public static function getCurrentUserName()
    {
        return $_SESSION['userName'] ?? null;
    }

    /**
     * Verificar si el usuario tiene al menos uno de los roles especificados.
     */
    public static function hasAnyRole($roleNames)
    {
        foreach ($roleNames as $roleName) {
            if (self::hasRole($roleName)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Verificar si el usuario tiene al menos uno de los accesos especificados.
     */
    public static function hasAnyAccess($accessNames)
    {
        foreach ($accessNames as $accessName) {
            if (self::hasAccess($accessName)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Verificar si el usuario tiene una acción específica en un acceso.
     *
     * @param string $accessName
     * @param int|string $actionIdentifier
     */
    public static function hasAction($accessName, $actionIdentifier)
    {
        $actionMap = self::getAccessActionMap($accessName);

        if (!$actionMap) {
            return false;
        }

        if (is_int($actionIdentifier) || (is_string($actionIdentifier) && ctype_digit($actionIdentifier))) {
            $key = (string) $actionIdentifier;
            if (isset($actionMap['byId'][$key])) {
                return ($actionMap['byId'][$key]['active'] ?? false) === true;
            }
        }

        if (is_string($actionIdentifier)) {
            $normalized = self::normalizeActionKey($actionIdentifier);
            if ($normalized !== '' && isset($actionMap['byKey'][$normalized])) {
                return ($actionMap['byKey'][$normalized]['active'] ?? false) === true;
            }
        }

        foreach ($actionMap['actions'] as $action) {
            if (isset($action['actionId']) && (string) $action['actionId'] === (string) $actionIdentifier) {
                return ($action['active'] ?? false) === true;
            }

            if (isset($action['description']) && is_string($actionIdentifier)) {
                if (self::normalizeActionKey($action['description']) === self::normalizeActionKey($actionIdentifier)) {
                    return ($action['active'] ?? false) === true;
                }
            }
        }

        return false;
    }

    /**
     * Verificar si el usuario tiene una acción específica por nombre.
     */
    public static function hasActionByName($accessName, $actionName)
    {
        return self::hasAction($accessName, $actionName);
    }

    /**
     * Obtener todas las acciones de un acceso específico.
     */
    public static function getAccessActions($accessName)
    {
        $actionMap = self::getAccessActionMap($accessName);

        if (!$actionMap) {
            return [];
        }

        return $actionMap['actions'];
    }

    /**
     * Verificar si el usuario puede crear.
     */
    public static function canCreate($accessName)
    {
        return self::hasActionByName($accessName, 'Crear');
    }

    /**
     * Verificar si el usuario puede editar.
     */
    public static function canEdit($accessName)
    {
        return self::hasActionByName($accessName, 'Editar');
    }

    /**
     * Verificar si el usuario puede eliminar.
     */
    public static function canDelete($accessName)
    {
        return self::hasActionByName($accessName, 'Eliminar');
    }

     /**
     * Verificar si el usuario puede Importar archivos.
     */
    public static function canImportFiles($accessName)
    {
        return self::hasActionByName($accessName, 'Importar');
    }
     /**
     * Verificar si el usuario puede Exportar archivos.
     */
    public static function canExportFiles($accessName)
    {
        return self::hasActionByName($accessName, 'Exportar');
    }
    /**
     * Verificar si el usuario puede Aprobar / Verificar Documentos.
     */
    public static function canApprove($accessName)
    {
        return self::hasActionByName($accessName, 'Aprobar');
    }

    /**
     * Verificar si el usuario puede Cambiar Status Generales.
     */
    public static function canChangeStatus($accessName)
    {
        return self::hasActionByName($accessName, 'Cambiar Status');
    }

    /**
     * Verificar si el usuario puede Cambiar Fechas.
     */
    public static function canChangeDates($accessName)
    {
        return self::hasActionByName($accessName, 'Cambiar Fecha')
            || self::hasActionByName($accessName, 'Cambiar Fechas');
    }

    /**
     * Verificar si el usuario puede Aplicar Pagos.
     */
    public static function canApplyPayments($accessName)
    {
        return self::hasActionByName($accessName, 'Aplicar Pagos')
            || self::hasActionByName($accessName, 'Aplicar Pago');
    }

    /**
     * Verificar si el usuario puede Reimprimir Documentos.
     */
    public static function canReprintDocuments($accessName)
    {
        return self::hasActionByName($accessName, 'Reimprimir');
    }
    
    /**
     * Obtener mapa completo de accesos con sus acciones normalizadas.
     */
    public static function getAllAccessActions()
    {
        if (!isset($_SESSION['accessActions']) || !is_array($_SESSION['accessActions'])) {
            return [];
        }

        $result = [];

        foreach (array_keys($_SESSION['accessActions']) as $accessName) {
            $result[$accessName] = self::getAccessActionMap($accessName);
        }

        return $result;
    }
}

// Funciones de conveniencia para uso directo
function hasRole($roleName)
{
    return PermissionHelper::hasRole($roleName);
}

function hasAccess($accessName)
{
    return PermissionHelper::hasAccess($accessName);
}

function hasUrlAccess($url)
{
    return PermissionHelper::hasUrlAccess($url);
}

function isAuthenticated()
{
    return PermissionHelper::isAuthenticated();
}

function getCurrentUserName()
{
    return PermissionHelper::getCurrentUserName();
}

// Funciones de conveniencia para acciones
function hasAction($accessName, $actionIdentifier)
{
    return PermissionHelper::hasAction($accessName, $actionIdentifier);
}

function hasActionByName($accessName, $actionName)
{
    return PermissionHelper::hasActionByName($accessName, $actionName);
}

function canCreate($accessName)
{
    return PermissionHelper::canCreate($accessName);
}

function canEdit($accessName)
{
    return PermissionHelper::canEdit($accessName);
}

function canDelete($accessName)
{
    return PermissionHelper::canDelete($accessName);
}
function canApprove($accessName)
{
    return PermissionHelper::canApprove($accessName);
}

function canImportFiles($accessName)
{
    return PermissionHelper::canImportFiles($accessName);
}

function canExportFiles($accessName)
{
    return PermissionHelper::canExportFiles($accessName);
}

function canChangeStatus($accessName)
{
    return PermissionHelper::canChangeStatus($accessName);
}

function canChangeDates($accessName)
{
    return PermissionHelper::canChangeDates($accessName);
}

function canApplyPayments($accessName)
{
    return PermissionHelper::canApplyPayments($accessName);
}

function canReprintDocuments($accessName)
{
    return PermissionHelper::canReprintDocuments($accessName);
}

function getAccessActions($accessName)
{
    return PermissionHelper::getAccessActions($accessName);
}

function getAllAccessActions()
{
    return PermissionHelper::getAllAccessActions();
}
?>