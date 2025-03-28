<?php

/**
 * Verifica la autenticación del usuario a través del token JWT
 * @return array Estado de la autenticación
 */
function verifyAuth()
{
    include_once __DIR__ . '/auth/validate_token.php';

    // Verificar si existe el token en la cabecera Authorization
    $headers = getallheaders();
    $authHeader = isset($headers['Authorization']) ? $headers['Authorization'] : '';

    // Extraer token del formato "Bearer {token}"
    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
    } else {
        // Intentar obtener token de cookies como alternativa
        $token = isset($_COOKIE['access_token']) ? $_COOKIE['access_token'] : null;
    }

    if (!$token) {
        // Intentar con refresh token si no hay access token
        $token = isset($_COOKIE['refresh_token']) ? $_COOKIE['refresh_token'] : null;
    }

    if (!$token) {
        return array("status" => "ERROR", "message" => "No autorizado: No se encontró token", "user_id" => 0);
    }

    // Validar el token
    $decoded = verifyToken($token);

    if (!$decoded) {
        return array("status" => "ERROR", "message" => "No autorizado: Token inválido", "user_id" => 0);
    }

    // Asegurémonos de que la propiedad 'id' existe en el objeto decodificado
    if (!isset($decoded->id)) {
        return array("status" => "ERROR", "message" => "No autorizado: Token malformado", "user_id" => 0);
    }

    // Si hemos llegado hasta aquí, el token es válido
    return array("status" => "OK", "message" => "Autenticado", "user_id" => $decoded->id);
}
