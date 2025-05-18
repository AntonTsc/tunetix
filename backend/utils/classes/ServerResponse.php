<?php
class ServerResponse
{
    public static function send($statusCode,$message,$data=null,$page=null)
    {
        // Si los headers no se han enviado aún, establecer el código de estado HTTP
        if (!headers_sent()) {
            http_response_code($statusCode);
            header('Content-Type: application/json');
        }

        $payload = [
            'status' => $statusCode === 200 ? 'OK' : 'ERROR',
            'message' => $message,
            'data' => $data,
            'page' => $page
        ];

        if($payload['data'] === null){
            unset($payload['data']);
        }

        if($payload['page'] === null){
            unset($payload['page']);
        }

        echo json_encode($payload);
        exit;
    }

    public static function success($message,$data=null,$page=null)
    {
        self::send(200,$message,$data,$page);
    }

    public static function error($statusCode,$message,$data=null,$page=null)
    {
        self::send($statusCode,$message,$data,$page);
    }
}
