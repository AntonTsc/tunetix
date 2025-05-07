<?php
include_once __DIR__ . '/../../../../dotenv.php';
include_once __DIR__ . '/../../../../cache/Cache.php';
include_once __DIR__ . '/../../../../Controllers/PreciosEventos/create.php';
include_once __DIR__ . '/../../../../utils/classes/ServerResponse.php';

class Concert
{
    private static $baseUrl = 'https://app.ticketmaster.com/discovery/v2';
    private static $preciosController;

    private static function initPreciosController()
    {
        if (!self::$preciosController) {
            $conn = require __DIR__ . '/../../../../db.php';
            self::$preciosController = new PreciosEventosController($conn);
        }
        return self::$preciosController;
    }

    public static function getAll($limit = 0, $keyword = "", $countryCode = "", $page = 1, $sort = "date_desc")
    {
        // Crear una clave única para el caché basada en los parámetros
        $cacheKey = "concerts_" . md5($limit . $keyword . $countryCode . $page . $sort);

        // Intentar obtener los datos del caché
        $cachedData = Cache::get($cacheKey);
        if ($cachedData) {
            $concerts = $cachedData['concerts'];
            $preciosController = self::initPreciosController();

            // Actualizar precios desde la base de datos incluso para datos en caché
            foreach ($concerts as &$concert) {
                try {
                    $precio = $preciosController->getEventPrice($concert['id']);
                    $concert['precio'] = $precio; // Un único precio fijo

                    // Mantener priceRanges para compatibilidad con la API de Ticketmaster
                    $concert['priceRanges'] = [[
                        'type' => 'Entrada general',
                        'min' => $precio,
                        'max' => $precio, // Mismo valor min/max = precio fijo
                        'currency' => 'EUR'
                    ]];
                } catch (Exception $e) {
                    error_log($e->getMessage());
                    $concert['precio'] = null;
                    $concert['priceRanges'] = [];
                }
            }

            header("Content-Type: application/json");
            echo json_encode([
                "status" => "OK",
                "message" => "Información de conciertos obtenida (desde caché).",
                "data" => $concerts,
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
            // Modificar la palabra clave para permitir búsquedas parciales
            // Añadiendo un asterisco al final para indicar "comienza con"
            if (!str_ends_with($keyword, '*')) {
                $keyword = $keyword . '*';
            }
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
                    $preciosController = self::initPreciosController();

                    // Obtener precios de la base de datos
                    foreach ($concerts as &$concert) {
                        try {
                            $precio = $preciosController->getEventPrice($concert['id']);
                            $concert['precio'] = $precio; // Un único precio fijo

                            // Mantener priceRanges para compatibilidad con la API de Ticketmaster
                            $concert['priceRanges'] = [[
                                'type' => 'Entrada general',
                                'min' => $precio,
                                'max' => $precio, // Mismo valor min/max = precio fijo
                                'currency' => 'EUR'
                            ]];
                        } catch (Exception $e) {
                            error_log($e->getMessage());
                            $concert['precio'] = null;
                            $concert['priceRanges'] = [];
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
                } else {
                    // No se encontraron eventos, pero el estado HTTP es 200
                    header("Content-Type: application/json");
                    echo json_encode([
                        "status" => "ERROR",
                        "message" => "No se encontraron conciertos.",
                        "data" => [],
                        "page" => [
                            'number' => $page,
                            'totalElements' => 0,
                            'totalPages' => 0,
                            'size' => $limit
                        ]
                    ]);
                    return;
                }
            }

            if ($httpCode === 404) {
                header("Content-Type: application/json");
                echo json_encode([
                    "status" => "ERROR",
                    "message" => "No se encontraron conciertos.",
                    "data" => [],
                    "page" => [
                        'number' => $page,
                        'totalElements' => 0,
                        'totalPages' => 0,
                        'size' => $limit
                    ]
                ]);
                return;
            }

            if ($httpCode !== 200) {
                header("Content-Type: application/json");
                echo json_encode([
                    "status" => "ERROR",
                    "message" => "Error al obtener los datos de los conciertos.",
                    "data" => [],
                    "page" => [
                        'number' => $page,
                        'totalElements' => 0,
                        'totalPages' => 0,
                        'size' => $limit
                    ]
                ]);
                return;
            }
        } catch (Exception $e) {
            header("Content-Type: application/json");
            echo json_encode([
                "status" => "ERROR",
                "message" => "Error al obtener los conciertos.",
                "data" => [],
                "page" => [
                    'number' => $page,
                    'totalElements' => 0,
                    'totalPages' => 0,
                    'size' => $limit
                ],
                "error" => $e->getMessage(),
            ]);
        }
    }

    public static function getById($eventId)
    {
        $cacheKey = "concert_" . $eventId;

        $cachedData = Cache::get($cacheKey);
        if ($cachedData) {
            $preciosController = self::initPreciosController();

            try {
                // Siempre obtener el precio actual de la base de datos
                $precio = $preciosController->getEventPrice($eventId);
                $cachedData['precio'] = $precio; // Un único precio fijo

                // Mantener priceRanges para compatibilidad
                $cachedData['priceRanges'] = [[
                    'type' => 'Entrada general',
                    'min' => $precio,
                    'max' => $precio, // Mismo valor min/max = precio fijo
                    'currency' => 'EUR'
                ]];

                // Actualizar el caché con los datos modificados
                Cache::set($cacheKey, $cachedData);
            } catch (Exception $e) {
                error_log($e->getMessage());
                $cachedData['priceRanges'] = [];
            }

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
                $preciosController = self::initPreciosController();

                try {
                    $precio = $preciosController->getEventPrice($eventId);
                    $data['precio'] = $precio; // Un único precio fijo

                    // Mantener priceRanges para compatibilidad
                    $data['priceRanges'] = [[
                        'type' => 'Entrada general',
                        'min' => $precio,
                        'max' => $precio, // Mismo valor min/max = precio fijo
                        'currency' => 'EUR'
                    ]];
                } catch (Exception $e) {
                    error_log($e->getMessage());
                    $data['priceRanges'] = [];
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

    public static function getAttractionIdByName(string $name)
    {
        try {
            $ch = curl_init();

            // Modificar la palabra clave para permitir búsquedas parciales
            if (!str_ends_with($name, '*')) {
                $name = $name . '*';
            }

            $params = [
                'apikey' => $_ENV['TICKETMASTER_API_KEY'],
                'keyword' => $name,
                'locale' => '*'
            ];
            $url = self::$baseUrl . '/attractions.json?' . http_build_query($params);

            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Accept: application/json',
                'Content-Type: application/json'
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode !== 200) {
                throw new Exception("Error getting the attractionId", $httpCode);
            }

            $attractionData = json_decode($response, true);

            // Ya no buscamos una coincidencia exacta del nombre, sino la primera que devuelva la API
            if (isset($attractionData['_embedded']['attractions']) && count($attractionData['_embedded']['attractions']) > 0) {
                return $attractionData['_embedded']['attractions'][0]['id'];
            }

            return null;
        } catch (Exception $e) {
            error_log("Error in getAttractionIdByName: " . $e->getMessage());
            return null;
        }
    }

    public static function getByArtistName(string $name): ?array
    {
        try {
            if (!$name) {
                return [];
            }

            $attractionId = self::getAttractionIdByName($name);
            if (!$attractionId) {
                return [];
            }

            $ch = curl_init();
            $params = [
                'apikey' => $_ENV['TICKETMASTER_API_KEY'],
                'attractionId' => $attractionId,
                'classificationName' => 'music',
                'locale' => '*',
                'sort' => 'date,asc',
                'startDateTime' => date('Y-m-d') . 'T00:00:00Z'
            ];

            $url = self::$baseUrl . '/events.json?' . http_build_query($params);
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, false);
            curl_setopt($ch, CURLOPT_SSL_VERIFYHOST, 0);
            curl_setopt($ch, CURLOPT_HTTPHEADER, [
                'Accept: application/json',
                'Content-Type: application/json'
            ]);

            $response = curl_exec($ch);
            $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
            curl_close($ch);

            if ($httpCode !== 200) {
                return [];
            }

            $eventsData = json_decode($response, true);

            if (isset($eventsData['_embedded']['events'])) {
                return array_slice($eventsData['_embedded']['events'], 0, 5);
            }

            return [];
        } catch (Exception $e) {
            error_log("Error in getByArtistName: " . $e->getMessage());
            return [];
        }
    }
}
