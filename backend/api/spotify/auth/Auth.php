<?php
class Auth
{
    private static $authUrl = "https://accounts.spotify.com/api/token";

    public static function getAccessToken()
    {
        $clientId = $_ENV['SPOTIFY_CLIENT_ID'];
        $clientSecret = $_ENV['SPOTIFY_SECRET_KEY'];

        $ch = curl_init();
        curl_setopt_array($ch, [
            CURLOPT_URL => self::$authUrl,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_POST => true,
            CURLOPT_SSL_VERIFYPEER => false, // Desactivar SSL (solo para ciertas redes)
            CURLOPT_POSTFIELDS => "grant_type=client_credentials",
            CURLOPT_HTTPHEADER => [
                "Authorization: Basic " . base64_encode($clientId . ":" . $clientSecret),
                "Content-Type: application/x-www-form-urlencoded"
            ]
        ]);

        $response = curl_exec($ch);
        curl_close($ch);

        $data = json_decode($response, true);
        return $data['access_token'] ?? throw new Exception("Error obtaining access token");
    }
}
