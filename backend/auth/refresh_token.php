<?php
include_once '../vendor/autoload.php';
include_once 'token.php';
include_once '../dotenv.php';
use Firebase\JWT\JWT;
use Firebase\JWT\Key;

$secret_key = $_ENV['SECRET'];

if (!isset($_COOKIE['refresh_token'])) {
    echo json_encode(["message" => "No hay token de refresh"]);
    exit;
}

$refresh_token = $_COOKIE['refresh_token'];

header('Content-Type: application/json');

try {
    $decoded = JWT::decode($refresh_token, new Key($secret_key, 'HS256'));
    $new_access_token = generateToken($decoded->id, $decoded->email, 1800); // 30 min

    setcookie("access_token", $new_access_token, time() + 1800, "/", "", true, true);

    echo json_encode(["status" => "OK", "message" => "Token renovado"]);
} catch (Exception $e) {
    echo json_encode(["status" => "ERROR", "message" => "Refresh token inválido", "error" => $e->getMessage()]);
}
?>
