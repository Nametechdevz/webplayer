<?php

namespace Database\Factories;

use App\Models\Merchant;
use App\Models\PaymentAddress;
use Illuminate\Database\Eloquent\Factories\Factory;

class OrderFactory extends Factory
{
    public function definition(): array
    {
        $amountUsd = $this->faker->randomFloat(2, 10, 10000);

        return [
            'merchant_id' => Merchant::factory(),
            'payment_address_id' => PaymentAddress::factory(),
            'external_order_id' => 'order-' . $this->faker->unique()->numerify('#############'),
            'amount_usd' => $amountUsd,
            'amount_crypto' => $amountUsd,
            'status' => 'pending',
            'tx_hash' => null,
            'expires_at' => now()->addMinutes(15),
        ];
    }

    public function completed(): self
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'completed',
            'tx_hash' => '0x' . $this->faker->sha256(),
        ]);
    }

    public function expired(): self
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'expired',
            'expires_at' => now()->subMinutes(1),
        ]);
    }
}
