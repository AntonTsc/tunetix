<?php
    include_once __DIR__ . '/Classes/Track.php';
    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 51; // Valor predeterminado de 50
    Track::getTopGlobalTracks($limit);
?>