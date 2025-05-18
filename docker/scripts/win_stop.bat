@echo off
setlocal

echo ===============================
echo Deteniendo contenedores Docker
echo ===============================

pushd ..
docker compose down
popd

endlocal
exit /b
