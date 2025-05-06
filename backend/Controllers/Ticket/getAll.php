<?php
include_once '../../db.php';
include_once '../../auth/validate_token.php';
include_once '../../auth/global_headers.php';

// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
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

        // Query simplificada sin alias para evitar problemas
        $query = "SELECT 
                    ticket.id, 
                    ticket.id_usuario, 
                    ticket.event_id, 
                    ticket.cantidad, 
                    ticket.precio_individual, 
                    ticket.precio_total, 
                    ticket.ubicacion, 
                    ticket.artista, 
                    ticket.metodo_pago_id, 
                    ticket.created_at as purchaseDate, 
                    metodo_pago.tipo as payment_type, 
                    metodo_pago.titular as payment_owner 
                  FROM 
                    ticket 
                  LEFT JOIN 
                    metodo_pago ON ticket.metodo_pago_id = metodo_pago.id 
                  WHERE 
                    ticket.id_usuario = ? 
                  ORDER BY 
                    ticket.created_at DESC";

        $stmt = $conn->prepare($query);
        $stmt->bind_param("i", $user_id);
        $stmt->execute();
        $result = $stmt->get_result();

        $tickets = [];

        // Log para cada ticket encontrado
        $ticketCount = 0;
        while ($ticket = $result->fetch_assoc()) {
            $ticketCount++;
            error_log("Procesando ticket #$ticketCount: ID=" . $ticket['id'] . ", Artista=" . $ticket['artista']);

            // Transformar los datos para que sean compatibles con la interfaz del frontend
            $status = 'completed'; // Por defecto todas las compras están completadas

            // Opcional: podemos determinar el estado basándonos en alguna lógica
            // Por ejemplo, si la compra es reciente (menos de 1 hora), podría estar en "pending"
            $purchaseTime = strtotime($ticket['purchaseDate']);
            $currentTime = time();

            if (($currentTime - $purchaseTime) < 3600) { // 1 hora
                $status = 'pending';
            }

            // Construir la URL de la imagen del evento (podría venir de la API de Ticketmaster o un campo en la BD)
            $eventImage = 'assets/imgs/events/default-event.jpg';

            // Asegurar que todos los campos sean del tipo correcto
            $ticketData = [
                'id' => (string)$ticket['id'], // Convertir a string para seguridad
                'eventId' => isset($ticket['event_id']) ? (string)$ticket['event_id'] : '',
                'eventName' => $ticket['artista'], // Usamos el artista como nombre del evento
                'eventImage' => $eventImage,
                'location' => $ticket['ubicacion'],
                'purchaseDate' => $ticket['purchaseDate'],
                'quantity' => (int)$ticket['cantidad'],
                'unitPrice' => (float)$ticket['precio_individual'],
                'totalPrice' => (float)$ticket['precio_total'],
                'status' => $status,
                'paymentMethod' => [
                    'id' => (int)$ticket['metodo_pago_id'],
                    'type' => $ticket['payment_type'] ?? '',
                    'owner' => $ticket['payment_owner'] ?? ''
                ]
            ];

            $tickets[] = $ticketData;
        }

        echo json_encode([
            "status" => "OK",
            "message" => "Tickets obtenidos correctamente",
            "data" => $tickets
        ]);
    } catch (Exception $e) {
        error_log("Error en getAll.php: " . $e->getMessage());
        echo json_encode(["status" => "ERROR", "message" => "Error: " . $e->getMessage()]);
    }
} else {
    echo json_encode(["status" => "ERROR", "message" => "Método no permitido"]);
}
