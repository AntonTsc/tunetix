@echo off
setlocal

set BASE_DIR=%~dp0..\..
set BACKEND_DIR=%BASE_DIR%\backend
set FRONTEND_DIR=%BASE_DIR%\frontend
set DOCKER_DIR=%BASE_DIR%\docker

echo.
echo === Instalando dependencias del backend (PHP/Composer) ===
cd /d "%BACKEND_DIR%"
if exist vendor (
    echo Las dependencias de PHP ya están instaladas. Omitiendo composer install...
) else (
    if exist composer.phar (
        php composer.phar install
    ) else (
        composer install
    )
    if %ERRORLEVEL% neq 0 (
        echo Error al instalar dependencias del backend
        exit /b %ERRORLEVEL%
    )
)

echo.
echo === Instalando dependencias del frontend (Node/NPM) ===
cd /d "%FRONTEND_DIR%"
if exist node_modules (
    echo Las dependencias de Node ya están instaladas. Omitiendo npm install...
) else (
    call npm install
    if %ERRORLEVEL% neq 0 (
        echo Error al instalar dependencias del frontend
        exit /b %ERRORLEVEL%
    )
)

echo.
echo === Compilando Angular para producción ===
REM Elimina la carpeta dist si ya existe para garantizar una build limpia
cd /d "%FRONTEND_DIR%"
if exist dist (
    echo Eliminando build anterior...
    rmdir /s /q dist
)
call npx ng build --configuration production
if %ERRORLEVEL% neq 0 (
    echo Error al compilar Angular
    exit /b %ERRORLEVEL%
)

echo.
echo === Levantando contenedores con Docker ===
cd /d "%DOCKER_DIR%"
docker compose up -d --build
if %ERRORLEVEL% neq 0 (
    echo Error al levantar contenedores Docker
    exit /b %ERRORLEVEL%
)

echo.
echo === Proceso completado ===
