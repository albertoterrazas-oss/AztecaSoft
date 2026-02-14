<?php

namespace App\Http\Controllers\Catalogs;

use App\Http\Controllers\Controller;
use App\Models\Catalogos\Provedores; // Importamos el modelo
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

class ProvedoresController extends Controller
{
    /**
     * Muestra el listado de proveedores.
     */
    public function index()
    {
        $proveedores = Provedores::all();
        return response()->json($proveedores);
    }

    /**
     * Guarda un nuevo proveedor en la base de datos.
     */
    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'RazonSocial' => 'required|string|max:255',
            'RFC'         => 'required|string|max:13',
            'idUsuario'   => 'required|integer',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Si la base de datos no asigna la fecha automáticamente:
        $data = $request->all();
        if (!isset($data['fecha'])) {
            $data['fecha'] = now(); 
        }

        $proveedor = Provedores::create($data);

        return response()->json([
            'message' => 'Proveedor registrado correctamente',
            'data'    => $proveedor
        ], 201);
    }

    /**
     * Muestra un proveedor específico.
     */
    public function show(string $id)
    {
        $proveedor = Provedores::find($id);

        if (!$proveedor) {
            return response()->json(['message' => 'Proveedor no encontrado'], 404);
        }

        return response()->json($proveedor);
    }

    /**
     * Actualiza un proveedor existente.
     */
    public function update(Request $request, string $id)
    {
        $proveedor = Provedores::find($id);

        if (!$proveedor) {
            return response()->json(['message' => 'Proveedor no encontrado'], 404);
        }

        $proveedor->update($request->all());

        return response()->json([
            'message' => 'Proveedor actualizado',
            'data'    => $proveedor
        ]);
    }

    /**
     * Elimina un proveedor.
     */
    public function destroy(string $id)
    {
        $proveedor = Provedores::find($id);

        if (!$proveedor) {
            return response()->json(['message' => 'Proveedor no encontrado'], 404);
        }

        $proveedor->delete();

        return response()->json(['message' => 'Proveedor eliminado correctamente']);
    }
}