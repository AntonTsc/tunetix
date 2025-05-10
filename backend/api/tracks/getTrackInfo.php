<?php
    include_once __DIR__ . '/classes/Track.php';
    include_once '../../auth/global_headers.php';
    include_once __DIR__ . '/../../utils/classes/ServerResponse.php';

    $artist = isset($_GET['artist']) ? $_GET['artist'] : '';
    $track = isset($_GET['track']) ? $_GET['track'] : '';

    if (empty($artist) || empty($track)) {
        ServerResponse::error(400, "Faltan parámetros");
        exit;
    }

    Track::getTrackInfo($track, $artist);
?>