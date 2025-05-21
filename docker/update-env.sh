#!/bin/bash
set -e

# Actualiza el archivo .env con las variables de entorno proporcionadas
ENV_FILE="/var/www/html/tunetix/backend/.env"
ENV_DIR=$(dirname "$ENV_FILE")

# Asegúrate de que el directorio existe
if [ ! -d "$ENV_DIR" ]; then
  echo "Creando directorio: $ENV_DIR"
  mkdir -p "$ENV_DIR"
fi

# Crea el archivo .env si no existe
if [ ! -f "$ENV_FILE" ]; then
  echo "Creando archivo .env nuevo"
  touch "$ENV_FILE"
  
  # Valores por defecto para el archivo .env
  echo "# Clave secreta para JWT" > "$ENV_FILE"
  echo "SECRET = ''" >> "$ENV_FILE"
  echo "" >> "$ENV_FILE"
  echo "# Credenciales BBDD" >> "$ENV_FILE"
  echo "DB_HOST = 'mariadb'" >> "$ENV_FILE"
  echo "DB_NAME = 'tunetix_db'" >> "$ENV_FILE"
  echo "DB_USER = 'tt_user'" >> "$ENV_FILE"
  echo "DB_PASS = 'admin'" >> "$ENV_FILE"
  echo "" >> "$ENV_FILE"
  echo "# LASTFM API" >> "$ENV_FILE"
  echo "LASTFM_API_KEY = ''" >> "$ENV_FILE"
  echo "" >> "$ENV_FILE"
  echo "# Ticketmaster API" >> "$ENV_FILE"
  echo "TICKETMASTER_API_KEY = ''" >> "$ENV_FILE"
  echo "" >> "$ENV_FILE"
  echo "# Google OAuth" >> "$ENV_FILE"
  echo "GOOGLE_CLIENT_ID = ''" >> "$ENV_FILE"
  echo "GOOGLE_CLIENT_SECRET = ''" >> "$ENV_FILE"
  echo "GOOGLE_REDIRECT_URI = 'http://localhost/inicio'" >> "$ENV_FILE"
fi

# Lista de variables de entorno a actualizar
env_vars=(
  "DB_HOST"
  "DB_NAME"
  "DB_USER"
  "DB_PASS"
  "SECRET"
  "LASTFM_API_KEY"
  "TICKETMASTER_API_KEY"
  "GOOGLE_CLIENT_ID"
  "GOOGLE_CLIENT_SECRET"
  "GOOGLE_REDIRECT_URI"
)

# Para cada variable, si está definida, actualiza el archivo .env
for var in "${env_vars[@]}"; do
  if [ ! -z "${!var}" ]; then
    # Reemplaza la línea existente o añade una nueva si no existe
    if grep -q "^${var} =" "$ENV_FILE"; then
      sed -i "s|^${var} =.*|${var} = '${!var}'|" "$ENV_FILE"
    else
      echo "${var} = '${!var}'" >> "$ENV_FILE"
    fi
    echo "Actualizada variable de entorno: ${var}"
  fi
done

# Establece permisos correctos
chown -R www-data:www-data /var/www/html

# Ejecuta el comando proporcionado (normalmente apache2-foreground)
exec "$@"
