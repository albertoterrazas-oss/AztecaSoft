<?php

namespace App\Http\Controllers\Procesos;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\DB;
class EmpaqueController extends Controller
{

    public function armarCajas(Request $request)
    {
        // 1. Validar la entrada
        $request->validate([
            'idAlmacenDestino' => 'required|integer',
            'cajas' => 'required|array',
        ]);

        // Usamos una transacción de base de datos para asegurar que si algo falla, 
        // no queden datos inconsistentes.
        DB::beginTransaction();

        try {
            $idAlmacenDestino = $request->idAlmacenDestino;
            $idUsuario = $request->user; // Asegúrate que 'user' sea el ID correcto
            $cajasJSON = json_encode($request->cajas);

            // 2. Ejecutar el Stored Procedure
            // Usamos DB::select o DB::statement. Para SQL Server, a veces es necesario 
            // SET NOCOUNT ON para que el error fluya correctamente a PHP.
            DB::statement("SET NOCOUNT ON; EXEC sp_ArmarCajas ?, ?, ?", [
                $idAlmacenDestino,
                $idUsuario,
                $cajasJSON
            ]);

            // Si todo sale bien, confirmamos los cambios
            DB::commit();

            return response()->json([
                'status' => 'success',
                'message' => 'Cajas armadas y procesadas correctamente.'
            ], 200);
        } catch (\Exception $e) {
            // Si hay CUALQUIER error, revertimos la transacción
            DB::rollBack();

            Log::error("Error al armar cajas: " . $e->getMessage());

            // Devolvemos el mensaje exacto de la excepción para depuración
            return response()->json([
                'status' => 'error',
                'message' => 'Hubo un problema en la transacción.',
                'error_detalle' => $e->getMessage(), // Aquí verás el error del SP
            ], 500);
        }
    }
}
