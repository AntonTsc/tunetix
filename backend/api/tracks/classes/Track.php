<?php
    include_once __DIR__ . '/../../../dotenv.php';
    include_once __DIR__ . '/../../../utils/classes/ServerResponse.php';
    include_once __DIR__ . '/../../../cache/Cache.php';

    class Track {
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

        private static function getTrackWikidataUrl($mbid) {
            usleep(1000000); // 1 segundo entre peticiones

            $url = self::$mbBaseUrl . "/recording/" . $mbid . "?inc=url-rels&fmt=json";
            
            $ch = curl_init($url);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_USERAGENT, 'TunetixApp/1.0.0');
            
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

        private static function getTrackImage($wikidataUrl) {
            if (empty($wikidataUrl)) return null;

            $wikidataId = basename($wikidataUrl);
            $url = self::$wdBaseUrl . "?action=wbgetclaims" .
                   "&property=P18" .
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

            return null;
        }

        private static function getArtistImageFromCache($artistName) {
            $imageKey = "artist_image_" . md5($artistName);
            return Cache::get($imageKey, true);
        }

        private static function sortTracks(array &$tracks, $sort) {
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

        public static function getTopTracksInfo($limit = 24, $page = 1, $sort = 'popularity_desc', $keyword = '') {
            self::initialize();
            $cacheKey = "top_tracks_$limit" . "_" . "$page";

            $cachedData = Cache::get($cacheKey);
            if ($cachedData) {
                $tracks = $cachedData['tracks'];
                $pagination = $cachedData['pagination'];

                // Solo actualizar imágenes usando el caché de artistas
                foreach ($tracks as $key => $track) {
                    if (isset($track['artist']['name'])) {
                        $artistImage = self::getArtistImageFromCache($track['artist']['name']);
                        if ($artistImage) {
                            $tracks[$key]['image'] = $artistImage;
                        }
                    }
                }

                if ($pagination['totalPages'] > 20) {
                    $pagination['totalPages'] = 20;
                }

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

            $url = self::$baseUrl . "&method=chart.gettoptracks&limit=$limit&page=$page";

            $curl = curl_init($url);
            curl_setopt($curl, CURLOPT_RETURNTRANSFER, true);

            try {
                $response = curl_exec($curl);
                curl_close($curl);

                $data = json_decode($response, true);
                if (!$data || !isset($data['tracks']['track'])) {
                    throw new Exception("Failed to fetch or parse data from API");
                }

                $pagination = $data['tracks']['@attr'];
                $tracks = $data['tracks']['track'];

                foreach ($tracks as $key => $track) {
                    if (isset($track['artist']['name'])) {
                        $artistImage = self::getArtistImageFromCache($track['artist']['name']);
                        if ($artistImage) {
                            $tracks[$key]['image'] = $artistImage;
                        }
                    } elseif (isset($track['mbid']) && !empty($track['mbid'])) {
                        $wikidataUrl = self::getTrackWikidataUrl($track['mbid']);
                        if ($wikidataUrl) {
                            $tracks[$key]['wikidata_url'] = $wikidataUrl;
                            $trackImages = self::getTrackImage($wikidataUrl);
                            if ($trackImages) {
                                $tracks[$key]['image'] = $trackImages;
                            }
                        }
                    }
                }

                if ($pagination['totalPages'] > 20) {
                    $pagination['totalPages'] = 20;
                }

                if (!empty($keyword)) {
                    $tracks = array_filter($tracks, function ($track) use ($keyword) {
                        return stripos($track['name'], $keyword) !== false;
                    });
                }

                self::sortTracks($tracks, $sort);

                $data = ["tracks" => $tracks, "pagination" => $pagination];
                Cache::set($cacheKey, $data);

                ServerResponse::success("Top tracks fetched successfully", $data);
            } catch (Exception $e) {
                ServerResponse::send($e->getCode(), $e->getMessage());
            }
        }
    }
?>