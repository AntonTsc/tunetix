<?php
include_once __DIR__ . '/../../../dotenv.php';
include_once __DIR__ . '/../../../utils/classes/ServerResponse.php';
include_once __DIR__ . '/../../../utils/classes/Cache.php';

class Track
{
    private static $apiKey;
    private static $baseUrl;

    private static function initialize()
    {
        if (empty($_ENV['LASTFM_API_KEY'])) {
            throw new Exception("API Key is not set in the environment variables.");
        }
        self::$apiKey = $_ENV['LASTFM_API_KEY'];
        self::$baseUrl = "https://ws.audioscrobbler.com/2.0/?api_key=" . self::$apiKey . "&format=json";
    }

    private static function getArtistImageFromCache($artistName)
    {
        $imageKey = "artist_image_" . md5($artistName);
        return Cache::get($imageKey, 'asset');
    }

    private static function sortTracks(array &$tracks, $sort)
    {
        switch ($sort) {
            case 'name_asc':
                usort($tracks, fn($a, $b) => strcmp($a['name'], $b['name']));
                break;
            case 'name_desc':
                usort($tracks, fn($a, $b) => strcmp($b['name'], $a['name']));
                break;
            case 'popularity_asc':
                usort($tracks, fn($a, $b) => $a['playcount'] <=> $b['playcount']);
                break;
            case 'popularity_desc':
                usort($tracks, fn($a, $b) => $b['playcount'] <=> $a['playcount']);
                break;
            default:
                break;
        }
    }

    public static function getTopTracksInfo($limit = 24, $page = 1, $sort = 'popularity_desc', $keyword = '')
    {
        self::initialize();
        $cacheKey = "top_tracks_$limit" . "_" . "$page";

        // Intenta obtener los datos del caché
        $cachedData = Cache::get($cacheKey, 'track');
        if ($cachedData) {
            $tracks = $cachedData['tracks'];
            $pagination = $cachedData['pagination'];

            // Obtener las imágenes de los artistas desde el caché
            foreach ($tracks as $key => $track) {
                if (isset($track['artist']['name'])) {
                    $artistImage = self::getArtistImageFromCache($track['artist']['name']);
                    if ($artistImage) {
                        $tracks[$key]['image'] = $artistImage;
                    }
                }
            }

            // Aplicar filtros y ordenación a los datos en caché
            if (!empty($keyword)) {
                $tracks = array_filter($tracks, function ($track) use ($keyword) {
                    return stripos($track['name'], $keyword) !== false;
                });
            }

            self::sortTracks($tracks, $sort);

            $data = ["tracks" => $tracks, "pagination" => $pagination];
            ServerResponse::success("Top tracks fetched successfully (from cache)", $data);
            return;
        }

        // Si no hay datos en caché, realizar la solicitud a la API
        try {
            $url = self::$baseUrl . "&method=chart.gettoptracks&limit=$limit&page=$page";
            $curl = curl_init($url);
            curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

            $response = curl_exec($curl);
            curl_close($curl);

            $data = json_decode($response, true);
            if (!$data || !isset($data['tracks']['track'])) {
                throw new Exception("Failed to fetch or parse data from API");
            }

            $tracks = $data['tracks']['track'];
            $pagination = $data['tracks']['@attr'];

            // Obtener imágenes de los artistas para nuevas pistas
            foreach ($tracks as $key => $track) {
                if (isset($track['artist']['name'])) {
                    $artistImage = self::getArtistImageFromCache($track['artist']['name']);
                    if ($artistImage) {
                        $tracks[$key]['image'] = $artistImage;
                    }
                }
            }

            if (!empty($keyword)) {
                $tracks = array_filter($tracks, function ($track) use ($keyword) {
                    return stripos($track['name'], $keyword) !== false;
                });
            }

            self::sortTracks($tracks, $sort);

            $data = ["tracks" => $tracks, "pagination" => $pagination];
            Cache::set($cacheKey, $data, 'track');

            ServerResponse::success("Top tracks fetched successfully", $data);
        } catch (Exception $e) {
            ServerResponse::send($e->getCode(), $e->getMessage());
        }
    }

    public static function getTrackInfo(string $trackName, string $artistName)
{
    self::initialize();
    $cacheKey = "track_info_" . md5($trackName . $artistName);

    // Intenta obtener los datos del caché
    $cachedData = Cache::get($cacheKey, 'track');
    if ($cachedData) {
        ServerResponse::success("Track info fetched successfully (from cache)", $cachedData);
        return;
    }

    // Si no hay datos en caché, realizar la solicitud a la API
    try {
        // URLs para las solicitudes
        $trackUrl = self::$baseUrl . "&method=track.getInfo&track=" . urlencode($trackName) . "&artist=" . urlencode($artistName);
        $similarTracksUrl = self::$baseUrl . "&method=track.getsimilar&track=" . urlencode($trackName) . "&artist=" . urlencode($artistName);
        
        // Inicializar cURL
        $curl = curl_init($trackUrl);
        $curlSimilar = curl_init($similarTracksUrl);

        // Establecer opciones para las solicitudes
        curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($curlSimilar, CURLOPT_RETURNTRANSFER, true);

        // Inicializar multi-cURL
        $mh = curl_multi_init();

        // Añadir las solicitudes a multi-cURL
        curl_multi_add_handle($mh, $curl);
        curl_multi_add_handle($mh, $curlSimilar);

        // Ejecutar las solicitudes concurrentemente
        $running = null;
        do {
            curl_multi_exec($mh, $running);
        } while ($running > 0);

        // Obtener las respuestas
        $trackResponse = curl_multi_getcontent($curl);
        $similarResponse = curl_multi_getcontent($curlSimilar);

        // Cerrar las sesiones cURL
        curl_multi_remove_handle($mh, $curl);
        curl_multi_remove_handle($mh, $curlSimilar);
        curl_multi_close($mh);
        curl_close($curl);
        curl_close($curlSimilar);

        // Decodificar las respuestas JSON
        $data = json_decode($trackResponse, true);
        $data['track']['similar'] = array_slice(json_decode($similarResponse, true)['similartracks']['track'], 0, 5);

        // Comprobar si ambas respuestas son válidas
        if (!$data) {
            throw new Exception("Failed to fetch or parse data from API");
        }

        // Almacenar en caché
        Cache::set($cacheKey, $data, 'track');
        
        // Responder con los datos obtenidos
        ServerResponse::success("Track info fetched successfully", $data);

    } catch (Exception $e) {
        ServerResponse::send($e->getCode(), $e->getMessage());
    }
}

}
