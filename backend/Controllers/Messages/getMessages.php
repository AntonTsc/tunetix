<?php
require_once '../../auth/global_headers.php';
require_once '../../db.php';
require_once '../../auth_verify.php';

// Verificación de autenticación
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(array("status" => "ERROR", "message" => "Method not allowed"));
    exit();
}

// Verificar autenticación
$auth_result = verifyAuth();
if ($auth_result['status'] !== 'OK') {
    http_response_code(401);
    echo json_encode($auth_result);
    exit();
}

try {
    // Parámetros de paginación
    $page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
    $limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 10;
    $offset = ($page - 1) * $limit;

    // Construir la consulta base con JOIN para obtener datos de usuario
    $query = "SELECT m.id, m.user_id, u.nombre as first_name, u.apellido as last_name, u.correo as email, 
              m.subject, m.message, m.status, m.date_created as created_at 
              FROM contact_messages m 
              LEFT JOIN usuario u ON m.user_id = u.id";

    $countQuery = "SELECT COUNT(*) as total FROM contact_messages";
    $newCountQuery = "SELECT COUNT(*) as new_count FROM contact_messages WHERE status = 'nuevo'";

    // Añadir filtro por estado si se proporciona
    $whereClause = "";
    if (isset($_GET['status']) && !empty($_GET['status'])) {
        $status = $conn->real_escape_string($_GET['status']);
        $whereClause = " WHERE m.status = '$status'";
        $countQuery .= " WHERE status = '$status'";
    }

    // Completar las consultas
    $query .= $whereClause . " ORDER BY m.date_created DESC LIMIT $offset, $limit";

    // Ejecutar consulta para el conteo total
    $resultCount = $conn->query($countQuery);
    $totalRow = $resultCount->fetch_assoc();
    $total = $totalRow['total'];

    // Ejecutar consulta para contar mensajes nuevos
    $resultNewCount = $conn->query($newCountQuery);
    $newCountRow = $resultNewCount->fetch_assoc();
    $newCount = $newCountRow['new_count'];

    // Ejecutar la consulta principal
    $result = $conn->query($query);

    if (!$result) {
        throw new Exception("Error en la consulta: " . $conn->error);
    }

    // Obtener los resultados
    $messages = array();
    while ($row = $result->fetch_assoc()) {
        // Sanitizar datos
        $row['first_name'] = htmlspecialchars($row['first_name'] ?? '');
        $row['last_name'] = htmlspecialchars($row['last_name'] ?? '');
        $row['email'] = htmlspecialchars($row['email'] ?? '');
        $row['subject'] = htmlspecialchars($row['subject']);
        $row['message'] = htmlspecialchars($row['message']);

        // Añadir nombre completo formateado para facilitar el display
        $row['name'] = ($row['first_name'] ?? '') . ' ' . ($row['last_name'] ?? '');

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
            "new_count" => (int)$newCount,
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
