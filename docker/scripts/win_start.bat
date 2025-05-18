@echo off
setlocal

echo.
echo === Instalando dependencias del backend (PHP/Composer) ===
cd ../../backend
if exist vendor (
    echo Las dependencias de PHP ya están instaladas. Omitiendo composer install...
) else (
    if exist composer.phar (
        php composer.phar install
    ) else (
        composer install
    )
)

echo.
echo === Instalando dependencias del frontend (Node/NPM) ===
cd ../frontend
if exist node_modules (
    echo Las dependencias de Node ya están instaladas. Omitiendo npm install...
) else (
    npm install
)

echo.
echo === Compilando Angular para producción ===
REM Elimina la carpeta dist si ya existe para garantizar una build limpia
if exist dist (
    echo Eliminando build anterior...
    rmdir /s /q dist
)
npx ng build --configuration production

echo.
echo === Levantando contenedores con Docker ===
cd ../docker
docker compose up -d --build

echo.
echo === Proceso completado ===
