<?php
include_once '../../db.php';
include_once '../../auth/global_headers.php';
include_once '../../auth/validate_token.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    // Verificar si existe el token de acceso
    if (!isset($_COOKIE['access_token'])) {
        echo json_encode(["status" => "ERROR", "message" => "No autorizado"]);
        exit;
    }

    // Obtener y validar el token
    $token = $_COOKIE['access_token'];
    $payload = verifyToken($token);

    if (!$payload) {
        echo json_encode(["status" => "ERROR", "message" => "Token inválido o expirado"]);
        exit;
    }

    // Obtener el ID del usuario del token
    $userId = $payload->id;

    // Consultar todos los datos del usuario
    $prep = $conn->prepare("SELECT id, nombre, apellido, correo, image_path, created_at, updated_at FROM usuario WHERE id = ?");
    $prep->bind_param("i", $userId);
    $prep->execute();
    $result = $prep->get_result();
    $user = $result->fetch_assoc();

    if (!$user) {
        echo json_encode(["status" => "ERROR", "message" => "Usuario no encontrado"]);
        exit;
    }

    // Consultar métodos de pago del usuario
    $paymentQuery = $conn->prepare("SELECT id, tipo, titular, numero_oculto, fecha_expiracion, created_at FROM metodo_pago WHERE id_usuario = ?");
    $paymentQuery->bind_param("i", $userId);
    $paymentQuery->execute();
    $paymentResult = $paymentQuery->get_result();
    $paymentMethods = [];

    while ($payment = $paymentResult->fetch_assoc()) {
        $paymentMethods[] = $payment;
    }

    // Consultar tickets del usuario
    $ticketQuery = $conn->prepare("SELECT id, cantidad, precio_individual, precio_total, ubicacion, artista, created_at FROM ticket WHERE id_usuario = ?");
    $ticketQuery->bind_param("i", $userId);
    $ticketQuery->execute();
    $ticketResult = $ticketQuery->get_result();
    $tickets = [];

    while ($ticket = $ticketResult->fetch_assoc()) {
        $tickets[] = $ticket;
    }

    // Formatear la respuesta
    $userData = [
        "id" => $user['id'],
        "first_name" => $user['nombre'],
        "last_name" => $user['apellido'],
        "email" => $user['correo'],
        "image_path" => $user['image_path'],
        "created_at" => $user['created_at'],
        "updated_at" => $user['updated_at'],
        "payment_methods" => $paymentMethods,
        "tickets" => $tickets
    ];

    echo json_encode([
        "status" => "OK",
        "message" => "Datos de usuario obtenidos",
        "data" => $userData
    ]);

    // Cerrar las consultas
    $prep->close();
    $paymentQuery->close();
    $ticketQuery->close();
} else {
    echo json_encode(["status" => "ERROR", "message" => "Método no permitido"]);
}
