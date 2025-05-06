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
    $stmt = $conn->prepare('SELECT id, nombre as first_name, apellido as last_name, correo as email, image_path, created_at, updated_at, auth_provider, contrasena FROM usuario WHERE id = ?');
    $stmt->bind_param('i', $userId);
    $stmt->execute();
    $result = $stmt->get_result();
    $user = $result->fetch_assoc();

    if (!$user) {
        echo json_encode(["status" => "ERROR", "message" => "Usuario no encontrado"]);
        exit;
    }

    // Añadir un campo que indique si el usuario tiene contraseña
    $user['has_password'] = !empty($user['contrasena']);

    // Eliminar el campo contrasena antes de enviar la respuesta por seguridad
    unset($user['contrasena']);

    // Consultar métodos de pago del usuario
    $paymentQuery = $conn->prepare("SELECT id, tipo, titular, cvc, fecha_expiracion, created_at FROM metodo_pago WHERE id_usuario = ?");
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
        "first_name" => $user['first_name'],
        "last_name" => $user['last_name'],
        "email" => $user['email'],
        "image_path" => $user['image_path'],
        "created_at" => $user['created_at'],
        "updated_at" => $user['updated_at'],
        "auth_provider" => $user['auth_provider'],
        "has_password" => $user['has_password'],
        "payment_methods" => $paymentMethods,
        "tickets" => $tickets
    ];

    echo json_encode([
        "status" => "OK",
        "message" => "Datos de usuario obtenidos",
        "data" => $userData
    ]);

    // Cerrar las consultas
    $stmt->close();
    $paymentQuery->close();
    $ticketQuery->close();
} else {
    echo json_encode(["status" => "ERROR", "message" => "Método no permitido"]);
}
