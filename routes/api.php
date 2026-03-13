<?php



use App\Http\Controllers\Admin\UserController;
use App\Http\Controllers\Admin\RolesController;
use App\Http\Controllers\Catalogs\AreasController;
use App\Http\Controllers\Catalogs\AlmacenesController;
use App\Http\Controllers\Catalogs\CodigosController;
use App\Http\Controllers\Catalogs\CorreosController;
use App\Http\Controllers\Catalogs\DepartamentoController;
use App\Http\Controllers\Catalogs\DestinosController;
use App\Http\Controllers\Catalogs\ListaVerificacionController;
use App\Http\Controllers\Catalogs\MenuController;
use App\Http\Controllers\Catalogs\MotivosController;
use App\Http\Controllers\Catalogs\PuestosController;
use App\Http\Controllers\Catalogs\RegistroEntradaController;
use App\Http\Controllers\Catalogs\UnidadesController;
use App\Http\Controllers\Catalogs\AsuntosController;
use App\Http\Controllers\Catalogs\BasculasController;
use App\Http\Controllers\Catalogs\ClientesController;
use App\Http\Controllers\Catalogs\ColoniasController;
use App\Http\Controllers\Catalogs\DashboardController;
use App\Http\Controllers\Catalogs\EstadosController;
use App\Http\Controllers\Catalogs\MunicipiosController;
use App\Http\Controllers\Catalogs\PersonasController;
use App\Http\Controllers\Catalogs\ProductosController;
use App\Http\Controllers\Catalogs\ProvedoresController;
use App\Http\Controllers\Procesos\DashboardController as ProcesosDashboardController;
use App\Http\Controllers\Procesos\DespieceController;
use App\Http\Controllers\Procesos\InventariosController;
use App\Http\Controllers\Procesos\RecepcionController;
use App\Http\Controllers\Procesos\SalidaController;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

Route::get('user/menus/{id}', [UserController::class, 'menus'])->name('user.menus');

Route::get('user/Perfil/{id}', [UserController::class, 'Perfil'])->name('user.Perfil');




Route::resource('destinos', DestinosController::class)->only([
    'index',
    'store',
    'update'
]);

// Esto crea automáticamente las 5 rutas: index, store, show, update, destroy
Route::resource('unidades', UnidadesController::class)->only([
    'index',
    'store',
    'show',
    'update',
    'destroy'
]);

Route::resource('motivos', MotivosController::class)->only([
    'index',
    'store',
    'update'
]);


Route::resource('menus', MenuController::class)->only([
    'index',
    'store',
    'update'
]);


Route::resource('listaverificacion', ListaVerificacionController::class)->only([
    'index',
    'store',
    'update'
]);




Route::resource('departamentos', DepartamentoController::class)->only([
    'index',
    'store',
    'update'
]);


Route::resource('puestos', PuestosController::class)->only([
    'index',
    'store',
    'update'
]);


Route::resource('codigos', CodigosController::class)->only([
    'index',
    'store',
    'update'
]);


Route::resource('asuntos', AsuntosController::class)->only([
    'index',
    'store',
    'update'
]);


Route::resource('productos', ProductosController::class)->only([
    'index',
    'store',
    'update'
]);

Route::resource('estados', EstadosController::class)->only([
    'index',
    'store',
    'update'
]);

Route::resource('municipios', MunicipiosController::class)->only([
    'index',
    'store',
    'update'
]);

Route::apiResource('colonias', ColoniasController::class);

Route::resource('almacenes', AlmacenesController::class)->only([
    'index',
    'store',
    'update'
]);


Route::resource('provedores', ProvedoresController::class)->only([
    'index',
    'store',
    'update'
]);

Route::resource('clientes', ClientesController::class)->only([
    'index',
    'store',
    'update'
]);

Route::resource('areas', AreasController::class)->only([
    'index',
    'store',
    'update'
]);

Route::resource('basculas', BasculasController::class)->only([
    'index',
    'store',
    'update'
]);

// Route::resource('Despiece', DespieceController::class)->only([
//     'index',
//     'store',
//     'update'
// ]);
// Route::post('/Despiece', action: [DespieceController::class, 'store'])->name('Despiece');

// Cambia esto temporalmente para testear
// Route::post('procesar-despiece', [DespieceController::class, 'store'])->name('despiece.store');
Route::post('/despiece', [DespieceController::class, 'store'])->name('despiece.store');


Route::get('archivo/{id}', [App\Http\Controllers\Catalogs\PersonasController::class, 'verFoto']);
Route::get('user/menus/{id}', [UserController::class, 'menus'])->name('user.menus');

Route::get('CondicionesUnidad', [ListaVerificacionController::class, 'CondicionesUnidad'])->name('CondicionesUnidad');

Route::get('menus-tree', [MenuController::class, 'getTree'])->name('menus-tree');
Route::get('QuienconQuienUnidades', [UnidadesController::class, 'QuienconQuienUnidades'])->name('QuienconQuienUnidades');
Route::get('QuienconQuienUnidadesDashboard', [UnidadesController::class, 'QuienconQuienUnidadesDashboard'])->name('QuienconQuienUnidadesDashboard');
Route::get('AutorizacionQuienconQuienUnidades', [UnidadesController::class, 'AutorizacionQuienconQuienUnidades'])->name('AutorizacionQuienconQuienUnidades');

Route::post('AuthorizacionQuienCQuien', [UnidadesController::class, 'AuthorizacionQuienCQuien'])->name('AuthorizacionQuienCQuien');

Route::post('GuardarLote', [RecepcionController::class, 'GuardarLote'])->name('GuardarLote');
Route::get('Lotes', [RecepcionController::class, 'Lotes'])->name('Lotes');

