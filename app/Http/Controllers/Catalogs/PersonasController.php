<?php

namespace App\Http\Controllers\Catalogs;

use App\Http\Controllers\Controller;
use App\Models\RH\Persona;
use App\Models\Catalogos\Archivo as CatalogosArchivo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

class PersonasController extends Controller
{
    public function index()
    {
        $personas = Persona::with('foto')->orderBy('ApePat', 'ASC')->get();

        $personas->transform(function ($persona) {
            if ($persona->foto && $persona->foto->archivo) {
                $binario = $persona->foto->archivo;
                $data = is_resource($binario) ? stream_get_contents($binario) : $binario;
                $persona->PathFotoEmpleado = 'data:image/jpeg;base64,' . base64_encode($data);
            } else {
                $persona->PathFotoEmpleado = null;
            }
            unset($persona->foto);
            return $persona;
        });

        return response()->json(['success' => true, 'data' => $personas], 200);
    }

    public function store(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'IdMunicipio'      => 'required|integer',
            'IdEstado'         => 'required|integer',
            'IdPuesto'         => 'required|integer',
            'IdColonia'        => 'required|integer',
            'Nombres'          => 'required|string|max:255',
            'ApePat'           => 'required|string|max:255',
            'FechaNacimiento'  => 'required',
            'RFC'              => 'required|string|max:13',
            'Curp'             => 'required|string|max:18',
            'SalarioReal'      => 'required|numeric',
            'PathFotoEmpleado' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            $personaData = $request->all();

            // Si viene una imagen nueva en Base64
            if ($request->filled('PathFotoEmpleado') && str_contains($request->PathFotoEmpleado, 'base64,')) {
                $base64Image = $request->PathFotoEmpleado;
                $extension = explode('/', explode(':', substr($base64Image, 0, strpos($base64Image, ';')))[1])[1];
                $imageContent = base64_decode(explode(',', $base64Image)[1]);
                $hexData = bin2hex($imageContent);

                $archivo = CatalogosArchivo::create([
                    'nombre' => 'foto_' . time() . '.' . $extension,
                    'archivo' => DB::raw("0x{$hexData}")
                ]);

                // Guardamos el ID del archivo en el campo de la persona
                $personaData['PathFotoEmpleado'] = $archivo->IdArchivo;
            } else {
                $personaData['PathFotoEmpleado'] = null;
            }

            $persona = Persona::create($personaData);

            DB::commit();
            return response()->json(['success' => true, 'data' => $persona], 201);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function update(Request $request, string $id)
    {
        $persona = Persona::find($id);
        if (!$persona) return response()->json(['success' => false, 'message' => 'No encontrado'], 404);

        $validator = Validator::make($request->all(), [
            'Nombres' => 'sometimes|required|string',
            'ApePat'  => 'sometimes|required|string',
            'RFC'     => 'sometimes|required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['success' => false, 'errors' => $validator->errors()], 422);
        }

        try {
            DB::beginTransaction();

            $updateData = $request->all();

            // Lógica Crucial: Solo procesar si el string contiene "base64," 
            // Esto evita que se cree un nuevo archivo si el usuario no cambió la foto
            if ($request->filled('PathFotoEmpleado') && str_contains($request->PathFotoEmpleado, 'base64,')) {
                $base64Image = $request->PathFotoEmpleado;
                
                // Extraer info del base64
                $format = str_contains($base64Image, 'image/png') ? 'png' : 'jpeg';
                $imageContent = base64_decode(explode(',', $base64Image)[1]);
                $hexData = bin2hex($imageContent);

                // Crear el nuevo registro binario
                $nuevoArchivo = CatalogosArchivo::create([
                    'nombre' => 'foto_rev_' . time() . '.' . $format,
                    'archivo' => DB::raw("0x{$hexData}")
                ]);

                // Actualizar el puntero en la tabla personas
                $updateData['PathFotoEmpleado'] = $nuevoArchivo->IdArchivo;
            } else {
                // Si NO es base64, significa que es la URL vieja o está vacía.
                // Mantenemos el ID que ya tenía la persona para no borrar la referencia.
                $updateData['PathFotoEmpleado'] = $persona->PathFotoEmpleado;
            }

            $persona->update($updateData);

            DB::commit();
            return response()->json(['success' => true, 'message' => 'Actualizado correctamente', 'data' => $persona], 200);
        } catch (\Exception $e) {
            DB::rollBack();
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    public function destroy(string $id)
    {
        $persona = Persona::find($id);
        if (!$persona) return response()->json(['success' => false, 'message' => 'No encontrado'], 404);
        $persona->delete();
        return response()->json(['success' => true, 'message' => 'Eliminado'], 200);
    }
}