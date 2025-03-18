<?php
    include_once '../../db.php';
    include_once '../../auth/global_headers.php';

    header('Content-Type: application/json');

    // TODO: crear funcionalidad para eliminar tarjetas de credito de un usuario

    $card_id = $_GET['id'];

    if(!isset($card_id)){
        echo json_encode(['status' => 'ERROR', 'message' => 'Id de tarjeta no especificada']);
        exit;
    }

    if(!doesIdExist($card_id)){
        echo json_encode(['status' => 'ERROR', 'message' => 'No se ha encontrado la tarjeta']);
        exit;
    }

    try{
        $prep = $conn->prepare('DELETE FROM metodo_pago WHERE id = ?');
        $prep->bind_param('i', $card_id);
        $prep->execute();
        
        echo json_encode(['status' => 'OK', 'message' => 'La tarjeta se ha borrado correctamente']);
    }catch(Exception $e){
        echo json_encode(['status' => 'ERROR', 'message' => 'No se ha podido borrar la tarjeta']);
    }

    function doesIdExist($id){
        global $conn;

        $prep = $conn->prepare('SELECT id FROM metodo_pago WHERE id = ?');
        $prep->bind_param('i', $id);
        $prep->execute();
        $result = $prep->get_result();

        return $result->num_rows > 0;
    }
?>