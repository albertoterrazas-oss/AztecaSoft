<?php

namespace App\Http\Controllers\Procesos;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Procesos\Detalle;
use App\Models\Procesos\Bitacora;
use App\Models\Procesos\Encabezado; // Importamos el modelo
use Illuminate\Support\Facades\DB;

class SalidaController extends Controller
{
    public function guardarSalida(Request $request)
    {
        // 1. Validamos datos
        $request->validate([
            'id_detalle'  => 'required',
            'cantidad'    => 'required|numeric|min:0.01',
            'id_area'     => 'required',
            'id_producto' => 'required'
        ]);

        try {
            return DB::transaction(function () use ($request) {

                // 2. Actualizamos el Detalle
                $detalle = Detalle::findOrFail($request->id_detalle);
                $detalle->estatus = 1; // Marcamos como procesado/pesado
                $detalle->kilos += $request->cantidad;
                $detalle->save();

                // 3. Creamos el registro en la Bitácora
                $bitacora = Bitacora::create([
                    'fechallegada'    => now(),
                    'fechasalida'     => now(),
                    'id_detalle'      => $request->id_detalle,
                    'id_subproducto'  => $request->id_producto,
                    'area'            => 'SALIDA', 
                    'almacen'         => 1,
                    'personaautorizo' => 0,
                    'estatus'         => 1,
                ]);

                // --- LÓGICA DE CIERRE DE ENCABEZADO ---
                
                // Buscamos si quedan detalles pendientes (estatus != 1) para este encabezado
                $pendientes = Detalle::where('id_encabezado', $detalle->id_encabezado)
                                     ->where('estatus', '!=', 1)
                                     ->count();

                // Si ya no hay pendientes, cerramos el encabezado
                if ($pendientes === 0) {
                    $encabezado = Encabezado::find($detalle->id_encabezado);
                    if ($encabezado) {
                        $encabezado->estatus = 1; // O el número que uses para "Cerrado/Finalizado"
                        $encabezado->save();
                    }
                }

                return response()->json([
                    'message' => 'Salida registrada correctamente',
                    'id'      => $bitacora->id_bitacora,
                    'kilos_actuales' => $detalle->kilos,
                    'lote_cerrado'   => $pendientes === 0 // Le avisamos al front si se cerró el lote
                ], 201);
            });
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error al registrar la salida',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}