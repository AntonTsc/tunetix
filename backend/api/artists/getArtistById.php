<?php
    include_once __DIR__ . '/classes/Artist.php';
    include_once '../../auth/global_headers.php';

    // Obtener parámetros de la URL
    $mbid = $_GET['mbid'] ?? null;
    $name = $_GET['name'] ?? null;

    // Si no se proporciona mbid, intentar usar el parámetro 'id' por compatibilidad
    if (!$mbid && isset($_GET['id'])) {
        $mbid = $_GET['id'];
    }

    Artist::getArtistMetaData($mbid, $name);
?>