<?php
    include_once __DIR__ . '/../../../../dotenv.php';

    class Concert {
        private static $baseUrl = 'https://app.ticketmaster.com/discovery/v2';

        public static function getAll($limit=0, $keyword="", $countryCode="") {
            $ch = curl_init();

            // Construir la URL con todos los parámetros necesarios
            $params = [
                'apikey' => $_ENV['TICKETMASTER_API_KEY'],
                'sort' => 'relevance,desc',
                'classificationName' => 'music',
                'locale' => '*', // Añadir locale
            ];

            if($limit > 0 && $limit <= 100) {
                $params['size'] = $limit;
            }

            if($keyword != "") {
                $params['keyword'] = $keyword;
            }

            if(isset($countryCode)){
                $params['countryCode'] = $countryCode;
            }

            $url = self::$baseUrl . '/events.json?' . http_build_query($params);

            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Accept: application/json',
                'Content-Type: application/json'
            ]);

            try {
                $response = curl_exec($ch);
                $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
                curl_close($ch);

                if($httpCode === 404) {
                    header("Content-Type: application/json");
                    echo json_encode([
                        "status" => "ERROR",
                        "message" => "No se encontraron conciertos.",
                    ]);
                    return;
                }

                if($httpCode !== 200) {
                    header("Content-Type: application/json");
                    echo json_encode([
                        "status" => "ERROR",
                        "message" => "Error al obtener los datos de los conciertos.",
                    ]);
                    return;
                }

                $concerts = json_decode($response, true);
                if(isset($concerts['_embedded']['events'])) {
                    $concerts = $concerts['_embedded']['events'];
                    if($limit > 0) {
                        $concerts = array_slice($concerts, 0, $limit);
                    }
                } else {
                    header("Content-Type: application/json");
                    echo json_encode([
                        "status" => "ERROR",
                        "message" => "No se encontraron conciertos.",
                    ]);
                    return;
                }

                header("Content-Type: application/json");
                echo json_encode([
                    "status" => "OK",
                    "message" => "Información de conciertos obtenidos.",
                    "data" => $concerts,
                ]);

            } catch(Exception $e) {
                header("Content-Type: application/json");
                echo json_encode([
                    "status" => "ERROR",
                    "message" => "Error al obtener los conciertos.",
                    "data" => $e->getMessage(),
                ]);
            }
        }
    }

?>