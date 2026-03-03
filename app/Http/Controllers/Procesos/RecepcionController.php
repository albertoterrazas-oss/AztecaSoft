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
                'detalles.producto',
                'movimientos' => function ($query) {
                    $query->where('IdAlmacenOrigen', '1');
                },
                'movimientos.producto'
            ])
                ->whereDoesntHave('movimientos', function ($query) {
                    $query->where('IdAlmacenDestino', '!=', '1');
                })
                ->get();

            return response()->json($lotes, 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener lotes',
                'details' => $e->getMessage()
            ], 500);
        }
    }



    public function LotesAreas()
    {
        try {
            $lotes = Encabezado::with([
                'provedor',
                'movimientos' => function ($query) {
                    // Esto filtra los movimientos que se muestran dentro del JSON
                    $query->where('IdAlmacenDestino', '2');
                },
                'movimientos.producto'
            ])
                // Esto filtra el Encabezado: "Solo tráeme encabezados que TENGAN movimientos con Almacen 2"
                ->whereHas('movimientos', function ($query) {
                    $query->where('IdAlmacenDestino', '2');
                })
                ->whereDoesntHave('movimientos', function ($query) {
                    $query->where('IdAlmacenDestino', '!=', '2');
                })
                ->get();

            if ($lotes->isEmpty()) {
                return response()->json([
                    'mensaje' => 'No se encontraron lotes con movimientos para el almacén destino 2'
                ], 404);
            }

            return response()->json($lotes, 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener lotes',
                'details' => $e->getMessage()
            ], 500);
        }
    }


    public function LotesLimpieza()
    {
        try {
            $almacenObjetivo = '2';

            $lotes = Encabezado::with([
                'provedor',
                'movimientos' => function ($query) use ($almacenObjetivo) {
                    // Solo cargamos los movimientos que entraron al almacén 2
                    $query->where('IdAlmacenDestino', $almacenObjetivo)
                        ->with('producto');
                }
            ])
                // 1. CONDICIÓN: Debe tener movimientos que entraron al almacén 2
                ->whereHas('movimientos', function ($query) use ($almacenObjetivo) {
                    $query->where('IdAlmacenDestino', $almacenObjetivo);
                })
                // 2. EXCLUSIÓN: NO debe tener movimientos donde el ORIGEN sea el almacén 2
                // (Esto significa que el lote ya salió de ahí)
                ->whereDoesntHave('movimientos', function ($query) use ($almacenObjetivo) {
                    $query->where('IdAlmacenOrigen', $almacenObjetivo);
                })
                ->get();

            if ($lotes->isEmpty()) {
                // return response()->json([
                //     'mensaje' => 'No hay lotes pendientes en el almacén 2 (o ya fueron procesados)'
                // ], 404); $LOTES
                $lotes=[];
            }

            return response()->json($lotes, 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al procesar la limpieza de lotes',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    public function LotesAreasDeshuese()
    {
        try {
            $lotes = Encabezado::with([
                'provedor',
                'movimientos' => function ($query) {
                    // Esto filtra los movimientos que se muestran dentro del JSON
                    $query->where('IdAlmacenDestino', '3');
                },
                'movimientos.producto'
            ])
                // Esto filtra el Encabezado: "Solo tráeme encabezados que TENGAN movimientos con Almacen 2"
                ->whereHas('movimientos', function ($query) {
                    $query->where('IdAlmacenDestino', '3');
                })
                ->get();

            if ($lotes->isEmpty()) {
                return response()->json([
                    'mensaje' => 'No se encontraron lotes con movimientos para el almacén destino 3'
                ], 404);
            }

            return response()->json($lotes, 200);
        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al obtener lotes',
                'details' => $e->getMessage()
            ], 500);
        }
    }


    // public function LoteDetalles(Request $request)
    // {
    //     try {
    //         // Validamos que el ID venga en la petición
    //         if (!$request->has('id')) {
    //             return response()->json(['error' => 'El ID del encabezado es requerido'], 400);
    //         }

    //         $detalles = Detalle::where('id_encabezado', $request->id)
    //             ->where('estatus', false)->get();

    //         return response()->json($detalles, 200);
    //     } catch (\Exception $e) {
    //         return response()->json([
    //             'error' => 'Error al obtener detalles',
    //             'details' => $e->getMessage()
    //         ], 500);
    //     }
    // }

    public function GuardarLote(Request $request)
    {
        // 1. Recolectar datos del request
        $idProveedor = $request->IdProveedor;
        $idUsuario = $request->idUsuarioLocal; // Ajusta según tu sistema de autenticación
        $fecha = $request->fecha ?? now(); // La fecha que viene del front

        $productosParaSP = collect($request->productos)->map(function ($prod) {
            return [
                "id" => $prod['IdProducto'], // Cambiamos IdProducto por id
                "piezas" => $prod['piezas'],
                "decomiso" => $prod['decomiso']
            ];
        });

        try {
            // 3. Ejecutar el procedimiento almacenado
            $resultado = DB::select('EXEC sp_GenerarLote ?, ?, ?, ?', [
                $idProveedor,
                $idUsuario,
                $fecha,
                json_encode($productosParaSP)
            ]);

            // DB::statement('EXEC sp_RegistrarEntrada ?, ?, ?, ?, ?, ?', [
            //     $request->id_lote,          // @IdLote
            //     $request->id_producto,            // @IdProducto
            //     $request->cantidad,               // @PesoReal (netWeight del front)
            //     $request->piezas ?? 0,            // @Piezas
            //     $request->idusuario ?? 0,            // @Piezas
            //     $request->id_area_entrada              // @IdAlmacenRecepcion
            // ]);

            return response()->json([
                'status' => 'success',
                'message' => 'Lote registrado correctamente',
                'data' => $resultado
            ]);
        } catch (\Exception $e) {
            // En caso de error de SQL o código
            return response()->json([
                'status' => 'error',
                'message' => 'Error al ejecutar el procedimiento',
                'details' => $e->getMessage()
            ], 500);
        }
    }


    public function sa(Request $request)
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
