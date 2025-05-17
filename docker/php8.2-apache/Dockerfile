FROM php:8.2-apache

# Habilitar módulos de Apache
RUN a2enmod rewrite headers

# Instalar mysqli y otras utilidades necesarias
RUN docker-php-ext-install mysqli

# Agregar permisos y configuración para el backend
RUN printf "<Directory /var/www/html/tunetix/backend>\n\
    Options Indexes FollowSymLinks\n\
    AllowOverride All\n\
    Require all granted\n\
</Directory>\n" >> /etc/apache2/apache2.conf
