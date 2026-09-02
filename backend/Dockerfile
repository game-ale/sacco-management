FROM php:8.3-cli

# Install system dependencies and PHP extensions for PostgreSQL
RUN apt-get update && apt-get install -y \
    libpq-dev \
    libzip-dev \
    unzip \
    git \
    && docker-php-ext-install pdo pdo_pgsql pgsql zip

# Install Composer
COPY --from=composer:latest /usr/bin/composer /usr/bin/composer

# Set working directory
WORKDIR /app

# Copy the backend files into the container
COPY . .

# Install Laravel dependencies
RUN composer install --optimize-autoloader --no-dev

# Set permissions for Laravel
RUN chown -R www-data:www-data /app/storage /app/bootstrap/cache

# Expose Render's default port
EXPOSE 10000

# Run migrations, create superadmin if not exists, and start the server
CMD php artisan migrate --force && \
    php artisan tinker --execute="\
        if(!\App\Models\User::where('email','superadmin@example.com')->exists()){\
            \App\Models\User::create([\
                'name'=>'Platform Superadmin',\
                'username'=>'superadmin',\
                'email'=>'superadmin@example.com',\
                'password'=>\Illuminate\Support\Facades\Hash::make('password'),\
                'role'=>'superadmin',\
                'email_verified_at'=>now(),\
            ]);\
            echo 'Superadmin created.';\
        }else{echo 'Superadmin exists.';}" && \
    php artisan serve --host=0.0.0.0 --port=10000
