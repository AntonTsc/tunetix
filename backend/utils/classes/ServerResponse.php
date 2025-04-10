<?php
    class ServerResponse{
        public static function send($statusCode, $message, $data = null) {
            http_response_code($statusCode);
            header('Content-Type: application/json');
            echo json_encode([
                'status' => $statusCode,
                'message' => $message,
                'data' => $data
            ]);
        }

        public static function success($message, $data = null){
            self::send(200, $message, $data);
        }
    }
?>