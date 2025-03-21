<?php
require_once '../../auth/global_headers.php';
require_once '../../db.php';
require_once '../../auth_verify.php';

// Verificar que sea una solicitud PUT
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(array("status" => "ERROR", "message" => "Method not allowed"));
    exit();
}

// Obtener datos del cuerpo
$data = json_decode(file_get_contents("php://input"));

// Verificar que se proporcionen los datos necesarios
if (!isset($data->id) || !isset($data->status)) {
    http_response_code(400);
    echo json_encode(array("status" => "ERROR", "message" => "Faltan campos requeridos"));
    exit();
}

// Verificar autenticación
$auth_result = verifyAuth();
if ($auth_result['status'] !== 'OK') {
    http_response_code(401);
    echo json_encode($auth_result);
    exit();
}

// Sanitizar datos
$id = intval($data->id);
$status = $conn->real_escape_string($data->status);

// Verificar que el status sea válido
$valid_statuses = array('nuevo', 'leído', 'archivado');
if (!in_array($status, $valid_statuses)) {
    http_response_code(400);
    echo json_encode(array("status" => "ERROR", "message" => "Estado no válido"));
    exit();
}

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

// Actualizar el estado del mensaje
$sql = "UPDATE contact_messages SET status = ? WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("si", $status, $id);

if ($stmt->execute()) {
    http_response_code(200);
    echo json_encode(array(
        "status" => "OK",
        "message" => "Estado actualizado correctamente"
    ));
} else {
    http_response_code(500);
    echo json_encode(array(
        "status" => "ERROR",
        "message" => "Error al actualizar el estado: " . $stmt->error
    ));
}

$stmt->close();
$conn->close();
