<?php
include_once dirname(__DIR__) . '/vendor/autoload.php';
include_once dirname(__DIR__) . '/dotenv.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use Firebase\JWT\ExpiredException;

$secret_key = $_ENV['SECRET'];

// Función para verificar un token
function verifyToken($token)
{
    global $secret_key;
    try {
        $decoded = JWT::decode($token, new Key($secret_key, 'HS256'));
        return $decoded;
    } catch (ExpiredException $e) {
        // Token expirado
        return false;
    } catch (Exception $e) {
        // Token inválido
        return false;
    }
}

// Este código solo se ejecuta si este archivo se llama directamente,
// no cuando se incluye en otro archivo
if (basename($_SERVER['PHP_SELF']) == basename(__FILE__)) {
    header('Content-Type: application/json');

    if (!isset($_COOKIE['access_token'])) {
        echo json_encode(["status" => "ERROR", "message" => "Token no proporcionado"]);
        exit;
    }

    $jwt = $_COOKIE['access_token'];

    try {
        $decoded = JWT::decode($jwt, new Key($secret_key, 'HS256'));
        echo json_encode(["status" => "OK", "message" => "Token valido"]);
    } catch (Exception $e) {
        echo json_encode(["status" => "ERROR", "message" => $e->getMessage()]);
    }
}
