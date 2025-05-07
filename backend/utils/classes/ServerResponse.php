<?php
class ServerResponse
{
    public static function send($statusCode, $message, $data = null)
    {
        // Si los headers no se han enviado aún, establecer el código de estado HTTP
        if (!headers_sent()) {
            http_response_code($statusCode);
            header('Content-Type: application/json');
        }

        echo json_encode([
            'status' => $statusCode === 200 ? 'OK' : 'ERROR',
            'message' => $message,
            'data' => $data
        ]);
        exit;
    }

    public static function success($message, $data = null)
    {
        self::send(200, $message, $data);
    }

    public static function error($statusCode, $message, $data = null)
    {
        self::send($statusCode, $message, $data);
    }
}
