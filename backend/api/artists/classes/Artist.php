<?php
include_once __DIR__ . '/../../../dotenv.php';
include_once __DIR__ . '/../../../utils/classes/ServerResponse.php';
include_once __DIR__ . '/../../../utils/classes/Cache.php';
include_once __DIR__ . '../../../ticketmaster/concerts/classes/Concert.php';


class Artist
{
    private static $apiKey;
    private static $baseUrl;
    private static $wdBaseUrl = "https://nfm.nuukmobility.com/proxy/https://www.wikidata.org/w/api.php";

    private static function initialize()
    {
        if (empty($_ENV['LASTFM_API_KEY'])) {
            throw new Exception("API Key is not set in the environment variables.");
        }
        self::$apiKey = $_ENV['LASTFM_API_KEY'];
        self::$baseUrl = "https://nfm.nuukmobility.com/proxy/https://ws.audioscrobbler.com/2.0/?api_key=" . self::$apiKey . "&format=json";
    }

    private static function getArtistImage($artistName)
    {
        // Buscar directamente en Wikidata por el nombre del artista
        $url = self::$wdBaseUrl . "?action=wbsearchentities" .
            "&search=" . urlencode($artistName) .
            "&language=en" .
            "&type=item" .
            "&format=json";

        $ch = curl_init($url);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        curl_setopt($ch, CURLOPT_USERAGENT, 'TunetixApp/1.0.0');

        $response = curl_exec($ch);
        curl_close($ch);

        $data = json_decode($response, true);

        if (isset($data['search'][0]['id'])) {
            $wikidataId = $data['search'][0]['id'];

            // Obtener la imagen del artista
            $imageUrl = self::$wdBaseUrl . "?action=wbgetclaims" .
                "&property=P18" .
                "&entity=" . $wikidataId .
                "&format=json";

            $ch = curl_init($imageUrl);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_USERAGENT, 'TunetixApp/1.0.0');

            $response = curl_exec($ch);
            curl_close($ch);

            $data = json_decode($response, true);

            if (isset($data['claims']['P18'][0]['mainsnak']['datavalue']['value'])) {
                $filename = $data['claims']['P18'][0]['mainsnak']['datavalue']['value'];
                $baseUrl = "https://upload.wikimedia.org/wikipedia/commons/";
                $cleanFilename = str_replace(' ', '_', $filename);
                $md5 = md5($cleanFilename);
                $hashPath = substr($md5, 0, 1) . '/' . substr($md5, 0, 2) . '/';

                return [
                    [
                        '#text' => $baseUrl . $hashPath . $cleanFilename,
                        'size' => 'small'
                    ],
                    [
                        '#text' => $baseUrl . $hashPath . $cleanFilename,
                        'size' => 'medium'
                    ],
                    [
                        '#text' => $baseUrl . $hashPath . $cleanFilename,
                        'size' => 'large'
                    ],
                    [
                        '#text' => $baseUrl . $hashPath . $cleanFilename,
                        'size' => 'extralarge'
                    ]
                ];
            }
        }

