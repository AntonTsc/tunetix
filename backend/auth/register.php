<?php
include_once '../db.php';
<<<<<<< HEAD
=======
include_once '../auth/global_headers.php';
>>>>>>> 1146de4923edd74e91bd9f73d69b5ab024695083
include_once '../utils/formValidations.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Recoge los parametros pasados en el body y lo convierte en un array asociativo
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['first_name'], $data['last_name'], $data['email'], $data['password'])) {
        echo json_encode(["message" => "Datos incompletos"]);
        exit;
    }

    // Limpiar y validar datos
    $first_name = trim($data['first_name']);
    $last_name = trim($data['last_name']);
    $email = trim($data['email']);
    $password = trim($data['password']);

    if (empty($first_name) || empty($last_name) || empty($email) || empty($password)) {
        echo json_encode(["status" => "ERROR", "message" => "Todos los campos deben ser rellenados"]);
        exit;
    }

    // Validacion y comprobacion del correo en la base de datos
    validateEmail($email);
    checkEmail($email, $conn);

    // Validacion de contraseña
    validatePassword($password);
    $password = password_hash($data['password'], PASSWORD_BCRYPT);

    $prep = $conn->prepare("INSERT INTO usuario (nombre, apellido, correo, contrasena) VALUES (?, ?, ?, ?)");
    $prep->bind_param("ssss", $first_name, $last_name, $email, $password);

    header('Content-Type: aplication/json');
    
    if ($prep->execute()) {
        echo json_encode(["status" => "OK", "message" => "Usuario registrado con éxito, ya puedes iniciar sesión"]);
    } else {
        echo json_encode(["status" => "ERROR", "message" => "Error al registrar"]);
    }

    $prep->close();
}
?>