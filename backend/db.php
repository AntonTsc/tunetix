<?php
include_once __DIR__ . '/dotenv.php';

$host = $_ENV['DB_HOST'];
$db_name = $_ENV['DB_NAME'];
$username = $_ENV['DB_USER'];
$password = $_ENV['DB_PASS'];

try {
    $conn = new mysqli($host, $username, $password, $db_name);

    if ($conn->connect_error) {
        throw new Exception("Error de conexión: " . $conn->connect_error);
    }

    return $conn;
} catch (Exception $e) {
    die(json_encode(["message" => $e->getMessage() . $e->getCode()]));
}
