<?php
require_once '../../auth/global_headers.php';
require_once '../../db.php';

// Asegurar que no hay salida antes de los encabezados
ob_start();
ob_clean();
header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(array("status" => "ERROR", "message" => "Method not allowed"));
    exit();
}

try {
    // Obtener parámetros
    $page = isset($_GET['page']) ? intval($_GET['page']) : 1;
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 10;
    // Compatibilidad con per_page y limit
    if (isset($_GET['per_page'])) {
        $limit = intval($_GET['per_page']);
    }
    $status = isset($_GET['status']) ? $_GET['status'] : '';
    $search = isset($_GET['search']) ? $_GET['search'] : '';
    $searchType = isset($_GET['searchType']) ? $_GET['searchType'] : 'all';

    if ($page < 1) $page = 1;
    if ($limit < 1 || $limit > 100) $limit = 10;

    $offset = ($page - 1) * $limit;

    $query = "SELECT cm.*, u.nombre as user_name, u.apellido as user_lastname, u.correo as user_email, u.image_path as user_image 
              FROM contact_messages cm
              LEFT JOIN usuario u ON cm.user_id = u.id";
    $countQuery = "SELECT COUNT(*) as total FROM contact_messages cm LEFT JOIN usuario u ON cm.user_id = u.id";
    $newCountQuery = "SELECT COUNT(*) as new_count FROM contact_messages WHERE status = 'nuevo'";

    $whereConditions = array();
    $params = array();
    $paramTypes = "";

    // Filtrar por estado
    if (!empty($status)) {
        $whereConditions[] = "cm.status = ?";
        $params[] = $status;
        $paramTypes .= "s";
    }

    // Aplicar búsqueda
    if (!empty($search)) {
        $searchParam = "%" . $search . "%";

        if ($searchType === 'subject') {
            $whereConditions[] = "cm.subject LIKE ?";
            $params[] = $searchParam;
            $paramTypes .= "s";
        } else if ($searchType === 'user') {
            $whereConditions[] = "(CONCAT(u.nombre, ' ', IFNULL(u.apellido, '')) LIKE ? OR u.correo LIKE ?)";
            $params[] = $searchParam;
            $params[] = $searchParam;
            $paramTypes .= "ss";
        } else {
            $whereConditions[] = "(cm.subject LIKE ? OR CONCAT(u.nombre, ' ', IFNULL(u.apellido, '')) LIKE ? OR u.correo LIKE ?)";
            $params[] = $searchParam;
            $params[] = $searchParam;
            $params[] = $searchParam;
            $paramTypes .= "sss";
        }
    }

    // Construir WHERE
    if (!empty($whereConditions)) {
        $query .= " WHERE " . implode(" AND ", $whereConditions);
        $countQuery .= " WHERE " . implode(" AND ", $whereConditions);
    }

    // Ordenar y limitar
    $query .= " ORDER BY cm.date_created DESC LIMIT ?, ?";
    $params[] = $offset;
    $params[] = $limit;
    $paramTypes .= "ii";

    // Obtener conteo total
    $totalCount = 0;
    if (!empty($params) && !empty($paramTypes)) {
        // Si hay parámetros, preparamos la consulta con ellos
        $countStmt = $conn->prepare($countQuery);

        // Creamos un nuevo array de parámetros y tipos para el conteo
        // excluyendo el offset y limit que no se necesitan para el conteo
        $countParamTypes = substr($paramTypes, 0, -2); // Quitar los últimos 2 caracteres (ii)
        $countParams = array_slice($params, 0, -2);    // Quitar offset y limit

        if (!empty($countParamTypes)) {
            // Solo vincular si hay tipos de parámetros
            $bindParamsCount = array(&$countStmt, $countParamTypes);
            foreach ($countParams as $key => $value) {
                $bindParamsCount[] = &$countParams[$key];
            }
            call_user_func_array('mysqli_stmt_bind_param', $bindParamsCount);
        }

        $countStmt->execute();
        $totalResult = $countStmt->get_result();
        $totalRow = $totalResult->fetch_assoc();
        $totalCount = $totalRow['total'];
        $countStmt->close();
    } else {
        // Si no hay parámetros, usamos una consulta simple
        $totalResult = $conn->query("SELECT COUNT(*) as total FROM contact_messages cm LEFT JOIN usuario u ON cm.user_id = u.id");
        $totalRow = $totalResult->fetch_assoc();
        $totalCount = $totalRow['total'];
    }

    // Obtener conteo de mensajes nuevos
    $newCountStmt = $conn->prepare($newCountQuery);
    $newCountStmt->execute();
    $newCountResult = $newCountStmt->get_result();
    $newCountRow = $newCountResult->fetch_assoc();
    $newCount = $newCountRow['new_count'];
    $newCountStmt->close();

    // Consulta principal
    $messages = array();
    $stmt = $conn->prepare($query);

    if (!empty($paramTypes)) {
        $bindParams = array(&$stmt, $paramTypes);
        foreach ($params as $key => $value) {
            $bindParams[] = &$params[$key];
        }
        call_user_func_array('mysqli_stmt_bind_param', $bindParams);
    }

    $stmt->execute();
    $result = $stmt->get_result();

    while ($row = $result->fetch_assoc()) {
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
            'created_at' => $row['date_created'],
            'user_image' => $row['user_image']
        );
    }

    $stmt->close();

    // Cálculo de páginas
    $totalPages = ceil($totalCount / $limit);

    // Respuesta
    echo json_encode(array(
        'status' => 'OK',
        'message' => 'Mensajes obtenidos correctamente',
        'data' => $messages,
        'pagination' => array(
            'total' => $totalCount,
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
