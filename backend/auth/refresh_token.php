<?php
include_once '../vendor/autoload.php';
include_once 'token.php';
include_once '../dotenv.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// Obtener la clave secreta del .env
$secret_key = $_ENV['SECRET']; 

// Verificar que el refresh_token está presente en las cookies
if (!isset($_COOKIE['refresh_token'])) {
    echo json_encode(["status" => "ERROR", "message" => "No hay refresh token"]);
    http_response_code(400);  // Código de error 400: Bad Request
    exit;
}

// Obtener el refresh_token de las cookies
$refresh_token = $_COOKIE['refresh_token'];

header('Content-Type: application/json');

try {
    $decoded = JWT::decode($refresh_token, new Key($secret_key, 'HS256'));

    // Verificar que la fecha de expiración del refresh_token no haya pasado
    if ($decoded->exp < time()) {
        echo json_encode(["status" => "ERROR", "message" => "Refresh token expirado"]);
        http_response_code(401);
        exit;
    }

    $new_access_token = generateToken($decoded->id, $decoded->email, 1800); // 30 min

    // Configurar la cookie de access_token con Secure y HttpOnly
    setcookie("access_token", $new_access_token, time() + 1800, "/", "", true, true);  // Expira en 30 min

    echo json_encode(["status" => "OK", "message" => "Token renovado", "access_token" => $new_access_token]);

} catch (Exception $e) {
    echo json_encode(["status" => "ERROR", "message" => "Refresh token inválido", "error" => $e->getMessage()]);
    http_response_code(401);
}
?>
