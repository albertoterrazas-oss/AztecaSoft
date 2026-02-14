<?php

namespace App\Models\Catalogos;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Clientes extends Model
{
    use HasFactory;

    protected $table = 'dbo.Clientes';

    protected $primaryKey = 'IdCliente';
    public $timestamps = false;

    protected $fillable = [
        'RazonSocial',
        'RFC',
        'idUsuario',
        'fecha',
    ];
}
