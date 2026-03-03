<?php

namespace App\Http\Controllers\Procesos;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use DB;

class InventariosController extends Controller
{
   public function getInventario(Request $request)
    {
        // Capturamos los parámetros de la URL
        // Ejemplo: /api/inventario?idAlmacen=1&idProveedor=5
        $idAlmacen = $request->query('idAlmacen');
        $idProveedor = $request->query('idProveedor');

        try {
            // Ejecutamos el procedimiento almacenado
            // Usamos "EXEC" para SQL Server o "CALL" para MySQL
            $resultados = DB::select("EXEC sp_InventarioAlmacen 
                @IdAlmacen = ?, 
                @IdProveedor = ?", 
                [$idAlmacen, $idProveedor]
            );

            if (empty($resultados)) {
                return response()->json(['message' => 'No se encontraron registros'], 404);
            }

            return response()->json($resultados, 200);

        } catch (\Exception $e) {
            return response()->json([
                'error' => 'Error al consultar el inventario',
                'detalle' => $e->getMessage()
            ], 500);
        }
    }
}
