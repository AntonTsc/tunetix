<?php
include_once '../../db.php';
include_once '../../auth/global_headers.php';
// No incluir validate_token.php ya que vamos a hacerlo manualmente

// Importaciones necesarias para JWT
require_once '../../vendor/autoload.php';
include_once '../../dotenv.php';

use Firebase\JWT\JWT;
use Firebase\JWT\Key;

// Activar registro de errores en un archivo
ini_set('log_errors', 1);
ini_set('error_log', '../../logs/google_password_errors.log');

// Registrar información de depuración
error_log('Intento de actualización de contraseña para cuenta Google');
error_log('Headers: ' . json_encode(getallheaders()));
error_log('Cookies: ' . json_encode($_COOKIE));
error_log('POST Data: ' . file_get_contents('php://input'));

header('Content-Type: application/json');

// Verificar método HTTP
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode([
        'status' => 'ERROR',
        'message' => 'Método no permitido'
    ]);
    exit;
}

// Simplificar el proceso para obtener el token - usar sólo cookies
$token = '';
if (isset($_COOKIE['refreshToken'])) {
    $token = $_COOKIE['refreshToken'];
} elseif (isset($_COOKIE['access_token'])) {
    $token = $_COOKIE['access_token'];
}

// Verificar que existe un token
if (empty($token)) {
    echo json_encode([
        'status' => 'ERROR',
        'message' => 'No se encontró token de autenticación en las cookies'
    ]);
    exit;
}

// Validar token
try {
    // Decodificar el token
    $secret_key = $_ENV['SECRET'] ?? null;

    if (!$secret_key) {
        error_log('ERROR: No se encontró SECRET_KEY en variables de entorno');
        echo json_encode([
            'status' => 'ERROR',
            'message' => 'Error de configuración del servidor'
        ]);
        exit;
    }

    $decoded = JWT::decode($token, new Key($secret_key, 'HS256'));

    // Acceso más flexible al ID
    if (isset($decoded->id)) {
        $user_id = $decoded->id;
    } else {
        echo json_encode([
            'status' => 'ERROR',
            'message' => 'Estructura de token inválida - ID no encontrado',
            'tokenData' => $decoded
        ]);
        exit;
    }

    error_log('Token decodificado: ' . json_encode($decoded));

    // Verificar que el ID de usuario existe
    if (!$user_id) {
        echo json_encode([
            'data' => $decoded,
            'status' => 'ERROR',
            'message' => 'Usuario no autenticado - ID no encontrado en token'
        ]);
        exit;
    }

    // Obtener datos del cuerpo de la solicitud
    $data = json_decode(file_get_contents('php://input'), true);
    $newPassword = $data['newPassword'] ?? null;

    // Validar campos
    if (!$newPassword) {
        echo json_encode([
            'status' => 'ERROR',
            'message' => 'La nueva contraseña es obligatoria'
        ]);
        exit;
    }

    // Verificar que la cuenta sea de Google
    $stmt = $conn->prepare('SELECT auth_provider FROM usuario WHERE id = ?');
    $stmt->bind_param('i', $user_id);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    if (!$user) {
        echo json_encode([
            'status' => 'ERROR',
            'message' => 'Usuario no encontrado'
        ]);
        exit;
    }

    if ($user['auth_provider'] !== 'google') {
        echo json_encode([
            'status' => 'ERROR',
            'message' => 'Esta operación solo está disponible para cuentas vinculadas a Google'
        ]);
        exit;
    }

    // Hashear la nueva contraseña
    $hashedPassword = password_hash($newPassword, PASSWORD_DEFAULT);

    // Actualizar la contraseña en la base de datos
    $stmt = $conn->prepare('UPDATE usuario SET contrasena = ? WHERE id = ?');
    $stmt->bind_param('si', $hashedPassword, $user_id);
    $updated = $stmt->execute();

    if ($updated) {
        echo json_encode([
            'status' => 'OK',
            'message' => 'Contraseña añadida correctamente. Ahora puedes iniciar sesión con email y contraseña.',
            'data' => [
                'has_password' => true
            ]
        ]);
    } else {
        echo json_encode([
            'status' => 'ERROR',
            'message' => 'Error al actualizar la contraseña: ' . $conn->error
        ]);
    }
} catch (Exception $e) {
    error_log('Error al decodificar token: ' . $e->getMessage());
    echo json_encode([
        'status' => 'ERROR',
        'message' => 'Error de autenticación: ' . $e->getMessage()
    ]);
    exit;
}
