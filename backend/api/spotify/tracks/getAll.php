<?php
    include_once __DIR__ . '/Classes/Track.php';
    include_once '../../../auth/global_headers.php';

    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50; // Valor predeterminado de 50
    Track::getTopGlobalTracks($limit);
?>