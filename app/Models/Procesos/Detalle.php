<?php

namespace App\Models\Procesos;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Detalle extends Model
{

    use HasFactory;
    public $timestamps = false;
    protected $table = 'dbo.LoteDetalle';
    protected $primaryKey = 'IdLote';
    protected $fillable = [
        'IdProducto',
        'Piezas',
        'Decomiso',
        'Peso',
        // 'kilos',
        // 'estatus'

    ];


    // App\Models\Detalle.php (o el nombre que tenga tu modelo de detalles)

    public function producto()
    {
        // Relacionamos con el modelo Productos usando la llave foránea
        return $this->belongsTo(\App\Models\Catalogos\Productos::class, 'id_producto', 'IdProducto');
    }
}
