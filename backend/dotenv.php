<?php
// Asegúrate de que el autoload está correctamente incluido
if (file_exists(__DIR__ . '/vendor/autoload.php')) {
    include_once __DIR__ . '/vendor/autoload.php';
} else {
    // Si no existe, registra un error
    error_log('ERROR: No se pudo encontrar vendor/autoload.php');
}

// Intenta cargar las variables de entorno desde .env
try {
    if (file_exists(__DIR__ . '/.env')) {
        $dotenv = Dotenv\Dotenv::createImmutable(__DIR__);
        $dotenv->load();

        // Verificar si SECRET se ha cargado correctamente
        if (empty($_ENV['SECRET'])) {
            error_log('AVISO: Variable SECRET no encontrada en .env después de cargar');
        } else {
            error_log('INFO: Variable SECRET cargada correctamente');
        }
    } else {
        error_log('ERROR: Archivo .env no encontrado en ' . __DIR__);
    }
} catch (Exception $e) {
    error_log('ERROR al cargar .env: ' . $e->getMessage());
}

// Definir variables predeterminadas si no se pudieron cargar desde .env
if (!isset($_ENV['SECRET']) || empty($_ENV['SECRET'])) {
    $_ENV['SECRET'] = 'F-!5W30#s5#?7y=Oc(FV<%pi0GWm1b:gE`W^N:cR"{/eVdr.vw';
    error_log('AVISO: Usando valor predeterminado para SECRET en dotenv.php');
}
