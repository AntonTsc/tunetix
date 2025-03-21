<?php

/**
 * Verifica la autenticación del usuario a través del token JWT
 * @return array Estado de la autenticación
 */
function verifyAuth()
{
    include_once __DIR__ . '/auth/validate_token.php';

    // Verificar si existe el token de acceso
    if (!isset($_COOKIE['access_token']) && !isset($_COOKIE['refresh_token'])) {
        return array("status" => "ERROR", "message" => "No autenticado");
    }

    // Obtener token de cookies
    $token = isset($_COOKIE['access_token']) ? $_COOKIE['access_token'] : null;
    $refreshToken = isset($_COOKIE['refresh_token']) ? $_COOKIE['refresh_token'] : null;

    if (!$token && !$refreshToken) {
        return array("status" => "ERROR", "message" => "No autenticado");
    }

    // Validar el token
    $activeToken = $token ?: $refreshToken;
    $decoded = verifyToken($activeToken);

    if (!$decoded) {
        return array("status" => "ERROR", "message" => "Token inválido o expirado");
    }

    // Verificar rol de usuario en la base de datos
    include_once __DIR__ . '/db.php';
    global $conn;

    $userId = $decoded->id;
    $sql = "SELECT rol FROM usuario WHERE id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        return array("status" => "ERROR", "message" => "Usuario no encontrado");
    }

    $user = $result->fetch_assoc();
    $stmt->close();

    return array(
        "status" => "OK",
        "message" => "Autenticado",
        "user_id" => $userId,
        "role" => $user['rol']
    );
}
