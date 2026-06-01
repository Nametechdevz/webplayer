<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class PaymentAddress extends Model
{
    protected $fillable = [
        'address',
        'status',
        'last_used_at',
    ];

    protected $casts = [
        'last_used_at' => 'datetime',
    ];

    public function orders(): HasMany
    {
        return $this->hasMany(Order::class);
    }

    public function isAvailable(): bool
    {
        return $this->status === 'available';
    }

    public function markAsOccupied(): void
    {
        $this->update([
            'status' => 'occupied',
            'last_used_at' => now(),
        ]);
    }

    public function markAsAvailable(): void
    {
        $this->update(['status' => 'available']);
    }
}
