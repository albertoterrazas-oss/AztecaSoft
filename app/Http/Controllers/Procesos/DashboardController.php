<?php

namespace App\Http\Controllers\Procesos;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use DB;
class DashboardController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        //
    }


    public function getKilosDashboard(Request $request)
    {
        try {
            // 1. Validar o asignar la fecha de consulta
            $fecha = $request->input('fecha', now()->format('Y-m-d'));

            // 2. Ejecutar sp_DashKilosDiarios
            // Nota: Se usa DB::select para obtener los resultados como array de objetos
            $kilosDiarios = DB::select('EXEC sp_DashKilosDiarios @FechaConsulta = ?', [$fecha]);

            // 3. Ejecutar sp_DashKilosDiariosYRecientes
            $kilosRecientes = DB::select('EXEC sp_DashKilosDiariosYRecientes');

            // 4. Retornar ambos en una sola petición JSON
            return response()->json([
                'success' => true,
                'data' => [
                    'diarios' => $kilosDiarios,
                    'recientes' => $kilosRecientes
                ]
            ], 200);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener los datos: ' . $e->getMessage()
            ], 500);
        }
    }
    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        //
    }

    /**
     * Display the specified resource.
     */
    public function show(string $id)
    {
        //
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, string $id)
    {
        //
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy(string $id)
    {
        //
    }
}
