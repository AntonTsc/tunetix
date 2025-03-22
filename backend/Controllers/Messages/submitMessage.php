<?php
require_once '../../auth/global_headers.php';
require_once '../../db.php';
require_once '../../auth_verify.php';

// Asegurar que no hay salida antes de los encabezados
ob_start(); // Iniciar buffer de salida
ob_clean(); // Limpiar buffer de salida
header('Content-Type: application/json'); // Especificar tipo de contenido

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

try {
    // Obtener el ID del usuario de los datos del formulario
    // Ya que el componente Angular envía el ID del usuario logueado
    if (isset($data->user_id) && !empty($data->user_id)) {
        // El ID viene directamente del frontend
        $user_id = intval($data->user_id);
    } else {
        // Intentamos obtener el ID del usuario desde la autenticación
        $auth_result = verifyAuth();
        
        if (isset($auth_result['status']) && $auth_result['status'] === 'OK' && isset($auth_result['user_id'])) {
            $user_id = $auth_result['user_id'];
        } else {
            // Si aún no tenemos ID, usar NULL - aunque esto no debería ocurrir
            // si el formulario solo es accesible para usuarios logueados
            $user_id = NULL;
        }
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
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "status" => "ERROR",
        "message" => "Error en el servidor: " . $e->getMessage()
    ));
}

$conn->close();
