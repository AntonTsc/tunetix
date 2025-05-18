#!/bin/bash

set -e

echo
echo "=== Instalando dependencias del backend (PHP/Composer) ==="
cd ../../backend
if [ -d "vendor" ]; then
    echo "Las dependencias de PHP ya están instaladas. Omitiendo composer install..."
else
    if [ -f "composer.phar" ]; then
        php composer.phar install
    else
        composer install
    fi
fi

echo
echo "=== Instalando dependencias del frontend (Node/NPM) ==="
cd ../frontend
if [ -d "node_modules" ]; then
    echo "Las dependencias de Node ya están instaladas. Omitiendo npm install..."
else
    npm install
fi

echo
echo "=== Compilando Angular para producción ==="
if [ -d "dist" ]; then
    echo "Eliminando build anterior..."
    rm -rf dist
fi
npx ng build --configuration production

echo
echo "=== Levantando contenedores con Docker ==="
cd ../docker
docker compose up -d --build

echo
echo "=== Proceso completado ==="
