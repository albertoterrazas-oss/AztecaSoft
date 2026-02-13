<?php

namespace App\Models\Catalogos;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Departamento extends Model
{
    use HasFactory;
    public $timestamps = false;
    protected $table = 'dbo.Departamento';
    protected $primaryKey = 'IdDepartamento';
    protected $fillable = [
        'nombre',
        'estatus',
        'departamentoPadre'
    ];
}
