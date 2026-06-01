<?php

namespace Database\Factories;

use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

class MerchantFactory extends Factory
{
    public function definition(): array
    {
        return [
            'name' => $this->faker->company(),
            'api_key' => Str::random(32),
            'webhook_url' => $this->faker->url(),
            'webhook_secret' => Str::random(64),
            'status' => 'active',
        ];
    }
}
