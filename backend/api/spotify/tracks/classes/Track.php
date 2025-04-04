<?php
include_once __DIR__ . '/../../../../dotenv.php';
include_once __DIR__ . '/../../auth/Auth.php';

class Track
{
    private static $baseUrl = "https://api.spotify.com/v1";

    public static function getTopGlobalTracks($limit)
    {
        $token = Auth::getAccessToken();
        $ch = curl_init();

        $url = self::$baseUrl . "/playlists/0sDahzOkMWOmLXfTMf2N4N/tracks?limit=$limit";

        curl_setopt_array($ch, [
            CURLOPT_URL => $url,
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_SSL_VERIFYPEER => false,
            CURLOPT_SSL_VERIFYHOST => 0,
            CURLOPT_HTTPHEADER => [
                "Authorization: Bearer " . $token,
                "Content-Type: application/json"
            ]
        ]);

        try {
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

            if (curl_errno($ch)) {
                throw new Exception("Curl error: " . curl_error($ch));
            }

            $data = json_decode($response, true);
            if (!$data) {
                throw new Exception("Failed to parse JSON response");
            }

            if (!isset($data['items'])) {
                throw new Exception("No tracks found in response");
            }

            curl_close($ch);

            if ($httpCode === 404) {
                header("Content-Type: application/json");
                echo json_encode([
                    "status" => "ERROR",
                    "message" => "Playlist no encontrada. Verifica el ID de la playlist.",
                ]);
                return;
            }

            if ($httpCode !== 200) {
                header("Content-Type: application/json");
                echo json_encode([
                    "status" => "ERROR",
                    "message" => "Error al obtener los datos de la playlist.",
                ]);
                return;
            }

            // Ordenar canciones por popularidad
            $tracks = $data['items'];

            usort($tracks, function ($a, $b) {
                return $b['track']['popularity'] <=> $a['track']['popularity'];
            });

            $tracks = array_map(function ($item) {
                return $item['track'];
            }, $tracks);

            header("Content-Type: application/json");
            echo json_encode([
                "status" => "OK",
                "message" => "Top $limit tracks obtenidos exitosamente.",
                "data" => $tracks
            ]);
        } catch (Exception $e) {
            echo $e->getMessage();
        }
    }
}
