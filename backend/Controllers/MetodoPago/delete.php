<?php
include_once '../../db.php';
include_once '../../auth/global_headers.php';

header('Content-Type: application/json');

// TODO: crear funcionalidad para eliminar tarjetas de credito de un usuario

$card_id = $_GET['id'];

if (!isset($card_id)) {
    echo json_encode(['status' => 'ERROR', 'message' => 'Id de tarjeta no especificada']);
    exit;
}

if (!doesIdExist($card_id)) {
    echo json_encode(['status' => 'ERROR', 'message' => 'No se ha encontrado la tarjeta']);
    exit;
}

try {
    // En lugar de eliminar, hacer delete lógico
    $deactivateCard = $conn->prepare("UPDATE metodo_pago SET active = 0 WHERE id = ?");
    $deactivateCard->bind_param("i", $card_id);

    if ($deactivateCard->execute()) {
        echo json_encode(['status' => 'OK', 'message' => 'Método de pago eliminado con éxito']);
    } else {
        echo json_encode(['status' => 'ERROR', 'message' => 'Error al eliminar el método de pago']);
    }
} catch (Exception $e) {
    echo json_encode(['status' => 'ERROR', 'message' => 'No se ha podido borrar la tarjeta']);
}

function doesIdExist($id)
{
    global $conn;

    $prep = $conn->prepare('SELECT id FROM metodo_pago WHERE id = ?');
    $prep->bind_param('i', $id);
    $prep->execute();
    $result = $prep->get_result();

    return $result->num_rows > 0;
}
