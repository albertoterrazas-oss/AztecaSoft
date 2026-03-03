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
    // app/Http/Controllers/PesajeController.php

    public function guardarSalida(Request $request)
    {
        // 1. Validamos datos
        $request->validate([
            'id_lote'   => 'required',
            'cantidad'     => 'required|numeric|min:0.01',
            'id_producto'  => 'required',
            'piezas'       => 'nullable|integer',
            'id_area_entrada'   => 'required',
            'id_area_salida'   => 'required'

        ]);

        try {
            return DB::transaction(function () use ($request) {

                DB::statement('EXEC sp_RegistrarEntrada ?, ?, ?, ?, ?, ?', [
                    $request->id_lote,          // @IdLote
                    $request->id_producto,            // @IdProducto
                    $request->cantidad,               // @PesoReal (netWeight del front)
                    $request->piezas ?? 0,            // @Piezas
                    $request->idusuario ?? 0,            // @Piezas
                    $request->id_area_entrada              // @IdAlmacenRecepcion
                ]);

                DB::statement('EXEC sp_RegistrarTraspaso ?, ?, ?, ?, ?, ?, ?', [
                    $request->id_lote,            // @IdLote
                    $request->id_producto,        // @IdProducto
                    $request->id_area_entrada,  // @IdAlmacenOrigen (Faltaba en tu lista)
                    $request->id_area_salida,         // @IdAlmacenDestino (El destino)
                    $request->cantidad,           // @Peso
                    $request->piezas ?? 0,        // @Piezas
                    $request->idusuario ?? 0      // @IdUsuario
                ]);


                return response()->json([
                    'message'        => 'Entrada registrada exitosamente',
                    // 'lote_cerrado'   => $pendientes === 0,
                    // 'kilos_actuales' => $detalle->kilos
                ], 201);
            });
        } catch (\Exception $e) {
            return response()->json([
                'error'   => 'Error en base de datos',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}
