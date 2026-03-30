<?php

namespace App\Http\Controllers\Procesos;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ReportesController extends Controller
{
    /**
     * Reporte: Lotes por proveedor
     */
    public function lotesPorProveedor(Request $request)
    {
        try {
            // Validamos que los parámetros existan
            $request->validate([
                'idProveedor' => 'required',
                'fechaInicio' => 'required|date',
                'fechaFin'    => 'required|date'
            ]);

            $resultado = DB::select('EXEC sp_ObtenerLotesPorProveedor ?, ?, ?', [
                $request->idProveedor,
                $request->fechaInicio,
                $request->fechaFin
            ]);

            return response()->json($resultado);
        } catch (\Exception $e) {
            Log::error("Error en lotesPorProveedor: " . $e->getMessage());
            return response()->json(['error' => 'Error al obtener los lotes'], 500);
        }
    }

    /**
     * Reporte: Productos en el Lote del proveedor
     */
    public function productosPorLote(Request $request)
    {
        try {
            $request->validate(['idLote' => 'required']);

            $resultado = DB::select('EXEC sp_ObtenerProductosPorLote ?', [
                $request->idLote
            ]);

            return response()->json($resultado);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al obtener productos del lote'], 500);
        }
    }

    /**
     * Reporte: Detalle de cómo se repartió el producto
     */
    public function detalleProductoEnLote(Request $request)
    {
        try {
            $request->validate([
                'idLote' => 'required',
                'idProducto' => 'required'
            ]);

            $resultado = DB::select('EXEC sp_DetalleProductoEnLote ?, ?', [
                $request->idLote,
                $request->idProducto
            ]);

            return response()->json($resultado);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Error al obtener detalle del producto'], 500);
        }
    }

    /**
     * Reporte 1 del Excel: Inventario, Entradas y Salidas (3 tablas)
     */
    public function reporteInventarioCompleto(Request $request)
    {
        try {
            $request->validate([
                'fechaInicio' => 'required|date',
                'fechaFin'    => 'required|date'
            ]);

            $pdo = DB::getPdo();
            $stmt = $pdo->prepare("EXEC sp_ReporteInventarioEntradasSalidas ?, ?");
            $stmt->execute([
                $request->fechaInicio,
                $request->fechaFin
            ]);

            $reporte = [
                'inventario' => $stmt->fetchAll(\PDO::FETCH_ASSOC),
                'entradas'   => [],
                'salidas'    => []
            ];

            // Tabla 2: Entradas
            if ($stmt->nextRowset()) {
                $reporte['entradas'] = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            }

            // Tabla 3: Salidas
            if ($stmt->nextRowset()) {
                $reporte['salidas'] = $stmt->fetchAll(\PDO::FETCH_ASSOC);
            }

            return response()->json($reporte);
        } catch (\Exception $e) {
            Log::error("Error en reporteInventarioCompleto: " . $e->getMessage());
            return response()->json(['error' => 'Error al generar el reporte completo'], 500);
        }
    }

    /**
     * Reporte Detallado con filtro opcional por clasificación
     */
    public function reporteDetallado(Request $request)
    {
        try {
            // Validamos las fechas obligatorias
            $request->validate([
                'fechaInicio'   => 'required|date',
                'fechaFin'      => 'required|date',
                'clasificacion' => 'nullable|string|max:50'
            ]);

            // Ejecutamos el SP pasando los 3 parámetros
            // Si clasificacion no viene, Laravel enviará null, lo cual respeta el default del SP
            $resultado = DB::select('EXEC sp_ReporteDetallado ?, ?, ?', [
                $request->fechaInicio,
                $request->fechaFin,
                $request->clasificacion 
            ]);

            return response()->json($resultado);
        } catch (\Exception $e) {
            Log::error("Error en reporteDetallado: " . $e->getMessage());
            return response()->json([
                'error' => 'Error al obtener el reporte detallado',
                'detalle' => $e->getMessage() // Opcional: solo para depuración
            ], 500);
        }
    }
}