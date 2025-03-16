<?php
include_once '../db.php';
include_once 'token.php';
include_once '../utils/formValidations.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['email'], $data['password'])) {
        echo json_encode(["status" => "ERROR", "message" => "Datos incompletos"]);
        exit;
    }

    $email = $data['email'];
    $password = $data['password'];

    $prep = $conn->prepare("SELECT id, nombre, apellido, correo, contrasena FROM usuario WHERE correo = ?");
    $prep->bind_param("s", $email);
    $prep->execute();
    $result = $prep->get_result();
    $user = $result->fetch_assoc();

    // Verificar si el usuario existe
    if (!$user) {
        echo json_encode(["status" => "ERROR", "message" => "Correo electrónico o contraseña incorrectos"]);
        exit;
    }

    // Validar formato de email
    try {
        validateEmail($user['correo']);
    } catch (Exception $e) {
        echo json_encode(["status" => "ERROR", "message" => $e->getMessage()]);
        exit;
    }

    // Verificar contraseña
    if (password_verify($password, $user['contrasena'])) {
        // Generar tokens
        $access_token = generateToken($user['id'], $user['correo'], 1800); // 30 min
        $refresh_token = generateToken($user['id'], $user['correo'], 259200); // 3 días

        // Configurar cookies seguras
        setcookie("access_token", $access_token, time() + 1800, "/", "", true, true);
        setcookie("refresh_token", $refresh_token, time() + 259200, "/", "", true, true);

        // Preparar respuesta
        $userData = [
            "id" => $user['id'],
            "first_name" => $user['nombre'],
            "last_name" => $user['apellido'],
            "email" => $user['correo']
        ];

        echo json_encode([
            "status" => "OK",
            "message" => "Login exitoso",
            "data" => $userData
        ]);
    } else {
        // Contraseña incorrecta
        echo json_encode(["status" => "ERROR", "message" => "Correo electrónico o contraseña incorrectos"]);
        exit;
    }

    $prep->close();
} else {
    echo json_encode(["status" => "ERROR", "message" => "Método no permitido"]);
}
