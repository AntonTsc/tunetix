FROM php:8.2-apache

# Install dependencies
RUN apt-get update && apt-get install -y \
    git \
    unzip \
    libzip-dev \
    libicu-dev \
    libonig-dev \
    && docker-php-ext-install mysqli pdo pdo_mysql zip intl mbstring

# Enable Apache modules
RUN a2enmod rewrite

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Configure PHP
RUN mv "$PHP_INI_DIR/php.ini-production" "$PHP_INI_DIR/php.ini"

# Set working directory
WORKDIR /var/www/html

# Set appropriate permissions
RUN chown -R www-data:www-data /var/www/html

# Apache configuration
COPY docker/apache/000-default.conf /etc/apache2/sites-available/000-default.conf

# Set environment variables for PHP
ENV PHP_MEMORY_LIMIT=256M \
    MAX_EXECUTION_TIME=120 \
    UPLOAD_MAX_FILESIZE=64M \
    DB_HOST=mariadb \
    DB_NAME=tunetix_db \
    DB_USER=tt_user \
    DB_PASS=admin

# Update PHP configuration
RUN echo "memory_limit=${PHP_MEMORY_LIMIT}" > $PHP_INI_DIR/conf.d/memory-limit.ini \
    && echo "max_execution_time=${MAX_EXECUTION_TIME}" > $PHP_INI_DIR/conf.d/max-execution-time.ini \
    && echo "upload_max_filesize=${UPLOAD_MAX_FILESIZE}" > $PHP_INI_DIR/conf.d/upload-max-filesize.ini

# Copy application code
COPY frontend/dist/tunetix/ /var/www/html/
COPY backend/ /var/www/html/tunetix/backend/

# Install PHP dependencies
WORKDIR /var/www/html/tunetix/backend
RUN php composer.phar install --no-interaction --no-dev --optimize-autoloader

# No creamos el .env aquí, lo hará el script de entrada
# El script update-env.sh lo creará si no existe y actualizará
# las variables según lo definido en docker-compose.yml

# Set up entrypoint script to update .env with environment variables
COPY docker/update-env.sh /update-env.sh
RUN chmod +x /update-env.sh

# Return to main directory
WORKDIR /var/www/html

# Expose port 80
EXPOSE 80

# Start Apache with environment variables update
ENTRYPOINT ["/update-env.sh"]
CMD ["apache2-foreground"]
