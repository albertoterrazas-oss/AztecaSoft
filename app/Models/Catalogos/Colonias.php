<?php

namespace App\Models\Catalogos;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Colonias extends Model
{
    use HasFactory;
    public $timestamps = false;
    protected $table = 'dbo.Colonias';
    protected $primaryKey = 'Colonia_Id';
    protected $fillable = [
        'Colonia_Nombre',
        'Colonia_IdMunicipio',
        'c_CodigoPostal',
        'Colonia_cveSAT',

    ];

    public function municipio()
    {
        // El tercer parámetro debe ser la llave primaria real del municipio
        return $this->belongsTo(Municipio::class, 'Colonia_IdMunicipio', 'idMunicipio');
    }
}
