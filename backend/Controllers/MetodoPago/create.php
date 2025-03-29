<?php
include_once '../../db.php';
include_once '../../utils/cardValidations.php';
include_once '../../auth/validate_token.php';
include_once '../../auth/global_headers.php';


// Handle preflight requests
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

global $conn;

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    try {
        // Get user ID from token instead of email
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

        // Get JSON data
        $data = json_decode(file_get_contents("php://input"), true);

        // Match variable names with what your frontend is sending
        $tipo = $data['tipo'] ?? $data['type'] ?? null;
        $titular = $data['titular'] ?? $data['owner'] ?? null;
        $pan = $data['numero'] ?? $data['pan'] ?? null;
        $cvc = $data['cvc'] ?? null;
        $fecha_expiracion = $data['fecha_expiracion'] ?? $data['expiration_date'] ?? null;
        $divisa = $data['divisa'] ?? $data['currency'] ?? 'EUR';

        // Validate required fields
        if (!isset($tipo, $titular, $pan, $cvc, $fecha_expiracion)) {
            echo json_encode(["status" => "ERROR", "message" => "Campos incompletos"]);
            exit;
        }

        // Validate card type (match your enum values in the database)
        if ($tipo !== 'VISA' && $tipo !== 'MASTERCARD') {
            echo json_encode(["status" => "ERROR", "message" => "Tipo de tarjeta inválida"]);
            exit;
        }

        // Remove any non-numeric characters (spaces, dashes, etc.) from PAN
        $pan = preg_replace('/\D/', '', $pan);

        // Validate CVC
        if (function_exists('validateCvc') && !validateCvc($cvc)) {
            echo json_encode(["status" => "ERROR", "message" => "Código CVC inválido"]);
            exit;
        }

        // Validate expiration date
        if (function_exists('validateExpirationDate') && !validateExpirationDate($fecha_expiracion)) {
            echo json_encode(["status" => "ERROR", "message" => "Fecha de expiración inválida"]);
            exit;
        }

        // Verificar si el usuario ya tiene esta tarjeta registrada
        $checkDuplicate = $conn->prepare("SELECT id FROM metodo_pago WHERE id_usuario = ? AND pan = ?");
        $checkDuplicate->bind_param("is", $user_id, $pan);
        $checkDuplicate->execute();
        $result = $checkDuplicate->get_result();

        if ($result->num_rows > 0) {
            echo json_encode(["status" => "ERROR", "message" => "Ya tienes esta tarjeta registrada"]);
            exit;
        }

        // Use column names that match your database schema
        $prep = $conn->prepare("INSERT INTO metodo_pago (tipo, id_usuario, titular, pan, cvc, fecha_expiracion, divisa) VALUES (?, ?, ?, ?, ?, ?, ?)");
        $prep->bind_param("sisiiss", $tipo, $user_id, $titular, $pan, $cvc, $fecha_expiracion, $divisa);

        if ($prep->execute()) {
            $id = $conn->insert_id;
            echo json_encode(['status' => 'OK', 'message' => 'Se ha añadido un nuevo método de pago', 'id' => $id]);
        } else {
            echo json_encode(['status' => 'ERROR', 'message' => 'Error al guardar: ' . $prep->error]);
        }
    } catch (Exception $e) {
        echo json_encode(['status' => 'ERROR', 'message' => 'Error: ' . $e->getMessage()]);
        exit;
    }
} else {
    echo json_encode(['status' => 'ERROR', 'message' => 'Método no permitido']);
}
