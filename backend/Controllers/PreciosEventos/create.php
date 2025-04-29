<?php
require_once __DIR__ . '/../../db.php';

class PreciosEventosController
{
    private $conn;

    public function __construct($conn)
    {
        $this->conn = $conn;
    }

    public function getEventPrice($eventId)
    {
        try {
            // Primero, intentar obtener el precio existente
            $stmt = $this->conn->prepare("SELECT precio FROM precios_eventos WHERE event_id = ?");
            $stmt->bind_param("s", $eventId);
            $stmt->execute();
            $result = $stmt->get_result();

            // Si encontramos un precio, lo devolvemos
            if ($result && $result->num_rows > 0) {
                $row = $result->fetch_assoc();
                return floatval($row['precio']);
            }

            // Si no existe precio, generamos uno nuevo
            $precio = mt_rand(3000, 15000) / 100;

            // Insertamos el nuevo precio
            $insertStmt = $this->conn->prepare("INSERT INTO precios_eventos (event_id, precio) VALUES (?, ?)");
            $insertStmt->bind_param("sd", $eventId, $precio);

            if (!$insertStmt->execute()) {
                throw new Exception("Error al insertar el precio: " . $insertStmt->error);
            }

            return $precio;
        } catch (Exception $e) {
            error_log("Error en getEventPrice: " . $e->getMessage());
            throw new Exception("Error al gestionar el precio del evento: " . $e->getMessage());
        }
    }
}
