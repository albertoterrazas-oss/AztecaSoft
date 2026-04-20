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


    // App\Models\Catalogos\Productos.php
    public function almacenes()
    {
        // IdProductoAlmacen es la PK de la tabla pivot, IdProducto e IdAlmacen son las FK
        return $this->belongsToMany(
           Almacenes::class, // Cambia esto por tu modelo de Almacen
            'ProductoAlmacen',
            'IdProducto',
            'IdAlmacen'
        )->withPivot('Estatus', 'FechaAsignacion');
    }
}
