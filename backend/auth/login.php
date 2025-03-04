<?php
include_once '../db.php';
include_once 'token.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['email'], $data['password'])) {
        echo json_encode(["message" => "Datos incompletos"]);
        exit;
    }

    $email = $data['email'];
    $password = $data['password'];

    $stmt = $conn->prepare("SELECT id, correo, contrasena FROM usuario WHERE correo = ?");
    $stmt->bind_param("s", $email);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    header('Content-Type: application/json');

    if ($user && password_verify($password, $user['contrasena'])) {
        // Generar tokens
        $access_token = generateToken($user['id'], $user['correo'], 1800); // 30 min
        $refresh_token = generateToken($user['id'], $user['correo'], 259200); // 3 días

        // Configurar cookies seguras
        setcookie("access_token", $access_token, time() + 1800, "/", "", true, true);
        setcookie("refresh_token", $refresh_token, time() + 259200, "/", "", true, true);

        echo json_encode(["status" => "OK", "message" => "Login exitoso"]);
    } else {
        echo json_encode(["status" => "ERROR", "message" => "Credenciales incorrectas"]);
    }

    $stmt->close();
}
?>