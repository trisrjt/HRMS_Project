#!/bin/sh
echo "Deploying application..."

# Run migrations
echo "Running migrations..."
php artisan migrate --force

# Run seeders
# We use || true to prevent deployment failure if seeders fail (e.g. duplicate data)
echo "Running seeders..."
php artisan db:seed --force || true

# Start Supervisor
echo "Starting supervisord..."
exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf
