<?php
include_once '../vendor/autoload.php';
include_once '../dotenv.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

$secret_key = $_ENV['SECRET'];

header('Content-Type: application/json');

if (!isset($_COOKIE['access_token'])) {
    echo json_encode(["message" => "Token no proporcionado"]);
    exit;
}

$jwt = $_COOKIE['access_token'];

try {
    $decoded = JWT::decode($jwt, new Key($secret_key, 'HS256'));
    echo json_encode(["status" => "OK", "message" => "Token valido"]);
} catch (Exception $e) {
    echo json_encode(["status" => "ERROR", "error" => $e->getMessage()]);
}
?>