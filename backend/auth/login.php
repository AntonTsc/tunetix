<?php
include_once '../db.php';
include_once 'global_headers.php';
include_once 'token.php';
include_once '../utils/formValidations.php';
include_once '../utils/classes/ServerResponse.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['email'], $data['password'])) {
        ServerResponse::error(0, "Datos incompletos");
        exit;
    }

    $email = $data['email'];
    $password = $data['password'];

    // Modificar la consulta para incluir el rol y auth_provider
    $stmt = $conn->prepare('SELECT id, nombre, apellido, correo, contrasena, rol, auth_provider FROM usuario WHERE correo = ?');
    $stmt->bind_param('s', $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    // Verificar si el usuario existe
    if (!$user) {
        ServerResponse::error(0, "Credenciales inválidas");
        exit;
    }

    // Comprobar si es cuenta de Google sin contraseña
    if ($user['auth_provider'] === 'google' && empty($user['contrasena'])) {
        ServerResponse::error(0, "Esta cuenta está vinculada a Google. Por favor, inicia sesión con Google o añade una contraseña desde tu perfil.");
        exit;
    }

    // Validar formato de email
    try {
        validateEmail($user['correo']);
    } catch (Exception $e) {
        ServerResponse::error($e->getCode(), $e->getMessage());
        exit;
    }

    // Verificar la contraseña (para cuentas locales o cuentas de Google con contraseña)
    if (password_verify($password, $user['contrasena'])) {
        $access_token = generateToken($user['id'], $user['correo'], 60 * 30); // 30 min
        $refresh_token = generateToken($user['id'], $user['correo'], 259200); // 3 días

        // Configurar cookies para cross-origin (localhost:4200 -> localhost)
        // CRÍTICO: httponly=false, secure=false, domain=null para desarrollo cross-origin
        setcookie("access_token", $access_token, [
            'expires' => time() + (60 * 30), // 30 minutos
            'path' => '/',
            'domain' => '', // NO especificar domain para permitir cross-origin
            'secure' => false, // FALSE en desarrollo (HTTP)
            'httponly' => false, // FALSE para permitir acceso desde JavaScript
            'samesite' => 'Lax' // Permitir envío cross-origin
        ]);

        setcookie("refresh_token", $refresh_token, [
            'expires' => time() + 259200, // 3 días
            'path' => '/',
            'domain' => '', // NO especificar domain para permitir cross-origin
            'secure' => false, // FALSE en desarrollo (HTTP)
            'httponly' => false, // FALSE para permitir acceso desde JavaScript
            'samesite' => 'Lax' // Permitir envío cross-origin
        ]);

        // Modificar la preparación de userData para incluir el rol
        $userData = [
            "id" => $user['id'],
            "first_name" => $user['nombre'],
            "last_name" => $user['apellido'],
            "email" => $user['correo'],
            "role" => $user['rol'] ?: 'user' // Si es NULL, poner 'user' por defecto
        ];

        ServerResponse::success("Login exitoso", $userData);
    } else {
        // Contraseña incorrecta
        ServerResponse::error(0, "Credenciales inválidas");
        exit;
    }

    $stmt->close();
} else {
    ServerResponse::error(0, "Método no permitido");
}
