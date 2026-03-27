<?php

namespace App\Http\Controllers\Procesos;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use DB;
class EmpaqueController extends Controller
{

    public function armarCajas(Request $request)
    {
        try {
            // 1. Validar la entrada
            $request->validate([
                'idAlmacenDestino' => 'required|integer',
                'cajas' => 'required|array',
            ]);

            // 2. Preparar los datos
            $idAlmacenDestino = $request->idAlmacenDestino;
            $idUsuario = $request->user;

            // Convertimos el array de cajas a una cadena JSON para el SP
            $cajasJSON = json_encode($request->cajas);

            // 3. Ejecutar el Stored Procedure
            // Usamos statement para SPs que realizan inserts/updates
            DB::statement("EXEC sp_ArmarCajas ?, ?, ?", [
                $idAlmacenDestino,
                $idUsuario,
                $cajasJSON
            ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Cajas armadas y procesadas correctamente.'
            ], 200);
        } catch (\Exception $e) {
            Log::error("Error al armar cajas: " . $e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'Hubo un problema al procesar la operación.',
                'error' => $e->getMessage()
            ], 500);
        }
    }
   
}
