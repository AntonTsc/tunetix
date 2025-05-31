<?php
include_once 'global_headers.php';
include_once '../utils/classes/ServerResponse.php';
include_once 'validate_token.php';

header('Content-Type: application/json');

// Debug: Log información para diagnóstico
error_log("=== GET_COOKIES DEBUG ===");
error_log("REQUEST_METHOD: " . $_SERVER['REQUEST_METHOD']);
error_log("HTTP_ORIGIN: " . ($_SERVER['HTTP_ORIGIN'] ?? 'No origin header'));
error_log("All cookies: " . print_r($_COOKIE, true));
error_log("access_token exists: " . (isset($_COOKIE['access_token']) ? 'YES' : 'NO'));
error_log("refresh_token exists: " . (isset($_COOKIE['refresh_token']) ? 'YES' : 'NO'));

if (isset($_COOKIE['access_token'], $_COOKIE['refresh_token'])) {
    // Verificar si el access_token es válido
    $is_valid = verifyToken($_COOKIE['access_token']) !== false;

    $cookies = [
        "access_token" => $_COOKIE['access_token'],
        "refresh_token" => $_COOKIE['refresh_token'],
        "access_token_valido" => $is_valid
    ];

    error_log("SUCCESS: Sending cookies response");
    ServerResponse::success("Cookies sent", $cookies);
} else {
    error_log("ERROR: Cookies not found or incomplete");
    // Más información de debug en el error
    $debug_info = [
        "cookies_received" => $_COOKIE,
        "access_token_present" => isset($_COOKIE['access_token']),
        "refresh_token_present" => isset($_COOKIE['refresh_token']),
        "total_cookies_count" => count($_COOKIE),
        "request_headers" => getallheaders()
    ];

    ServerResponse::error(0, "Error when attempting to send cookies", $debug_info);
}
