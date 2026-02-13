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
    ];
}
