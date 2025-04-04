<?php

include_once __DIR__ . '/../../../../dotenv.php';
include_once __DIR__ . '/../../auth/Auth.php';

class Artist
{
    private static $baseUrl = "https://api.spotify.com/v1"; 

    private static function getTopGlobalArtistIds($limit)
    {
        $token = Auth::getAccessToken();
        $ch = curl_init();

        // TOP 100 GLOBAL ARTIST IDS
        $url = self::$baseUrl . "/playlists/0Hm1tCeFv45CJkNeIAtrfF/tracks?limit=$limit";

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

            // Debug information
            error_log("Artist Response: " . $response);
            error_log("HTTP Code: " . $httpCode);

            if (curl_errno($ch)) {
                throw new Exception("Curl error: " . curl_error($ch));
            }

            curl_close($ch);

            if ($httpCode !== 200) {
                throw new Exception("API error: HTTP Code " . $httpCode);
            }

            $data = json_decode($response, true);
            if (!$data) {
                throw new Exception("Failed to parse JSON response");
            }

            $artistIds = [];
            foreach ($data['items'] as $item) {
                if (isset($item['track']['artists'])) {
                    foreach ($item['track']['artists'] as $artist) {
                        $artistIds[$artist['id']] = true;
                    }
                }
            }

            if (empty($artistIds)) {
                throw new Exception("No artist IDs found in response");
            }

            return array_keys($artistIds);
        } catch (Exception $e) {
            error_log("Error in getTopGlobalArtistIds: " . $e->getMessage());
            header("Content-Type: application/json");
            echo json_encode([
                "status" => "ERROR",
                "message" => "Error getting artist IDs: " . $e->getMessage()
            ]);
            return null;
        }
    }

    public static function getTopGlobalArtists($limit)
    {
        $artistIds = self::getTopGlobalArtistIds($limit);

        if (!is_array($artistIds)) {
            header("Content-Type: application/json");
            echo json_encode([
                "status" => "ERROR",
                "message" => "Failed to get artist IDs"
            ]);
            return;
        }

        $artistIds = array_slice($artistIds, 0, $limit);
        $token = Auth::getAccessToken();
        $artists = [];

        $multiCurl = [];
        $mh = curl_multi_init();

        foreach ($artistIds as $id) {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, self::$baseUrl . "/artists/$id");
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                "Authorization: Bearer " . $token,
                "Content-Type: application/json"
            ]);
            curl_multi_add_handle($mh, $ch);
            $multiCurl[] = $ch;
        }

        do {
            curl_multi_exec($mh, $running);
        } while ($running > 0);

        foreach ($multiCurl as $ch) {
            $response = curl_multi_getcontent($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_multi_remove_handle($mh, $ch);

            if ($httpCode === 404) {
                header("Content-Type: application/json");
                echo json_encode([
                    "status" => "ERROR",
                    "message" => "Artistas no encontrados. Verifica los IDs de los artistas.",
                ]);
                return;
            }

            if ($httpCode !== 200) {
                header("Content-Type: application/json");
                echo json_encode([
                    "status" => "ERROR",
                    "message" => "Error al obtener los datos de los artistas.",
                ]);
                return;
            }

            $data = json_decode($response, true);
            if (isset($data)) {
                $artists[] = [
                    "id" => $data['id'],
                    "name" => $data['name'],
                    "genres" => $data['genres'],
                    "popularity" => $data['popularity'],
                    "followers" => $data['followers']['total'],
                    "images" => $data['images']
                ];
            }
        }

        curl_multi_close($mh);

        // Ordenar los artistas por popularidad de mayor a menor
        usort($artists, function ($a, $b) {
            return $b['popularity'] <=> $a['popularity'];
        });

        header("Content-Type: application/json");
        echo json_encode([
            "status" => "OK",
            "message" => "Información de artistas obtenida",
            "data" => $artists,
            "temp_token" => $token
        ]);
    }
}
