<?php

namespace App\Http\Controllers\Procesos;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class DespieceController extends Controller
{
    public function store(Request $request)
    {
        try {
            DB::beginTransaction();

            // 1. Normalizar el JSON (Asegurarnos de que SQL Server reciba un string)
            $datosJson = is_array($request->datos_json)
                ? json_encode($request->datos_json)
                : $request->datos_json;

            // dd($datosJson);

            // 2. Registro del Movimiento de Salida (Traspaso)
            // Usamos SET NOCOUNT ON para evitar el error "The active result contains no fields"
            // DB::statement("SET NOCOUNT ON; EXEC sp_RegistrarTraspaso ?, ?, ?, ?, ?, ?, ?", [
            //     $request->id_lote,
            //     $request->id_producto_origen,
            //     $request->id_almacen_origen,
            //     $request->id_almacen_destino,
            //     $request->peso_entrada,
            //     $request->piezas_entrada ?? 0,
            //     $request->idusuario,
            // ]);

            // 3. Procesar el despiece
            DB::statement("SET NOCOUNT ON; EXEC sp_ProcesarDespiece ?, ?, ?, ?, ?, ?, ?, ?, ?", [
                $request->id_lote,
                $request->id_producto_origen,
                $request->id_almacen_origen,
                $request->id_almacen_destino,
                $request->idusuario,
                $request->peso_entrada,
                $request->piezas_entrada ?? 0,
                $datosJson,
                $request->finDelLote ?? 0
            ]);

            DB::commit();

            return response()->json([
                'success' => true,
                'message' => 'Despiece procesado correctamente'
            ]);
        } catch (\Exception $e) {
            DB::rollBack();

            // Log para depuración interna
            Log::error("Error en Store Despiece: " . $e->getMessage());

            // Limpiar el mensaje de error para el usuario
            $errorMessage = $e->getMessage();

            if (str_contains($errorMessage, 'Inventario insuficiente')) {
                $errorMessage = 'No hay inventario suficiente en el lote o almacén seleccionado.';
            } elseif (str_contains($errorMessage, 'IMSSP')) {
                $errorMessage = 'Error de comunicación con SQL Server. Verifique SET NOCOUNT ON en los SP.';
            } else {
                $errorMessage = 'Ocurrió un error al procesar la solicitud.';
            }

            return response()->json([
                'success' => false,
                'message' => $errorMessage,
                // Solo ver el error real si estás en modo debug
                'debug' => config('app.debug') ? $e->getMessage() : null
            ], 500);
        }
    }
}
