#!/bin/sh
php artisan storage:link || true
php artisan config:cache
php artisan serve --host=0.0.0.0 --port=8000