        return null;
    }

    /**
     * Ordena los artistas según el parámetro $sort.
     * 
     * Opciones de ordenación disponibles:
     * - name_asc: Ordena por nombre en orden ascendente (A-Z).
     * - name_desc: Ordena por nombre en orden descendente (Z-A).
     * - popularity_asc: Ordena por popularidad en orden ascendente.
     * - popularity_desc: Ordena por popularidad en orden descendente.
     * 
     * @param array $artists Lista de artistas a ordenar.
     * @param string $sort Parámetro de ordenación (name_asc, name_desc, popularity_asc, popularity_desc).
     * @return void
     */
    private static function sortArtists(array &$artists, $sort)
    {
        switch ($sort) {
            case 'name_asc':
                usort($artists, fn($a, $b) => strcmp($a['name'], $b['name']));
                break;
            case 'name_desc':
                usort($artists, fn($a, $b) => strcmp($b['name'], $a['name']));
                break;
            case 'popularity_asc':
                usort($artists, function ($a, $b) {
                    // Verificar si existe playcount en ambos elementos
                    $aPlaycount = isset($a['playcount']) ? $a['playcount'] : (isset($a['listeners']) ? $a['listeners'] : 0);
                    $bPlaycount = isset($b['playcount']) ? $b['playcount'] : (isset($b['listeners']) ? $b['listeners'] : 0);
                    return $aPlaycount <=> $bPlaycount;
                });
                break;
            case 'popularity_desc':
                usort($artists, function ($a, $b) {
                    // Verificar si existe playcount en ambos elementos
                    $aPlaycount = isset($a['playcount']) ? $a['playcount'] : (isset($a['listeners']) ? $a['listeners'] : 0);
                    $bPlaycount = isset($b['playcount']) ? $b['playcount'] : (isset($b['listeners']) ? $b['listeners'] : 0);
                    return $bPlaycount <=> $aPlaycount;
                });
                break;
            default:
                // Si el valor de $sort no es válido, no se aplica ninguna ordenación
                break;
        }
    }

    /**
     * Obtiene información de los artistas más populares.
     * @param int $limit Número máximo de artistas a obtener (por defecto: 24).
     * @param int $page Número de página para la paginación (por defecto: 1).
     * @param string $sort Parámetro de ordenación (por defecto: 'popularity_desc').
     * @param string $keyword Palabra clave para filtrar los artistas (esta vacio por defecto).
     */
    public static function getTopArtistsInfo($limit = 24, $page = 1, $sort = 'popularity_desc', $keyword = '')
    {
        self::initialize();

        // Si se proporciona una palabra clave, usar búsqueda directa en lugar de artistas populares
        if (!empty($keyword)) {
            $cacheKey = "search_artists_" . md5($keyword) . "_$limit" . "_" . "$page";

            // Intenta obtener resultados de búsqueda del caché
            $cachedData = Cache::get($cacheKey, 'artist');
            if ($cachedData) {
                $artists = $cachedData['artists'];
                $pagination = $cachedData['pagination'];

                self::sortArtists($artists, $sort);

                $data = ["artists" => $artists, "pagination" => $pagination];
                ServerResponse::success("Artists search results fetched successfully (from cache)", $data);
                return;
            }

            // Si no hay datos en caché, realizar la solicitud de búsqueda a la API
            try {
                $url = self::$baseUrl . "&method=artist.search&artist=" . urlencode($keyword) . "&limit=$limit&page=$page";
                $curl = curl_init($url);
                curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

                $response = curl_exec($curl);
                curl_close($curl);

                $data = json_decode($response, true);
                if (!$data || !isset($data['results']['artistmatches']['artist'])) {
                    throw new Exception("Failed to fetch or parse search data from API");
                }

                $artists = $data['results']['artistmatches']['artist'];
                $pagination = $data['results']['@attr'];

                // Procesar artistas y obtener imágenes y conciertos
                foreach ($artists as $key => $artist) {
                    // Asegurar que el artista tenga playcount
                    if (!isset($artists[$key]['playcount']) && isset($artists[$key]['listeners'])) {
                        // Si no tiene playcount pero tiene listeners, obtener info completa del artista
                        $artistInfoUrl = self::$baseUrl . "&method=artist.getinfo&artist=" . urlencode($artist['name']) . "&autocorrect=1";
                        $artistInfoCurl = curl_init($artistInfoUrl);
                        curl_setopt($artistInfoCurl, CURLOPT_RETURNTRANSFER, true);
                        $artistInfoResponse = curl_exec($artistInfoCurl);
                        curl_close($artistInfoCurl);

                        $artistInfoData = json_decode($artistInfoResponse, true);
                        if ($artistInfoData && isset($artistInfoData['artist']['stats']['playcount'])) {
                            // Añadir playcount desde la info detallada del artista
                            $artists[$key]['playcount'] = $artistInfoData['artist']['stats']['playcount'];
                        } else {
                            // Si no se puede obtener, poner un valor por defecto
                            $artists[$key]['playcount'] = "0";
                        }
                    }

                    // Procesar imagen
                    $imageKey = "artist_image_" . md5($artist['name']);
                    $cachedImage = Cache::get($imageKey, 'asset');

                    if ($cachedImage) {
                        $artists[$key]['image'] = $cachedImage;
                    } else {
                        $artistImages = self::getArtistImage($artist['name']);
                        if ($artistImages) {
                            $artists[$key]['image'] = $artistImages;
                            Cache::set($imageKey, $artistImages, 'asset');
                        }
                    }

                    // Obtener y cachear conciertos
                    $cachedConcerts = Cache::getConcertData($artist['name']);

                    if (!$cachedConcerts) {
                        $concerts = Concert::getByArtistName($artist['name']);

                        if (!empty($concerts)) {
                            // Procesar los conciertos para obtener solo los datos necesarios
                            $processedConcerts = array_map(function ($concert) {
                                return [
                                    'id' => $concert['id'],
                                    'name' => $concert['name'],
                                    'image' => $concert['images'][0]['url'] ?? '' // Solo la primera imagen
                                ];
                            }, $concerts);

                            // Guardar en el archivo de conciertos consolidado
                            Cache::addConcertData($artist['name'], $processedConcerts);
                            $artists[$key]['concerts'] = $processedConcerts;
                        } else {
                            $artists[$key]['concerts'] = [];
                            // Guardar array vacío para evitar consultas repetidas
                            Cache::addConcertData($artist['name'], []);
                        }
                    } else {
                        $artists[$key]['concerts'] = $cachedConcerts;
                    }
                }

                self::sortArtists($artists, $sort);

                $data = ["artists" => $artists, "pagination" => $pagination];
                Cache::set($cacheKey, $data, 'artist');

                ServerResponse::success("Artists search results fetched successfully", $data);
                return;
            } catch (Exception $e) {
                ServerResponse::send($e->getCode(), $e->getMessage());
                return;
            }
        }

        // Si no hay palabra clave, obtener artistas populares (comportamiento original)
        $cacheKey = "top_artists_$limit" . "_" . "$page";

        // Intenta obtener los datos del caché
        $cachedData = Cache::get($cacheKey, 'artist');
        if ($cachedData) {
            $artists = $cachedData['artists'];
            $pagination = $cachedData['pagination'];

            self::sortArtists($artists, $sort);

            $data = ["artists" => $artists, "pagination" => $pagination];
            ServerResponse::success("Top artists fetched successfully (from cache)", $data);
            return;
        }

        // Si no hay datos en caché, realizar la solicitud a la API
        try {
            $url = self::$baseUrl . "&method=chart.gettopartists&limit=$limit&page=$page";
            $curl = curl_init($url);
            curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

            $response = curl_exec($curl);
            curl_close($curl);

            $data = json_decode($response, true);
            if (!$data || !isset($data['artists']['artist'])) {
                throw new Exception("Failed to fetch or parse data from API");
            }

            $artists = $data['artists']['artist'];
            $pagination = $data['artists']['@attr'];

            // Procesar artistas y obtener conciertos
            foreach ($artists as $key => $artist) {
                // Asegurar que el artista tenga playcount
                if (!isset($artists[$key]['playcount']) && isset($artists[$key]['listeners'])) {
                    // Si no tiene playcount pero tiene listeners, obtener info completa del artista
                    $artistInfoUrl = self::$baseUrl . "&method=artist.getinfo&artist=" . urlencode($artist['name']) . "&autocorrect=1";
                    $artistInfoCurl = curl_init($artistInfoUrl);
                    curl_setopt($artistInfoCurl, CURLOPT_RETURNTRANSFER, true);
                    $artistInfoResponse = curl_exec($artistInfoCurl);
                    curl_close($artistInfoCurl);

                    $artistInfoData = json_decode($artistInfoResponse, true);
                    if ($artistInfoData && isset($artistInfoData['artist']['stats']['playcount'])) {
                        // Añadir playcount desde la info detallada del artista
                        $artists[$key]['playcount'] = $artistInfoData['artist']['stats']['playcount'];
                    } else {
                        // Si no se puede obtener, poner un valor por defecto
                        $artists[$key]['playcount'] = "0";
                    }
                }

                // Procesar imagen
                $imageKey = "artist_image_" . md5($artist['name']);
                $cachedImage = Cache::get($imageKey, 'asset');

                if ($cachedImage) {
                    $artists[$key]['image'] = $cachedImage;
                } else {
                    $artistImages = self::getArtistImage($artist['name']);
                    if ($artistImages) {
                        $artists[$key]['image'] = $artistImages;
                        Cache::set($imageKey, $artistImages, 'asset');
                    }
                }

                // Obtener y cachear conciertos
                $cachedConcerts = Cache::getConcertData($artist['name']);

                if (!$cachedConcerts) {
                    $concerts = Concert::getByArtistName($artist['name']);

                    if (!empty($concerts)) {
                        // Procesar los conciertos para obtener solo los datos necesarios
                        $processedConcerts = array_map(function ($concert) {
                            return [
                                'id' => $concert['id'],
                                'name' => $concert['name'],
                                'image' => $concert['images'][0]['url'] ?? '' // Solo la primera imagen
                            ];
                        }, $concerts);

                        // Guardar en el archivo de conciertos consolidado
                        Cache::addConcertData($artist['name'], $processedConcerts);
                        $artists[$key]['concerts'] = $processedConcerts;
                    } else {
                        $artists[$key]['concerts'] = [];
                        // Guardar array vacío para evitar consultas repetidas
                        Cache::addConcertData($artist['name'], []);
                    }
                } else {
                    $artists[$key]['concerts'] = $cachedConcerts;
                }
            }

            self::sortArtists($artists, $sort);

            $data = ["artists" => $artists, "pagination" => $pagination];
            Cache::set($cacheKey, $data, 'artist');

            ServerResponse::success("Top artists fetched successfully", $data);
        } catch (Exception $e) {
            ServerResponse::send($e->getCode(), $e->getMessage());
        }
    }

    /**
     * Obtiene la información detallada de un artista usando su mbid o nombre
     * @param string|null $mbid ID de MusicBrainz del artista (opcional)
     * @param string|null $name Nombre del artista (opcional)
     * @throws Exception Si no se proporciona ningún parámetro o si falla la petición
     */
    public static function getArtistMetaData(?string $mbid = null, ?string $name = null)
    {
        self::initialize();

        if (!$mbid && !$name) {
            throw new Exception("Either mbid or name must be provided");
        }

        // Determinar qué parámetro usar para la caché
        $cacheKey = $mbid ?
            "artist_meta_mbid_" . $mbid :
            "artist_meta_name_" . md5($name);

        // Intentar obtener del caché
        $cachedData = Cache::get($cacheKey, 'artist');
        if ($cachedData) {
            ServerResponse::success("Artist metadata fetched successfully (from cache)", $cachedData);
            return;
        }

        try {
            // Construir URL según el parámetro proporcionado
            if ($mbid) {
                $url = self::$baseUrl . "&method=artist.getinfo&mbid=" . urlencode($mbid) . "&autocorrect=1";
            } else {
                $url = self::$baseUrl . "&method=artist.getinfo&artist=" . urlencode($name) . "&autocorrect=1";
            }

            $curl = curl_init($url);
            curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

            $response = curl_exec($curl);
            curl_close($curl);

            $data = json_decode($response, true);
            if (!$data || !isset($data['artist'])) {
                throw new Exception("Failed to fetch or parse data from API");
            }

            $artist = $data['artist'];

            // Procesar imágenes del artista principal
            $imageKey = "artist_image_" . md5($artist['name']);
            $cachedImage = Cache::get($imageKey, 'asset');

            if ($cachedImage) {
                $artist['image'] = $cachedImage;
            } else {
                $artistImages = self::getArtistImage($artist['name']);
                if ($artistImages) {
                    $artist['image'] = $artistImages;
                    Cache::set($imageKey, $artistImages, 'asset');
                }
            }

            // Obtener conciertos del artista
            $cachedConcerts = Cache::getConcertData($artist['name']);

            if (!$cachedConcerts) {
                $concerts = Concert::getByArtistName($artist['name']);

                if (!empty($concerts)) {
                    // Procesar los conciertos para obtener solo los datos necesarios
                    $processedConcerts = array_map(function ($concert) {
                        return [
                            'id' => $concert['id'],
                            'name' => $concert['name'],
                            'image' => $concert['images'][0]['url'] ?? '' // Solo la primera imagen
                        ];
                    }, $concerts);

                    // Guardar en el archivo de conciertos consolidado
                    Cache::addConcertData($artist['name'], $processedConcerts);
                    $artist['concerts'] = $processedConcerts;
                } else {
                    $artist['concerts'] = [];
                    // Guardar array vacío para evitar consultas repetidas
                    Cache::addConcertData($artist['name'], []);
                }
            } else {
                $artist['concerts'] = $cachedConcerts;
            }

            // Procesar artistas similares
            if (isset($artist['similar']['artist']) && is_array($artist['similar']['artist'])) {
                foreach ($artist['similar']['artist'] as $key => $similarArtist) {
                    $similarImageKey = "artist_image_" . md5($similarArtist['name']);
                    $cachedSimilarImage = Cache::get($similarImageKey, 'asset');

                    if ($cachedSimilarImage) {
                        $artist['similar']['artist'][$key]['image'] = $cachedSimilarImage;
                    } else {
                        $similarArtistImages = self::getArtistImage($similarArtist['name']);
                        if ($similarArtistImages) {
                            $artist['similar']['artist'][$key]['image'] = $similarArtistImages;
                            Cache::set($similarImageKey, $similarArtistImages, 'asset');
                        }
                    }
                }
            }

            Cache::set($cacheKey, $artist, 'artist');
            ServerResponse::success("Artist metadata fetched successfully", $artist);
        } catch (Exception $e) {
            ServerResponse::send($e->getCode(), $e->getMessage());
        }
    }
}
