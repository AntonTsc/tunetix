<?php
require_once '../../auth/global_headers.php';
require_once '../../db.php';
require_once '../../auth_verify.php';

// Verificar que sea una solicitud DELETE
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    http_response_code(405);
    echo json_encode(array("status" => "ERROR", "message" => "Method not allowed"));
    exit();
}

// Verificar que se proporcione un ID
if (!isset($_GET['id'])) {
    http_response_code(400);
    echo json_encode(array("status" => "ERROR", "message" => "ID de mensaje no proporcionado"));
    exit();
}

// Verificar autenticación
$auth_result = verifyAuth();
if ($auth_result['status'] !== 'OK') {
    http_response_code(401);
    echo json_encode($auth_result);
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
    echo json_encode(array("status" => "ERROR", "message" => "Mensaje no encontrado"));
    $check_stmt->close();
    exit();
}
$check_stmt->close();

// Eliminar el mensaje
$sql = "DELETE FROM contact_messages WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("i", $id);

if ($stmt->execute()) {
    http_response_code(200);
    echo json_encode(array(
        "status" => "OK",
        "message" => "Mensaje eliminado correctamente"
    ));
} else {
    http_response_code(500);
    echo json_encode(array(
        "status" => "ERROR",
        "message" => "Error al eliminar el mensaje: " . $stmt->error
    ));
}

$stmt->close();
$conn->close();
