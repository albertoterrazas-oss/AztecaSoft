<?php

namespace App\Http\Controllers\Catalogs;

use App\Http\Controllers\Controller;
use App\Models\Catalogos\Departamento;
use Illuminate\Http\Request;
use Exception;

/**
 * Controlador para la gestión de Departamentos (dbo.Departamento)
 */
class DepartamentoController extends Controller
{
    /**
     * GET /catalogs/departamentos
     * Lista todos los departamentos.
     */
    public function index()
    {
        $departamentos = Departamento::all();
        return response()->json($departamentos);
    }

    /**
     * GET /catalogs/departamentos/activos
     * Retorna solo los departamentos donde estatus es true.
     */
    public function DepartamentosActivos()
    {
        $departamentos = Departamento::where('estatus', true)->get();
        return response()->json($departamentos);
    }

    /**
     * POST /catalogs/departamentos
     * Crea un nuevo departamento.
     */
    public function store(Request $request)
    {
        $request->validate([
            'nombre'            => 'required|string|max:255',
            'estatus'           => 'required|boolean',
            'departamentoPadre' => 'nullable|integer',
        ]);

        try {
            $departamento = Departamento::create($request->all());
            return response()->json($departamento, 201);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'No se pudo crear el departamento.',
                'message' => $e->getMessage()
            ], 500);
        }
    }

    /**
     * GET /catalogs/departamentos/{id}
     */
    public function show(string $id)
    {
        $departamento = Departamento::findOrFail($id);
        return response()->json($departamento);
    }

    /**
     * PUT/PATCH /catalogs/departamentos/{id}
     */
    public function update(Request $request, string $id)
    {
        $departamento = Departamento::findOrFail($id);

        $request->validate([
            'nombre'            => 'sometimes|required|string|max:255',
            'estatus'           => 'sometimes|boolean',
            'departamentoPadre' => 'nullable|integer',
        ]);

        try {
            $departamento->update($request->all());
            return response()->json($departamento, 200);
        } catch (Exception $e) {
            return response()->json(['error' => 'No se pudo actualizar el departamento.'], 500);
        }
    }

    /**
     * DELETE /catalogs/departamentos/{id}
     */
    public function destroy(string $id)
    {
        $departamento = Departamento::findOrFail($id);

        try {
            $departamento->delete();
            return response()->json(null, 204);
        } catch (Exception $e) {
            return response()->json([
                'error' => 'No se pudo eliminar el departamento. Verifique que no tenga dependencias.'
            ], 500);
        }
    }
}