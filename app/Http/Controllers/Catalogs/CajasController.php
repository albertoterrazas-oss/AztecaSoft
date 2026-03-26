<?php

namespace App\Http\Controllers\Catalogs;

use App\Http\Controllers\Controller;
use App\Models\Catalogos\Cajas;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class CajasController extends Controller
{
    /**
     * Muestra una lista de las cajas.
     */
    public function index()
    {
        $cajas = Cajas::all();
        return response()->json($cajas);
    }

    /**
     * Store: Guarda una nueva caja en la base de datos.
     */
    public function store(Request $request)
    {
        $request->validate([
            // 'FolioCaja'       => 'required|string|max:50',
            'NumCaja'         => 'required|integer',
            'IdUsuario'       => 'required|integer',
            'IdAlmacenActual' => 'required|integer',
            'PesoTotal'       => 'required|numeric',
            'PiezasTotales'   => 'required|integer',
            'Estatus'         => 'required|integer',
        ]);

        // Agregamos la fecha de creación manualmente ya que no usamos timestamps automáticos
        $data = $request->all();
        $data['FechaCreacion'] = now();

        $caja = Cajas::create($data);

        return response()->json([
            'message' => 'Caja creada con éxito',
            'data'    => $caja
        ], 210);
    }

    /**
     * Display: Muestra una caja específica.
     */
    public function show($id)
    {
        $caja = Cajas::findOrFail($id);
        return response()->json($caja);
    }

    /**
     * Update: Actualiza una caja existente.
     */
    public function update(Request $request, $id)
    {
        $caja = Cajas::findOrFail($id);

        $request->validate([
            // 'FolioCaja'       => 'sometimes|string|max:50',
            'NumCaja'         => 'sometimes|integer',
            'IdUsuario'       => 'sometimes|integer',
            'IdAlmacenActual' => 'sometimes|integer',
            'PesoTotal'       => 'sometimes|numeric',
            'PiezasTotales'   => 'sometimes|integer',
            'Estatus'         => 'sometimes|integer',
        ]);

        $caja->update($request->all());

        return response()->json([
            'message' => 'Caja actualizada con éxito',
            'data'    => $caja
        ]);
    }

    /**
     * Remove: Elimina (o cambia estatus) de una caja.
     */
    public function destroy($id)
    {
        $caja = Cajas::findOrFail($id);
        
        // Opción A: Eliminación física
        $caja->delete();

        /* // Opción B: Eliminación lógica (si prefieres solo cambiar el estatus)
        $caja->update(['Estatus' => 0]); 
        */

        return response()->json([
            'message' => 'Caja eliminada correctamente'
        ]);
    }
}