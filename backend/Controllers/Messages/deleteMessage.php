<?php
require_once '../../auth/global_headers.php';
require_once '../../utils/classes/ServerResponse.php';
require_once '../../db.php';
require_once '../../auth_verify.php';

// Asegurar que no hay salida antes de los encabezados
ob_start(); // Iniciar buffer de salida
ob_clean(); // Limpiar buffer de salida
header('Content-Type: application/json'); // Especificar tipo de contenido

// Verificar que sea una solicitud DELETE
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    ServerResponse::error(405, "Method not allowed");
    exit();
}

// Verificar que se proporcione un ID
if (!isset($_GET['id'])) {
    http_response_code(400);
    ServerResponse::error(400, "Falta el ID del mensaje");
    exit();
}

// Verificar autenticación
$auth_result = verifyAuth();
if ($auth_result['status'] !== 'OK') {
    http_response_code(401);
    ServerResponse::error(401, "No autorizado");
    exit();
}

// Obtener y sanitizar el ID
$id = intval($_GET['id']);

// Verificar que el mensaje exista
$check_sql = "SELECT id FROM contact_messages WHERE id = ?";
$check_stmt = $conn->prepare($check_sql);
$check_stmt->bind_param("i", $id);
$check_stmt->execute();
$check_result = $check_stmt->get_result();

if ($check_result->num_rows === 0) {
    http_response_code(404);
    ServerResponse::error(404, "Mensaje no encontrado");
    $check_stmt->close();
    exit();
}

$check_stmt->close();

// Eliminar el mensaje
$delete_sql = "DELETE FROM contact_messages WHERE id = ?";
$delete_stmt = $conn->prepare($delete_sql);
$delete_stmt->bind_param("i", $id);

if ($delete_stmt->execute()) {
    ServerResponse::success("Mensaje eliminado correctamente");
} else {
    http_response_code(500);
    ServerResponse::error(500, "Error al eliminar mensaje" . $delete_stmt->error);
}

$delete_stmt->close();
$conn->close();
