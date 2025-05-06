<?php

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

require_once '../vendor/autoload.php';
include_once 'token.php';
include_once 'validate_token.php';
include_once '../db.php';
include_once 'global_headers.php';

header('Content-Type: application/json');

// Verifica que exista el access_token
if (!isset($_COOKIE['access_token'])) {
    http_response_code(401);
    echo json_encode(['status' => 'ERROR', 'message' => 'No token']);
    exit;
}

try {
    $token = $_COOKIE['access_token'];
    $decoded = JWT::decode($token, new Key($_ENV['SECRET'], 'HS256'));
    error_log('Token recibido: ' . $token);
    error_log('Decodificado: ' . print_r($decoded, true));
    $userId = $decoded->user_id; // <-- Aquí debe existir

    error_log("Buscando usuario con id: $userId");

    // Busca el usuario en la base de datos
    $stmt = $conn->prepare("SELECT id, nombre, apellido, correo, rol FROM usuario WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();
    error_log("Resultado de la consulta: " . print_r($user, true));

    if ($user) {
        $user_id = $user['id'];
        $email = $user['correo'];
        $role = $user['rol'];

        $payload = [
            "user_id" => $user_id,
            "email" => $email,
            "role" => $role,
            "iat" => time(),
            "exp" => time() + 1800
        ];
        $access_token = JWT::encode($payload, $_ENV['SECRET'], 'HS256');

        echo json_encode([
            'status' => 'OK',
            'data' => [
                'user_id' => $user_id,
                'first_name' => $user['nombre'],
                'last_name' => $user['apellido'],
                'email' => $user['correo'],
                'role' => $user['rol'],
                'access_token' => $access_token
            ]
        ]);
    } else {
        http_response_code(404);
        echo json_encode(['status' => 'ERROR', 'message' => 'User not found']);
    }
} catch (Exception $e) {
    http_response_code(401);
    echo json_encode(['status' => 'ERROR', 'message' => 'Invalid token']);
}