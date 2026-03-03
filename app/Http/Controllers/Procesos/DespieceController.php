<?php

namespace App\Http\Controllers\Procesos;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class DespieceController extends Controller
{
    public function store(Request $request)
    {
        try {
            // Ejecutar el Stored Procedure con los parámetros recibidos
            // El JSON se envía tal cual como una cadena de texto
            DB::statement('EXEC sp_ProcesarDespiece ?, ?, ?, ?, ?, ?, ?, ?', [
                $request->id_lote,
                $request->id_producto_origen,
                $request->id_almacen_origen,
                $request->id_almacen_destino,
                6, // IdUsuario (puedes usar Auth::id() si tienes login)
                $request->peso_entrada,
                $request->piezas_entrada,
                $request->datos_json // El array de subproductos en formato JSON
            ]);

            return response()->json(['success' => true, 'message' => 'Despiece procesado correctamente']);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}