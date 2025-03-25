<?php
require_once '../../auth/global_headers.php';
require_once '../../db.php';
require_once '../../auth_verify.php';

// Asegurar que no hay salida antes de los encabezados
ob_start(); // Iniciar buffer de salida
ob_clean(); // Limpiar buffer de salida
header('Content-Type: application/json'); // Especificar tipo de contenido

// Verificar método
if ($_SERVER['REQUEST_METHOD'] !== 'GET') {
    http_response_code(405);
    echo json_encode(array("status" => "ERROR", "message" => "Method not allowed"));
    exit();
}

// Verificar autenticación
$auth_result = verifyAuth();
if ($auth_result['status'] !== 'OK') {
    http_response_code(401);
    echo json_encode(array("status" => "ERROR", "message" => "No autorizado"));
    exit();
}

try {
    // Estas son las mismas consultas que ya usas en getMessages.php
    $countQuery = "SELECT COUNT(*) as total FROM contact_messages";
    $newCountQuery = "SELECT COUNT(*) as new_count FROM contact_messages WHERE status = 'nuevo'";

    // Ejecutar consulta para obtener total de mensajes
    $totalResult = $conn->query($countQuery);
    if (!$totalResult) {
        throw new Exception("Error en consulta: " . $conn->error);
    }
    $totalRow = $totalResult->fetch_assoc();
    $total = (int)$totalRow['total'];

    // Ejecutar consulta para obtener total de mensajes nuevos
    $newResult = $conn->query($newCountQuery);
    if (!$newResult) {
        throw new Exception("Error en consulta: " . $conn->error);
    }
    $newRow = $newResult->fetch_assoc();
    $unread = (int)$newRow['new_count'];

    // Obtener el mensaje más reciente (opcional)
    $latestQuery = "SELECT date_created FROM contact_messages ORDER BY date_created DESC LIMIT 1";
    $latestResult = $conn->query($latestQuery);
    $latest = null;

    if ($latestResult && $latestResult->num_rows > 0) {
        $latestRow = $latestResult->fetch_assoc();
        $latest = $latestRow['date_created'];
    }

    // Construir respuesta con formato compatible con el dashboard
    $response = array(
        "status" => "OK",
        "data" => array(
            "general" => array(
                "total" => $total,
                "unread" => $unread,
                "latest" => $latest
            )
        )
    );

    echo json_encode($response);
} catch (Exception $e) {
    http_response_code(500);
    echo json_encode(array(
        "status" => "ERROR",
        "message" => "Error al obtener estadísticas: " . $e->getMessage()
    ));
}

$conn->close();
