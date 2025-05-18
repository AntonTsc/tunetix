<?php
include_once './classes/Concert.php';
include_once '../../../auth/global_headers.php';
include_once '../../../utils/classes/ServerRespponse.php';

$eventId = isset($_GET['id']) ? $_GET['id'] : "";

if (empty($eventId)) {
    ServerResponse::error(0, "ID del evento no proporcionado");
    exit;
}

Concert::getById($eventId);
