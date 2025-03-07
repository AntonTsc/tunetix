<?php
include_once '../db.php';

function checkEmail($email, $connection){
    // Verificar si el correo ya existe en la base de datos
    $checkEmail = $connection->prepare("SELECT id FROM usuario WHERE correo = ?");
    $checkEmail->bind_param("s", $email);
    $checkEmail->execute();
    $result = $checkEmail->get_result();

    if ($result->num_rows > 0) {
        echo json_encode(["status" => "ERROR", "message" => "El correo ya está registrado"]);
        exit;
    }

    return true;
}

function validateEmail($email){
    if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
        echo json_encode(["status" => "ERROR", "message" => "Correo electrónico inválido"]);
        exit;
    }

    return true;
}

function validatePassword($password){
    if(empty($password)){
        echo json_encode(["status" => "ERROR", "message" => "La contraseña no puede estar vacía"]);
        exit;
    }

    if (strlen($password) < 8 || strlen($password) > 16) {
        echo json_encode(["status" => "ERROR", "message" => "La contraseña debe tener entre 8 y 16 caracteres"]);
        exit;
    }

    return true;
}

function checkPassword($email, $password, $connection){
    $checkPassword = $connection->prepare('SELECT id FROM usuario WHERE correo = ? AND contrasena = ?');
    $checkPassword->bind_param('ss', $email, $password);
    $checkPassword->execute();
    $result = $checkPassword->get_result();

    if($result->num_rows === 0){
        echo json_encode(["status" => "ERROR", "message" => "Contraseña incorrecta"]);
        exit;
    }
}
?>