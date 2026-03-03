<?php

namespace App\Models\Procesos;

use App\Models\Catalogos\Provedores;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Encabezado extends Model
{

    use HasFactory;
    public $timestamps = false;
    protected $table = 'dbo.Lotes';
    protected $primaryKey = 'IdLote';
    protected $fillable = [
        'IdProveedor',
        'IdUsuario',
        'fecha',
    ];

    public function provedor()
    {
        return $this->belongsTo(Provedores::class, 'IdProveedor');
    }

    // En app/Models/Encabezado.php
    public function detalles()
    {
        // Relación de uno a muchos usando tu llave foránea id_encabezado
        return $this->hasMany(Detalle::class, 'IdLote');
    }

    public function movimientos()
    {
        // Relación de uno a muchos: Un lote tiene muchos movimientos
        return $this->hasMany(Movimientos::class, 'IdLote', 'IdLote');
    }
}
