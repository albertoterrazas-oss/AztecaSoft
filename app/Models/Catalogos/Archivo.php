<?php

namespace App\Models\Catalogos;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Archivo extends Model
{
    use HasFactory;
    public $primaryKey = "IdArchivo";
    public $timestamps = false;
    protected $table = 'dbo.Archivo';
    protected $fillable = [
        'nombre',
        'archivo'
    ];

    public function getArchivoArchivoAttribute($value)
    {
        return base64_encode($value);
    }
}
