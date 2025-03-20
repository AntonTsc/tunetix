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

// Verificar que sea una solicitud GET
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(array("status" => "ERROR", "message" => "Method not allowed"));
    exit();
}

try {
    // Parámetros de paginación
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    $offset = ($page - 1) * $limit;

    // Construir la consulta base
    $query = "SELECT * FROM contact_messages";
    $countQuery = "SELECT COUNT(*) as total FROM contact_messages";

    // Añadir filtro por estado si se proporciona
    $whereClause = "";
    $params = array();

    if (isset($_GET['status']) && !empty($_GET['status'])) {
        $status = $conn->real_escape_string($_GET['status']);
        $whereClause = " WHERE status = '$status'";
    }

    // Completar las consultas
    $countQuery .= $whereClause;
    $query .= $whereClause . " ORDER BY created_at DESC LIMIT $offset, $limit";

    // Ejecutar consulta para el conteo total
    $resultCount = $conn->query($countQuery);
    $totalRow = $resultCount->fetch_assoc();
    $total = $totalRow['total'];

    // Ejecutar la consulta principal
    $result = $conn->query($query);

    // Obtener los resultados
    $messages = array();
    while ($row = $result->fetch_assoc()) {
        // Sanitizar los datos antes de devolverlos
        $row['name'] = htmlspecialchars($row['name']);
        $row['email'] = htmlspecialchars($row['email']);
        $row['subject'] = htmlspecialchars($row['subject']);
        $row['message'] = htmlspecialchars($row['message']);

        $messages[] = $row;
    }

    // Devolver resultados con metadatos de paginación
    http_response_code(200);
    echo json_encode(array(
        "status" => "OK",
        "message" => "Mensajes recuperados con éxito",
        "data" => $messages,
        "pagination" => array(
            "total" => (int)$total,
            "currentPage" => $page,
            "limit" => $limit,
            "totalPages" => ceil($total / $limit)
        )
    ));
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "status" => "ERROR",
        "message" => "Error en el servidor: " . $e->getMessage()
    ));
}

$conn->close();
