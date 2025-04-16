<?php
class Cache
{
    private static $cacheDir = __DIR__ . '/'; // Directorio donde se almacenará el caché (misma ruta que Cache.php)
    private static $assetsDir = __DIR__ . '/../assets/'; // Directorio donde se almacenarán los assets
    private static $cacheTime = 86400; // Tiempo de expiración del caché en segundos (24 horas)

    /**
     * Obtiene los datos del caché si existen y no han expirado.
     *
     * @param string $key La clave única para identificar el caché.
     * @param bool $isAsset Indica si se trata de un asset.
     * @return mixed|null Los datos almacenados en el caché o null si no existen o han expirado.
     */
    public static function get($key, $isAsset = false)
    {
        $directory = $isAsset ? self::$assetsDir : self::$cacheDir;
        $filePath = $directory . $key . '.json';

        // Verifica si el archivo existe y no ha expirado
        if (file_exists($filePath) && (time() - filemtime($filePath)) < self::$cacheTime) {
            return json_decode(file_get_contents($filePath), true);
        }

        return null; // El caché no existe o ha expirado
    }

    /**
     * Almacena datos en el caché.
     *
     * @param string $key La clave única para identificar el caché.
     * @param mixed $data Los datos que se almacenarán en el caché.
     * @param bool $isAsset Indica si se trata de un asset.
     * @return void
     */
    public static function set($key, $data, $isAsset = false)
    {
        $directory = $isAsset ? self::$assetsDir : self::$cacheDir;

        // Asegúrate de que el directorio exista
        if (!is_dir($directory)) {
            mkdir($directory, 0777, true);
        }

        $filePath = $directory . $key . '.json';
        file_put_contents($filePath, json_encode($data, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES));
    }

    /**
     * Elimina un archivo de caché específico.
     *
     * @param string $key La clave única para identificar el caché.
     * @return void
     */
    public static function delete($key)
    {
        $filePath = self::$cacheDir . $key . '.json';

        if (file_exists($filePath)) {
            unlink($filePath);
        }
    }

    /**
     * Limpia todo el caché eliminando todos los archivos en el directorio de caché.
     *
     * @return void
     */
    public static function clear()
    {
        if (is_dir(self::$cacheDir)) {
            $files = glob(self::$cacheDir . '*.json'); // Obtiene todos los archivos JSON en el directorio

            foreach ($files as $file) {
                if (is_file($file)) {
                    unlink($file); // Elimina cada archivo
                }
            }
        }
    }
}
?>