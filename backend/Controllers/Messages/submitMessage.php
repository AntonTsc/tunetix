<?php
require_once '../../config/global_headers.php';
require_once '../../db.php';

// No se requiere autenticación para enviar mensajes de contacto

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
    !isset($data->name) ||
    !isset($data->email) ||
    !isset($data->subject) ||
    !isset($data->message) ||
    empty(trim($data->name)) ||
    empty(trim($data->email)) ||
    empty(trim($data->subject)) ||
    empty(trim($data->message))
) {
    http_response_code(400);
    echo json_encode(array("status" => "ERROR", "message" => "Datos incompletos. Todos los campos son requeridos."));
    exit();
}

// Validar email
if (!filter_var($data->email, FILTER_VALIDATE_EMAIL)) {
    http_response_code(400);
    echo json_encode(array("status" => "ERROR", "message" => "Formato de email inválido."));
    exit();
}

try {
    // Sanitizar los datos
    $name = $conn->real_escape_string(htmlspecialchars(strip_tags($data->name)));
    $email = $conn->real_escape_string(htmlspecialchars(strip_tags($data->email)));
    $subject = $conn->real_escape_string(htmlspecialchars(strip_tags($data->subject)));
    $message = $conn->real_escape_string(htmlspecialchars(strip_tags($data->message)));
    $status = 'nuevo';
    $created_at = date('Y-m-d H:i:s');

    // Preparar la consulta SQL
    $query = "INSERT INTO contact_messages (name, email, subject, message, status, created_at) 
              VALUES (?, ?, ?, ?, ?, ?)";

    $stmt = $conn->prepare($query);
    $stmt->bind_param("ssssss", $name, $email, $subject, $message, $status, $created_at);

    // Ejecutar la consulta
    if ($stmt->execute()) {
        // Opcional: Enviar email de notificación a los administradores
        $adminEmail = "admin@tunetix.com";
        $mailSubject = "Nuevo mensaje de contacto en Tunetix";
        $mailMessage = "Has recibido un nuevo mensaje de contacto:\n\n";
        $mailMessage .= "Nombre: " . $name . "\n";
        $mailMessage .= "Email: " . $email . "\n";
        $mailMessage .= "Asunto: " . $subject . "\n";
        $mailMessage .= "Mensaje: " . $message . "\n\n";
        $mailMessage .= "Recibido el: " . $created_at;

        $headers = "From: notificaciones@tunetix.com\r\n";

        // Descomentar para activar el envío de emails en producción
        // mail($adminEmail, $mailSubject, $mailMessage, $headers);

        http_response_code(201);
        echo json_encode(array(
            "status" => "OK",
            "message" => "Mensaje enviado exitosamente"
        ));
    } else {
        http_response_code(503);
        echo json_encode(array(
            "status" => "ERROR",
            "message" => "No se pudo enviar el mensaje. Inténtalo de nuevo."
        ));
    }

    $stmt->close();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "status" => "ERROR",
        "message" => "Error en el servidor: " . $e->getMessage()
    ));
}

$conn->close();
