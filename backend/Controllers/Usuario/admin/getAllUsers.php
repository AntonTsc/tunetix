<?php
include_once '../../../db.php';
include_once '../../../auth/validate_token.php';
include_once '../../../auth/global_headers.php';

header('Content-Type: application/json');

// Verificar si hay un token de acceso válido
if (!isset($_COOKIE['access_token'])) {
    echo json_encode(["status" => "ERROR", "message" => "No autorizado"]);
    exit;
}

$token = $_COOKIE['access_token'];
$payload = verifyToken($token);

if (!$payload) {
    echo json_encode(["status" => "ERROR", "message" => "Token inválido o expirado"]);
    exit;
}

// Obtener el ID del usuario desde el token
$userId = $payload->id;

// IMPORTANTE: Verificar que el usuario sea administrador
$stmt = $conn->prepare("SELECT rol FROM usuario WHERE id = ?");
$stmt->bind_param("i", $userId);
$stmt->execute();
$result = $stmt->get_result();

if ($result->num_rows > 0) {
    $user = $result->fetch_assoc();
    $role = $user['rol'] ?: 'user';

    // Denegar acceso si no es administrador
    if ($role !== 'admin') {
        echo json_encode([
            "status" => "ERROR",
            "message" => "Acceso denegado - Se requieren permisos de administrador"
        ]);
        exit;
    }
} else {
    echo json_encode(["status" => "ERROR", "message" => "Usuario no encontrado"]);
    exit;
}

// Si llegamos aquí, el usuario es administrador
// Obtener todos los usuarios
$getAllUsers = $conn->prepare("SELECT id, nombre as first_name, apellido as last_name, correo as email, image_path, rol as role, created_at, updated_at FROM usuario ORDER BY id ASC");
$getAllUsers->execute();
$result = $getAllUsers->get_result();

$users = [];
while ($row = $result->fetch_assoc()) {
    // Asegurarse de que el rol tenga un valor predeterminado
    if (empty($row['role'])) {
        $row['role'] = 'user';
    }

    $users[] = $row;
}

echo json_encode([
    "status" => "OK",
    "message" => "Usuarios obtenidos correctamente",
    "data" => $users
]);

$getAllUsers->close();
$stmt->close();
