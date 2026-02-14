<?php

namespace App\Models\Catalogos;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Provedores extends Model
{
    use HasFactory;

    protected $table = 'dbo.Proveedores';

    protected $primaryKey = 'IdProveedor';
    public $timestamps = false;

    protected $fillable = [
        'RazonSocial',
        'RFC',
        'idUsuario',
        'fecha',
    ];
}
