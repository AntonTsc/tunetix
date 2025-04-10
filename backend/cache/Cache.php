<?php
class Cache
{
    private static $cacheDir = __DIR__ . '/'; // Directorio donde se almacenará el caché (misma ruta que Cache.php)
    private static $cacheTime = 3600; // Tiempo de expiración del caché en segundos (1 hora)

    /**
     * Obtiene los datos del caché si existen y no han expirado.
     *
     * @param string $key La clave única para identificar el caché.
     * @return mixed|null Los datos almacenados en el caché o null si no existen o han expirado.
     */
    public static function get($key)
    {
        $filePath = self::$cacheDir . $key . '.json';

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
     * @return void
     */
    public static function set($key, $data)
    {
        // Asegúrate de que el directorio de caché exista
        if (!is_dir(self::$cacheDir)) {
            mkdir(self::$cacheDir, 0777, true);
        }

        $filePath = self::$cacheDir . $key . '.json';
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
        $filePath = self::$cacheDir . md5($key) . '.json';

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