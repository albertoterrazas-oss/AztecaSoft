<?php

namespace App\Models\Catalogos;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Basculas extends Model
{
    use HasFactory;

    public $timestamps = false;
    protected $table = 'dbo.Basculas';
    protected $primaryKey = 'IdBascula';
    protected $fillable = [
        'Nombre',
        'puerto',
    ];
}
