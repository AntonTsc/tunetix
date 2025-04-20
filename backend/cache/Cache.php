<?php
class Cache
{
    private static $cacheDir = __DIR__ . '/';
    private static $assetsDir = __DIR__ . '/../assets/';
    private static $artistsDir = __DIR__ . '/artists/';
    private static $tracksDir = __DIR__ . '/tracks/';
    private static $cacheTime = 86400; // 24 horas

    public static function get($key, $type = '')
    {
        $directory = self::getDirectory($type);
        $filePath = $directory . $key . '.json';

        if (file_exists($filePath) && (time() - filemtime($filePath)) < self::$cacheTime) {
            return json_decode(file_get_contents($filePath), true);
        }

        return null;
    }

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

    private static function getDirectory($type)
    {
        switch ($type) {
            case 'artist':
                return self::$artistsDir;
            case 'track':
                return self::$tracksDir;
            case 'asset':
                return self::$assetsDir;
            default:
                return self::$cacheDir;
        }
    }
}