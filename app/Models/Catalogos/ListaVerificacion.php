<?php

namespace App\Models\Catalogos;
use App\Models\User ;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ListaVerificacion extends Model
{
    use HasFactory;
    public $timestamps = false;
    protected $table = 'dbo.ListaVerificacion';
    protected $primaryKey = 'IdLista';
    protected $fillable = [
        'Nombre',
        'Estatus',
        // 'ListaVerificacion_observaciones',
        // 'ListaVerificacion_usuarioID',
        // 'ListaVerificacion_imgVehiculo'
    ];


    // public function usuario(): BelongsTo
    // {
    //     return $this->belongsTo(User::class, 'ListaVerificacion_usuarioID', 'Personas_usuarioID');
    // }
}
