<?php
include_once '../../db.php';
include_once '../../auth/token.php';
include_once '../../auth/global_headers.php';

header('Content-Type: application/json');

try {
    // Verifica el JWT y obtiene el user_id del usuario autenticado
    $jwt = getBearerToken();
    if (!$jwt) {
        echo json_encode(['status' => 'ERROR', 'message' => 'Token no proporcionado']);
        exit;
    }

    $user_id = getUserIdFromToken($jwt);
    if (!$user_id) {
        echo json_encode(['status' => 'ERROR', 'message' => 'Token inválido']);
        exit;
    }

    $prep = $conn->prepare("SELECT * FROM metodo_pago WHERE id_usuario = ?");
    $prep->bind_param('i', $user_id);
    $prep->execute();
    $result = $prep->get_result();
    $data = $result->fetch_all(MYSQLI_ASSOC);

    echo json_encode(['status' => 'OK', 'message' => 'Datos enviados', 'data' => $data]);
} catch (Exception $e) {
    // Registra el error en el servidor
    error_log($e->getMessage());
    echo json_encode(['status' => 'ERROR', 'message' => 'Ocurrió un error interno']);
    exit;
}
?>