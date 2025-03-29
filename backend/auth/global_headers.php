<?php
// Permitir solicitudes desde localhost:4200 (Angular)
header('Access-Control-Allow-Origin: http://localhost:4200');
// Permitir cookies en solicitudes cross-origin
header('Access-Control-Allow-Credentials: true');
// Permitir métodos HTTP
header('Access-Control-Allow-Methods: GET, POST, PUT, DELETE, OPTIONS');
// Permitir ciertos encabezados
header('Access-Control-Allow-Headers: Origin, X-Requested-With, Content-Type, Accept, Authorization');

// Manejar solicitudes OPTIONS (preflight)
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    // Simplemente devolver 200 OK con encabezados CORS ya configurados
    http_response_code(200);
    exit();
}
