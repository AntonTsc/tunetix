<?php
    include_once '../../db.php';
    include_once '../../utils/cardValidations.php';

    header('Content-Type: application/json');

    global $conn;

    if($_SERVER['REQUEST_METHOD'] === 'POST'){
        try{
            $data = json_decode(file_get_contents("php://input"), true);

            $type = $data['type'];
            $user_id = getUserId($conn, $data['email']);
            $owner = $data['owner'];
            $pan = $data['pan'];
            $cvc = $data['cvc'];
            $expiration_date = $data['expiration_date'];
            $currency = $data['currency'];

            if(!isset($type, $user_id, $owner, $pan, $cvc, $expiration_date)){
                echo json_encode(["status" => "ERROR", "message" => "Campos incompo"]);
                exit;
            }
    
            if(!validateType($type, $conn)){
                echo json_encode(["status" => "ERROR", "message" => "Tipo de tarjeta invalida"]);
                exit;
            }

            if(!validatePan($pan)){
                echo json_encode(["status" => "ERROR", "message" => "Codigo PAN invalido"]);
                exit;
            }

            if(!validateCvc($cvc)){
                echo json_encode(["status" => "ERROR", "message" => "Codigo CVC invalido"]);
                exit;
            }

            if(!validateExpirationDate($expiration_date)){
                echo json_encode(["status" => "ERROR", "message" => "Fecha de expiracion invalida"]);
                exit;
            }

            $prep = $conn->prepare("INSERT INTO metodo_pago VALUES(null,?,?,?,?,?,?,?,null)");
            $prep->bind_param("sisiiss", $type, $user_id, $owner, $pan, $cvc, $expiration_date, $currency);
            $prep->execute();

            echo json_encode(['status' => 'OK', 'message' => 'Se ha añadido un nuevo metodo de pago']);
            
        }catch(Exception $e){
            echo json_encode(['status' => 'ERROR', 'message' => 'No se ha podido añadir un nuevo metodo de pago']);
            throw $e;
            exit;
        }
    }

    function getUserId($conn, $email){
        try{
            $prep = $conn->prepare("SELECT id FROM usuario WHERE correo = ?");
            $prep->bind_param('s', $email);
            $prep->execute();
            $result = $prep->get_result();
            
            return $result->fetch_assoc()['id'];    
        }catch(Exception $e){
            throw $e;
        }
    }
?>