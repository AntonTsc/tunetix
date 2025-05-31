<?php
include_once '../auth/global_headers.php';
include_once '../utils/classes/ServerResponse.php';

// Limpiar cookies con configuraciones cross-origin
setcookie("access_token", "", [
    'expires' => time() - 3600,
    'path' => '/',
    'domain' => '',
    'secure' => false,
    'httponly' => false,
    'samesite' => 'Lax'
]);
setcookie("refresh_token", "", [
    'expires' => time() - 3600,
    'path' => '/',
    'domain' => '',
    'secure' => false,
    'httponly' => false,
    'samesite' => 'Lax'
]);

ServerResponse::success("Sesión cerrada");
