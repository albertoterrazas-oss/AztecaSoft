<?php

namespace App\Http\Middleware;

use Closure;
use App\Models\Menu;
use Illuminate\Http\Request;
use App\Providers\RouteServiceProvider;
use Symfony\Component\HttpFoundation\Response;

class PermissionToAccess
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();
        $user->menus;
        $route = $request->path();
        // if(in_array($request->path(), RouteServiceProvider::SKIPPED_ROUTES_PERMISSION))
        //     return $next($request);
        $menu = Menu::where('menu_url', $route)->firstOrFail();
        // if(!$user->menus->contains($menu->menu_id))
        //     return response()->view('errors.403');
        return $next($request);
    }
}
