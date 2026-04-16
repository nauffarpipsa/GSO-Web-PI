<?php
/**
 * Script temporal para verificar configuración de upload
 */

header('Content-Type: application/json');

$config = [
    'upload_max_filesize' => ini_get('upload_max_filesize'),
    'post_max_size' => ini_get('post_max_size'),
    'max_execution_time' => ini_get('max_execution_time'),
    'memory_limit' => ini_get('memory_limit'),
    'file_uploads' => ini_get('file_uploads'),
    'tmp_dir' => sys_get_temp_dir(),
    'tmp_dir_writable' => is_writable(sys_get_temp_dir()) ? 'YES' : 'NO'
];

echo json_encode($config, JSON_PRETTY_PRINT);
?>

