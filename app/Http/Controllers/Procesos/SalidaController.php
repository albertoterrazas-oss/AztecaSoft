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
            'id_almacen'   => 'required'
        ]);

        try {
            return DB::transaction(function () use ($request) {
                // 2. Localizamos el detalle para obtener el ID del Lote (encabezado)
                // $detalle = Detalle::findOrFail($request->id_detalle);

                // 3. Ejecución del Procedimiento Almacenado
                // @IdLote, @IdProducto, @PesoReal, @Piezas, @IdUsuario, @IdAlmacenRecepcion
                DB::statement('EXEC sp_RegistrarEntrada ?, ?, ?, ?, ?, ?', [
                    $request->id_lote,          // @IdLote
                    $request->id_producto,            // @IdProducto
                    $request->cantidad,               // @PesoReal (netWeight del front)
                    $request->piezas ?? 0,            // @Piezas
                    $request->idusuario ?? 0,            // @Piezas
                    $request->id_almacen              // @IdAlmacenRecepcion
                ]);

                // 4. Actualización manual de apoyo (si el SP no marca el detalle como procesado)
                // $detalle->estatus = 1;
                // $detalle->kilos += $request->cantidad;
                // $detalle->save();

                // // 5. Verificación de cierre de Lote
                // $pendientes = Detalle::where('id_encabezado', $detalle->id_encabezado)
                //     ->where('estatus', '!=', 1)
                //     ->count();

                // if ($pendientes === 0) {
                //     $encabezado = Encabezado::find($detalle->id_encabezado);
                //     if ($encabezado) {
                //         $encabezado->estatus = 1; // Lote finalizado
                //         $encabezado->save();
                //     }
                // }

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
