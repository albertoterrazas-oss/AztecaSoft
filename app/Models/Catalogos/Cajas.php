<?php

namespace App\Models\Catalogos;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cajas extends Model
{
    protected $table = 'dbo.TiposCaja';

    // Definimos la llave primaria si no es el estándar "id"
    protected $primaryKey = 'IdTipoCaja';

    // Desactiva timestamps si la tabla no tiene 'created_at' y 'updated_at'
    // Si solo tiene FechaCreacion, lo manejaremos manualmente o vía fillable
    public $timestamps = false;

    protected $fillable = [
        // 'FolioCaja',
        'Nombre',
        'Tara',
        'Estatus',
        'FechaRegistro',
        // 'PesoTotal',
        // 'PiezasTotales',
        // 'Estatus',
    ];
}
