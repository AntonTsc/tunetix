<?php
// Script para limpiar la caché de la aplicación
include_once __DIR__ . '/../utils/classes/Cache.php';

header('Content-Type: application/json');

// Función para eliminar archivos en un directorio que coincidan con un patrón
function clearCacheFiles($dir, $pattern)
{
    $deleted = [];
    if (is_dir($dir)) {
        $files = glob($dir . $pattern);
        foreach ($files as $file) {
            if (is_file($file)) {
                if (unlink($file)) {
                    $deleted[] = basename($file);
                }
            }
        }
    }
    return $deleted;
}

// Función para asegurar que existan todos los directorios de caché
function ensureCacheDirectories($baseDir)
{
    $directories = [
        'cache',
        'cache/artists',
        'cache/tracks',
        'cache/concerts',
        'cache/metadata',
        'cache/searches',
        'cache/assets'  // Cambiado de 'assets' a 'cache/assets'
    ];

    foreach ($directories as $dir) {
        $fullPath = $baseDir . '/' . $dir;
        if (!is_dir($fullPath)) {
            mkdir($fullPath, 0777, true);
        }
    }
}

// Función para migrar archivos de una ubicación antigua a una nueva
function migrateFiles($oldDir, $newDir, $pattern = '*')
{
    $migrated = [];

    // Verificar que ambos directorios existan
    if (!is_dir($oldDir)) {
        return $migrated;
    }

    if (!is_dir($newDir)) {
        mkdir($newDir, 0777, true);
    }

    // Obtener todos los archivos que coincidan con el patrón
    $files = glob($oldDir . $pattern);

    foreach ($files as $file) {
        if (is_file($file)) {
            $filename = basename($file);
            $newPath = $newDir . $filename;

            // Copiar el archivo a la nueva ubicación y luego eliminar el original
            if (copy($file, $newPath)) {
                if (unlink($file)) {
                    $migrated[] = $filename;
                }
            }
        }
    }

    return $migrated;
}

// Directorios de caché
$baseDir = __DIR__ . '/..';
$cacheDir = $baseDir . '/cache/';
$artistsDir = $baseDir . '/cache/artists/';
$tracksDir = $baseDir . '/cache/tracks/';
$concertsDir = $baseDir . '/cache/concerts/';
$metadataDir = $baseDir . '/cache/metadata/';
$searchesDir = $baseDir . '/cache/searches/';
$assetsDir = $baseDir . '/cache/assets/';
$oldAssetsDir = $baseDir . '/assets/';

// Asegurar que existan todos los directorios
ensureCacheDirectories($baseDir);

// Migrar archivos de assets desde la ubicación antigua a la nueva
$migratedFiles = migrateFiles($oldAssetsDir, $assetsDir);

$result = [
    'status' => 'OK',
    'message' => 'Limpieza de caché completada',
    'data' => [
        'search_artists' => clearCacheFiles($searchesDir, '*'),
        'artists_cache' => clearCacheFiles($artistsDir, '*'),
        'tracks_cache' => clearCacheFiles($tracksDir, '*'),
        'metadata_cache' => clearCacheFiles($metadataDir, '*'),
        'concerts_cache' => clearCacheFiles($concertsDir, '*'),
        'legacy_cache' => [
            'artist_concerts' => clearCacheFiles($cacheDir, 'artist_concerts_*'),
            'artist_meta' => clearCacheFiles($cacheDir, 'artist_meta_*'),
            'top_artists' => clearCacheFiles($cacheDir, 'top_artists_*'),
            'search_artists' => clearCacheFiles($cacheDir, 'search_artists_*'),
            'concerts' => clearCacheFiles($cacheDir, 'concerts_*'),
            'other' => clearCacheFiles($cacheDir, '*.json')
        ],
        'assets' => [] // No limpiamos assets por defecto para no perder imágenes
    ]
];

// Si se han migrado archivos, añadir esa información al resultado
if (!empty($migratedFiles)) {
    $result['data']['migrated_assets'] = $migratedFiles;
    $result['message'] = 'Limpieza de caché completada y archivos de assets migrados';
}

// Parámetro opcional para limpiar todo, incluyendo assets
if (isset($_GET['full']) && $_GET['full'] === 'true') {
    $result['data']['assets'] = clearCacheFiles($assetsDir, 'artist_image_*');
    $result['message'] = 'Limpieza completa de caché realizada';
}

echo json_encode($result, JSON_PRETTY_PRINT);
