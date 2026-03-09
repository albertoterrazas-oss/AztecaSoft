<?php

use App\Http\Controllers\ProfileController;
use Illuminate\Foundation\Application;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

/*
|--------------------------------------------------------------------------
| Web Routes
|--------------------------------------------------------------------------
|
| Here is where you can register web routes for your application. These
| routes are loaded by the RouteServiceProvider within a group which
| contains the "web" middleware group. Now create something great!
|
*/

// Route::get('/', function () {
//     return Inertia::render('Auth/Login', [
//         'canLogin' => Route::has('login'),
//         'canRegister' => Route::has('register'),
//         'laravelVersion' => Application::VERSION,
//         'phpVersion' => PHP_VERSION,
//     ]);
// });

// Route::middleware(['auth', 'verified'])->group(function () {
//     Route::get('/dashboard', function () {
//         return Inertia::render('Home');
//     })->name('dashboard');

//     Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
//     Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
//     Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
// });

// Route::get('/', function () {
//     return auth()->check()
//         ? redirect()->route('dashboard')
//         : redirect()->route('login');
// });

Route::get('/', function () {
    return auth()->check()
        ? redirect('/dashboard')
        : Inertia::render('Auth/Login'); // O tu ruta de login
});

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('/dashboard', function () {
        return Inertia::render('Home');
    })->name('dashboard');

    // ... tus otras rutas
});


// Route::get('/AuthorizationCode', function () {
//     return Inertia::render('AuthorizationCode');
// })->name('AuthorizationCode');

// Route::middleware(['auth'])->group(function () {
//     // 1. Home / Dashboard
//     Route::get('/', function () {
//         return Inertia::render('Home');
//     });
//     Route::get('/dashboard', function () {
//         return Inertia::render('Home');
//     });
// });

// Route::middleware('auth')->group(function () {
//     Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
//     Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
//     Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
// });

// Route::get('/{path}', function () {
//     return Inertia::render('Home');
// })->middleware(['auth'])
//     ->where('path', '^(?!api).*')
//     ->name('dashboard');

Route::get('/AuthorizationCode', function () {
    return Inertia::render('AuthorizationCode');
});


Route::get('/AuthorizationQuiencQuien', function () {
    return Inertia::render('AuthorizationQuiencQuien');
});




Route::middleware(['auth', 'permission'])->get('/{path?}', function () {
    return Inertia::render('Home');
})->where('path', '^(?!api|login|register).*$');

require __DIR__ . '/auth.php';
