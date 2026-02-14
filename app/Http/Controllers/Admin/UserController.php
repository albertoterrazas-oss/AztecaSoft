<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Admin\Menu;
use App\Models\RH\Persona;
use App\Models\Roles;
use App\Models\User;
use App\Models\UserxMenu;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Validator;

class UserController extends Controller
{
    public function index()
    {
        $users = User::with('persona', 'rol')->get()->map(function ($user) {
            // Creamos un campo nuevo combinando los datos de la relación persona
            $user->nombre_completo = "{$user->persona->Nombres} {$user->persona->ApePat} {$user->persona->ApeMat}";
            return $user;
        });

        return response()->json($users);
    }

    public function store(Request $request)
    {
        DB::beginTransaction();

        try {
            // 1. Definimos reglas base
            $rules = [
                'Username'  => 'required|string|max:255',
                'IdPersona' => 'required',
                'IdRol'     => 'required',
                'Password'  => 'required|string|min:8', // <--- Obligatoria por defecto si la DB no acepta nulls
            ];

            $validator = Validator::make($request->all(), $rules);

            if ($validator->fails()) {
                return response()->json($validator->errors(), 400);
            }

            // 2. Mapeo de datos
            $data = [
                'Username'  => $request->Username,
                'IdPersona' => $request->IdPersona,
                'IdRol'     => $request->IdRol,
                'Password'  => Hash::make($request->Password), // <--- Siempre incluimos el Hash
            ];

            $user = User::create($data);

            // ... resto del código de Menus ...

            DB::commit();
            return response()->json($user, 201);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al crear el usuario', 'message' => $e->getMessage()], 500);
        }
    }


    public function show($id)
    {
        $user = User::find($id);

        if (!$user) {
            // Retorna 404 Not Found
            return response()->json(['message' => 'Usuario no encontrado'], 404);
        }

        return response()->json($user);
    }

