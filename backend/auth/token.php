<?php
include_once '../vendor/autoload.php';
include_once '../dotenv.php';

use Firebase\JWT\JWT;

$secret_key = $_ENV['SECRET'];

function generateToken($user_id, $email, $exp) {
    global $secret_key;
    $payload = [
        "id" => $user_id,
        "email" => $email,
        "exp" => time() + $exp
    ];
    return JWT::encode($payload, $secret_key, 'HS256');
}
?>