<?php
include_once '../../../db.php';
include_once '../../../auth/validate_token.php';
include_once '../../../auth/global_headers.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(["status" => "ERROR", "message" => "Método no permitido"]);
    exit;
}

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

// Obtener datos de la solicitud
$data = json_decode(file_get_contents("php://input"), true);

if (!isset($data['userId']) || !isset($data['role'])) {
    echo json_encode(["status" => "ERROR", "message" => "Faltan datos requeridos"]);
    exit;
}

$targetUserId = (int)$data['userId'];
$newRole = $data['role'];

// Validar que el rol sea válido
if ($newRole !== 'user' && $newRole !== 'admin') {
    echo json_encode(["status" => "ERROR", "message" => "Rol inválido"]);
    exit;
}

// Evitar que un administrador elimine sus propios privilegios
if ($targetUserId === $userId && $newRole !== 'admin') {
    echo json_encode(["status" => "ERROR", "message" => "No puedes degradar tu propio rol de administrador"]);
    exit;
}

// Actualizar el rol del usuario
$updateRole = $conn->prepare("UPDATE usuario SET rol = ? WHERE id = ?");
$updateRole->bind_param("si", $newRole, $targetUserId);

if ($updateRole->execute()) {
    echo json_encode([
        "status" => "OK",
        "message" => "Rol de usuario actualizado correctamente"
    ]);
} else {
    echo json_encode([
        "status" => "ERROR",
        "message" => "Error al actualizar el rol: " . $updateRole->error
    ]);
}

$updateRole->close();
$stmt->close();
