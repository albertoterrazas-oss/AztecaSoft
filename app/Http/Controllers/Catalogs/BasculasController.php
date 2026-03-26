<?php

namespace App\Http\Controllers\Catalogs;

use App\Http\Controllers\Controller;
use App\Models\Catalogos\Basculas;
use Illuminate\Http\Request;
use Exception;
use Http;
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


    public function obtenerPorPuerto(Request $request)
    {
        try {
            // Laravel le "pega" a la IP del servicio de la báscula (puerto 5000)
            // Usamos un timeout por si la báscula está desconectada
                    // dd(123);
            $url = "http://192.168.139.89:5000/pesaje/puerto/{$request->puerto}";

            $response = Http::timeout(3)->get($url);

            if ($response->successful()) {
                // Si la báscula respondió bien, retornamos su JSON
                return response()->json([
                    'status' => 'success',
                    'data' => $response->json()
                ]);
            }

            return response()->json([
                'status' => 'error',
                'message' => 'La báscula no respondió correctamente'
            ], 502);
        } catch (\Exception $e) {
            Log::error("Error de conexión al puerto $puerto: " . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'No se pudo establecer conexión con el servicio de pesaje local.'
            ], 500);
        }
    }
}
