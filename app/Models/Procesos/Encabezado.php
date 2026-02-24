<?php

namespace App\Models\Procesos;

use App\Models\Catalogos\Provedores;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Encabezado extends Model
{

    use HasFactory;
    public $timestamps = false;
    protected $table = 'dbo.Encabezado';
    protected $primaryKey = 'id_encabezado';
    protected $fillable = [
        'id_proveedor',
        'id_archivo',
        'observaciones',
        'total',
        'persona_recibio',
        'fecha'
    ];

     public function provedor()
    {
        return $this->belongsTo(Provedores::class, 'id_proveedor');
    }
}
