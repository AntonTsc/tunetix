<?php
include_once '../db.php';
include_once 'global_headers.php';
include_once 'token.php';
include_once '../utils/formValidations.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['email'], $data['password'])) {
        echo json_encode(["status" => "ERROR", "message" => "Datos incompletos"]);
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
        echo json_encode([
            'status' => 'ERROR',
            'message' => 'Credenciales inválidas.'
        ]);
        exit;
    }

    // Comprobar si es cuenta de Google sin contraseña
    if ($user['auth_provider'] === 'google' && empty($user['contrasena'])) {
        echo json_encode([
            'status' => 'ERROR',
            'message' => 'Esta cuenta está vinculada a Google. Por favor, inicia sesión con Google o añade una contraseña desde tu perfil.'
        ]);
        exit;
    }

    // Validar formato de email
    try {
        validateEmail($user['correo']);
    } catch (Exception $e) {
        echo json_encode(["status" => "ERROR", "message" => $e->getMessage()]);
        exit;
    }

    // Verificar la contraseña (para cuentas locales o cuentas de Google con contraseña)
    if (password_verify($password, $user['contrasena'])) {
        // Generar tokens
        $access_token = generateToken($user['id'], $user['correo'], 60 * 30); // 30 min
        $refresh_token = generateToken($user['id'], $user['correo'], 259200); // 3 días

        // Configurar cookies seguras
        setcookie("access_token", $access_token, time() + 60 * 30, "/", "localhost", false, false);
        setcookie("refresh_token", $refresh_token, time() + 259200, "/", "localhost", false, false);

        // Modificar la preparación de userData para incluir el rol
        $userData = [
            "id" => $user['id'],
            "first_name" => $user['nombre'],
            "last_name" => $user['apellido'],
            "email" => $user['correo'],
            "role" => $user['rol'] ?: 'user' // Si es NULL, poner 'user' por defecto
        ];

        echo json_encode([
            "status" => "OK",
            "message" => "Login exitoso",
            "data" => $userData
        ]);
    } else {
        // Contraseña incorrecta
        echo json_encode([
            'status' => 'ERROR',
            'message' => 'Credenciales inválidas.'
        ]);
        exit;
    }

    $stmt->close();
} else {
    echo json_encode(["status" => "ERROR", "message" => "Método no permitido"]);
}
