@echo off
setlocal

set DOCKER_PATH=docker

pushd "%DOCKER_PATH%\scripts"
call win_stop.bat
call win_start.bat
popd