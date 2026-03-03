<?php

namespace App\Http\Controllers\Catalogs;

use App\Http\Controllers\Controller;
use App\Models\Menu;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class MenuController extends Controller
{

    public function index()
    {
        $menus = Menu::with([
            'menuPadre' =>
            function ($menu) {
                $menu->with([
                    'menuPadre' =>
                    function ($menu2) {
                        $menu2->with('menuPadre');
                    }
                ]);
            }
        ])
            ->get()
            ->sortBy('menu_nombre')
            ->values();

        return response()->json($menus, 200);
    }

    public function store(Request $request)
    {

        $validator = Validator::make($request->all(), [
            'menu_nombre' => 'required|string|max:50',
            'menu_idPadre' => 'nullable|integer',
            'menu_url' => 'required',
            'menu_tooltip' => 'nullable',
            'menu_estatus' => 'required',
        ]);
        if (!$validator->fails()) {

            $menu = Menu::create($validator->attributes());

            $allMenus = Menu::select('menu_id')->get()->map(fn($m) => $m->menu_id);
            $admin = User::first();
            $admin->menus()->syncWithPivotValues($allMenus, [
                'usuarioxmenu_alta' => 1,
                'usuarioxmenu_consulta' => 1,
                'usuarioxmenu_especial' => 1,
                'usuarioxmenu_cambio' => 1,
            ]);
            $admin->save();



            return response()->json([
                'message' => 'Menu creado correctamente',
                'menu' => $menu
            ], 201);
        }
        return response()->json($validator->errors(), 400);
    }

    public function update(Request $request)
    {

        $validator = Validator::make($request->all(), [
            'menu_nombre' => 'required|string|max:50',
            'menu_idPadre' => 'nullable|integer',
            'menu_url' => 'required',
            'menu_tooltip' => 'nullable',
            'menu_estatus' => 'required',
        ]);
        if (!$validator->fails()) {

            $menu = Menu::find($request->menu);
            $menu->menu_nombre = $request->menu_nombre;
            $menu->menu_idPadre = $request->menu_idPadre;
            $menu->menu_url = $request->menu_url;
            $menu->menu_tooltip = $request->menu_tooltip;
            $menu->menu_estatus = $request->menu_estatus;
            $menu->save();

            $allMenus = Menu::select('menu_id')->get()->map(fn($m) => $m->menu_id);
            $admin = User::first();
            $admin->menus()->syncWithPivotValues($allMenus, [
                'usuarioxmenu_alta' => 1,
                'usuarioxmenu_consulta' => 1,
                'usuarioxmenu_especial' => 1,
                'usuarioxmenu_cambio' => 1,
            ]);
            $admin->save();

            return response()->json([
                'message' => 'Menu actualizado correctamente',
                'menu' => $menu
            ], 201);
        }
        return response()->json($validator->errors(), 400);
    }

    public function getTree(Request $request)
    {
        $tree = [];
        $menus = Menu::all()->sortBy('menu_nombre')->values();

        foreach ($menus as $menu) {
            if ($menu->menu_idPadre == 0) {
                $node = [
                    'key' => $menu->menu_id,
                    'label' => $menu->menu_nombre,
                    'data' => $menu->menu_tooltip,
                    'idPadre' => $menu->menu_idPadre,
                    'children' => []
                ];

                $childMenus = collect($menus)->where('menu_idPadre', $menu->menu_id)->sortBy('menu_nombre')->values();

                foreach ($childMenus as $childMenu) {
                    $childNode = [
                        'key' => $childMenu->menu_id,
                        'label' => $childMenu->menu_nombre,
                        'data' => $childMenu->menu_tooltip,
                        'idPadre' => $childMenu->menu_idPadre,
                        'children' => []
                    ];

                    $grandchildMenus = collect($menus)->where('menu_idPadre', $childMenu->menu_id)->sortBy('menu_nombre')->values();

                    foreach ($grandchildMenus as $grandchildMenu) {
                        $grandchildNode = [
                            'key' => $grandchildMenu->menu_id,
                            'label' => $grandchildMenu->menu_nombre,
                            'data' => $grandchildMenu->menu_tooltip,
                            'idPadre' => $grandchildMenu->menu_idPadre,
                            'children' => []
                        ];

                        $greatGrandchildMenus = collect($menus)->where('menu_idPadre', $grandchildMenu->menu_id)->sortBy('menu_nombre')->values();

                        foreach ($greatGrandchildMenus as $greatGrandchildMenu) {
                            $greatGrandchildNode = [
                                'key' => $greatGrandchildMenu->menu_id,
                                'label' => $greatGrandchildMenu->menu_nombre,
                                'data' => $greatGrandchildMenu->menu_tooltip,
                                'idPadre' => $greatGrandchildMenu->menu_idPadre,
                                'children' => []
                            ];

                            $grandchildNode['children'][] = $greatGrandchildNode;
                        }

                        $childNode['children'][] = $grandchildNode;
                    }

                    $node['children'][] = $childNode;
                }

                $tree[] = $node;
            }
        }

        return $tree;
    }
}
