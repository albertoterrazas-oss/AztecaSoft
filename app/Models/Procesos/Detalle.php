<?php

namespace App\Models\Procesos;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Detalle extends Model
{

    use HasFactory;
    public $timestamps = false;
    protected $table = 'dbo.Detalle_Producto';
    protected $primaryKey = 'id_detalle';
    protected $fillable = [
        'id_encabezado',
        'id_producto',
        'cantidad',
        'precio',
        'kilos',
        'estatus'

    ];


    // App\Models\Detalle.php (o el nombre que tenga tu modelo de detalles)

    public function producto()
    {
        // Relacionamos con el modelo Productos usando la llave foránea
        return $this->belongsTo(\App\Models\Catalogos\Productos::class, 'id_producto', 'IdProducto');
    }
}
