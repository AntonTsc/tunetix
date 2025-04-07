<?php
include_once __DIR__ . '/../../../../dotenv.php';

class Concert
{
    private static $baseUrl = 'https://app.ticketmaster.com/discovery/v2';

    public static function getAll($limit = 0, $keyword = "", $countryCode = "", $page = 0, $sort = "date_desc")
    {
        $ch = curl_init();

        // Obtener la fecha actual en formato YYYY-MM-DD
        $today = date('Y-m-d');

        // Construir la URL con todos los parámetros necesarios
        $params = [
            'apikey' => $_ENV['TICKETMASTER_API_KEY'],
            'classificationName' => 'music',
            'locale' => '*',
            'page' => $page,
            'startDateTime' => $today . 'T00:00:00Z' // Añadir filtro de fecha desde hoy
        ];

        // Añadir el orden según el parámetro sort
        switch ($sort) {
            case 'date_asc':
                $params['sort'] = 'date,asc';
                break;
            case 'date_desc':
                $params['sort'] = 'date,desc';
                break;
            case 'name_asc':
                $params['sort'] = 'name,asc';
                break;
            case 'name_desc':
                $params['sort'] = 'name,desc';
                break;
            default:
                $params['sort'] = 'date,asc'; // Cambiado a asc por defecto para mostrar los más cercanos
        }

        if ($limit > 0 && $limit <= 100) {
            $params['size'] = $limit;
        }

        if ($keyword != "") {
            $params['keyword'] = $keyword;
        }

        if (isset($countryCode) && $countryCode !== "") {
            $params['countryCode'] = $countryCode;
        }

        $url = self::$baseUrl . '/events.json?' . http_build_query($params);

        curl_setopt($ch, CURLOPT_URL, $url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
        curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
        curl_setopt($ch, CURLOPT_HTTPHEADER, [
            'Accept: application/json',
            'Content-Type: application/json'
        ]);

        try {
            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode === 404) {
                header("Content-Type: application/json");
                echo json_encode([
                    "status" => "ERROR",
                    "message" => "No se encontraron conciertos.",
                ]);
                return;
            }

            if ($httpCode !== 200) {
                header("Content-Type: application/json");
                echo json_encode([
                    "status" => "ERROR",
                    "message" => "Error al obtener los datos de los conciertos.",
                ]);
                return;
            }

            $data = json_decode($response, true);
            if (isset($data['_embedded']['events'])) {
                $concerts = $data['_embedded']['events'];
                $page_info = [
                    'number' => $page,
                    'totalElements' => $data['page']['totalElements'] ?? count($concerts),
                    'totalPages' => $data['page']['totalPages'] ?? ceil(count($concerts) / $limit),
                    'size' => $limit
                ];

                header("Content-Type: application/json");
                echo json_encode([
                    "status" => "OK",
                    "message" => "Información de conciertos obtenidos.",
                    "data" => $concerts,
                    "page" => $page_info
                ]);
                return;
            } else {
                header("Content-Type: application/json");
                echo json_encode([
                    "status" => "ERROR",
                    "message" => "No se encontraron conciertos.",
                ]);
                return;
            }
        } catch (Exception $e) {
            header("Content-Type: application/json");
            echo json_encode([
                "status" => "ERROR",
                "message" => "Error al obtener los conciertos.",
                "data" => $e->getMessage(),
            ]);
        }
    }
}
