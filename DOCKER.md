# Tunetix - Despliegue en Producción con Docker

Esta guía explica cómo desplegar la aplicación Tunetix en un entorno de producción utilizando Docker Hub.

## Para el Usuario Final (Despliegue)

### Requisitos Previos

- [Docker](https://docs.docker.com/get-docker/)
- [Docker Compose](https://docs.docker.com/compose/install/)
- Credenciales para API de Last.fm y Ticketmaster
- Credenciales OAuth de Google (opcionales)

### Pasos para Desplegar en Producción

1. **Crear un archivo docker-compose.yml**

```yaml
version: "3.8"

services:
  mariadb:
    image: mariadb:latest
    container_name: mariadb
    environment:
      MYSQL_ROOT_PASSWORD: admin # Cambia esto por motivos de seguridad
      MYSQL_DATABASE: tunetix_db
      MYSQL_USER: tt_user
      MYSQL_PASSWORD: admin # Cambia esto por motivos de seguridad
    volumes:
      - tunetix-db:/var/lib/mysql
      # Asegúrate de tener el archivo SQL de la base de datos
      - ./tunetix_db.sql:/docker-entrypoint-initdb.d/tunetix_db.sql:ro
    networks:
      - tunetix-network

  phpmyadmin:
    image: phpmyadmin/phpmyadmin:latest
    container_name: phpmyadmin
    environment:
      PMA_HOST: mariadb
      PMA_PORT: 3306
      PMA_USER: tt_user
      PMA_PASSWORD: admin # Debe coincidir con la contraseña anterior
    ports:
      - "8080:80"
    networks:
      - tunetix-network

  apache:
    image: anttsc/tunetix:latest # Usa la imagen de Docker Hub
    container_name: apache
    ports:
      - "80:80"
    depends_on:
      - mariadb
    networks:
      - tunetix-network

networks:
  tunetix-network:
    driver: bridge

volumes:
  tunetix-db:
    driver: local
```

2. **Descargar el archivo SQL de la base de datos**

   Descarga el archivo `tunetix_db.sql` y guárdalo en el mismo directorio que tu archivo docker-compose.yml.

3. **Configurar las variables de entorno**

   En el archivo docker-compose.yml, actualiza las variables de entorno con tus propias credenciales:

   ```yaml
   apache:
     image: anttsc/tunetix:latest
     environment:
       - DB_HOST=mariadb
       - DB_NAME=tunetix_db
       - DB_USER=tt_user
       - DB_PASS=admin
       - SECRET=your_jwt_secret_key # Cambia esto por una clave segura para JWT
       - LASTFM_API_KEY=your_lastfm_api_key # Obtén esto de https://www.last.fm/api/account/create
       - TICKETMASTER_API_KEY=your_ticketmaster_api_key # Obtén esto de https://developer.ticketmaster.com/
       - GOOGLE_CLIENT_ID=your_google_client_id # Obtén esto de Google Cloud Console
       - GOOGLE_CLIENT_SECRET=your_google_client_secret # Obtén esto de Google Cloud Console
       - GOOGLE_REDIRECT_URI=http://localhost/inicio
   ```

4. **Ejecutar los contenedores**

```bash
docker-compose up -d
```

4. **Acceder a la Aplicación**

- **Frontend**: http://localhost
- **phpMyAdmin**: http://localhost:8080 (usuario: tt_user, contraseña: admin)

5. **Para detener la aplicación**

```bash
docker-compose down
```

## Información Adicional

- La imagen Docker contiene tanto el frontend (Angular) como el backend (PHP).
- Los datos de la base de datos se guardan en un volumen Docker para persistencia.
- Todas las variables de entorno necesarias se pasan a través del archivo docker-compose.yml.
- El sistema creará automáticamente el archivo `.env` con las variables proporcionadas en docker-compose.yml.
- Si no se proporcionan las claves API, algunas características de la aplicación no funcionarán.

### Obtener las Claves de API necesarias

1. **Last.fm API Key**:

   - Regístrate en [Last.fm API](https://www.last.fm/api/account/create)
   - Crea una nueva aplicación para obtener tu API Key

2. **Ticketmaster API Key**:

   - Regístrate en [Ticketmaster Developer](https://developer.ticketmaster.com/)
   - Crea un nuevo proyecto para obtener tu API Key

3. **Google OAuth Credentials**:
   - Ve a [Google Cloud Console](https://console.cloud.google.com/)
   - Crea un proyecto y configura las credenciales OAuth
   - Añade http://localhost/inicio como URI de redirección

## Solución de Problemas

### La aplicación no se conecta a la base de datos

- Verifica que las credenciales en docker-compose.yml sean correctas
- Asegúrate de que el contenedor de MariaDB esté funcionando: `docker ps`
- Revisa los logs del contenedor: `docker logs mariadb`

### Errores 500 en la API

- Revisa los logs del contenedor de Apache: `docker logs apache`
- Verifica si las variables de entorno se han configurado correctamente: `docker exec -it apache cat /var/www/html/tunetix/backend/.env`

### Problemas con las API externas

- Asegúrate de haber proporcionado las claves API correctas en el archivo docker-compose.yml
- Comprueba que las claves API sean válidas accediendo a tus cuentas de desarrollador
- Revisa los logs de la aplicación para ver errores específicos de las API
