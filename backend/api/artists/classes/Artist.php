<?php
    include_once __DIR__ . '/../../../dotenv.php';
    include_once __DIR__ . '/../../../utils/classes/ServerResponse.php';
    include_once __DIR__ . '/../../../cache/Cache.php';
    

    class Artist{
        private static $apiKey;
        private static $baseUrl;
        private static $mbBaseUrl = "https://musicbrainz.org/ws/2";
        private static $wdBaseUrl = "https://www.wikidata.org/w/api.php";

        private static function initialize() {
            if (empty($_ENV['LASTFM_API_KEY'])) {
                throw new Exception("API Key is not set in the environment variables.");
            }
            self::$apiKey = $_ENV['LASTFM_API_KEY'];
            self::$baseUrl = "https://ws.audioscrobbler.com/2.0/?api_key=" . self::$apiKey . "&format=json";
        }

        private static function getArtistWikidataUrl($mbid) {
            // Añadir retraso para respetar el rate limit de MusicBrainz
            usleep(1000000); // 1 segundo entre peticiones

            $url = self::$mbBaseUrl . "/artist/" . $mbid . "?inc=url-rels&fmt=json";
            
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_USERAGENT, 'TunetixApp/1.0.0'); // Required by MusicBrainz API
            
            $response = curl_exec($ch);
            curl_close($ch);
            
            $data = json_decode($response, true);
            
            if (isset($data['relations'])) {
                foreach ($data['relations'] as $relation) {
                    if ($relation['type'] === 'wikidata' && isset($relation['url']['resource'])) {
                        return $relation['url']['resource'];
                    }
                }
            }
            
            return null;
        }

        private static function getArtistImage($wikidataUrl) {
            if (empty($wikidataUrl)) return null;

            // Extraer el ID de Wikidata de la URL (Q12345)
            $wikidataId = basename($wikidataUrl);

            // Construir la URL para la API de Wikidata
            $url = self::$wdBaseUrl . "?action=wbgetclaims" .
                   "&property=P18" . // P18 es la propiedad para imágenes
                   "&entity=" . $wikidataId .
                   "&format=json";

            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_USERAGENT, 'TunetixApp/1.0.0');

            $response = curl_exec($ch);
            curl_close($ch);

            $data = json_decode($response, true);

            if (isset($data['claims']['P18'][0]['mainsnak']['datavalue']['value'])) {
                $filename = $data['claims']['P18'][0]['mainsnak']['datavalue']['value'];
                
                // Construir las URLs de las imágenes usando el formato de Wikimedia Commons
                $baseUrl = "https://upload.wikimedia.org/wikipedia/commons/";
                
                // Calcular el hash MD5 del nombre del archivo (sin espacios)
                $cleanFilename = str_replace(' ', '_', $filename);
                $md5 = md5($cleanFilename);
                
                // Obtener los primeros caracteres del hash
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
                    usort($artists, fn($a, $b) => $a['playcount'] <=> $b['playcount']);
                    break;
                case 'popularity_desc':
                    usort($artists, fn($a, $b) => $b['playcount'] <=> $a['playcount']);
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
            $cacheKey = "top_artists_$limit" . "_" . "$page";

            // Intenta obtener los datos del caché
            $cachedData = Cache::get($cacheKey, 'artist');
            if ($cachedData) {
                $artists = $cachedData['artists'];
                $pagination = $cachedData['pagination'];

                // Actualizar las imágenes de los artistas
                foreach ($artists as $key => $artist) {
                    if (isset($artist['mbid']) && !empty($artist['mbid'])) {
                        // Intentar cargar la imagen desde el caché de assets
                        $cachedImage = self::getArtistImageFromCache($artist['name']);

                        if ($cachedImage) {
                            // Si existe en caché, usar esa imagen
                            $artists[$key]['image'] = $cachedImage;
                        } else {
                            // Si no existe en caché, obtener de Wikidata
                            $wikidataUrl = self::getArtistWikidataUrl($artist['mbid']);
                            if ($wikidataUrl) {
                                $artistImages = self::getArtistImage($wikidataUrl);
                                if ($artistImages) {
                                    $artists[$key]['image'] = $artistImages;
                                    // Guardar en caché para futuras consultas (en /assets)
                                    Cache::set("artist_image_" . md5($artist['name']), $artistImages, 'asset');
                                }
                            }
                        }
                    }
                }

                // Limitar el número de páginas a 20
                if ($pagination['totalPages'] > 20) {
                    $pagination['totalPages'] = 20;
                }

                // Filtrar los artistas según el parámetro $keyword
                if (!empty($keyword)) {
                    $artists = array_filter($artists, function ($artist) use ($keyword) {
                        return stripos($artist['name'], $keyword) !== false;
                    });
                }

                // Ordenar los artistas según el parámetro $sort
                self::sortArtists($artists, $sort);

                $data = ["artists" => $artists, "pagination" => $pagination];
                ServerResponse::success("Top artists fetched successfully (from cache)", $data);
                return;
            }

            // Si no hay datos en el caché, realiza la solicitud a la API
            $url = self::$baseUrl . "&method=chart.gettopartists&limit=$limit&page=$page";

            $curl = curl_init($url);
            curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

            try {
                $response = curl_exec($curl);
                curl_close($curl);

                $data = json_decode($response, true);
                if (!$data || !isset($data['artists']['artist'])) {
                    throw new Exception("Failed to fetch or parse data from API");
                }

                $pagination = $data['artists']['@attr'];
                $artists = $data['artists']['artist'];

                // Procesar cada artista para obtener su URL de Wikidata y su imagen
                foreach ($artists as $key => $artist) {
                    if (isset($artist['mbid']) && !empty($artist['mbid'])) {
                        $wikidataUrl = self::getArtistWikidataUrl($artist['mbid']);
                        if ($wikidataUrl) {
                            $artists[$key]['wikidata_url'] = $wikidataUrl;
                            
                            // Intentar obtener la imagen desde Wikidata
                            $artistImages = self::getArtistImage($wikidataUrl);
                            if ($artistImages) {
                                $artists[$key]['image'] = $artistImages;
                            }
                        }
                    }
                }

                // Limitar el número de páginas a 20
                if ($pagination['totalPages'] > 20) {
                    $pagination['totalPages'] = 20;
                }

                // Filtrar los artistas según el parámetro $keyword
                if (!empty($keyword)) {
                    $artists = array_filter($artists, function ($artist) use ($keyword) {
                        return stripos($artist['name'], $keyword) !== false;
                    });
                }

                // Ordenar los artistas según el parámetro $sort
                self::sortArtists($artists, $sort);

                $data = ["artists" => $artists, "pagination" => $pagination];

                // Guarda los datos en el caché
                Cache::set($cacheKey, $data, 'artist');

                // Devuelve los datos al cliente
                ServerResponse::success("Top artists fetched successfully", $data);
            } catch (Exception $e) {
                ServerResponse::send($e->getCode(), $e->getMessage());
            }
        }

        private static function getArtistImageFromCache($artistName) {
            $imageKey = "artist_image_" . md5($artistName);
            return Cache::get($imageKey, 'asset');
        }
    }
?>