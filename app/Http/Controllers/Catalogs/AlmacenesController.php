<?php

namespace App\Http\Controllers\Catalogs;

use App\Http\Controllers\Controller;
use App\Models\Catalogos\Almacenes;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class AlmacenesController extends Controller
{
    /**
     * Muestra una lista de almacenes.
     */
    // public function index(Request $request)
    // {
    //     $query = Almacenes::query();

    //     // Filtro de búsqueda por nombre si se requiere
    //     if ($request->has('search')) {
    //         $query->where('Nombre', 'LIKE', '%' . $request->search . '%');
    //     }

    //     // Si prefieres sin paginación para catálogos cortos, usa ->get()
    //     // Pero para consistencia con tus componentes React, usamos paginate
    //     return response()->json($query->paginate(20), 200);
    // }

    public function index()
    {
        $asuntos = Almacenes::all();
        return response()->json($asuntos);
    }
    /**
     * Almacena un nuevo almacén.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'Nombre' => 'required|string|max:255',
            'Tipo'   => 'nullable|string|max:50', // Ajusta el max según tu DB
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $almacen = Almacenes::create($request->all());

        return response()->json(
            $almacen,
            201
        );
    }

    /**
     * Muestra un almacén específico.
     */
    public function show($id)
    {
        $almacen = Almacenes::find($id);

        if (!$almacen) {
            return response()->json(['message' => 'Almacén no encontrado'], 404);
        }

        return response()->json($almacen, 200);
    }

    /**
     * Actualiza un almacén existente.
     */
    public function update(Request $request, $id)
    {
        $almacen = Almacenes::find($id);

        if (!$almacen) {
            return response()->json(['message' => 'Almacén no encontrado'], 404);
        }

        $validator = Validator::make($request->all(), [
            'Nombre' => 'sometimes|required|string|max:255',
            'Tipo'   => 'nullable|string|max:50',
        ]);

        if ($validator->fails()) {
            return response()->json($validator->errors(), 400);
        }

        $almacen->update($request->all());

        return response()->json([
            'message' => 'Almacén actualizado correctamente',
            'data' => $almacen
        ], 200);
    }

    /**
     * Elimina un almacén.
     */
    public function destroy($id)
    {
        $almacen = Almacenes::find($id);

        if (!$almacen) {
            return response()->json(['message' => 'Almacén no encontrado'], 404);
        }

        $almacen->delete();

        return response()->json(['message' => 'Almacén eliminado'], 200);
    }
}
