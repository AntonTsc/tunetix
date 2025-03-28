<?php

/**
 * Funciones de autenticación para el backend de Tunetix
 */

/**
 * Verifica si el usuario actual está autenticado como administrador
 * @return bool Verdadero si el usuario es administrador, falso en caso contrario
 */
function isAdmin()
{
    session_start();

    // Verificar si el usuario está logueado
    if (!isset($_SESSION['user_id'])) {
        return false;
    }

    // Verificar si tiene rol de administrador
    if (!isset($_SESSION['user_role']) || $_SESSION['user_role'] !== 'admin') {
        return false;
    }

    return true;
}

/**
 * Verifica si el usuario actual está autenticado (cualquier rol)
 * @return bool Verdadero si el usuario está autenticado, falso en caso contrario
 */
function isAuthenticated()
{
    session_start();
    return isset($_SESSION['user_id']);
}

/**
 * Obtiene el ID del usuario actualmente autenticado
 * @return int|null ID del usuario o null si no está autenticado
 */
function getCurrentUserId()
{
    session_start();
    return isset($_SESSION['user_id']) ? $_SESSION['user_id'] : null;
}

/**
 * Obtiene el rol del usuario actualmente autenticado
 * @return string|null Rol del usuario o null si no está autenticado
 */
function getCurrentUserRole()
{
    session_start();
    return isset($_SESSION['user_role']) ? $_SESSION['user_role'] : null;
}

/**
 * Verifica si el API token recibido es válido
 * @return bool Verdadero si el token es válido, falso en caso contrario
 */
function validateApiToken()
{
    $headers = getallheaders();

    // Verificar si existe el header de autorización
    if (!isset($headers['Authorization'])) {
        return false;
    }

    // Extraer el token (formato: "Bearer {token}")
    $authHeader = $headers['Authorization'];
    $token = null;

    if (preg_match('/Bearer\s(\S+)/', $authHeader, $matches)) {
        $token = $matches[1];
    }

    if (!$token) {
        return false;
    }

    // Aquí deberías implementar la validación del token según tu sistema
    // Por ahora, como es un esqueleto, retornamos true para testing
    // En producción, debes validar contra tu base de datos o sistema de tokens

    return true;
}
