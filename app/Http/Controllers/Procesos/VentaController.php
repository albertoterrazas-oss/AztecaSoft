<?php

namespace App\Http\Controllers\Procesos;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use DB;

class VentaController extends Controller
{


    public function CajasIndex(Request $request)
    {
        try {

            $resultado = DB::select('EXEC sp_ObtenerCajas');

            // Usamos empty() de PHP que es más rápido para arrays nativos.
            return response()->json($resultado ?: [], 200);
        } catch (\Exception $e) {
            // Loguear el error es buena práctica para no perder el rastro en producción
            Log::error("Error en LotesLimpieza: " . $e->getMessage());

            return response()->json([
                'error'   => 'Error al procesar la limpieza de lotes',
                'details' => config('app.debug') ? $e->getMessage() : 'Consulte al administrador'
            ], 500);
        }
    }


    public function venderCajas(Request $request)
    {
        try {
            // 1. Validar que lleguen los datos necesarios
            $request->validate([
                'IdCliente' => 'required|integer',
                'cajas'     => 'required|array', // El array de IDs que viene de React
            ]);

            // 2. Preparar los datos
            $idUsuario = $request->user;
            $idCliente = $request->IdCliente;

            // 3. Convertir el array de cajas al formato JSON que espera el SP:
            // [{"idCaja": 1}, {"idCaja": 5}]
            $cajasFormatted = collect($request->cajas)->map(function ($id) {
                return ['idCaja' => $id];
            })->toJson();

            // 4. Ejecutar el SP (Usando EXEC para SQL Server)
            // Es vital pasar los parámetros en el orden correcto o nombrados
            $resultado = DB::statement('EXEC sp_VenderCajas ?, ?, ?', [
                $idUsuario,
                $idCliente,
                $cajasFormatted
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Venta procesada correctamente'
            ], 200);
        } catch (\Exception $e) {
            Log::error("Error en sp_VenderCajas: " . $e->getMessage());

            return response()->json([
                'error'   => 'Error al procesar la venta',
                'details' => config('app.debug') ? $e->getMessage() : 'Error interno'
            ], 500);
        }
    }


}
