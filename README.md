# 🎵 Tunetix - Plataforma de Música y Eventos

<img src="frontend/src/assets/imgs/logo.webp" alt="Tunetix Logo" width="200">

Tunetix es una plataforma que integra información de música y eventos, permitiendo a los usuarios descubrir artistas, buscar conciertos y comprar entradas.

[![PHP Version](https://img.shields.io/badge/PHP-8.2+-4F5B93.svg)](https://www.php.net/)
[![Angular Version](https://img.shields.io/badge/Angular-16.x-DD0031.svg)](https://angular.io/)
[![MySQL](https://img.shields.io/badge/MySQL-10.4+-00758F.svg)](https://www.mysql.com/)

---

## 📑 Índice

- [🎵 Tunetix - Plataforma de Música y Eventos](#-tunetix---plataforma-de-música-y-eventos)
  - [📑 Índice](#-índice)
  - [📋 Requisitos previos](#-requisitos-previos)
  - [🗂️ Estructura del proyecto](#️-estructura-del-proyecto)
  - [Despliegue](#despliegue)
    - [Pasos pre-despliegue](#pasos-pre-despliegue)
      - [1. Clona el repositorio](#1-clona-el-repositorio)
      - [2. Variables de entorno](#2-variables-de-entorno) - [🐳 Despliegue con Docker](#-despliegue-con-docker)
      - [1. Despliegue en producción](#1-despliegue-en-producción)
      - [2. Acceder al proyecto](#2-acceder-al-proyecto)
    - [💻 Instalación y configuración (sin Docker)](#-instalación-y-configuración-sin-docker)
      - [1. Configurar la base de datos](#1-configurar-la-base-de-datos)
      - [2. Configurar el backend](#2-configurar-el-backend)
      - [3. Configurar el frontend](#3-configurar-el-frontend)
  - [🚀 Ejecución del proyecto](#-ejecución-del-proyecto)
  - [✨ Funcionalidades principales](#-funcionalidades-principales)
  - [🛠️ Resolución de problemas comunes](#️-resolución-de-problemas-comunes)
  - [🔄 Sistema de caché](#-sistema-de-caché)
  - [📊 Tecnologías principales](#-tecnologías-principales)

---

## 📋 Requisitos previos

- [PHP 8.2+](https://www.php.net/)
- [Composer](https://getcomposer.org/)
- [Node.js](https://nodejs.org/) y [npm](https://www.npmjs.com/)
- [Angular CLI](https://angular.io/cli)
- [MySQL/MariaDB](https://mariadb.org/)
- [Docker](https://www.docker.com/) y [Docker Compose](https://docs.docker.com/compose/)
- [Last.fm API Key](https://www.last.fm/api/account/create)
- [Ticketmaster API Key](https://developer.ticketmaster.com/)
- [Google Client ID y Secret](https://console.cloud.google.com/)

---

## 🗂️ Estructura del proyecto

```
tunetix/
├── backend/               # Código backend en PHP
│   ├── api/               # Endpoints API para artistas, eventos y canciones
│   ├── auth/              # Autenticación y autorización
│   ├── cache/             # Sistema de caché para optimizar respuestas
│   ├── Controllers/       # Controladores MVC con lógica de negocio
│   ├── db/                # Scripts y esquemas para la base de datos
│   ├── uploads/           # Archivos subidos por usuarios (imágenes, etc.)
│   ├── utils/             # Funciones y utilidades generales
│   ├── .env.example       # Ejemplo de archivo .env
│   ├── .gitignore         # Archivos ignorados por Git en backend
│   ├── .htaccess          # Configuraciones Apache para backend
│   ├── auth_verify        # Script o módulo para verificación de autenticación
│   ├── composer.json      # Definición de dependencias PHP
│   ├── composer.lock      # Registro de versiones instaladas
│   ├── composer.phar      # Ejecutable Composer (gestor de dependencias)
│   └── dotenv/            # Librería para manejo de variables de entorno
├── docker/                # Archivos para Docker y despliegue
    ├── scripts/           # Scripts para Docker
│   ├── php8.2-apache/     # Imagen PHP 8.2 con Apache personalizada
│   └── docker-compose.yml # Orquestador de contenedores (backend, frontend)
├── frontend/              # Código frontend en Angular
│   ├── .angular/          # Configuraciones internas Angular
│   ├── dist/              # Archivos compilados listos para producción
│   ├── node_modules/      # Dependencias instaladas (npm/pnpm)
│   ├── src/               # Código fuente Angular (componentes, servicios)
│   ├── .editorconfig      # Configuración de editor para el proyecto
│   ├── .gitignore         # Archivos ignorados por Git en frontend
│   ├── angular.json       # Configuración principal Angular
│   ├── package-lock.json  # Registro de versiones exactas de npm
│   ├── package.json       # Dependencias y scripts npm
│   ├── pnpm-lock.yaml     # Archivo bloqueo para pnpm
│   ├── README.md          # Documentación específica frontend
│   ├── tailwind.config.js # Configuración TailwindCSS
│   ├── tsconfig.app.json  # Configuración TypeScript app
│   ├── tsconfig.json      # Configuración general TypeScript
│   └── tsconfig.spec.json # Configuración para tests TypeScript
├── .gitignore             # Archivos ignorados globalmente por Git
└── README.md              # Documentación general del proyecto

```

---

## Despliegue

### Pasos pre-despliegue

#### 1. Clona el repositorio

```bash
git clone https://github.com/AntonTsc/tunetix.git
cd tunetix
```

#### 2. Variables de entorno

dentro de `backend/`, crea un archivo `.env` a partir de `.env.example`

```bash
cp .env.example .env
```

```bash
# Clave secreta para JWT
SECRET = tu_token_key (cuantos mas caracteres, mejor)

# Credenciales BBDD
DB_HOST = 'localhost'  # Si vas a usar Docker, debes poner 'mariadb'
DB_NAME = 'tunetix_db'
DB_USER = 'tt_user'
DB_PASS = 'admin'

# LASTFM API
LASTFM_API_KEY = tu_api_key

# Ticketmaster API
TICKETMASTER_API_KEY = tu_api_key

# Google OAuth
GOOGLE_CLIENT_ID = tu_client_id
GOOGLE_CLIENT_SECRET = tu_secret
GOOGLE_REDIRECT_URI = 'http://localhost/inicio'
```

### 🐳 Despliegue con Docker

#### 1. Despliegue en producción

Para desplegar la aplicación en un entorno de producción usando Docker:

1. **Crear un archivo docker-compose.yml**:

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
      PMA_PASSWORD: admin
    ports:
      - "8080:80"
    networks:
      - tunetix-network

  apache:
    image: anttsc/tunetix:latest # Imagen publicada en Docker Hub
    container_name: apache
    environment:
      - DB_HOST=mariadb
      - DB_NAME=tunetix_db
      - DB_USER=tt_user
      - DB_PASS=admin
      - SECRET=your_jwt_secret_key # Cambia esto por tu clave JWT
      - LASTFM_API_KEY=your_lastfm_api_key # Obtén una clave en last.fm
      - TICKETMASTER_API_KEY=your_ticketmaster_api_key # Clave de Ticketmaster
      - GOOGLE_CLIENT_ID=your_google_client_id # Desde Google Cloud Console
      - GOOGLE_CLIENT_SECRET=your_google_client_secret # Desde Google Cloud Console
      - GOOGLE_REDIRECT_URI=http://localhost/inicio
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

2. **Descargar el archivo SQL de la base de datos**:

   Descarga el archivo `tunetix_db.sql` del repositorio y guárdalo en el mismo directorio que tu archivo docker-compose.yml.

3. **Iniciar los contenedores**:

```bash
docker-compose up -d
```

Para más detalles sobre la configuración de Docker, consulta el archivo [DOCKER.md](DOCKER.md).

#### 2. Acceder al proyecto

- Frontend: [http://localhost](http://localhost)
- Backend API: [http://localhost/tunetix/backend/api/](http://localhost/tunetix/backend/api/)
- phpMyAdmin: [http://localhost:8080](http://localhost:8080) (usuario: tt_user, contraseña: admin)

---

### 💻 Instalación y configuración (sin Docker)

#### 1. Configurar la base de datos

```sql
CREATE DATABASE tunetix_db;
CREATE USER 'tt_user'@'localhost' IDENTIFIED BY 'admin';
GRANT ALL PRIVILEGES ON tunetix_db.* TO 'tt_user'@'localhost';
FLUSH PRIVILEGES;
```

#### 2. Configurar el backend

```bash
cd backend
cp .env.example .env
composer install
```

#### 3. Configurar el frontend

```bash
cd frontend
npm install
```

---

## 🚀 Ejecución del proyecto

El frontend y el backend se sirven juntos a través de Apache.

- Accede a la aplicación: [http://localhost](http://localhost)
- API REST: [http://localhost/tunetix/backend/api](http://localhost/tunetix/backend/api)

---

## ✨ Funcionalidades principales

- Autenticación con JWT
- Inicio de sesión con Google
- Descubrimiento de artistas y eventos
- Sistema de favoritos
- Integración con Last.fm y Ticketmaster
- Sistema de caché para peticiones externas
- Interfaz responsive

---

## 🛠️ Resolución de problemas comunes

**El frontend no puede acceder a la API**

- Revisa que `apiUrl` en `environment.ts` esté correctamente configurado.

**Error de conexión a la base de datos**

- Verifica credenciales en `.env`
- Asegúrate de que el contenedor de base de datos esté levantado.

**JWT inválido o expirado**

- Verifica la clave `JWT_SECRET`
- Revisa el sistema de renovación de tokens

---

## 🔄 Sistema de caché

El backend guarda respuestas de Last.fm y Ticketmaster como archivos `.json` en `storage/cache/`. Esto permite reducir la latencia y la cantidad de peticiones externas.

---

## 📊 Tecnologías principales

| Tecnología                                              | Uso                     |
| ------------------------------------------------------- | ----------------------- |
| [PHP](https://www.php.net/)                             | Backend                 |
| [Laravel](https://laravel.com/)                         | Framework PHP           |
| [Angular](https://angular.io/)                          | Frontend SPA            |
| [MySQL](https://www.mysql.com/)                         | Base de datos           |
| [Composer](https://getcomposer.org/)                    | Dependencias PHP        |
| [Node.js](https://nodejs.org/)                          | Herramientas frontend   |
| [Docker](https://www.docker.com/)                       | Contenedores            |
| [Last.fm API](https://www.last.fm/api)                  | Información de artistas |
| [Ticketmaster API](https://developer.ticketmaster.com/) | Información de eventos  |
