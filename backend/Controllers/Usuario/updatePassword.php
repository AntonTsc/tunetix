<?php
include_once '../../db.php';
include_once '../../auth/global_headers.php';
include_once '../../auth/validate_token.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Verificar si existe el token de acceso
    if (!isset($_COOKIE['access_token'])) {
        echo json_encode(["status" => "ERROR", "message" => "No autorizado"]);
        exit;
    }

    // Obtener y validar el token
    $token = $_COOKIE['access_token'];
    $payload = verifyToken($token);

    if (!$payload) {
        echo json_encode(["status" => "ERROR", "message" => "Token inválido o expirado"]);
        exit;
    }

    // Obtener el ID del usuario del token
    $userId = $payload->id;

    // Obtener los datos a actualizar desde el cuerpo de la solicitud
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['currentPassword']) || !isset($data['newPassword'])) {
        echo json_encode(["status" => "ERROR", "message" => "Datos incompletos"]);
        exit;
    }

    $currentPassword = $data['currentPassword'];
    $newPassword = $data['newPassword'];

    // Verificar que la contraseña actual sea correcta
    $stmt = $conn->prepare("SELECT contrasena FROM usuario WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    if (!$user) {
        echo json_encode(["status" => "ERROR", "message" => "Usuario no encontrado"]);
        exit;
    }

    if (!password_verify($currentPassword, $user['contrasena'])) {
        echo json_encode(["status" => "ERROR", "message" => "La contraseña actual es incorrecta"]);
        exit;
    }

    // Validar la nueva contraseña (puedes añadir más validaciones según tus requisitos)
    if (strlen($newPassword) < 6) {
        echo json_encode(["status" => "ERROR", "message" => "La nueva contraseña debe tener al menos 6 caracteres"]);
        exit;
    }

    // Hashear la nueva contraseña
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

    // Actualizar la contraseña en la base de datos
    $updateStmt = $conn->prepare("UPDATE usuario SET contrasena = ?, updated_at = NOW() WHERE id = ?");
    $updateStmt->bind_param("si", $hashedPassword, $userId);

    if ($updateStmt->execute()) {
        echo json_encode([
            "status" => "OK",
            "message" => "Contraseña actualizada correctamente"
        ]);
    } else {
        echo json_encode([
            "status" => "ERROR",
            "message" => "Error al actualizar la contraseña: " . $updateStmt->error
        ]);
    }

    $stmt->close();
    $updateStmt->close();
} else {
    echo json_encode(["status" => "ERROR", "message" => "Método no permitido"]);
}