Route::get('LoteDetalles', [RecepcionController::class, 'LoteDetalles'])->name('LoteDetalles');

Route::post('/pesaje/guardar-lote', [SalidaController::class, 'guardarSalida'])->name('pesaje.store');

Route::get('LotesAreas', [RecepcionController::class, 'LotesAreas'])->name('LotesAreas');

Route::post('ProductosLotes', [RecepcionController::class, 'ProductosLotes'])->name('ProductosLotes');
Route::post('ProductosLotesHistorial', [RecepcionController::class, 'ProductosLotesHistorial'])->name('ProductosLotesHistorial');


Route::get('LotesEntrada', [RecepcionController::class, 'LotesEntrada'])->name('LotesEntrada');

Route::get('LotesDeshuese', [RecepcionController::class, 'LotesDeshuese'])->name('LotesDeshuese');
Route::get('LotesLimpieza', [RecepcionController::class, 'LotesLimpieza'])->name('LotesLimpieza');

Route::get('/getInventario', [InventariosController::class, 'getInventario'])->name('getInventario');


Route::get('QuienconQuienControl', [UnidadesController::class, 'QuienconQuienControl'])->name('QuienconQuienControl');
Route::get('DashboardUnidad', [UnidadesController::class, 'DashboardUnidad'])->name('DashboardUnidad');
Route::get('UnidadesQuiencQuien', [UnidadesController::class, 'UnidadesQuiencQuien'])->name('UnidadesQuiencQuien');
Route::post('ReporteMovimientos', [UnidadesController::class, 'ReporteMovimientos'])->name('ReporteMovimientos');

Route::get('DestinosQuiencQuien', [DestinosController::class, 'DestinosQuiencQuien'])->name('DestinosQuiencQuien');
Route::get('MotivosQuiencQuien', [MotivosController::class, 'MotivosQuiencQuien'])->name('MotivosQuiencQuien');
Route::get('DepartamentosActivos', [DepartamentoController::class, 'DepartamentosActivos'])->name('DepartamentosActivos');

Route::post('/asignaciones', [RegistroEntradaController::class, 'store'])->name('asignaciones.store');
Route::post('/codesend', [RegistroEntradaController::class, 'codesend'])->name('codesend');
Route::post('/verifycode', [RegistroEntradaController::class, 'verifycode'])->name('verifycode');



Route::post('/changesswho',  [RegistroEntradaController::class, 'changesswho'])->name('changesswho');
Route::post('/WhoDestint',  [RegistroEntradaController::class, 'WhoDestint'])->name('WhoDestint');
Route::get('/choferes', [UserController::class, 'choferes'])->name('choferes');


Route::post('/WhoAyudantes',  [RegistroEntradaController::class, 'WhoAyudantes'])->name('WhoAyudantes');


Route::get('indexconfiguracioncorreo', [CorreosController::class, 'indexconfiguracioncorreo'])->name('indexconfiguracioncorreo');
Route::post('ConfiguracionCorreoStore', [CorreosController::class, 'ConfiguracionCorreoStore'])->name('ConfiguracionCorreoStore');
Route::post('sendMailTest', [RegistroEntradaController::class, 'sendMailTest'])->name('sendMailTest');





Route::post('ultimos-movimientos-unidad', [RegistroEntradaController::class, 'getUltimosMovimientosUnidad'])->name('ultimos-movimientos-unidad');

Route::resource('users', UserController::class)->only([
    'index', // GET /api/admin/users
    'store', // POST /api/admin/users
    'show',  // GET /api/admin/users/{user}
    'update', // PUT/PATCH /api/admin/users/{user}
    'destroy' // DELETE /api/admin/users/{user}
]);

Route::resource('roles', RolesController::class)->only([
    'index', // GET /api/admin/roles
    'store', // POST /api/admin/roles
    'update' // PUT/PATCH /api/admin/roles/{role}
]);

Route::resource('correos', CorreosController::class)->only([
    'index', // GET /api/admin/roles
    'store', // POST /api/admin/roles
    'update' // PUT/PATCH /api/admin/roles/{role}
]);

Route::resource('personas', controller: PersonasController::class)->only([
    'index',    // (GET /api/destinos)
    'store',    // (POST /api/destinos)
    'update'    // (PUT/PATCH /api/destinos/{destino})
]);



Route::get('getKilosDashboard', [ProcesosDashboardController::class, 'getKilosDashboard'])->name('getKilosDashboard');

Route::get('getsubproductos', [ProductosController::class, 'getsubproductos'])->name('getsubproductos');

Route::get('MovimientoPrimerPesaje', [RecepcionController::class, 'MovimientoPrimerPesaje'])->name('MovimientoPrimerPesaje');

// });

Route::post('CodigoverificacionEstado', [CodigosController::class, 'CodigoverificacionEstado'])->name('CodigoverificacionEstado');
Route::get('rolesxmenu', [RolesController::class, 'getAllRolesMenu'])->name('rolesxmenu.index');
Route::get('rolesxmenu/{id}', [RolesController::class, 'getRolesMenu'])->name('rolesxmenu.show');
Route::put('rolesxmenu/{id}', [RolesController::class, 'rolesxmenu'])->name('rolesxmenu.update');
Route::post('rolesxmenu/usersPerRole', [RolesController::class, 'usersPerRole'])->name('rolesxmenu.usersPerRole');
Route::post('usuarioxmenu', [UserController::class, 'getUsuarioMenu'])->name('usuarioxmenu.index');
Route::put('usuarioxmenu/{id}', [UserController::class, 'usuarioxmenu'])->name('usuarioxmenu.update');

Route::get('testcorreo', [ListaVerificacionController::class, 'testcorreo'])->name('testcorreo');
