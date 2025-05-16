# 🎵 Tunetix - Plataforma de Música y Eventos

![Tunetix Logo](frontend/src/assets/imgs/logo.webp)

Tunetix es una plataforma que integra información de música y eventos, permitiendo a los usuarios descubrir artistas, buscar conciertos y comprar entradas.

[![PHP Version](https://img.shields.io/badge/PHP-8.2+-4F5B93.svg)](https://www.php.net/)
[![Angular Version](https://img.shields.io/badge/Angular-16.x-DD0031.svg)](https://angular.io/)
[![MySQL](https://img.shields.io/badge/MySQL-10.4+-00758F.svg)](https://www.mysql.com/)

## 📋 Requisitos previos

- **Backend:**
  - PHP 8.2 o superior
  - MySQL/MariaDB 10.4 o superior
  - XAMPP, WAMP, LAMP o similar
  - Composer
  - Extensiones PHP: bcmath, curl, date, dom, fileinfo, json, libxml, mbstring, mysqli, mysqlnd, openssl, PDO, pdo_mysql, session, SimpleXML, tokenizer, xml, zip
- **Frontend:**
  - Node.js 16.x o superior
  - Angular 16.x o superior
  - npm o pnpm (recomendado)

## 🗂️ Estructura del proyecto

El proyecto está dividido en dos partes principales:

### Backend (PHP)

```
backend/
├── api/               # Endpoints API para artistas, eventos y canciones
│   ├── artists/       # Endpoints para gestión de artistas
│   ├── ticketmaster/  # Integración con Ticketmaster API
│   └── tracks/        # Endpoints para canciones y álbumes
├── auth/              # Autenticación y autorización
├── cache/             # Sistema de caché para optimizar respuestas
├── Controllers/       # Controladores MVC
│   ├── Messages/      # Gestión de mensajes de contacto
│   ├── MetodoPago/    # Gestión de métodos de pago
│   ├── Ticket/        # Gestión de tickets
│   └── Usuario/       # Gestión de usuarios
├── db/                # Scripts de base de datos
├── uploads/           # Almacenamiento de archivos subidos
├── utils/             # Utilidades y helpers
└── vendor/            # Dependencias (Composer)
```

### Frontend (Angular)

```
frontend/
├── src/
│   ├── app/
│   │   ├── components/      # Componentes de la aplicación
│   │   ├── interfaces/      # Modelos de datos
│   │   ├── services/        # Servicios para comunicación con API
│   │   ├── guards/          # Guards para proteger rutas
│   │   └── interceptors/    # Interceptores HTTP
│   ├── assets/              # Imágenes y recursos estáticos
│   └── environments/        # Configuración de entornos
├── angular.json             # Configuración del proyecto Angular
└── package.json             # Dependencias npm
```

## 💻 Instalación y configuración

### 1. Clonar el repositorio

```powershell
git clone [URL_DEL_REPOSITORIO]
cd tunetix
```

### 2. Configurar la base de datos

1. Inicia MySQL desde tu panel de control XAMPP
2. Crea una base de datos llamada `tunetix_db`
3. Crea un usuario con permisos sobre esta base de datos:
   ```sql
   CREATE USER 'tt_user'@'localhost' IDENTIFIED BY 'admin';
   GRANT ALL PRIVILEGES ON tunetix_db.* TO 'tt_user'@'localhost';
   FLUSH PRIVILEGES;
   ```
4. Importa la estructura de la base de datos:

   ```bash
   mysql -u tt_user -p tunetix_db < backend/db/tunetix_db.sql
   ```

   También puedes importar el archivo `backend/db/tunetix_db.sql` usando phpMyAdmin.

### 3. Configurar el backend

1. Navega al directorio del backend:

   ```powershell
   cd backend
   ```

2. Instala las dependencias de PHP con Composer:

   ```powershell
   # Si tienes Composer instalado globalmente
   composer install

   # O si usas el archivo composer.phar incluido
   php composer.phar install
   ```

3. Copia el archivo de ejemplo de variables de entorno:

   ```powershell
   Copy-Item .env.example .env
   ```

4. Edita el archivo `.env` con tus propias credenciales:

   - **JWT Secret**: Genera una clave secreta para JWT (puedes usar [este generador](https://passwordsgenerator.net/))
   - **Base de datos**: Configura las credenciales (ya configuradas si seguiste los pasos anteriores)
   - **API keys**: Agrega las claves para LastFM, Ticketmaster y Google OAuth (ver sección "Obtener API keys")

### 4. Configurar el frontend

1. Navega al directorio del frontend:

   ```powershell
   cd ../frontend
   ```

2. Instala las dependencias de Angular:

   ```powershell
   # Usando npm
   npm install

   # O usando pnpm (recomendado para este proyecto)
   pnpm install
   ```

3. Verifica la configuración del entorno:

   Abre el archivo `src/environments/environment.ts` y asegúrate de que la URL de la API apunte correctamente a tu backend local.

### 5. Obtener API keys

#### 🎵 LastFM API

1. Ve a [Last.fm API](https://www.last.fm/api/account/create)
2. Crea una cuenta y solicita una API key
3. Copia la API key en tu archivo `.env` como `LASTFM_API_KEY`
4. No requiere secreto, solo necesitas la clave pública

#### 🎫 Ticketmaster API

1. Ve a [Ticketmaster Developer Portal](https://developer.ticketmaster.com/)
2. Crea una cuenta y solicita una API key
3. Copia la API key en tu archivo `.env` como `TICKETMASTER_API_KEY`
4. Nota: Para entornos de producción, configura los dominios permitidos en el portal de desarrolladores

#### 🔐 Google OAuth

1. Ve a [Google Cloud Console](https://console.cloud.google.com/)
2. Crea un proyecto nuevo
3. En la sección "APIs y servicios":
   - Ve a "Credenciales"
   - Crea credenciales de tipo "ID de cliente de OAuth"
   - Selecciona "Aplicación web" como tipo
4. Agrega `http://localhost:4200/inicio` como URI de redirección autorizada
5. Copia el ID de cliente como `GOOGLE_CLIENT_ID` y el secreto como `GOOGLE_CLIENT_SECRET` en tu archivo `.env`

## 🚀 Ejecución del proyecto

### Backend

1. Inicia XAMPP (o tu servidor web local):

   - Inicia los servicios Apache y MySQL
   - Verifica que MySQL esté ejecutándose en el puerto 3306

2. El backend debe estar accesible en:

   ```
   http://localhost/tunetix/backend/
   ```

3. Prueba que la API esté funcionando:
   - Visita `http://localhost/tunetix/backend/api/ticketmaster/concerts/getAll.php` en tu navegador
   - Deberías ver una respuesta JSON con los conciertos disponibles

### Frontend

1. Navega al directorio del frontend:
   ```powershell
   cd frontend
   ```
2. Inicia el servidor de desarrollo:
   ```powershell
   ng serve --open
   ```
3. La aplicación se abrirá automáticamente en tu navegador predeterminado:

   ```
   http://localhost:4200
   ```

4. Para producción:
   ```powershell
   ng build --configuration production
   ```
   Los archivos se generarán en `frontend/dist/`

## ✨ Funcionalidades principales

### 🔒 Gestión de usuarios

- Registro e inicio de sesión local
- Autenticación con Google OAuth
- Panel de perfil con imagen personalizable
- Sistema de roles (usuario / administrador)

### 🎵 Exploración musical

- Búsqueda y visualización de artistas
- Descubrimiento de canciones populares
- Biografías y discografías detalladas
- Integración con LastFM para metadatos musicales

### 🎫 Eventos y entradas

- Búsqueda de conciertos por ubicación y artista
- Calendario de eventos próximos
- Compra de entradas segura
- Sistema de precios dinámicos
- QR de verificación de tickets

### 💳 Pagos y facturación

- Gestión de métodos de pago
- Soporte para tarjetas (VISA/Mastercard)
- Historial de compras
- Facturación electrónica

### 📞 Soporte

- Sistema de contacto con seguimiento de tickets
- Centro de ayuda y FAQ
- Chat de soporte (próximamente)

## 🛠️ Resolución de problemas comunes

### Error de conexión a la base de datos

- Verifica que el servidor MySQL esté ejecutándose (`localhost:3306`)
- Confirma que las credenciales en el archivo `.env` sean correctas
- Asegúrate de que el usuario tenga los permisos adecuados

### Error al obtener datos de las APIs externas

- Verifica que las API keys en el archivo `.env` sean válidas
- Comprueba la conectividad a Internet y los firewalls
- Revisa los límites de uso de tu cuenta de API en sus respectivos portales
- Verifica que los endpoints no estén en la lista de bloqueo de CORS

### Problemas con CORS

- Asegúrate de que los encabezados CORS estén correctamente configurados en el backend (`auth/global_headers.php`)
- Verifica que estás accediendo a la aplicación desde los dominios permitidos
- Intenta usar extensiones como "CORS Unblock" solo para desarrollo local

## 🔄 Sistema de caché

Tunetix implementa un sistema de caché avanzado para mejorar el rendimiento:

- **Artistas**: Metadatos y búsquedas populares (`cache/artists/`)
- **Imágenes**: Optimización y almacenamiento local (`cache/assets/`)
- **Conciertos**: Búsquedas recientes y ubicaciones populares (`cache/concerts/`)
- **Canciones**: Letras y metadatos (`cache/tracks/`)

El sistema de caché se limpia automáticamente cada 24 horas o manualmente a través del endpoint `api/clear_cache.php`.

## 📊 Tecnologías principales

- **Backend**: PHP nativo con arquitectura MVC
- **Frontend**: Angular 16 con Angular Material
- **Base de datos**: MySQL/MariaDB
- **Autenticación**: JWT + Google OAuth
- **APIs**: LastFM, Ticketmaster
- **Caché**: Sistema de archivos personalizado
