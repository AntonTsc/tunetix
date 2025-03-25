<?php
    class SpotifyAuth {
        private static $authUrl = "https://accounts.spotify.com/api/token";

        public static function getAccessToken() {
            $clientId = $_ENV['SPOTIFY_CLIENT_ID'];
            $clientSecret = $_ENV['SPOTIFY_SECRET_KEY'];

            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, self::$authUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_POST, true);
            curl_setopt($ch, CURLOPT_POSTFIELDS, "grant_type=client_credentials");
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                "Authorization: Basic " . base64_encode("$clientId:$clientSecret"),
                "Content-Type: application/x-www-form-urlencoded"
            ]);

            $response = curl_exec($ch);
            curl_close($ch);

            $data = json_decode($response, true);

            if (isset($data['access_token'])) {
                return $data['access_token'];
            } else {
                throw new Exception("Error obtaining Spotify access token: " . $data['error_description']);
            }
        }
    }
?>