<?php
include_once '../db.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Recoge los parametros pasados en el body y lo convierte en un array asociativo
    $data = json_decode(file_get_contents("php://input"), true);

    if (!isset($data['first_name'], $data['last_name'], $data['email'], $data['password'])) {
        echo json_encode(["message" => "Datos incompletos"]);
        exit;
    }

    $first_name = $data['first_name'];
    $last_name = $data['last_name'];
    $email = $data['email'];
    $password = password_hash($data['password'], PASSWORD_BCRYPT);

    $prep = $conn->prepare("INSERT INTO usuario (nombre, apellido, correo, contrasena) VALUES (?, ?, ?, ?)");
    $prep->bind_param("ssss", $first_name, $last_name, $email, $password);

    header('Content-Type: aplication/json');
    
    if ($prep->execute()) {
        echo json_encode(["status" => "OK", "message" => "Usuario registrado con éxito"]);
    } else {
        echo json_encode(["status" => "ERROR", "message" => "Error al registrar"]);
    }

    $prep->close();
}
?>