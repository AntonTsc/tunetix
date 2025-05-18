<?php
    include_once '../auth/global_headers.php';
    include_once '../utils/classes/ServerResponse.php';
    include_once 'validate_token.php';
    
    header('Content-Type: application/json');
    if(isset($_COOKIE['access_token'], $_COOKIE['refresh_token'])){
        // Verificar si el access_token es válido
        $is_valid = verifyToken($_COOKIE['access_token']) !== false;
        
        $cookies = [
            "access_token" => $_COOKIE['access_token'], 
            "refresh_token" => $_COOKIE['refresh_token'],
            "access_token_valido" => $is_valid
        ];
        
        ServerResponse::success("Cookies sent", $cookies);
    }else{
        ServerResponse::error(0, "Error when attempting to send cookies");
    }
?>