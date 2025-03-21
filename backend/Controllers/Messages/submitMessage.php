<?php
require_once '../../auth/global_headers.php';
require_once '../../db.php';
require_once '../../auth_verify.php';

// Verificar que sea una solicitud POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array("status" => "ERROR", "message" => "Method not allowed"));
    exit();
}

// Obtener datos del cuerpo de la solicitud
$data = json_decode(file_get_contents("php://input"));

// Verificar que todos los campos necesarios estén presentes
if (
    !isset($data->subject) ||
    !isset($data->message) ||
    empty(trim($data->subject)) ||
    empty(trim($data->message))
) {
    http_response_code(400);
    echo json_encode(array("status" => "ERROR", "message" => "Faltan campos requeridos"));
    exit();
}

// Verificar autenticación - Si no está autenticado, también se puede enviar como anónimo con user_id=0
$auth_result = verifyAuth();
$user_id = 0; // Por defecto, anónimo

if ($auth_result['status'] === 'OK') {
    $user_id = $auth_result['user_id'];
}

// Sanitizar los datos
$subject = $conn->real_escape_string($data->subject);
$message = $conn->real_escape_string($data->message);
$status = 'nuevo';
$date_created = date('Y-m-d H:i:s');

// Insertar mensaje en la base de datos con ID de usuario
$sql = "INSERT INTO contact_messages (user_id, subject, message, status, date_created) 
        VALUES (?, ?, ?, ?, ?)";

$stmt = $conn->prepare($sql);
$stmt->bind_param("issss", $user_id, $subject, $message, $status, $date_created);

if ($stmt->execute()) {
    http_response_code(201);
    echo json_encode(array(
        "status" => "OK",
        "message" => "Mensaje enviado correctamente",
        "id" => $stmt->insert_id
    ));
} else {
    http_response_code(500);
    echo json_encode(array(
        "status" => "ERROR",
        "message" => "Error al enviar el mensaje: " . $stmt->error
    ));
}

$stmt->close();
$conn->close();
