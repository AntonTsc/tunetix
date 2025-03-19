<?php
include_once __DIR__ . '/../vendor/autoload.php';
include_once __DIR__ . '/../dotenv.php';
include_once __DIR__ . '/global_headers.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

$secret_key = $_ENV['SECRET'];

function generateToken($user_id, $email, $exp) {
    global $secret_key;
    $payload = [
        "id" => $user_id,
        "email" => $email,
        "exp" => time() + $exp
    ];
    return JWT::encode($payload, $secret_key, 'HS256');
}

function getUserIdFromToken($jwt) {
    global $secret_key;
    try {
        $decoded = JWT::decode($jwt, new Key($secret_key, 'HS256'));
        return $decoded->id;
    } catch (Exception $e) {
        // Maneja el error de decodificación del token
        return null;
    }
}

function getBearerToken() {
    $headers = apache_request_headers();
    if (isset($headers['Authorization'])) {
        $matches = [];
        if (preg_match('/Bearer\s(\S+)/', $headers['Authorization'], $matches)) {
            return $matches[1];
        }
    }
    return null;
}
?>