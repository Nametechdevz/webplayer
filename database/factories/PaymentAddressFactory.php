<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;

class PaymentAddressFactory extends Factory
{
    public function definition(): array
    {
        return [
            'address' => 'T' . $this->faker->bothify('####################'),
            'status' => 'available',
            'last_used_at' => null,
        ];
    }

    public function occupied(): self
    {
        return $this->state(fn(array $attributes) => [
            'status' => 'occupied',
            'last_used_at' => now(),
        ]);
    }
}
