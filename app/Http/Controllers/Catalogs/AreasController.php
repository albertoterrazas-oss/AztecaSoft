<?php

namespace App\Http\Controllers\Catalogs;

use App\Http\Controllers\Controller;
use App\Models\Catalogos\Areas;
use Illuminate\Http\Request;

class AreasController extends Controller
{
    /**
     * Muestra una lista de las áreas.
     */
    public function index()
    {
        $areas = Areas::all();
        return response()->json($areas);
    }

    /**
     * Almacena una nueva área en la base de datos.
     */
    public function store(Request $request)
    {
        $request->validate([
            'areas_nombre'  => 'required|string|max:255',
            'areas_estatus' => 'required|boolean',
        ]);

        $area = Areas::create($request->all());

        return response()->json([
            'message' => 'Área creada con éxito',
            'data'    => $area
        ], 201);
    }

    /**
     * Muestra un área específica.
     */
    public function show($id)
    {
        $area = Areas::find($id);

        if (!$area) {
            return response()->json(['message' => 'Área no encontrada'], 404);
        }

        return response()->json($area);
    }

    /**
     * Actualiza un área específica.
     */
    public function update(Request $request, $id)
    {
        $area = Areas::find($id);

        if (!$area) {
            return response()->json(['message' => 'Área no encontrada'], 404);
        }

        $request->validate([
            'areas_nombre'  => 'sometimes|required|string|max:255',
            'areas_estatus' => 'sometimes|required|boolean',
        ]);

        $area->update($request->all());

        return response()->json([
            'message' => 'Área actualizada con éxito',
            'data'    => $area
        ]);
    }

    /**
     * Elimina un área (Borrado físico).
     */
    public function destroy($id)
    {
        $area = Areas::find($id);

        if (!$area) {
            return response()->json(['message' => 'Área no encontrada'], 404);
        }

        $area->delete();

        return response()->json(['message' => 'Área eliminada correctamente']);
    }
}