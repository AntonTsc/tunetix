<?php
include_once '../db.php';
include_once '../auth/token.php';
include_once '../auth/global_headers.php';
include_once '../dotenv.php';

header('Content-Type: application/json');

// Manejar solicitudes OPTIONS para CORS
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit;
}

// Iniciar OAuth con Google
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'init') {
    $state = bin2hex(random_bytes(16)); // Generar estado único
    session_start();
    $_SESSION['google_state'] = $state; // Guardar estado para verificar después

    $params = [
        'client_id' => $_ENV['GOOGLE_CLIENT_ID'],
        'redirect_uri' => $_ENV['GOOGLE_REDIRECT_URI'],
        'response_type' => 'code',
        'scope' => 'email profile',
        'state' => $state,
        'prompt' => 'select_account'
    ];

    $auth_url = 'https://accounts.google.com/o/oauth2/v2/auth?' . http_build_query($params);

    echo json_encode([
        "status" => "OK",
        "auth_url" => $auth_url
    ]);
    exit;
}

// Procesar callback de Google
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['code'])) {
    $code = $_GET['code'];
    $state = $_GET['state'] ?? '';
    $isXhrRequest = isset($_SERVER['HTTP_X_REQUESTED_WITH']) && $_SERVER['HTTP_X_REQUESTED_WITH'] === 'XMLHttpRequest';

    // Iniciar sesión para recuperar el estado almacenado
    session_start();

    // Verificar si hay un estado almacenado en sesión
    if (!isset($_SESSION['google_state'])) {
        // Si no hay estado en sesión, no lo validamos
        // (Esto permite que las redirecciones directas desde Angular funcionen)
        error_log("No se encontró google_state en la sesión, omitiendo validación de estado");
    }
    // Si hay estado en sesión, validarlo
    else if ($_SESSION['google_state'] !== $state) {
        error_log("La validación de estado falló: sesión=" . $_SESSION['google_state'] . " vs recibido=" . $state);

        if ($isXhrRequest) {
            echo json_encode([
                "status" => "ERROR",
                "message" => "La validación de estado falló"
            ]);
            exit;
        } else {
            // Redirigir con error en caso de solicitud normal
            header("Location: " . $_ENV['FRONTEND_URL'] . "/login?error=invalid_state");
            exit;
        }
    }

    // Intercambiar código por token
    $token_url = 'https://oauth2.googleapis.com/token';
    $token_data = [
        'code' => $code,
        'client_id' => $_ENV['GOOGLE_CLIENT_ID'],
        'client_secret' => $_ENV['GOOGLE_CLIENT_SECRET'],
        'redirect_uri' => $_ENV['GOOGLE_REDIRECT_URI'],
        'grant_type' => 'authorization_code'
    ];

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $token_url);
    curl_setopt($ch, CURLOPT_POST, true);
    curl_setopt($ch, CURLOPT_POSTFIELDS, http_build_query($token_data));
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);

    $response = curl_exec($ch);

    if (curl_errno($ch)) {
        error_log("Error de cURL: " . curl_error($ch));

        if ($isXhrRequest) {
            echo json_encode([
                "status" => "ERROR",
                "message" => "Error al obtener token: " . curl_error($ch)
            ]);
            exit;
        } else {
            header("Location: " . $_ENV['FRONTEND_URL'] . "/login?error=token_error");
            exit;
        }
    }

    curl_close($ch);
    $token_response = json_decode($response, true);

    if (!isset($token_response['access_token'])) {
        error_log("No se recibió token de acceso: " . print_r($token_response, true));

        if ($isXhrRequest) {
            echo json_encode([
                "status" => "ERROR",
                "message" => "No se recibió token de acceso"
            ]);
            exit;
        } else {
            header("Location: " . $_ENV['FRONTEND_URL'] . "/login?error=no_access_token");
            exit;
        }
    }

    // Obtener información del usuario con el token
    $userinfo_url = 'https://www.googleapis.com/oauth2/v3/userinfo';

    $ch = curl_init();
    curl_setopt($ch, CURLOPT_URL, $userinfo_url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_HTTPHEADER, ['Authorization: Bearer ' . $token_response['access_token']]);

    $response = curl_exec($ch);
    curl_close($ch);

    $user_info = json_decode($response, true);

    if (!isset($user_info['sub'])) {
        error_log("No se recibió información del usuario: " . print_r($user_info, true));

        if ($isXhrRequest) {
            echo json_encode([
                "status" => "ERROR",
                "message" => "No se recibió información del usuario"
            ]);
            exit;
        } else {
            header("Location: " . $_ENV['FRONTEND_URL'] . "/login?error=invalid_userinfo");
            exit;
        }
    }

    // Procesar datos del usuario
    $googleId = $user_info['sub'];
    $email = $user_info['email'] ?? '';
    $firstName = $user_info['given_name'] ?? '';
    $lastName = $user_info['family_name'] ?? '';
    $photoUrl = $user_info['picture'] ?? '';

    // Si tenemos una URL de foto de perfil, vamos a descargarla y guardarla localmente
    if (!empty($photoUrl)) {
        $localPhotoPath = downloadGoogleProfileImage($photoUrl, $googleId);
        if ($localPhotoPath) {
            $photoUrl = $localPhotoPath;
        }
    }

    try {
        // Comprobar si el usuario ya existe
        $stmt = $conn->prepare("SELECT * FROM usuario WHERE google_id = ?");
        $stmt->bind_param("s", $googleId);
        $stmt->execute();
        $result = $stmt->get_result();

        $loginStatus = "";
        $userData = null;

        if ($result->num_rows > 0) {
            $user = $result->fetch_assoc();
            $userData = $user;

            // Generar tokens
            $access_token = generateToken($user['id'], $user['correo'], 1800); // 30 min
            $refresh_token = generateToken($user['id'], $user['correo'], 259200); // 3 días

            // Configurar cookies
            setcookie("access_token", $access_token, time() + 1800, "/", "", false, false);
            setcookie("refresh_token", $refresh_token, time() + 259200, "/", "", false, false);

            $loginStatus = "success";
        } else {
            // Comprobar si existe un usuario con este email
            $stmt = $conn->prepare("SELECT id FROM usuario WHERE correo = ?");
            $stmt->bind_param("s", $email);
            $stmt->execute();
            $result = $stmt->get_result();

            if ($result->num_rows > 0) {
                $user = $result->fetch_assoc();
                $userId = $user['id'];

                // Vincular google_id al usuario existente
                $stmt = $conn->prepare("UPDATE usuario SET google_id = ?, auth_provider = 'google', image_path = COALESCE(image_path, ?) WHERE id = ?");
                $stmt->bind_param("ssi", $googleId, $photoUrl, $userId);
                $stmt->execute();

                // Obtener datos de usuario
                $stmt = $conn->prepare("SELECT * FROM usuario WHERE id = ?");
                $stmt->bind_param("i", $userId);
                $stmt->execute();
                $result = $stmt->get_result();
                $user = $result->fetch_assoc();
                $userData = $user;

                // Generar tokens
                $access_token = generateToken($user['id'], $user['correo'], 1800); // 30 min
                $refresh_token = generateToken($user['id'], $user['correo'], 259200); // 3 días

                // Configurar cookies
                setcookie("access_token", $access_token, time() + 1800, "/", "", false, false);
                setcookie("refresh_token", $refresh_token, time() + 259200, "/", "", false, false);

                $loginStatus = "linked";
            } else {
                // Crear nuevo usuario
                $emptyPassword = ''; // No necesitamos contraseña para login con Google
                $authProvider = 'google'; // Especificar el proveedor de autenticación

                // Modificar la sentencia SQL para incluir auth_provider
                $stmt = $conn->prepare("INSERT INTO usuario (nombre, apellido, correo, google_id, image_path, contrasena, auth_provider) VALUES (?, ?, ?, ?, ?, ?, ?)");
                $stmt->bind_param("sssssss", $firstName, $lastName, $email, $googleId, $photoUrl, $emptyPassword, $authProvider);

                if ($stmt->execute()) {
                    $userId = $conn->insert_id;

                    // Obtener datos del usuario recién creado
                    $stmt = $conn->prepare("SELECT * FROM usuario WHERE id = ?");
                    $stmt->bind_param("i", $userId);
                    $stmt->execute();
                    $result = $stmt->get_result();
                    $userData = $result->fetch_assoc();

                    // Generar tokens
                    $access_token = generateToken($userId, $email, 1800); // 30 min
                    $refresh_token = generateToken($userId, $email, 259200); // 3 días

                    // Configurar cookies
                    setcookie("access_token", $access_token, time() + 1800, "/", "", false, false);
                    setcookie("refresh_token", $refresh_token, time() + 259200, "/", "", false, false);

                    $loginStatus = "registered";
                } else {
                    error_log("Error SQL: " . $stmt->error); // Registrar el error SQL para diagnóstico

                    if ($isXhrRequest) {
                        echo json_encode([
                            "status" => "ERROR",
                            "message" => "Error al registrar usuario: " . $stmt->error
                        ]);
                        exit;
                    } else {
                        header("Location: " . $_ENV['FRONTEND_URL'] . "/login?error=registration_failed&sql_error=" . urlencode($stmt->error));
                        exit;
                    }
                }
            }
        }

        // Para XHR (solicitudes desde Angular), devolver JSON
        if ($isXhrRequest) {
            echo json_encode([
                "status" => "OK",
                "login_status" => $loginStatus,
                "message" => "Autenticación exitosa",
                "user_data" => [
                    "id" => $userData['id'],
                    "first_name" => $userData['nombre'],
                    "last_name" => $userData['apellido'],
                    "email" => $userData['correo'],
                    "image_path" => $userData['image_path']
                ]
            ]);
            exit;
        } else {
            // Para solicitudes normales, redirigir a la aplicación Angular
            header("Location: " . $_ENV['FRONTEND_URL'] . "/login?login=" . $loginStatus);
            exit;
        }
    } catch (Exception $e) {
        error_log("Exception: " . $e->getMessage()); // Registrar la excepción para diagnóstico

        if ($isXhrRequest) {
            echo json_encode([
                "status" => "ERROR",
                "message" => "Error en el servidor: " . $e->getMessage()
            ]);
            exit;
        } else {
            header("Location: " . $_ENV['FRONTEND_URL'] . "/login?error=" . urlencode($e->getMessage()));
            exit;
        }
    }
}

