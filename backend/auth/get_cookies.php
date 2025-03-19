<?php
    include_once '../auth/global_headers.php';
    
    header('Content-Type: application/json');
    if(isset($_COOKIE['access_token'], $_COOKIE['refresh_token'])){
        $cookies = ["access_token" => $_COOKIE['access_token'], "refresh_token" => $_COOKIE['refresh_token']];
        echo json_encode(["status" => "OK", "message" => "cookies sent", "data" => $cookies]);
    }else{
        echo json_encode(["status" => "ERROR", "message" => "Error when attempting to send cookies"]);
    }
?>