    public function update(Request $request, $id)
    {
        $user = User::find($id);

        if (!$user) {
            return response()->json(['message' => 'Usuario no encontrado'], 404);
        }

        // 1. Reglas usando los nombres del modelo ($fillable)
        $rules = [
            'Username'  => 'required|string',
            'IdPersona' => 'required',
            'IdRol'     => 'required',
        ];

        // Password solo si se envía y no está vacío
        if ($request->filled('Password')) {
            $rules['Password'] = 'string|min:8';
        }

        $validator = Validator::make($request->all(), $rules);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        DB::beginTransaction();

        try {
            // 2. Actualizar datos básicos
            // Nota: Como tu modelo tiene 'Password' => 'hashed', Laravel lo hasheará solo si lo asignas
            $user->Username = $request->Username;
            $user->IdPersona = $request->IdPersona;
            $user->IdRol = $request->IdRol;

            // 3. Manejar cambio de Rol y Menús (Descomenta la relación en el modelo primero)
            if ($user->isDirty('IdRol')) {
                $nuevoRol = Roles::with('menus')->find($request->IdRol);
                if ($nuevoRol) {
                    $menus = [];
                    foreach ($nuevoRol->menus as $menu) {
                        $menus[$menu->menu_id] = [
                            'usuarioxmenu_alta'     => 1,
                            'usuarioxmenu_cambio'   => 1,
                            'usuarioxmenu_consulta' => 1,
                            'usuarioxmenu_especial' => 0,
                        ];
                    }
                    // Asegúrate de activar la función menus() en el modelo
                    if (method_exists($user, 'menus')) {
                        $user->menus()->sync($menus);
                    }
                }
            }

            // 4. Asignar nueva contraseña si viene en el request
            if ($request->filled('Password')) {
                $user->Password = $request->Password;
                // ^ No necesitas Hash::make si el modelo tiene el cast 'hashed'
            }

            $user->save();

            DB::commit();

            return response()->json([
                'message' => 'Usuario actualizado exitosamente',
                'user'    => $user
            ], 200);
        } catch (\Throwable $e) {
            DB::rollBack();
            return response()->json([
                'error'   => 'Error al actualizar el usuario',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    public function menus(Request $request, $id) // Lo inyectas directamente aquí    
    {

        //    'idUser' => $user->IdUsuario,
        //         'idRol' => $user->IdRol
        $user = User::where('IdUsuario', $id)
            ->with('menus') // <--- Aquí estaba el error: se necesita usar ()
            ->first();

        if (!$user) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        // Obtener y filtrar menús
        $menusData = $user->menus()
            ->orderBy('menu_nombre')
            ->get()
            ->map(fn($menu) => $menu->toArray());

        $menus = [];
        $menusMap = [];
        $processedMenus = []; // Array para controlar menús procesados y evitar duplicados

        // Crear un mapa de menús
        foreach ($menusData as $menu) {
            $menu['childs'] = []; // Ahora sí podemos modificarlo porque es un array
            $menusMap[$menu['menu_id']] = $menu;
        }

        // Construir jerarquía de menús
        foreach ($menusData as $menu) {
            // Verificar si el menú ya ha sido procesado para evitar duplicados
            if (in_array($menu['menu_id'], $processedMenus)) {
                continue; // Si ya fue procesado, lo saltamos
            }

            if ($menu['menu_idPadre'] == 0) {
                $menus[] = &$menusMap[$menu['menu_id']];
            } else {
                $menusMap[$menu['menu_idPadre']]['childs'][] = &$menusMap[$menu['menu_id']];
            }

            // Marcar el menú como procesado
            $processedMenus[] = $menu['menu_id'];
        }

        return response()->json($menus, 200);
    }


    public function Perfil(Request $request, $id)
    {
        // 1. Buscamos al usuario con sus menús
        $user = User::where('IdUsuario', $id)
            ->with('menus')
            ->first();

        if (!$user) {
            return response()->json(['error' => 'Usuario no encontrado'], 404);
        }

        // 2. Buscamos a la persona relacionada cargando la relación 'foto'
        // Asumiendo que la relación se llama 'foto' en tu modelo Persona
        $persona = Persona::with('foto')->find($user->IdPersona);

        if ($persona) {
            // 3. Aplicamos la lógica de Base64 directamente al objeto (sin transform)
            if ($persona->foto && $persona->foto->archivo) {
                $binario = $persona->foto->archivo;

                // Verificamos si es un recurso (Resource) de SQL Server o string
                $data = is_resource($binario) ? stream_get_contents($binario) : $binario;

                $persona->PathFotoEmpleado = 'data:image/jpeg;base64,' . base64_encode($data);
            } else {
                $persona->PathFotoEmpleado = null;
            }

            // Limpiamos la relación para no enviar el binario pesado dos veces
            unset($persona->foto);
        }

        $menusData = $user->menus()
            ->orderBy('menu_nombre')
            ->get()
            ->map(fn($menu) => $menu->toArray());

        $menus = [];
        $menusMap = [];
        $processedMenus = []; // Array para controlar menús procesados y evitar duplicados

        // Crear un mapa de menús
        foreach ($menusData as $menu) {
            $menu['childs'] = []; // Ahora sí podemos modificarlo porque es un array
            $menusMap[$menu['menu_id']] = $menu;
        }

        // Construir jerarquía de menús
        foreach ($menusData as $menu) {
            // Verificar si el menú ya ha sido procesado para evitar duplicados
            if (in_array($menu['menu_id'], $processedMenus)) {
                continue; // Si ya fue procesado, lo saltamos
            }

            if ($menu['menu_idPadre'] == 0) {
                $menus[] = &$menusMap[$menu['menu_id']];
            } else {
                $menusMap[$menu['menu_idPadre']]['childs'][] = &$menusMap[$menu['menu_id']];
            }

            // Marcar el menú como procesado
            $processedMenus[] = $menu['menu_id'];
        }

        // 4. Retornamos toda la información necesaria
        return response()->json([
            'user'    => $user,
            'persona' => $persona,
            'menus'   => $menus // Si necesitas los menús por separado
        ], 200);
    }
}
