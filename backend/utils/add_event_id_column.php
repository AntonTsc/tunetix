<?php
// Script para añadir la columna event_id a la tabla ticket
include_once '../../db.php';

try {
    // Verificar si la columna ya existe
    $checkColumnQuery = "SHOW COLUMNS FROM ticket LIKE 'event_id'";
    $result = $conn->query($checkColumnQuery);

    if ($result->num_rows == 0) {
        // La columna no existe, añadirla
        $alterTableQuery = "ALTER TABLE ticket ADD COLUMN event_id VARCHAR(255) AFTER id_usuario";
        if ($conn->query($alterTableQuery)) {
            echo json_encode([
                "status" => "OK",
                "message" => "Columna event_id añadida correctamente a la tabla ticket"
            ]);
        } else {
            echo json_encode([
                "status" => "ERROR",
                "message" => "Error al añadir la columna: " . $conn->error
            ]);
        }
    } else {
        echo json_encode([
            "status" => "OK",
            "message" => "La columna event_id ya existe en la tabla ticket"
        ]);
    }
} catch (Exception $e) {
    echo json_encode([
        "status" => "ERROR",
        "message" => "Error: " . $e->getMessage()
    ]);
}