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
  - [🐳 Despliegue con Docker](#-despliegue-con-docker)
    - [1. Variables de entorno](#1-variables-de-entorno)
    - [2. Clonar el repositorio](#2-clonar-el-repositorio)
    - [3. Construir y levantar los contenedores](#3-construir-y-levantar-los-contenedores)
    - [4. Acceder al proyecto](#4-acceder-al-proyecto)
    - [5. Scripts útiles](#5-scripts-útiles)
  - [💻 Instalación y configuración (sin Docker)](#-instalación-y-configuración-sin-docker)
    - [1. Clonar el repositorio](#1-clonar-el-repositorio)
    - [2. Configurar la base de datos](#2-configurar-la-base-de-datos)
    - [3. Configurar el backend](#3-configurar-el-backend)
    - [4. Configurar el frontend](#4-configurar-el-frontend)
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

## 🐳 Despliegue con Docker

### 1. Variables de entorno

Asegúrate de tener un archivo `.env` en la raíz del directorio `backend/` con el siguiente contenido:

```env
MYSQL_ROOT_PASSWORD=root
MYSQL_DATABASE=tunetix_db
MYSQL_USER=tt_user
MYSQL_PASSWORD=admin

JWT_SECRET=clave_supersecreta

LASTFM_API_KEY=tu_api_key
TICKETMASTER_API_KEY=tu_api_key
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_secret
```

Puedes duplicar el archivo `.env.example` y modificarlo:

```bash
cp .env.example .env
```

### 2. Clonar el repositorio

```bash
git clone https://github.com/tu_usuario/tunetix.git
cd tunetix
```

### 3. Construir y levantar los contenedores

```bash
docker-compose up -d --build
```

Esto iniciará:

- PHP + Apache (sirve frontend y backend)
- MySQL
- phpMyAdmin

### 4. Acceder al proyecto

- Frontend: [http://localhost](http://localhost)
- Backend API: [http://localhost/tunetix/backend/api/](http://localhost/tunetix/backend/api/)
- phpMyAdmin (opcional): [http://localhost:8080](http://localhost:8080)

### 5. Scripts útiles

```bash
docker-compose down                                 # Detener contenedores
docker-compose logs -f                              # Ver logs
docker exec -it tunetix-db-1 mysql -u tt_user -p    # Acceder a MySQL
```

---

## 💻 Instalación y configuración (sin Docker)

### 1. Clonar el repositorio

```bash
git clone https://github.com/tu_usuario/tunetix.git
cd tunetix
```

### 2. Configurar la base de datos

```sql
CREATE DATABASE tunetix_db;
CREATE USER 'tt_user'@'localhost' IDENTIFIED BY 'admin';
GRANT ALL PRIVILEGES ON tunetix_db.* TO 'tt_user'@'localhost';
FLUSH PRIVILEGES;
```

### 3. Configurar el backend

```bash
cd backend
cp .env.example .env
composer install
```

Edita `.env`:

```env
DB_HOST=mariadb
DB_PORT=3306
DB_DATABASE=tunetix_db
DB_USERNAME=tt_user
DB_PASSWORD=admin

JWT_SECRET=clave_supersecreta

LASTFM_API_KEY=tu_api_key
TICKETMASTER_API_KEY=tu_api_key
GOOGLE_CLIENT_ID=tu_client_id
GOOGLE_CLIENT_SECRET=tu_secret
```

### 4. Configurar el frontend

```bash
cd frontend
npm install
```

Edita `src/environments/environment.ts`:

```ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost/tunetix/backend/api',
};
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

| Tecnología                            | Uso                        |
|---------------------------------------|----------------------------|
| [PHP](https://www.php.net/)           | Backend                    |
| [Laravel](https://laravel.com/)       | Framework PHP              |
| [Angular](https://angular.io/)        | Frontend SPA               |
| [MySQL](https://www.mysql.com/)       | Base de datos              |
| [Composer](https://getcomposer.org/)  | Dependencias PHP           |
| [Node.js](https://nodejs.org/)        | Herramientas frontend      |
| [Docker](https://www.docker.com/)     | Contenedores               |
| [Last.fm API](https://www.last.fm/api)| Información de artistas    |
| [Ticketmaster API](https://developer.ticketmaster.com/) | Información de eventos |

