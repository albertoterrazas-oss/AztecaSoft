<?php

namespace App\Models\Catalogos;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Productos extends Model
{
    use HasFactory;
    public $timestamps = false;
    protected $table = 'dbo.Productos';
    protected $primaryKey = 'IdProducto';
    protected $fillable = [
        'Nombre',
        'UnidadMedida',
        'EsSubproducto',
        'fecha',
        'idUsuario',
        'ProductoPadre'
    ];

    // Relación: Un subproducto pertenece a un producto padre
    public function padre()
    {
        return $this->belongsTo(Productos::class, 'ProductoPadre', 'IdProducto');
    }

    // Relación: Un producto puede tener muchos subproductos
    public function hijos()
    {
        return $this->hasMany(Productos::class, 'ProductoPadre', 'IdProducto');
    }
}
