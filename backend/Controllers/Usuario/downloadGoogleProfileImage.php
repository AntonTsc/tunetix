<?php
include_once '../../db.php';
include_once '../../auth/global_headers.php';
include_once '../../auth/validate_token.php';

header('Content-Type: application/json');

// Verificar que sea una solicitud POST
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['status' => 'ERROR', 'message' => 'Método no permitido']);
    exit;
}

// Obtener el token de las cookies
$token = $_COOKIE['access_token'] ?? null;
if (!$token) {
    echo json_encode(['status' => 'ERROR', 'message' => 'No se encontró token de autenticación']);
    exit;
}

// Validar token y obtener ID de usuario
$payload = verifyToken($token);
if (!$payload) {
    echo json_encode(['status' => 'ERROR', 'message' => 'Token inválido o expirado']);
    exit;
}

$user_id = $payload->id;

try {
    // Obtener la URL de la imagen del usuario desde la base de datos
    $stmt = $conn->prepare("SELECT image_path FROM usuario WHERE id = ?");
    $stmt->bind_param("i", $user_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows === 0) {
        echo json_encode(['status' => 'ERROR', 'message' => 'Usuario no encontrado']);
        exit;
    }

    $user = $result->fetch_assoc();
    $profileImageUrl = $user['image_path'];

    // Verificar si es una URL de Google
    if (!$profileImageUrl || strpos($profileImageUrl, 'googleusercontent.com') === false) {
        echo json_encode(['status' => 'ERROR', 'message' => 'No hay una imagen de Google para descargar']);
        exit;
    }

    // Crear directorio si no existe
    $upload_dir = "../../uploads/avatars/";
    if (!file_exists($upload_dir)) {
        mkdir($upload_dir, 0755, true);
    }

    // Generar nombre de archivo único
    $file_name = "google_" . $user_id . "_" . time() . ".jpg";
    $file_path = $upload_dir . $file_name;

    // Inicializar cURL para descargar la imagen
    $ch = curl_init($profileImageUrl);

    // Configurar opciones de cURL
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_FOLLOWLOCATION, true);
    curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
    curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');

    // Ejecutar solicitud y obtener imagen
    $image_data = curl_exec($ch);
    $curl_error = curl_error($ch);
    $http_code = curl_getinfo($ch, CURLINFO_HTTP_CODE);
    curl_close($ch);

    // Verificar si la descarga fue exitosa
    if ($http_code !== 200 || !$image_data) {
        error_log("Error descargando imagen de Google: $curl_error (HTTP: $http_code)");
        echo json_encode([
            'status' => 'ERROR',
            'message' => 'Error al descargar la imagen de Google',
            'details' => $curl_error
        ]);
        exit;
    }

    // Guardar la imagen en el servidor
    if (file_put_contents($file_path, $image_data)) {
        // Actualizar la URL de la imagen en la base de datos
        $relative_path = "uploads/avatars/" . $file_name;
        $stmt = $conn->prepare("UPDATE usuario SET image_path = ? WHERE id = ?");
        $stmt->bind_param("si", $relative_path, $user_id);

        if ($stmt->execute()) {
            echo json_encode([
                'status' => 'OK',
                'message' => 'Imagen descargada y guardada correctamente',
                'data' => [
                    'image_path' => $relative_path
                ]
            ]);
        } else {
            echo json_encode([
                'status' => 'ERROR',
                'message' => 'Error al actualizar la base de datos',
                'error' => $conn->error
            ]);
        }
    } else {
        echo json_encode([
            'status' => 'ERROR',
            'message' => 'Error al guardar la imagen en el servidor'
        ]);
    }
} catch (Exception $e) {
    error_log('Error: ' . $e->getMessage());
    echo json_encode([
        'status' => 'ERROR',
        'message' => 'Error del servidor',
        'error' => $e->getMessage()
    ]);
}
