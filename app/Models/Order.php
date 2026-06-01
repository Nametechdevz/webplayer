<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Order extends Model
{
    protected $fillable = [
        'merchant_id',
        'payment_address_id',
        'external_order_id',
        'amount_usd',
        'amount_crypto',
        'status',
        'tx_hash',
        'expires_at',
    ];

    protected $casts = [
        'amount_usd' => 'decimal:2',
        'amount_crypto' => 'decimal:6',
        'expires_at' => 'datetime',
    ];

    public function merchant(): BelongsTo
    {
        return $this->belongsTo(Merchant::class);
    }

    public function paymentAddress(): BelongsTo
    {
        return $this->belongsTo(PaymentAddress::class);
    }

    public function isPending(): bool
    {
        return $this->status === 'pending';
    }

    public function isCompleted(): bool
    {
        return $this->status === 'completed';
    }

    public function isExpired(): bool
    {
        return $this->status === 'expired';
    }

    public function hasExpired(): bool
    {
        return $this->expires_at < now();
    }

    public function markAsCompleted(string $txHash): void
    {
        $this->update([
            'status' => 'completed',
            'tx_hash' => $txHash,
        ]);
    }

    public function markAsExpired(): void
    {
        $this->update(['status' => 'expired']);
    }
}
