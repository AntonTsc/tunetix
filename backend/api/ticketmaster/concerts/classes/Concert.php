<?php
include_once __DIR__ . '/../../../../dotenv.php';
include_once __DIR__ . '/../../../../cache/Cache.php';

class Concert
{
    private static $baseUrl = 'https://app.ticketmaster.com/discovery/v2';

    public static function getAll($limit = 0, $keyword = "", $countryCode = "", $page = 0, $sort = "date_desc")
    {
        // Crear una clave única para el caché basada en los parámetros
        $cacheKey = "concerts_" . md5($limit . $keyword . $countryCode . $page . $sort);

        // Intentar obtener los datos del caché
        $cachedData = Cache::get($cacheKey);
        if ($cachedData) {
            header("Content-Type: application/json");
            echo json_encode([
                "status" => "OK",
                "message" => "Información de conciertos obtenida (desde caché).",
                "data" => $cachedData['concerts'],
                "page" => $cachedData['page_info']
            ]);
            return;
        }

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

            if ($httpCode === 200) {
                $data = json_decode($response, true);
                if (isset($data['_embedded']['events'])) {
                    $concerts = $data['_embedded']['events'];

                    // Añadir precios aleatorios a cada concierto
                    foreach ($concerts as &$concert) {
                        if (!isset($concert['priceRanges'])) {
                            $basePrice = mt_rand(30, 150); // Precio base entre 30€ y 150€
                            $concert['priceRanges'] = [[
                                'type' => 'Entrada general',
                                'min' => $basePrice,
                                'max' => $basePrice + mt_rand(20, 50),
                                'currency' => 'EUR'
                            ]];
                        }
                    }

                    $page_info = [
                        'number' => $page,
                        'totalElements' => $data['page']['totalElements'] ?? count($concerts),
                        'totalPages' => $data['page']['totalPages'] ?? ceil(count($concerts) / $limit),
                        'size' => $limit
                    ];

                    // Guardar en caché
                    Cache::set($cacheKey, [
                        'concerts' => $concerts,
                        'page_info' => $page_info
                    ]);

                    header("Content-Type: application/json");
                    echo json_encode([
                        "status" => "OK",
                        "message" => "Información de conciertos obtenida.",
                        "data" => $concerts,
                        "page" => $page_info
                    ]);
                    return;
                }
            }

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
        } catch (Exception $e) {
            header("Content-Type: application/json");
            echo json_encode([
                "status" => "ERROR",
                "message" => "Error al obtener los conciertos.",
                "data" => $e->getMessage(),
            ]);
        }
    }

    public static function getById($eventId)
    {
        $cacheKey = "concert_" . $eventId;

        $cachedData = Cache::get($cacheKey);
        if ($cachedData) {
            header("Content-Type: application/json");
            echo json_encode([
                "status" => "OK",
                "message" => "Información del evento obtenida (desde caché).",
                "data" => $cachedData
            ]);
            return;
        }

        $ch = curl_init();

        $params = [
            'apikey' => $_ENV['TICKETMASTER_API_KEY'],
            'locale' => '*'
        ];

        $url = self::$baseUrl . '/events/' . $eventId . '?' . http_build_query($params);

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

            if ($httpCode === 200) {
                $data = json_decode($response, true);

                // Asegurar que siempre haya un rango de precios
                if (!isset($data['priceRanges']) || empty($data['priceRanges'])) {
                    $basePrice = mt_rand(30, 150);
                    $data['priceRanges'] = [[
                        'type' => 'Entrada general',
                        'min' => $basePrice,
                        'max' => $basePrice + mt_rand(20, 50),
                        'currency' => 'EUR'
                    ]];
                }

                // Guardar en caché con los precios
                Cache::set($cacheKey, $data);

                header("Content-Type: application/json");
                echo json_encode([
                    "status" => "OK",
                    "message" => "Información del evento obtenida.",
                    "data" => $data
                ]);
                return;
            }

            if ($httpCode === 404) {
                header("Content-Type: application/json");
                echo json_encode([
                    "status" => "ERROR",
                    "message" => "Evento no encontrado."
                ]);
                return;
            }

            if ($httpCode !== 200) {
                header("Content-Type: application/json");
                echo json_encode([
                    "status" => "ERROR",
                    "message" => "Error al obtener los datos del evento."
                ]);
                return;
            }
        } catch (Exception $e) {
            header("Content-Type: application/json");
            echo json_encode([
                "status" => "ERROR",
                "message" => "Error al obtener el evento.",
                "error" => $e->getMessage()
            ]);
        }
    }
}
