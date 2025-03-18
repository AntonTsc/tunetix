<?php
include_once '../../db.php';
include_once '../../auth/global_headers.php';
include_once '../../auth/validate_token.php';

header('Content-Type: application/json');

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Verificar si existe el token de acceso
    if (!isset($_COOKIE['access_token'])) {
        echo json_encode(["status" => "ERROR", "message" => "No autorizado"]);
        exit;
    }

    // Obtener y validar el token
    $token = $_COOKIE['access_token'];
    $payload = verifyToken($token);

    if (!$payload) {
        echo json_encode(["status" => "ERROR", "message" => "Token inválido o expirado"]);
        exit;
    }

    // Obtener el ID del usuario del token
    $userId = $payload->id;

    // Obtener los datos a actualizar desde el cuerpo de la solicitud
    $data = json_decode(file_get_contents("php://input"), true);

    if (!$data) {
        echo json_encode(["status" => "ERROR", "message" => "No se recibieron datos para actualizar"]);
        exit;
    }

    // Inicialización de variables
    $nombre = $data['name'] ?? null;
    $apellido = $data['lastName'] ?? null;
    $correo = $data['email'] ?? null;
    $camposActualizados = [];

    // Construir la consulta SQL dinámicamente basada en los campos recibidos
    $updateQuery = "UPDATE usuario SET ";
    $params = [];
    $types = "";

    if ($nombre !== null) {
        $updateQuery .= "nombre = ?, ";
        $params[] = $nombre;
        $types .= "s";
        $camposActualizados[] = "nombre";
    }

    if ($apellido !== null) {
        $updateQuery .= "apellido = ?, ";
        $params[] = $apellido;
        $types .= "s";
        $camposActualizados[] = "apellido";
    }

    if ($correo !== null) {
        // Verificar si el correo ya está en uso por otro usuario
        $checkEmail = $conn->prepare("SELECT id FROM usuario WHERE correo = ? AND id != ?");
        $checkEmail->bind_param("si", $correo, $userId);
        $checkEmail->execute();
        $resultEmail = $checkEmail->get_result();

        if ($resultEmail->num_rows > 0) {
            echo json_encode(["status" => "ERROR", "message" => "El correo electrónico ya está en uso por otro usuario"]);
            exit;
        }

        $updateQuery .= "correo = ?, ";
        $params[] = $correo;
        $types .= "s";
        $camposActualizados[] = "correo";
    }

    // Añadir timestamp de actualización
    $updateQuery .= "updated_at = NOW() ";

    // Añadir condición WHERE
    $updateQuery .= "WHERE id = ?";
    $params[] = $userId;
    $types .= "i";

    // Si no hay campos para actualizar
    if (empty($camposActualizados)) {
        echo json_encode(["status" => "ERROR", "message" => "No se especificaron campos para actualizar"]);
        exit;
    }

    // Preparar y ejecutar la consulta
    $stmt = $conn->prepare($updateQuery);

    // Crear un array con referencias para bind_param
    $bindParams = array($types);
    foreach ($params as $key => $value) {
        $bindParams[] = &$params[$key];
    }

    call_user_func_array(array($stmt, 'bind_param'), $bindParams);

    if ($stmt->execute()) {
        // Si la actualización fue exitosa, obtener los datos actualizados
        $prep = $conn->prepare("SELECT id, nombre, apellido, correo, image_path, created_at, updated_at FROM usuario WHERE id = ?");
        $prep->bind_param("i", $userId);
        $prep->execute();
        $result = $prep->get_result();
        $user = $result->fetch_assoc();

        // Formatear la respuesta
        $userData = [
            "id" => $user['id'],
            "first_name" => $user['nombre'],
            "last_name" => $user['apellido'],
            "email" => $user['correo'],
            "image_path" => $user['image_path'],
            "created_at" => $user['created_at'],
            "updated_at" => $user['updated_at']
        ];

        echo json_encode([
            "status" => "OK",
            "message" => "Datos actualizados correctamente",
            "data" => $userData,
            "updated_fields" => $camposActualizados
        ]);

        $prep->close();
    } else {
        echo json_encode(["status" => "ERROR", "message" => "Error al actualizar los datos: " . $stmt->error]);
    }

    $stmt->close();
} else {
    echo json_encode(["status" => "ERROR", "message" => "Método no permitido"]);
}
