<?php

namespace App\Http\Controllers\Catalogs;

use App\Http\Controllers\Controller;
use App\Mail\ConfiguracionCorreo;
use App\Models\Catalogos\CorreoNotificacion;
use Illuminate\Http\Request;
use App\Models\Catalogos\ListaVerificacion; // Asegúrate de importar el modelo
use Illuminate\Http\JsonResponse;
use Illuminate\Validation\ValidationException; // Se recomienda usar la excepción específica
use Illuminate\Support\Facades\Mail;

class ListaVerificacionController extends Controller
{
    // Definición de reglas de validación comunes
    // ¡IMPORTANTE! Las claves deben coincidir con las columnas del modelo ($fillable)
    private $validationRules = [
        'Nombre'       => 'required|string|max:255',
        // 'ListaVerificacion_tipo'         => 'required',
        // 'ListaVerificacion_observaciones' => 'required|string', // Cambiado a 'string'
        // 'ListaVerificacion_usuarioID'    => 'required|integer', // Asumiendo que es un ID de usuario entero
        // 'ListaVerificacion_imgVehiculo'    => 'required|integer', // Asumiendo que es un ID de usuario entero

    ];


    //  use HasFactory;
    // public $timestamps = false;
    // protected $table = 'dbo.ListaVerificacion';
    // protected $primaryKey = 'IdLista';
    // protected $fillable = [
    //     'Nombre',
    //     'Estatus',

    /**
     * Display a listing of the resource.
     * Muestra una lista de todos los recursos de CatalogosListaVerificacion.
     */
    public function index(): JsonResponse
    {
        try {
            $listas = ListaVerificacion::all();
            return response()->json($listas);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al obtener las listas de verificación.', 'error' => $e->getMessage()], 500);
        }
    }

     public function CondicionesUnidad(): JsonResponse
    {
        try {
            $listas = ListaVerificacion::with('usuario')->where('ListaVerificacion_imgVehiculo',false)->get();
            return response()->json($listas);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al obtener las listas de verificación.', 'error' => $e->getMessage()], 500);
        }
    }

    public function store(Request $request): JsonResponse
    {
        try {
            $validatedData = $request->validate($this->validationRules);
            $lista = ListaVerificacion::create($validatedData);
            // 3. Devolver el recurso creado
            return response()->json($lista, 201);
        } catch (ValidationException $e) {
            // Laravel maneja esto automáticamente, pero lo dejamos por si se quiere un manejo específico
            return response()->json(['message' => 'Los datos proporcionados no son válidos.', 'errors' => $e->errors()], 422);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al crear la lista de verificación.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Display the specified resource.
     * Muestra el recurso de CatalogosListaVerificacion especificado por su ID.
     */
    public function show(string $id): JsonResponse
    {
        try {
            // Buscar el recurso por la clave primaria definida en el modelo
            $lista = ListaVerificacion::findOrFail($id);
            return response()->json($lista);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Lista de verificación no encontrada.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al obtener la lista de verificación.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Update the specified resource in storage.
     * Actualiza el recurso de CatalogosListaVerificacion especificado en la base de datos.
     */
    public function update(Request $request, string $id): JsonResponse
    {
        try {
            // 1. Validar los datos de entrada
            $validatedData = $request->validate($this->validationRules);

            // 2. Encontrar el recurso
            $lista = ListaVerificacion::findOrFail($id);

            // 3. Actualizar el registro
            $lista->update($validatedData);

            // 4. Devolver el recurso actualizado
            return response()->json($lista);
        } catch (ValidationException $e) {
            return response()->json(['message' => 'Los datos proporcionados no son válidos.', 'errors' => $e->errors()], 422);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Lista de verificación no encontrada para actualizar.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al actualizar la lista de verificación.', 'error' => $e->getMessage()], 500);
        }
    }

    /**
     * Remove the specified resource from storage.
     * Elimina el recurso de CatalogosListaVerificacion especificado de la base de datos.
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            // 1. Encontrar y eliminar el recurso
            $lista = ListaVerificacion::findOrFail($id);
            $lista->delete();

            // 2. Devolver una respuesta de éxito sin contenido
            return response()->json(null, 204);
        } catch (\Illuminate\Database\Eloquent\ModelNotFoundException $e) {
            return response()->json(['message' => 'Lista de verificación no encontrada para eliminar.'], 404);
        } catch (\Exception $e) {
            return response()->json(['message' => 'Error al eliminar la lista de verificación.', 'error' => $e->getMessage()], 500);
        }
    }

    // Métodos `create` y `edit` no implementados para API (se dejan sin cambios o se pueden eliminar)
    public function create()
    {
        return response()->json(['message' => 'Ruta no implementada para APIs (solo para formularios web)'], 404);
    }

    public function edit(string $id)
    {
        return response()->json(['message' => 'Ruta no implementada para APIs (solo para formularios web)'], 404);
    }


    /**
     * Configura el servicio de correo con las credenciales de una empresa específica.
     *
     * @param object $empresa Objeto o array con los datos de la empresa.
     * @return void
     */
    public function configEmail(): void
    {
        // 1. Obtener los valores de las variables de entorno.
        // Usamos env() para leer el .env directamente.

        $host = env('MAIL_HOST');
        $port = (int) env('MAIL_PORT'); // Asegurar que sea entero
        $username = env('MAIL_USERNAME');
        $password = env('MAIL_PASSWORD');
        // Laravel espera 'tls' o 'ssl' para encryption.
        $encryption = env('MAIL_ENCRYPTION', 'ssl');

        // 2. Obtener la plantilla de configuración actual para el mailer 'smtp'.
        $config = config('mail.mailers.smtp');

        // 3. Modificar los valores del mailer 'smtp' con los datos del .env.
        $config['host'] = $host;
        $config['port'] = $port;
        $config['username'] = $username;
        $config['password'] = $password;
        $config['encryption'] = $encryption;

        // 4. Crear el array de configuración del remitente ('from') desde el .env.
        $from = [
            'address' => env('MAIL_FROM_ADDRESS'),
            'name' => env('MAIL_FROM_NAME', 'DELFIN'), // Usamos 'DELFIN' como valor por defecto si no está en el .env
        ];

        // 5. Inyectar la configuración dinámica.

        // A. Sobrescribir el mailer 'smtp'
        config(['mail.mailers.smtp' => $config]);

        // B. Sobrescribir la dirección 'from' global
        config(['mail.from' => $from]);
    }
    // public function testcorreo(Request $request)
    // {



    //     // $Correos = CorreoNotificacion::all();
    //     // return response()->json([
    //     //     'data' => $Correos,
    //     //     'message' => 'Correos recuperados exitosamente'
    //     // ], 200);
    //     // $this->configEmail();
    //     $Datos = (object) [
    //         "Titulo" => "Test",
    //         "Detalle" => "TEST: Envio de configuracion de correos",
    //     ];
    //     Mail::to("guzmaan.edgar@gmail.com")->send(new ConfiguracionCorreo($Datos));

    //     return response()->json(['message' => 'Se envio con exito el correo'], 200);
    // }

    // public function CorreoIncidencias(Request $request)
    // {

    //     $this->configEmail();
    //     $Datos = (object) [
    //         "Titulo" => "CORREO INCIDENCIAS",
    //         "incidencias" => "CORREO INCIDENCIAS",

    //         // "Detalle" => "TEST: Envio de configuracion de correos",
    //     ];
    //     Mail::to("guzmaan.edgar@gmail.com")->send(new ConfiguracionCorreo($Datos));

    //     return response()->json(['message' => 'Se envio con exito el correo'], 200);
    // }
}
