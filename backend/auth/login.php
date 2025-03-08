<?php
include_once '../db.php';
include_once 'token.php';
include_once '../utils/formValidations.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['email'], $data['password'])) {
        echo json_encode(["message" => "Datos incompletos"]);
        exit;
    }

    $email = $data['email'];
    $password = $data['password'];

    $prep = $conn->prepare("SELECT id, nombre, apellido, correo, contrasena FROM usuario WHERE correo = ?");
    $prep->bind_param("s", $email);
    $prep->execute();
    $result = $prep->get_result();
    $user = $result->fetch_assoc();

    header('Content-Type: application/json');

    validateEmail($user['correo']);

    if ($user && password_verify($password, $user['contrasena'])) {
        // Generar tokens
        $access_token = generateToken($user['id'], $user['correo'], 1800); // 30 min
        $refresh_token = generateToken($user['id'], $user['correo'], 259200); // 3 días

        // Configurar cookies seguras
        setcookie("access_token", $access_token, time() + 1800, "/", "", true, true);
        setcookie("refresh_token", $refresh_token, time() + 259200, "/", "", true, true);

        unset($user['contrasena'], $user['id']);

        echo json_encode(["status" => "OK", "message" => "Login exitoso", "data" => $user]);
    } else {
        echo json_encode(["status" => "ERROR", "message" => "Credenciales incorrectas"]);
    }

    $prep->close();
}
?>