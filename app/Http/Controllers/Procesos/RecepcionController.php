<?php

namespace App\Http\Controllers\Procesos;

use App\Http\Controllers\Controller;
use App\Models\Procesos\Bitacora;
use Illuminate\Http\Request;
use App\Models\Procesos\Encabezado;
use App\Models\Procesos\Detalle;
use Illuminate\Support\Facades\DB;

class RecepcionController extends Controller
{


    public function Lotes()
    {
        try {
            $lotes = Encabezado::with([
                'provedor',
                'detalles.producto' // <-- AQUÍ CARGAMOS EL PRODUCTO DENTRO DEL DETALLE
            ])
                ->where('estatus', "0")
                ->get();

            // if ($lotes->isEmpty()) {
            //     return response()->json(['message' => 'No se encontraron lotes activos'], 404);
            // }

            return response()->json($lotes, 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener lotes',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    public function LoteDetalles(Request $request)
    {
        try {
            // Validamos que el ID venga en la petición
            if (!$request->has('id')) {
                return response()->json(['error' => 'El ID del encabezado es requerido'], 400);
            }

            $detalles = Detalle::where('id_encabezado', $request->id)
                ->where('estatus', false)->get();

            return response()->json($detalles, 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener detalles',
                'details' => $e->getMessage()
            ], 500);
        }
    }
    public function GuardarLote(Request $request)
    {
        // 1. Validar la información (Opcional pero recomendado)
        $request->validate([
            'IdProveedor' => 'required',
            'productos' => 'required|array|min:1',
            'fecha' => 'required|date'
        ]);

        try {
            // 2. Iniciar Transacción
            return DB::transaction(function () use ($request) {

                // 3. Crear el Encabezado
                // Nota: Mapeamos los nombres que vienen de React (IdProveedor) 
                // a los del modelo (id_proveedor)
                $encabezado = Encabezado::create([
                    'id_proveedor' => $request->IdProveedor,
                    'observaciones' => $request->observaciones,
                    'fecha' => $request->fecha,
                    'folio' => $request->folio,
                    'estatus' => 0,
                    'persona_recibio' => auth()->user()->name ?? 'Sistema', // O lo que manejes
                    'total' => 0, // Puedes calcularlo sumando los detalles después
                    'id_archivo' => null,
                ]);

                // 4. Crear los Detalles
                foreach ($request->productos as $prod) {
                    $detalle =  Detalle::create([
                        'id_encabezado' => $encabezado->id_encabezado,
                        'id_producto' => $prod['IdProducto'],
                        'cantidad' => $prod['cantidad'],
                        'precio' => 0, // Ajustar si mandas precio desde el front
                        'kilos' => 0, // Ajustar si manejas kilos aparte de cantidad
                        'estatus' => 0, // Ajustar si manejas kilos aparte de cantidad
                    ]);

                    Bitacora::create([
                        'fechallegada' => now(), // Ajustar si manejas kilos aparte de cantidad
                        'fechasalida' => now(), // Ajustar si manejas kilos aparte de cantidad
                        'id_detalle' => $detalle->id_detalle, // Ajustar si manejas kilos aparte de cantidad
                        'id_subproducto' => 0, // Ajustar si manejas kilos aparte de cantidad
                        'area' => 'RECEPCION', // Ajustar si manejas kilos aparte de cantidad
                        'almacen' => NULL, // Ajustar si manejas kilos aparte de cantidad
                        'personaautorizo' => 0, // Ajustar si manejas kilos aparte de cantidad
                        'estatus' => 1, // Ajustar si manejas kilos aparte de cantidad
                    ]);
                }

                return response()->json([
                    'message' => 'Lote y detalles guardados con éxito',
                    'id' => $encabezado->id_encabezado
                ], 201);
            });
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al procesar el guardado',
                'details' => $e->getMessage()
            ], 500);
        }
    }
}
