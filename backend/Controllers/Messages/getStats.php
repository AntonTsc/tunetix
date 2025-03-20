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
    // Estadísticas por estado
    $statusQuery = "SELECT status, COUNT(*) as count FROM contact_messages GROUP BY status";
    $statusResult = $conn->query($statusQuery);

    $statusStats = array();
    while ($row = $statusResult->fetch_assoc()) {
        $statusStats[$row['status']] = (int)$row['count'];
    }

    // Asegurar que todos los estados posibles aparezcan en las estadísticas
    $allStatuses = array('nuevo', 'leído', 'respondido', 'archivado');
    foreach ($allStatuses as $status) {
        if (!isset($statusStats[$status])) {
            $statusStats[$status] = 0;
        }
    }

    // Estadísticas por mes (últimos 6 meses)
    $monthlyQuery = "SELECT 
                       DATE_FORMAT(created_at, '%Y-%m') as month, 
                       COUNT(*) as count 
                     FROM contact_messages 
                     WHERE created_at >= DATE_SUB(CURRENT_DATE(), INTERVAL 6 MONTH) 
                     GROUP BY DATE_FORMAT(created_at, '%Y-%m') 
                     ORDER BY month";

    $monthlyResult = $conn->query($monthlyQuery);

    $monthlyStats = array();
    while ($row = $monthlyResult->fetch_assoc()) {
        $monthlyStats[$row['month']] = (int)$row['count'];
    }

    // Estadísticas generales
    $generalQuery = "SELECT 
                      COUNT(*) as total,
                      SUM(CASE WHEN status = 'nuevo' THEN 1 ELSE 0 END) as unread,
                      MAX(created_at) as latest
                    FROM contact_messages";

    $generalResult = $conn->query($generalQuery);
    $generalStats = $generalResult->fetch_assoc();

    $generalStats['total'] = (int)$generalStats['total'];
    $generalStats['unread'] = (int)$generalStats['unread'];

    // Devolver todas las estadísticas
    http_response_code(200);
    echo json_encode(array(
        "status" => "OK",
        "message" => "Estadísticas recuperadas con éxito",
        "data" => array(
            "byStatus" => $statusStats,
            "monthly" => $monthlyStats,
            "general" => $generalStats
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
