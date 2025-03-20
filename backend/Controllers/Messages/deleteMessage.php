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

// Verificar que sea una solicitud DELETE
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
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
    
    // Preparar la consulta
    $query = "DELETE FROM contact_messages WHERE id = ?";
    $stmt = $conn->prepare($query);
    $stmt->bind_param("i", $id);
    
    // Ejecutar la consulta
    $stmt->execute();
    
    // Verificar si se eliminó alguna fila
    if ($stmt->affected_rows > 0) {
        http_response_code(200);
        echo json_encode(array(
            "status" => "OK",
            "message" => "Mensaje eliminado con éxito"
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
?>
