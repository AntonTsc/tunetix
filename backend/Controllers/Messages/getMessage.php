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

// Verificar que sea una solicitud GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(array("status" => "ERROR", "message" => "Method not allowed"));
    exit();
}

// Verificar que se proporcione un ID
if (!isset($_GET['id']) || empty($_GET['id'])) {
    http_response_code(400);
    echo json_encode(array("status" => "ERROR", "message" => "Se requiere un ID de mensaje"));
    exit();
}

try {
    // Sanitizar el ID
    $id = (int)$_GET['id'];

    // Preparar la consulta - MODIFICADA PARA INCLUIR IMAGE_PATH
    $query = "SELECT cm.*, u.nombre as user_name, u.apellido as user_lastname, u.correo as user_email, u.image_path as user_image 
              FROM contact_messages cm 
              LEFT JOIN usuario u ON cm.user_id = u.id 
              WHERE cm.id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $id);

    // Ejecutar la consulta
    $stmt->execute();
    $result = $stmt->get_result();

    // Verificar si se encontró el mensaje
    if ($result->num_rows > 0) {
        $row = $result->fetch_assoc();

        // Sanitizar los datos antes de devolverlos
        $name = $row['user_name'] ? $row['user_name'] . ' ' . ($row['user_lastname'] ?? '') : 'Usuario ' . $row['user_id'];
        $email = $row['user_email'] ?? 'Sin correo';

        // Crear objeto de respuesta con datos adicionales del usuario
        $messageData = [
            'id' => $row['id'],
            'user_id' => $row['user_id'],
            'name' => $name,
            'email' => $email,
            'subject' => htmlspecialchars($row['subject']),
            'message' => htmlspecialchars($row['message']),
            'status' => $row['status'] ?? 'nuevo',
            'created_at' => $row['date_created'],
            'user_image' => $row['user_image'] // Añadimos el campo de imagen
        ];

        http_response_code(200);
        echo json_encode(array(
            "status" => "OK",
            "message" => "Mensaje recuperado con éxito",
            "data" => $messageData
        ));
    } else {
        http_response_code(404);
        echo json_encode(array(
            "status" => "ERROR",
            "message" => "Mensaje no encontrado"
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
