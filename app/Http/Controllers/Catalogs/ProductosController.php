<?php

namespace App\Http\Controllers\Catalogs;

use App\Http\Controllers\Controller;
use App\Models\Catalogos\Productos;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Exception;
use Carbon\Carbon;

class ProductosController extends Controller
{
    /**
     * Obtener todos los productos con sus almacenes vinculados
     */
    public function index()
    {
        try {
            // Cargamos la relación almacenes para que el front sepa qué checkboxes marcar
            // Nota: Se asume que en el modelo Productos existe la relación 'almacenes'
            $productos = Productos::with('almacenes')
                ->orderBy('Nombre', 'asc') 
                ->get();

            return response()->json($productos, 200);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'Error al obtener productos',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Obtener estructura de padres e hijos
     */
    public function getsubproductos()
    {
        try {
            $productos = Productos::has('hijos')
                ->with(['hijos' => function ($query) {
                    $query->orderBy('Nombre', 'asc');
                }])
                ->where('EsSubproducto', 0)
                ->orderBy('Nombre', 'asc')
                ->get();

            return response()->json($productos, 200);
        } catch (Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    /**
     * Crear un nuevo producto y sus asignaciones de almacén
     */
    public function store(Request $request)
    {
        $request->validate([
            'Nombre' => 'required|string|max:255',
            'UnidadMedida' => 'required|string|max:50',
            'EsSubproducto' => 'required',
            'idUsuario' => 'required|integer',
            'ProductoPadre' => 'nullable|integer',
            'Clasificacion' => 'nullable|string',
            'AlmacenesSeleccionados' => 'nullable|array' 
        ]);

        try {
            DB::beginTransaction();

            // 1. Crear el producto base
            $producto = Productos::create([
                'Nombre'        => $request->Nombre,
                'UnidadMedida'  => $request->UnidadMedida,
                'EsSubproducto' => $request->EsSubproducto,
                'fecha'         => Carbon::now(),
                'idUsuario'     => $request->idUsuario,
                'ProductoPadre' => $request->ProductoPadre,
                'Clasificacion' => $request->Clasificacion,
            ]);

            // 2. Insertar en la tabla ProductoAlmacen (la de tu imagen)
            if ($request->has('AlmacenesSeleccionados') && count($request->AlmacenesSeleccionados) > 0) {
                foreach ($request->AlmacenesSeleccionados as $idAlmacen) {
                    DB::table('ProductoAlmacen')->insert([
                        'IdProducto'      => $producto->IdProducto, // Tu PK Identity
                        'IdAlmacen'       => $idAlmacen,
                        'Estatus'         => 1,
                        'FechaAsignacion' => Carbon::now()
                    ]);
                }
            }

            DB::commit();
            return response()->json($producto->load('almacenes'), 201);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Error al crear producto', 
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar producto y sincronizar almacenes
     */
    public function update(Request $request, $id)
    {
        $producto = Productos::find($id);

        if (!$producto) {
            return response()->json(['message' => 'Producto no encontrado'], 404);
        }

        $request->validate([
            'Nombre' => 'sometimes|string|max:255',
            'AlmacenesSeleccionados' => 'nullable|array'
        ]);

        try {
            DB::beginTransaction();

            // 1. Actualizar datos básicos
            $producto->update($request->all());

            // 2. Sincronizar Almacenes (Sincronización Manual para la tabla de la imagen)
            if ($request->has('AlmacenesSeleccionados')) {
                // Borramos las asignaciones actuales para este producto
                DB::table('ProductoAlmacen')->where('IdProducto', $id)->delete();

                // Insertamos las nuevas marcadas en el Front
                foreach ($request->AlmacenesSeleccionados as $idAlmacen) {
                    DB::table('ProductoAlmacen')->insert([
                        'IdProducto'      => $id,
                        'IdAlmacen'       => $idAlmacen,
                        'Estatus'         => 1,
                        'FechaAsignacion' => Carbon::now()
                    ]);
                }
            }

            DB::commit();
            return response()->json($producto->load('almacenes'), 200);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json([
                'error' => 'Error al actualizar producto', 
                'details' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * Eliminar un producto (se recomienda borrar cascada o manual las asignaciones)
     */
    public function destroy($id)
    {
        try {
            DB::beginTransaction();
            
            $producto = Productos::find($id);
            if (!$producto) return response()->json(['message' => 'No encontrado'], 404);

            // Borrar primero los vínculos en ProductoAlmacen para evitar error de FK
            DB::table('ProductoAlmacen')->where('IdProducto', $id)->delete();
            
            $producto->delete();

            DB::commit();
            return response()->json(['message' => 'Eliminado correctamente'], 200);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'No se pudo eliminar el producto'], 500);
        }
    }

    /**
     * Mostrar un producto específico
     */
    public function show($id)
    {
        $producto = Productos::with('almacenes')->find($id);
        if (!$producto) return response()->json(['message' => 'No encontrado'], 404);
        return response()->json($producto, 200);
    }
}