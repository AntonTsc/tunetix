<?php
    include_once __DIR__ . '/../../../../dotenv.php';
    include_once __DIR__ . '/../../auth/Auth.php';

    class Track{
        private static $baseUrl = "https://api.spotify.com/v1";
        public static function getTopGlobalTracks($limit){
            $token = Auth::getAccessToken();
            $ch = curl_init();
            // TOP 100 GLOBAL TRACK IDS
            $url = Track::$baseUrl . "/playlists/0sDahzOkMWOmLXfTMf2N4N/tracks?limit=$limit";

            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                "Authorization: Bearer " . $token,
                "Content-Type: application/json"
            ]);

            try{
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

                // Ordenar canciones por popularidad
                $data = json_decode($response, true);
                
                $tracks = $data['items'];

                usort($tracks, function($a, $b){
                    return $b['track']['popularity'] <=> $a['track']['popularity'];
                });

                $tracks = array_map(function($item){
                    return $item['track'];
                }, $tracks);

                header("Content-Type: application/json");
                echo json_encode([
                    "status" => "OK",
                    "message" => "Top $limit tracks obtenidos exitosamente.",
                    "data" => $tracks
                ]);
            }catch(Exception $e){
                echo $e->getMessage();
            }
        }
    }
?>