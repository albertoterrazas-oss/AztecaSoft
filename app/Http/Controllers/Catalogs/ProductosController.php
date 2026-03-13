<?php

// namespace App\Http\Controllers\Catalogos;

// use App\Http\Controllers\Controller;
// use App\Models\Catalogos\Productos;
// use Illuminate\Http\Request;


namespace App\Http\Controllers\Catalogs;

use App\Http\Controllers\Controller;
use App\Models\Catalogos\Productos;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Exception;
use Illuminate\Support\Facades\DB;

class ProductosController extends Controller
{
    public function index()
    {
        try {
            // Usamos orderBy para ordenar por la columna 'Nombre' de forma ascendente (A-Z)
            $productos = Productos::orderBy('Nombre', 'asc')->get();

            return response()->json($productos, 200);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'Error al obtener productos',
                'details' => $e->getMessage()
            ], 500);
        }
    }

    public function getsubproductos()
    {
        try {
            // has('hijos') filtra los padres que NO tienen hijos
            $productos = Productos::has('hijos')
                ->with(['hijos' => function ($query) {
                    $query->orderBy('Nombre', 'asc');
                }])
                ->where('EsSubproducto', 0)
                ->orderBy('Nombre', 'asc')
                ->get();

            return response()->json($productos, 200);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'Error al obtener estructura',
                'details' => $e->getMessage()
            ], 500);
        }
    }
    /**
     * Crear un nuevo producto
     */
    public function store(Request $request)
    {
        $request->validate([
            'Nombre' => 'required|string|max:255',
            'UnidadMedida' => 'required|string|max:50',
            'EsSubproducto' => 'required|boolean',
            'idUsuario' => 'required|integer',
            'ProductoPadre' => 'nullable|integer'
        ]);

        try {
            DB::beginTransaction();

            $producto = Productos::create([
                'Nombre' => $request->Nombre,
                'UnidadMedida' => $request->UnidadMedida,
                'EsSubproducto' => $request->EsSubproducto,
                'fecha' => now(), // Generamos la fecha actual automáticamente
                'idUsuario' => $request->idUsuario,
                'ProductoPadre' => $request->ProductoPadre,

            ]);

            DB::commit();
            return response()->json($producto, 201);
        } catch (Exception $e) {
            DB::rollBack();
            return response()->json(['error' => 'Error al crear producto', 'details' => $e->getMessage()], 500);
        }
    }

    /**
     * Mostrar un producto específico
     */
    public function show($id)
    {
        $producto = Productos::find($id);

        if (!$producto) {
            return response()->json(['message' => 'Producto no encontrado'], 404);
        }

        return response()->json($producto, 200);
    }

    /**
     * Actualizar un producto existente
     */
    public function update(Request $request, $id)
    {
        $producto = Productos::find($id);

        if (!$producto) {
            return response()->json(['message' => 'Producto no encontrado'], 404);
        }

        $request->validate([
            'Nombre' => 'sometimes|string|max:255',
            'UnidadMedida' => 'sometimes|string|max:50',
            'EsSubproducto' => 'sometimes|boolean',
            'idUsuario' => 'sometimes|integer',
            'ProductoPadre' => 'nullable|integer'

        ]);

        try {
            $producto->update($request->all());
            return response()->json($producto, 200);
        } catch (Exception $e) {
            return response()->json(['error' => 'Error al actualizar producto', 'details' => $e->getMessage()], 500);
        }
    }

    /**
     * Eliminar un producto
     */
    public function destroy($id)
    {
        $producto = Productos::find($id);

        if (!$producto) {
            return response()->json(['message' => 'Producto no encontrado'], 404);
        }

        try {
            $producto->delete();
            return response()->json(['message' => 'Producto eliminado correctamente'], 200);
        } catch (Exception $e) {
            return response()->json(['error' => 'No se pudo eliminar el producto'], 500);
        }
    }
}