// Endpoint para verificar el estado de autenticación
if ($_SERVER['REQUEST_METHOD'] === 'GET' && isset($_GET['action']) && $_GET['action'] === 'check') {
    if (isset($_COOKIE['access_token']) && isset($_COOKIE['refresh_token'])) {
        echo json_encode([
            "status" => "OK",
            "message" => "Autenticado"
        ]);
    } else {
        echo json_encode([
            "status" => "ERROR",
            "message" => "No autenticado"
        ]);
    }
    exit;
}

// Si se reciben datos del usuario para validación
if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    // Este endpoint ya no es necesario pero lo mantenemos para compatibilidad
    echo json_encode([
        "status" => "ERROR",
        "message" => "Este método está obsoleto. Usa /auth/google_login.php?action=init para iniciar el flujo OAuth"
    ]);
    exit;
}

echo json_encode([
    "status" => "ERROR",
    "message" => "Método no permitido o parámetros faltantes"
]);

/**
 * Descarga una imagen de perfil de Google y la guarda localmente
 * @param string $url URL de la imagen de Google
 * @param string $googleId ID de Google del usuario
 * @return string|null Ruta relativa de la imagen guardada o null si falla
 */
function downloadGoogleProfileImage($url, $googleId)
{
    // Crear directorio si no existe
    $uploadDir = '../../../frontend/src/assets/imgs/avatars/';
    if (!file_exists($uploadDir)) {
        mkdir($uploadDir, 0755, true);
    }

    // Generar nombre de archivo único
    $fileName = 'google_' . $googleId . '_' . time() . '.jpg';
    $filePath = $uploadDir . $fileName;

    // Intentar descargar la imagen
    $imageContent = @file_get_contents($url);

    if ($imageContent !== false) {
        // Guardar la imagen
        if (file_put_contents($filePath, $imageContent)) {
            // Devolver ruta relativa para guardar en BD
            return 'assets/imgs/avatars/' . $fileName;
        }
    }

    // Registrar error si falla
    error_log("Error descargando imagen de perfil de Google: " . $url);
    return null;
}
