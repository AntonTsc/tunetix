<?php
include_once __DIR__ . '/classes/Track.php';
include_once '../../auth/global_headers.php';

$limit = isset($_GET['limit']) ? (int)$_GET['limit'] : 24;
$page = isset($_GET['page']) ? (int)$_GET['page'] : 1;
$sort = isset($_GET['sort']) ? $_GET['sort'] : 'popularity_desc';
$keyword = isset($_GET['keyword']) ? $_GET['keyword'] : '';

Track::getTopTracksInfo($limit, $page, $sort, $keyword);
