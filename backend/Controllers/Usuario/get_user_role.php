<?php
include_once '../../db.php';
include_once '../../auth/validate_token.php';
include_once '../../auth/global_headers.php';

header('Content-Type: application/json');

// Añadir cabeceras para evitar caché
header('Cache-Control: no-store, no-cache, must-revalidate, max-age=0');
header('Pragma: no-cache');
header('Expires: 0');

// Verificar si hay un token de acceso válido
if (!isset($_COOKIE['access_token'])) {
    echo json_encode([
        "status" => "ERROR",
        "message" => "No autorizado - Acceso denegado"
    ]);
    exit;
}

$token = $_COOKIE['access_token'];
$payload = verifyToken($token);

if (!$payload) {
    echo json_encode([
        "status" => "ERROR",
        "message" => "Token inválido o expirado"
    ]);
    exit;
}

// Obtener el ID del usuario desde el token
$userId = $payload->id;

// Consultar el rol del usuario en la base de datos
$stmt = $conn->prepare("SELECT id, nombre, apellido, correo, rol FROM usuario WHERE id = ?");
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $user = $result->fetch_assoc();
    $role = $user['rol'] ?: 'user'; // Si el campo está vacío, asignar 'user' por defecto

    // Registrar todas las verificaciones de admin para seguridad
    if ($role === 'admin') {
        // Opcional: Mantener un registro de las verificaciones de administrador
        error_log("Verificación de administrador exitosa - Usuario ID: " . $userId . " - IP: " . $_SERVER['REMOTE_ADDR']);
    }

    echo json_encode([
        "status" => "OK",
        "message" => "Rol de usuario obtenido correctamente",
        "data" => [
            "role" => $role,
            "userId" => $userId,
            "verified" => true
        ]
    ]);
} else {
    echo json_encode([
        "status" => "ERROR",
        "message" => "Usuario no encontrado - ID: " . $userId
    ]);
}

$stmt->close();
