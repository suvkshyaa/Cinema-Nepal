# Backend Setup (run these on your own machine)

These are the *application* files for Nepali Cinema Hub. Laravel's framework
itself isn't included here (Composer's registry isn't reachable from the
sandbox that generated this) — so set it up like this:

1. Create a fresh Laravel project next to this folder's contents:
   composer create-project laravel/laravel cinema-hub-backend

2. Copy these files into the new project, overwriting where they already exist:
   - app/Models/Movie.php, Review.php, PollVote.php
   - app/Http/Controllers/MovieController.php, ReviewController.php, PollController.php
   - database/migrations/*.php  (the 3 new migration files)
   - database/seeders/MovieSeeder.php
   - routes/api.php

3. Register the seeder in database/seeders/DatabaseSeeder.php:
   $this->call([MovieSeeder::class]);

4. Set up your .env with MySQL credentials, then run:
   php artisan migrate --seed

5. Enable CORS for the frontend (config/cors.php should already allow
   'paths' => ['api/*'] by default in modern Laravel — just confirm
   'allowed_origins' includes your frontend's URL, e.g. http://localhost:5173).

6. Start the server:
   php artisan serve
   (defaults to http://localhost:8000, matching the frontend's .env.example)
