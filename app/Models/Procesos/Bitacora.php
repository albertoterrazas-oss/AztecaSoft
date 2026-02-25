<?php

namespace App\Models\Procesos;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Bitacora extends Model
{
    use HasFactory;
    public $timestamps = false;
    protected $table = 'dbo.Bitacora';
    protected $primaryKey = 'id_bitacora';
    protected $fillable = [
        'fechallegada',
        'fechasalida',
        'id_detalle',
        'id_subproducto',
        'area',
        'almacen',
        'personaautorizo',
        'estatus',

        
    ];
}
