<?php

namespace App\Models\Catalogos;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Areas extends Model
{    

    use HasFactory;

    public $timestamps = false;
    protected $table = 'dbo.areas';
    protected $primaryKey = 'id';
    protected $fillable = [
        'areas_nombre',
        'areas_estatus',
    ];
}
