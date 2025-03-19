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
    
    // Verificar si se ha enviado un archivo
    if (!isset($_FILES['image']) || $_FILES['image']['error'] !== UPLOAD_ERR_OK) {
        echo json_encode([
            "status" => "ERROR", 
            "message" => "No se ha recibido ninguna imagen o ha ocurrido un error al subir"
        ]);
        exit;
    }
    
    // Obtener información del archivo
    $file = $_FILES['image'];
    $fileName = $file['name'];
    $fileTmpPath = $file['tmp_name'];
    $fileSize = $file['size'];
    $fileError = $file['error'];
    
    // Validar tipo de archivo (solo imágenes)
    $validTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
    $fileType = mime_content_type($fileTmpPath);
    
    if (!in_array($fileType, $validTypes)) {
        echo json_encode([
            "status" => "ERROR", 
            "message" => "El archivo debe ser una imagen (JPEG, PNG, GIF o WEBP)"
        ]);
        exit;
    }
    
    // Validar tamaño (máximo 5MB)
    if ($fileSize > 5 * 1024 * 1024) {
        echo json_encode([
            "status" => "ERROR", 
            "message" => "La imagen no debe superar los 5MB"
        ]);
        exit;
    }
    
    // Crear directorio si no existe
    $uploadDir = '../../../frontend/src/assets/imgs/avatars/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }
    
    // Generar nombre único para el archivo
    $extension = pathinfo($fileName, PATHINFO_EXTENSION);
    $newFileName = 'avatar_' . $userId . '_' . time() . '.' . $extension;
    $uploadPath = $uploadDir . $newFileName;
    
    // Obtener la ruta relativa para guardar en la base de datos
    $relativePath = 'assets/imgs/avatars/' . $newFileName;
    
    // Mover el archivo al directorio de destino
    if (move_uploaded_file($fileTmpPath, $uploadPath)) {
        // Obtener la imagen anterior para eliminarla si existe
        $stmt = $conn->prepare("SELECT image_path FROM usuario WHERE id = ?");
        $stmt->bind_param("i", $userId);
        $stmt->execute();
        $result = $stmt->get_result();
        $user = $result->fetch_assoc();
        
        if ($user && $user['image_path']) {
            $oldImagePath = '../../../frontend/src/' . $user['image_path'];
            // Verificar si el archivo existe y no es el avatar por defecto
            if (file_exists($oldImagePath) && strpos($user['image_path'], 'default') === false) {
                unlink($oldImagePath);
            }
        }
        
        // Actualizar la ruta de la imagen en la base de datos
        $updateStmt = $conn->prepare("UPDATE usuario SET image_path = ?, updated_at = NOW() WHERE id = ?");
        $updateStmt->bind_param("si", $relativePath, $userId);
        
        if ($updateStmt->execute()) {
            // Obtener datos actualizados del usuario
            $userStmt = $conn->prepare("SELECT id, nombre, apellido, correo, image_path, created_at, updated_at FROM usuario WHERE id = ?");
            $userStmt->bind_param("i", $userId);
            $userStmt->execute();
            $userResult = $userStmt->get_result();
            $userData = $userResult->fetch_assoc();
            
            echo json_encode([
                "status" => "OK",
                "message" => "Imagen de perfil actualizada correctamente",
                "data" => [
                    "id" => $userData['id'],
                    "first_name" => $userData['nombre'],
                    "last_name" => $userData['apellido'],
                    "email" => $userData['correo'],
                    "image_path" => $userData['image_path'],
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
    } else {
        echo json_encode([
            "status" => "ERROR",
            "message" => "Error al mover el archivo subido"
        ]);
    }
    
    if (isset($stmt)) {
        $stmt->close();
    }
    
} else {
    echo json_encode(["status" => "ERROR", "message" => "Método no permitido"]);
}
?>