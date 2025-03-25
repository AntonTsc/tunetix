<?php

use BcMath\Number;

    include_once __DIR__ . '/../../../../dotenv.php';
    include_once __DIR__ . '/../Auth/SpotifyAuth.php';

    class Artist{

        function __construct()
        {

        }

        private static $baseUrl = "https://api.spotify.com/v1";

        private static function getTopGlobalArtistIds($limit)
        {   $limit = $limit-1;
            $token = SpotifyAuth::getAccessToken();
            $ch = curl_init();
            // TOP 50 GLOBAL ARTIST IDS
            $url = Artist::$baseUrl . "/playlists/0Hm1tCeFv45CJkNeIAtrfF/tracks?limit=$limit";

            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                "Authorization: Bearer " . $token,
                "Content-Type: application/json"
            ]);

            try {
                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
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

                // Procesar la respuesta para obtener los IDs únicos de los artistas
                $data = json_decode($response, true);
                $artistIds = [];

                foreach ($data['items'] as $item) {
                    if (isset($item['track']['artists'])) {
                        foreach ($item['track']['artists'] as $artist) {
                            $artistId = $artist['id'];
                            if (!in_array($artistId, $artistIds)) {
                                $artistIds[] = $artistId; // Agregar solo IDs únicos
                            }
                        }
                    }
                }
                return $artistIds;
            } catch (Exception $e) {
                header("Content-Type: application/json");
                echo json_encode([
                    "status" => "ERROR",
                    "message" => "Error al obtener los artistas",
                    "data" => $e->getMessage()
                ]);
            }
        }

        public static function getTopGlobalArtists($limit)
        {
            $artistIds = Artist::getTopGlobalArtistIds($limit);
            $artistIds = array_slice($artistIds, 0, $limit);
            $token = SpotifyAuth::getAccessToken();
            $artists = [];
            $ch = curl_init();
            $url = Artist::$baseUrl . "/artists?ids=" . implode(",", $artistIds);

            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                "Authorization: Bearer " . $token,
                "Content-Type: application/json"
            ]);

            try {
                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);
        
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
                        "endpoint" => $url
                    ]);
                    return;
                }
        
                // Procesar la respuesta para obtener información de los artistas
                $data = json_decode($response, true);
                if (isset($data['artists'])) {
                    foreach ($data['artists'] as $artist) {
                        $artists[] = [
                            "id" => $artist['id'],
                            "name" => $artist['name'],
                            "genres" => $artist['genres'],
                            "popularity" => $artist['popularity'],
                            "followers" => $artist['followers']['total'],
                            "images" => $artist['images']
                        ];
                    }
                }
        
                header("Content-Type: application/json");
                echo json_encode([
                    "status" => "OK",
                    "message" => "Información de artistas obtenida",
                    "data" => $artists,
                ]);
            } catch (Exception $e) {
                header("Content-Type: application/json");
                echo json_encode([
                    "status" => "ERROR",
                    "message" => "Error al obtener los artistas",
                    "data" => $e->getMessage(),
                ]);
            }
        }
    }
?>