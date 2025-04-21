<?php
include_once '../../db.php';
include_once '../../auth/validate_token.php';
include_once '../../auth/global_headers.php';

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Verificar autenticación
        if (!isset($_COOKIE['access_token'])) {
            echo json_encode(["status" => "ERROR", "message" => "No autorizado"]);
            exit;
        }

        $token = $_COOKIE['access_token'];
        $payload = verifyToken($token);

        if (!$payload) {
            echo json_encode(["status" => "ERROR", "message" => "Token inválido o expirado"]);
            exit;
        }

        $user_id = $payload->id;

        // Obtener datos del body
        $data = json_decode(file_get_contents("php://input"), true);

        // Validar datos requeridos
        if (!isset($data['cantidad'], $data['precio_individual'], $data['ubicacion'], $data['artista'])) {
            echo json_encode(["status" => "ERROR", "message" => "Datos incompletos"]);
            exit;
        }

        // Calcular precio total
        $precio_total = $data['cantidad'] * $data['precio_individual'];

        // Insertar ticket
        $stmt = $conn->prepare("INSERT INTO ticket (id_usuario, cantidad, precio_individual, precio_total, ubicacion, artista) VALUES (?, ?, ?, ?, ?, ?)");

        $stmt->bind_param(
            "iiddss",
            $user_id,
            $data['cantidad'],
            $data['precio_individual'],
            $precio_total,
            $data['ubicacion'],
            $data['artista']
        );

        if ($stmt->execute()) {
            echo json_encode([
                "status" => "OK",
                "message" => "Tickets comprados correctamente",
                "data" => [
                    "id" => $conn->insert_id,
                    "cantidad" => $data['cantidad'],
                    "precio_individual" => $data['precio_individual'],
                    "precio_total" => $precio_total,
                    "ubicacion" => $data['ubicacion'],
                    "artista" => $data['artista']
                ]
            ]);
        } else {
            echo json_encode(["status" => "ERROR", "message" => "Error al registrar la compra"]);
        }
    } catch (Exception $e) {
        echo json_encode(["status" => "ERROR", "message" => "Error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "ERROR", "message" => "Método no permitido"]);
}
