<?php
include_once '../../db.php';
include_once '../../auth/global_headers.php';
include_once '../../auth/validate_token.php';

header('Content-Type: application/json');

// Verificar método HTTP
if ($_SERVER['REQUEST_METHOD'] !== 'DELETE') {
    echo json_encode([
        "status" => "ERROR",
        "message" => "Método no permitido"
    ]);
    exit;
}

// Verificar autenticación mediante token
if (!isset($_COOKIE['access_token'])) {
    echo json_encode([
        "status" => "ERROR",
        "message" => "No autorizado"
    ]);
    exit;
}

// Validar token
$token = $_COOKIE['access_token'];
$payload = verifyToken($token);

if (!$payload) {
    echo json_encode([
        "status" => "ERROR",
        "message" => "Token inválido o expirado"
    ]);
    exit;
}

// Obtener el ID de usuario del token
$userId = $payload->id;

try {
    // Obtener la imagen actual
    $stmt = $conn->prepare("SELECT image_path FROM usuario WHERE id = ?");
    $stmt->bind_param("i", $userId);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode([
            "status" => "ERROR",
            "message" => "Usuario no encontrado"
        ]);
        exit;
    }

    $user = $result->fetch_assoc();

    // Verificar si el usuario tiene una imagen
    if (!$user['image_path']) {
        echo json_encode([
            "status" => "ERROR",
            "message" => "El usuario no tiene una imagen de perfil"
        ]);
        exit;
    }

    // Determinar la ubicación correcta del archivo según la ruta almacenada
    if (strpos($user['image_path'], 'uploads/avatars/') === 0) {
        // Imagen en el backend
        $imagePath = '../../' . $user['image_path'];
    } else if (strpos($user['image_path'], 'assets/imgs/avatars/') === 0) {
        // Imagen en el frontend (compatibilidad con versiones anteriores)
        $imagePath = '../../../frontend/src/' . $user['image_path'];
    } else {
        // URL externa (Google)
        $imagePath = null;
    }

    // Eliminar el archivo físicamente si existe y no es una URL externa
    if ($imagePath && file_exists($imagePath) && strpos($user['image_path'], 'default') === false) {
        if (!unlink($imagePath)) {
            echo json_encode([
                "status" => "ERROR",
                "message" => "No se pudo eliminar el archivo de imagen"
            ]);
            exit;
        }
    }

    // Actualizar la base de datos para eliminar la referencia
    $updateStmt = $conn->prepare("UPDATE usuario SET image_path = NULL, updated_at = NOW() WHERE id = ?");
    $updateStmt->bind_param("i", $userId);

    if ($updateStmt->execute()) {
        // Obtener los datos actualizados del usuario
        $userStmt = $conn->prepare("SELECT id, nombre, apellido, correo, image_path, created_at, updated_at FROM usuario WHERE id = ?");
        $userStmt->bind_param("i", $userId);
        $userStmt->execute();
        $userResult = $userStmt->get_result();
        $userData = $userResult->fetch_assoc();

        echo json_encode([
            "status" => "OK",
            "message" => "Imagen de perfil eliminada correctamente",
            "data" => [
                "id" => $userData['id'],
                "first_name" => $userData['nombre'],
                "last_name" => $userData['apellido'],
                "email" => $userData['correo'],
                "image_path" => null,
                "created_at" => $userData['created_at'],
                "updated_at" => $userData['updated_at']
            ]
        ]);

        $userStmt->close();
    } else {
        echo json_encode([
            "status" => "ERROR",
            "message" => "Error al actualizar la base de datos: " . $updateStmt->error
        ]);
    }

    $updateStmt->close();
    $stmt->close();
} catch (Exception $e) {
    echo json_encode([
        "status" => "ERROR",
        "message" => "Error al procesar la solicitud: " . $e->getMessage()
    ]);
}
