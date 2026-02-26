<?php

namespace App\Http\Controllers\Catalogs;

use App\Http\Controllers\Controller;
use App\Models\Catalogos\Basculas;
use Illuminate\Http\Request;
use Exception;

class BasculasController extends Controller
{
    /**
     * Muestra la lista de básculas.
     */
    public function index()
    {
        $basculas = Basculas::all();
        return response()->json($basculas);
    }

    /**
     * Almacena una nueva báscula.
     */
    public function store(Request $request)
    {
        $request->validate([
            'Nombre' => 'required|string|max:255',
            'puerto' => 'required|string|max:50',
        ]);

        try {
            $bascula = Basculas::create($request->all());
            return response()->json([
                'message' => 'Báscula creada con éxito',
                'data' => $bascula
            ], 201);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Muestra una báscula específica.
     */
    public function show(string $id)
    {
        $bascula = Basculas::find($id);

        if (!$bascula) {
            return response()->json(['message' => 'Báscula no encontrada'], 404);
        }

        return response()->json($bascula);
    }

    /**
     * Actualiza una báscula en la base de datos.
     */
    public function update(Request $request, string $id)
    {
        $bascula = Basculas::find($id);

        if (!$bascula) {
            return response()->json(['message' => 'Báscula no encontrada'], 404);
        }

        $request->validate([
            'Nombre' => 'sometimes|required|string|max:255',
            'puerto' => 'sometimes|required|string|max:50',
        ]);

        try {
            $bascula->update($request->all());
            return response()->json([
                'message' => 'Báscula actualizada con éxito',
                'data' => $bascula
            ]);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Elimina una báscula.
     */
    public function destroy(string $id)
    {
        $bascula = Basculas::find($id);

        if (!$bascula) {
            return response()->json(['message' => 'Báscula no encontrada'], 404);
        }

        try {
            $bascula->delete();
            return response()->json(['message' => 'Báscula eliminada correctamente']);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }
}