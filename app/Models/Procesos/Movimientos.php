<?php

namespace App\Models\Procesos;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Movimientos extends Model
{
    use HasFactory;
    public $timestamps = false;
    protected $table = 'dbo.Movimientos';
    protected $primaryKey = 'IdMovimiento';
    protected $fillable = [
        'IdLote',
        'IdProducto',
        'IdAlmacenOrigen',
        'IdAlmacenDestino',

        'Peso',
        'Piezas',
        'IdUsuario',
        'Fecha',
        'TipoMovimiento',
    ];



    public function producto()
    {
        return $this->belongsTo(\App\Models\Catalogos\Productos::class, 'id_producto', 'IdProducto');
    }
}
