<?php
require_once '../../auth/global_headers.php';
require_once '../../db.php';
require_once '../../auth_verify.php';

// Asegurar que no hay salida antes de los encabezados
ob_start(); // Iniciar buffer de salida
ob_clean(); // Limpiar buffer de salida
header('Content-Type: application/json'); // Especificar tipo de contenido

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
    echo json_encode(array("status" => "ERROR", "message" => "Faltan datos requeridos"));
    exit();
}

// Verificar autenticación
$auth_result = verifyAuth();
if ($auth_result['status'] !== 'OK') {
    http_response_code(401);
    echo json_encode(array("status" => "ERROR", "message" => "No autorizado"));
    exit();
}

// Sanitizar datos
$id = intval($data->id);
$status = $conn->real_escape_string($data->status);

// Verificar que el estado sea válido
$valid_statuses = array('nuevo', 'leído', 'archivado');
if (!in_array($status, $valid_statuses)) {
    http_response_code(400);
    echo json_encode(array("status" => "ERROR", "message" => "Estado no válido"));
    exit();
}

// Actualizar en la base de datos
$sql = "UPDATE contact_messages SET status = ? WHERE id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("si", $status, $id);

if ($stmt->execute()) {
    if ($stmt->affected_rows > 0) {
        echo json_encode(array("status" => "OK", "message" => "Estado actualizado correctamente"));
    } else {
        http_response_code(404);
        echo json_encode(array("status" => "ERROR", "message" => "No se encontró el mensaje o no se requería actualización"));
    }
} else {
    http_response_code(500);
    echo json_encode(array("status" => "ERROR", "message" => "Error al actualizar estado: " . $stmt->error));
}

$stmt->close();
$conn->close();
