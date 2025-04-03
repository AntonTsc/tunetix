<?php
    include_once './Classes/Artist.php';
    include_once '../../../auth/global_headers.php';

    $limit = isset($_GET['limit']) ? intval($_GET['limit']) : 50; // Valor predeterminado de 50
    Artist::getTopGlobalArtists($limit);
?>