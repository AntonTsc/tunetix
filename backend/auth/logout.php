<?php
include_once '../auth/global_headers.php';
include_once '../utils/classes/ServerResponse.php';

setcookie("access_token", "", time() - 3600, "/", "", false, false);
setcookie("refresh_token", "", time() - 3600, "/", "", false, false);

ServerResponse::success("Sesión cerrada");
?>