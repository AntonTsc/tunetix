<?php
include_once '../auth/global_headers.php';

header('Content-Type: application/json');

setcookie("access_token", "", time() - 3600, "/", "", true, true);
setcookie("refresh_token", "", time() - 3600, "/", "", true, true);

echo json_encode(["status" => "OK", "message" => "Sesion cerrada"]);
?>