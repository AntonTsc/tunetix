<?php
require_once '../../auth/global_headers.php';
require_once '../../db.php';

// Asegurar que no hay salida antes de los encabezados
ob_start(); // Iniciar buffer de salida
ob_clean(); // Limpiar buffer de salida
header('Content-Type: application/json'); // Especificar tipo de contenido

// Verificación de método
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(array("status" => "ERROR", "message" => "Method not allowed"));
    exit();
}

try {
    // NOTA: Por ahora ignoramos la autenticación para fines de depuración
    // En un entorno de producción, deberías volver a implementar la autenticación

    // Obtener parámetros de paginación y filtrado
    $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
    $status = isset($_GET['status']) ? $_GET['status'] : '';

    // Validar parámetros
    if ($page < 1) $page = 1;
    if ($limit < 1 || $limit > 100) $limit = 10;

    // Calcular offset
    $offset = ($page - 1) * $limit;

    // Construir la consulta base
    $query = "SELECT cm.*, u.nombre as user_name, u.apellido as user_lastname, u.correo as user_email 
              FROM contact_messages cm
              LEFT JOIN usuario u ON cm.user_id = u.id";
    $countQuery = "SELECT COUNT(*) as total FROM contact_messages";
    $newCountQuery = "SELECT COUNT(*) as new_count FROM contact_messages WHERE status = 'nuevo'";

    // Aplicar filtrado por estado si es necesario
    if (!empty($status)) {
        $query .= " WHERE cm.status = ?";
        $countQuery .= " WHERE status = ?";
    }

    // Ordenar por fecha de creación (más recientes primero)
    $query .= " ORDER BY cm.date_created DESC LIMIT ?, ?";

    // Preparar y ejecutar consulta para obtener total de mensajes
    if (!empty($status)) {
        $countStmt = $conn->prepare($countQuery);
        $countStmt->bind_param("s", $status);
    } else {
        $countStmt = $conn->prepare($countQuery);
    }

    $countStmt->execute();
    $totalResult = $countStmt->get_result();
    $totalRow = $totalResult->fetch_assoc();
    $total = $totalRow['total'];

    // Preparar y ejecutar consulta para obtener total de mensajes nuevos
    $newCountStmt = $conn->prepare($newCountQuery);
    $newCountStmt->execute();
    $newCountResult = $newCountStmt->get_result();
    $newCountRow = $newCountResult->fetch_assoc();
    $newCount = $newCountRow['new_count'];

    // Preparar y ejecutar consulta principal
    if (!empty($status)) {
        $stmt = $conn->prepare($query);
        $stmt->bind_param("sii", $status, $offset, $limit);
    } else {
        $stmt = $conn->prepare($query);
        $stmt->bind_param("ii", $offset, $limit);
    }

    $stmt->execute();
    $result = $stmt->get_result();

    // Preparar la respuesta
    $messages = array();
    while ($row = $result->fetch_assoc()) {
        // Construir el nombre completo del usuario
        $name = $row['user_name'] ? $row['user_name'] . ' ' . ($row['user_lastname'] ?? '') : 'Usuario ' . $row['user_id'];
        $email = $row['user_email'] ?? 'Sin correo';

        $messages[] = array(
            'id' => $row['id'],
            'user_id' => $row['user_id'],
            'name' => $name,
            'email' => $email,
            'subject' => $row['subject'],
            'message' => $row['message'],
            'status' => $row['status'] ?? 'nuevo',
            'created_at' => $row['date_created']
        );
    }

    // Calcular el total de páginas
    $totalPages = ceil($total / $limit);

    // Construir la respuesta
    echo json_encode(array(
        'status' => 'OK',
        'message' => 'Mensajes obtenidos correctamente',
        'data' => $messages,
        'pagination' => array(
            'total' => $total,
            'new_count' => $newCount,
            'currentPage' => $page,
            'limit' => $limit,
            'totalPages' => $totalPages
        )
    ));
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "status" => "ERROR",
        "message" => "Error al obtener mensajes: " . $e->getMessage()
    ));
}

$conn->close();
