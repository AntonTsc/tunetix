<?php
require_once '../../config/global_headers.php';
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

// Verificar que sea una solicitud PUT
if ($_SERVER['REQUEST_METHOD'] !== 'PUT') {
    http_response_code(405);
    echo json_encode(array("status" => "ERROR", "message" => "Method not allowed"));
    exit();
}

// Obtener datos del cuerpo de la solicitud
$data = json_decode(file_get_contents("php://input"));

// Verificar que se proporcionen los campos necesarios
if (!isset($data->id) || !isset($data->status) || empty($data->id) || empty($data->status)) {
    http_response_code(400);
    echo json_encode(array("status" => "ERROR", "message" => "Se requieren ID y estado del mensaje"));
    exit();
}

// Validar que el estado sea uno de los valores permitidos
$allowedStatuses = array('nuevo', 'leído', 'respondido', 'archivado');
if (!in_array($data->status, $allowedStatuses)) {
    http_response_code(400);
    echo json_encode(array(
        "status" => "ERROR",
        "message" => "Estado no válido. Estados permitidos: " . implode(', ', $allowedStatuses)
    ));
    exit();
}

try {
    // Sanitizar los datos
    $id = (int)$data->id;
    $status = $conn->real_escape_string($data->status);
    $updated_at = date('Y-m-d H:i:s');

    // Preparar la consulta
    $query = "UPDATE contact_messages 
              SET status = ?, updated_at = ? 
              WHERE id = ?";

    $stmt = $conn->prepare($query);
    $stmt->bind_param("ssi", $status, $updated_at, $id);

    // Ejecutar la consulta
    $stmt->execute();

    // Verificar si se actualizó alguna fila
    if ($stmt->affected_rows > 0) {
        http_response_code(200);
        echo json_encode(array(
            "status" => "OK",
            "message" => "Estado del mensaje actualizado con éxito"
        ));
    } else {
        http_response_code(404);
        echo json_encode(array(
            "status" => "ERROR",
            "message" => "No se encontró ningún mensaje con el ID proporcionado"
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
