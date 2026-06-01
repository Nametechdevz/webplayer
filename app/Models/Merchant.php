<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Merchant extends Model
{
    protected $fillable = [
        'name',
        'api_key',
        'webhook_url',
        'webhook_secret',
        'status',
    ];

    protected $hidden = [
        'api_key',
        'webhook_secret',
    ];

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }
}
