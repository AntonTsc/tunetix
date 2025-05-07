<?php

/**
 * Clase para gestionar el caché de la aplicación
 * 
 * Permite guardar y recuperar datos en caché para optimizar el rendimiento
 */
class Cache
{
    private static $cacheDir = __DIR__ . '/../../cache/';
    private static $assetsDir = __DIR__ . '/../../cache/assets/';
    private static $artistsDir = __DIR__ . '/../../cache/artists/';
    private static $tracksDir = __DIR__ . '/../../cache/tracks/';
    private static $concertsDir = __DIR__ . '/../../cache/concerts/';
    private static $searchesDir = __DIR__ . '/../../cache/searches/';
    private static $metadataDir = __DIR__ . '/../../cache/metadata/';
    private static $cacheTime = 86400; // 24 horas

    /**
     * Obtiene un elemento del caché
     * 
     * @param string $key Clave del elemento
     * @param string $type Tipo de caché ('artist', 'track', 'asset', 'concert', 'search', 'metadata' o vacío para el predeterminado)
     * @return mixed|null Datos recuperados o null si no existe o está caducado
     */
    public static function get($key, $type = '')
    {
        $directory = self::getDirectory($type);
        $filePath = $directory . $key . '.json';

        if (file_exists($filePath) && (time() - filemtime($filePath)) < self::$cacheTime) {
            return json_decode(file_get_contents($filePath), true);
        }

        return null;
    }

    /**
     * Guarda un elemento en el caché
     * 
     * @param string $key Clave del elemento
     * @param mixed $data Datos a guardar
     * @param string $type Tipo de caché ('artist', 'track', 'asset', 'concert', 'search', 'metadata' o vacío para el predeterminado)
     */
    public static function set($key, $data, $type = '')
    {
        $directory = self::getDirectory($type);

        // Asegúrate de que el directorio exista
        if (!is_dir($directory)) {
            mkdir($directory, 0777, true);
        }

        $filePath = $directory . $key . '.json';
        file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    }

    /**
     * Actualiza o agrega datos a un concierto en el caché de conciertos consolidado
     * 
     * @param string $artistName Nombre del artista
     * @param array $concertData Datos del concierto a agregar
     * @return bool Éxito de la operación
     */
    public static function addConcertData($artistName, $concertData)
    {
        $directory = self::$concertsDir;

        // Asegurar que el directorio exista
        if (!is_dir($directory)) {
            mkdir($directory, 0777, true);
        }

        // Usar un archivo único para todos los conciertos
        $filePath = $directory . 'all_concerts.json';

        // Leer datos existentes o crear array vacío
        if (file_exists($filePath)) {
            $allConcerts = json_decode(file_get_contents($filePath), true) ?: [];
        } else {
            $allConcerts = [];
        }

        // Agregar o actualizar los conciertos del artista
        $allConcerts[$artistName] = $concertData;

        // Guardar los datos actualizados
        return file_put_contents($filePath, json_encode($allConcerts, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES)) !== false;
    }

    /**
     * Obtiene los datos de conciertos para un artista específico
     * 
     * @param string $artistName Nombre del artista
     * @return array|null Datos de conciertos o null si no existen
     */
    public static function getConcertData($artistName)
    {
        $filePath = self::$concertsDir . 'all_concerts.json';

        if (file_exists($filePath) && (time() - filemtime($filePath)) < self::$cacheTime) {
            $allConcerts = json_decode(file_get_contents($filePath), true);
            return $allConcerts[$artistName] ?? null;
        }

        return null;
    }

    /**
     * Determina el directorio de caché según el tipo
     * 
     * @param string $type Tipo de caché
     * @return string Ruta del directorio
     */
    private static function getDirectory($type)
    {
        switch ($type) {
            case 'artist':
                return self::$artistsDir;
            case 'track':
                return self::$tracksDir;
            case 'asset':
                return self::$assetsDir;
            case 'concert':
                return self::$concertsDir;
            case 'search':
                return self::$searchesDir;
            case 'metadata':
                return self::$metadataDir;
            default:
                return self::$cacheDir;
        }
    }
}
