<?php

namespace App\Models\RH;

use App\Models\Catalogos\Archivo;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Persona extends Model
{
    use HasFactory;
    public $table = 'rh.Persona';
    public $timestamps = false;
    public $primaryKey = 'IdPersona';

    protected $fillable = [
        'IdMunicipio',
        'IdEstado',
        'IdPuesto',
        'IdColonia',
        'Nombres',
        'ApePat',
        'ApeMat',
        'Calle',
        'CasaNum',
        'Telefono',
        'FechaNacimiento',
        'FechaIngreso',
        'Sexo',
        'NSS',
        'RFC',
        'Curp',
        'CodigoPostal',
        'SalarioReal',
        'Estatus',
        'EsEmpleado',
        'PathFotoEmpleado',
    ];


    public function foto()
    {
        // PathFotoEmpleado es la FK en tu tabla personas
        // archivo_idarchivo es la PK en tu tabla archivo
        return $this->belongsTo(Archivo::class, 'PathFotoEmpleado', 'IdArchivo');
    }
}
