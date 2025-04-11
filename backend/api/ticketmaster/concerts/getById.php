<?php
include_once './classes/Concert.php';
include_once '../../../auth/global_headers.php';

$eventId = isset($_GET['id']) ? $_GET['id'] : "";

if (empty($eventId)) {
    header("Content-Type: application/json");
    echo json_encode([
        "status" => "ERROR",
        "message" => "ID del evento no proporcionado"
    ]);
    exit;
}

Concert::getById($eventId);
