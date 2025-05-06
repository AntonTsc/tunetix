<?php
include_once '../../db.php';
include_once '../../auth/validate_token.php';
include_once '../../auth/global_headers.php';

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

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
        if (!isset($data['cantidad'], $data['precio_individual'], $data['ubicacion'], $data['artista'], $data['metodo_pago_id'])) {
            echo json_encode(["status" => "ERROR", "message" => "Datos incompletos"]);
            exit;
        }

        // Verificar que el método de pago pertenezca al usuario
        $verify_payment = $conn->prepare("SELECT id FROM metodo_pago WHERE id = ? AND id_usuario = ?");
        $verify_payment->bind_param("ii", $data['metodo_pago_id'], $user_id);
        $verify_payment->execute();
        $result = $verify_payment->get_result();

        if ($result->num_rows === 0) {
            echo json_encode(["status" => "ERROR", "message" => "Método de pago no válido o no pertenece al usuario"]);
            exit;
        }

        // Calcular precio total
        $precio_total = $data['cantidad'] * $data['precio_individual'];

        // Comprobar si existe el campo event_id
        if (isset($data['event_id']) && !empty($data['event_id'])) {
            // Verificar que el evento exista en la tabla precios_eventos
            $verify_event = $conn->prepare("SELECT event_id FROM precios_eventos WHERE event_id = ?");
            $verify_event->bind_param("s", $data['event_id']);
            $verify_event->execute();
            $event_result = $verify_event->get_result();

            if ($event_result->num_rows === 0) {
                // Si el evento no existe, lo registramos primero
                $insert_event = $conn->prepare("INSERT INTO precios_eventos (event_id, precio) VALUES (?, ?)");
                $insert_event->bind_param("sd", $data['event_id'], $data['precio_individual']);

                if (!$insert_event->execute()) {
                    echo json_encode(["status" => "ERROR", "message" => "Error al registrar el evento"]);
                    exit;
                }
            }

            // Insertar ticket con event_id
            $stmt = $conn->prepare("INSERT INTO ticket (id_usuario, event_id, cantidad, precio_individual, precio_total, ubicacion, artista, metodo_pago_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");

            $stmt->bind_param(
                "isiddssi",
                $user_id,
                $data['event_id'],
                $data['cantidad'],
                $data['precio_individual'],
                $precio_total,
                $data['ubicacion'],
                $data['artista'],
                $data['metodo_pago_id']
            );
        } else {
            // Insertar ticket sin event_id (compatible con versiones anteriores)
            $stmt = $conn->prepare("INSERT INTO ticket (id_usuario, cantidad, precio_individual, precio_total, ubicacion, artista, metodo_pago_id) VALUES (?, ?, ?, ?, ?, ?, ?)");

            $stmt->bind_param(
                "iiddssi",
                $user_id,
                $data['cantidad'],
                $data['precio_individual'],
                $precio_total,
                $data['ubicacion'],
                $data['artista'],
                $data['metodo_pago_id']
            );
        }

        if ($stmt->execute()) {
            $response_data = [
                "id" => $conn->insert_id,
                "cantidad" => $data['cantidad'],
                "precio_individual" => $data['precio_individual'],
                "precio_total" => $precio_total,
                "ubicacion" => $data['ubicacion'],
                "artista" => $data['artista'],
                "metodo_pago_id" => $data['metodo_pago_id']
            ];

            // Añadir event_id a la respuesta si está presente
            if (isset($data['event_id'])) {
                $response_data["event_id"] = $data['event_id'];
            }

            echo json_encode([
                "status" => "OK",
                "message" => "Tickets comprados correctamente",
                "data" => $response_data
            ]);
        } else {
            echo json_encode(["status" => "ERROR", "message" => "Error al registrar la compra: " . $stmt->error]);
        }
    } catch (Exception $e) {
        echo json_encode(["status" => "ERROR", "message" => "Error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "ERROR", "message" => "Método no permitido"]);
}
