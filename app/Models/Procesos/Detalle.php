<?php

namespace App\Models\Procesos;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Detalle extends Model
{

    use HasFactory;
    public $timestamps = false;
    protected $table = 'dbo.Detalles';
    protected $primaryKey = 'id_detalle';
    protected $fillable = [
        'id_encabezado',
        'id_producto',
        'cantidad',
        'precio',
        'kilos',
       
    ];
}