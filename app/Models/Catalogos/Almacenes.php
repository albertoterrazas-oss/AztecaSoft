<?php

namespace App\Models\Catalogos;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Almacenes extends Model
{
    use HasFactory;

    public $timestamps = false;
    protected $table = 'dbo.Almacenes';
    protected $primaryKey = 'IdAlmacen';
    protected $fillable = [
        'Nombre',
        'Tipo',
        'IdBascula',
        'CapacidadKilos'
    ];



    public function bascula()
    {
        return $this->belongsTo(Basculas::class, 'IdBascula', 'IdBascula');
    }
}
