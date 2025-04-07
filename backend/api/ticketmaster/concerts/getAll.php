<?php
include_once './classes/Concert.php';
include_once '../../../auth/global_headers.php';

$limit = isset($_GET['limit']) ? $_GET['limit'] : 0;
$keyword = isset($_GET['keyword']) ? $_GET['keyword'] : "";
$countryCode = isset($_GET['countryCode']) ? $_GET['countryCode'] : "";
$page = isset($_GET['page']) ? $_GET['page'] : 0;
$sort = isset($_GET['sort']) ? $_GET['sort'] : "date_asc"; // Añadido parámetro de ordenación

Concert::getAll($limit, $keyword, $countryCode, $page, $sort);
