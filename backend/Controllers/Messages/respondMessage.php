<?php
require_once '../../auth/global_headers.php';
require_once '../../db.php';

// En un entorno de producción, debes descomentar la siguiente línea
// y asegurarte de que el archivo y la función isAdmin() existan
// require_once '../../utils/authenticate.php';

// IMPORTANTE: En producción, esta verificación debe ser reemplazada por una adecuada
// Verificar autenticación del administrador (temporal)
function isAdminTemp()
{
    // Para desarrollo: siempre retorna true
    // En producción: implementa la lógica adecuada
    return true;
}

if (!isAdminTemp()) {
    http_response_code(403);
    echo json_encode(array("status" => "ERROR", "message" => "Acceso denegado. Se requieren permisos de administrador."));
    exit();
}

// Verificar que sea una solicitud POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array("status" => "ERROR", "message" => "Method not allowed"));
    exit();
}

// Obtener datos del cuerpo de la solicitud
$data = json_decode(file_get_contents("php://input"));

// Verificar que se proporcionen los campos necesarios
if (!isset($data->id) || !isset($data->response) || empty($data->id) || empty($data->response)) {
    http_response_code(400);
    echo json_encode(array("status" => "ERROR", "message" => "Se requieren ID del mensaje y respuesta"));
    exit();
}

try {
    // Sanitizar el ID
    $id = (int)$data->id;

    // Primero, obtener los datos del mensaje
    $queryGet = "SELECT * FROM contact_messages WHERE id = ?";
    $stmtGet = $conn->prepare($queryGet);
    $stmtGet->bind_param("i", $id);
    $stmtGet->execute();
    $result = $stmtGet->get_result();

    if ($result->num_rows == 0) {
        http_response_code(404);
        echo json_encode(array("status" => "ERROR", "message" => "Mensaje no encontrado"));
        $stmtGet->close();
        $conn->close();
        exit();
    }

    $message = $result->fetch_assoc();
    $stmtGet->close();

    // Actualizar el estado del mensaje a "respondido"
    $queryUpdate = "UPDATE contact_messages 
                   SET status = 'respondido', updated_at = ? 
                   WHERE id = ?";

    $stmtUpdate = $conn->prepare($queryUpdate);
    $updated_at = date('Y-m-d H:i:s');
    $stmtUpdate->bind_param("si", $updated_at, $id);

    // Sanitizar la respuesta
    $responseText = $conn->real_escape_string(htmlspecialchars(strip_tags($data->response)));

    // Enviar el email de respuesta
    $to = $message['email'];
    $subject = "RE: " . $message['subject'] . " - Tunetix";

    // Construir el cuerpo del email
    $emailBody = "Hola " . $message['name'] . ",\n\n";
    $emailBody .= "Gracias por contactar con Tunetix. En respuesta a tu mensaje:\n\n";
    $emailBody .= "\"" . $message['message'] . "\"\n\n";
    $emailBody .= "Nuestra respuesta:\n\n";
    $emailBody .= $responseText . "\n\n";
    $emailBody .= "Saludos cordiales,\n";
    $emailBody .= "El equipo de Tunetix";

    $headers = "From: soporte@tunetix.com\r\n";
    $headers .= "Reply-To: soporte@tunetix.com\r\n";

    // Guardar la respuesta en la base de datos y actualizar el estado
    if ($stmtUpdate->execute()) {
        // Descomentar para activar el envío de emails en producción
        // $mailSent = mail($to, $subject, $emailBody, $headers);
        $mailSent = true; // Para pruebas, asumimos que se envió correctamente

        if ($mailSent) {
            http_response_code(200);
            echo json_encode(array(
                "status" => "OK",
                "message" => "Respuesta enviada exitosamente"
            ));
        } else {
            http_response_code(500);
            echo json_encode(array(
                "status" => "ERROR",
                "message" => "Estado actualizado pero hubo un problema al enviar el email"
            ));
        }
    } else {
        http_response_code(503);
        echo json_encode(array(
            "status" => "ERROR",
            "message" => "No se pudo actualizar el estado del mensaje"
        ));
    }

    $stmtUpdate->close();
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "status" => "ERROR",
        "message" => "Error en el servidor: " . $e->getMessage()
    ));
}

$conn->close();
