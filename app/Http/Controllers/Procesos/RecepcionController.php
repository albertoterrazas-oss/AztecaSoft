<?php

namespace App\Http\Controllers\Procesos;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Procesos\Encabezado;
use App\Models\Procesos\Detalle;
use Illuminate\Support\Facades\DB;

class RecepcionController extends Controller
{


    public function Lotes()
    {
        try {
            // Se aplica el orderBy antes del get() para que la consulta sea efectiva
            $lotes = Encabezado::with('provedor')->get();

            return response()->json($lotes, 200);
        } catch (\Exception $e) { // Agregada la barra invertida para capturar la excepción global
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

            // Obtenemos los detalles filtrando por el id_encabezado
            // Opcional: puedes agregar ->orderBy('created_at', 'desc') para ver lo más reciente primero
            $detalles = Detalle::where('id_encabezado', $request->id)->get();

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
                    'persona_recibio' => auth()->user()->name ?? 'Sistema', // O lo que manejes
                    'total' => 0, // Puedes calcularlo sumando los detalles después
                    'id_archivo' => null,
                ]);

                // 4. Crear los Detalles
                foreach ($request->productos as $prod) {
                    Detalle::create([
                        'id_encabezado' => $encabezado->id_encabezado,
                        'id_producto' => $prod['IdProducto'],
                        'cantidad' => $prod['cantidad'],
                        'precio' => 0, // Ajustar si mandas precio desde el front
                        'kilos' => 0, // Ajustar si manejas kilos aparte de cantidad
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