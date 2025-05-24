#!/bin/bash

set -e

echo "==============================="
echo "Deteniendo contenedores Docker"
echo "==============================="

cd ../
docker compose down

exit 0