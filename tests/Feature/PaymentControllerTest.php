<?php

namespace Tests\Feature;

use App\Models\Merchant;
use App\Models\PaymentAddress;
use Tests\TestCase;

class PaymentControllerTest extends TestCase
{
    protected Merchant $merchant;
    protected PaymentAddress $address;

    protected function setUp(): void
    {
        parent::setUp();

        $this->merchant = Merchant::factory()->create([
            'status' => 'active',
        ]);

        $this->address = PaymentAddress::factory()->create([
            'status' => 'available',
        ]);
    }

    public function test_create_order_with_valid_data()
    {
        $response = $this->postJson('/api/v1/orders', [
            'amount_usd' => 99.99,
            'external_order_id' => 'order-12345',
        ], [
            'X-Merchant-Key' => $this->merchant->api_key,
        ]);

        $response->assertStatus(201)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'order_id',
                    'payment_address',
                    'amount_crypto',
                    'amount_usd',
                    'expires_at',
                ],
            ])
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('orders', [
            'merchant_id' => $this->merchant->id,
            'external_order_id' => 'order-12345',
            'amount_usd' => '99.99',
        ]);
    }

    public function test_create_order_without_api_key()
    {
        $response = $this->postJson('/api/v1/orders', [
            'amount_usd' => 99.99,
            'external_order_id' => 'order-12345',
        ]);

        $response->assertStatus(401)
            ->assertJson(['success' => false]);
    }

    public function test_create_order_with_invalid_merchant()
    {
        $response = $this->postJson('/api/v1/orders', [
            'amount_usd' => 99.99,
            'external_order_id' => 'order-12345',
        ], [
            'X-Merchant-Key' => 'invalid-key-xyz',
        ]);

        $response->assertStatus(401);
    }

    public function test_create_order_with_inactive_merchant()
    {
        $inactiveMerchant = Merchant::factory()->create([
            'status' => 'inactive',
        ]);

        $response = $this->postJson('/api/v1/orders', [
            'amount_usd' => 99.99,
            'external_order_id' => 'order-12345',
        ], [
            'X-Merchant-Key' => $inactiveMerchant->api_key,
        ]);

        $response->assertStatus(401);
    }

    public function test_create_order_marks_address_as_occupied()
    {
        $this->postJson('/api/v1/orders', [
            'amount_usd' => 99.99,
            'external_order_id' => 'order-12345',
        ], [
            'X-Merchant-Key' => $this->merchant->api_key,
        ]);

        $this->assertTrue(
            $this->address->refresh()->status === 'occupied'
        );
    }

    public function test_create_order_with_missing_fields()
    {
        $response = $this->postJson('/api/v1/orders', [
            'amount_usd' => 99.99,
        ], [
            'X-Merchant-Key' => $this->merchant->api_key,
        ]);

        $response->assertStatus(422);
    }

    public function test_create_order_with_invalid_amount()
    {
        $response = $this->postJson('/api/v1/orders', [
            'amount_usd' => -50,
            'external_order_id' => 'order-12345',
        ], [
            'X-Merchant-Key' => $this->merchant->api_key,
        ]);

        $response->assertStatus(422);
    }

    public function test_duplicate_external_order_id()
    {
        $this->postJson('/api/v1/orders', [
            'amount_usd' => 99.99,
            'external_order_id' => 'order-duplicate',
        ], [
            'X-Merchant-Key' => $this->merchant->api_key,
        ]);

        $response = $this->postJson('/api/v1/orders', [
            'amount_usd' => 50.00,
            'external_order_id' => 'order-duplicate',
        ], [
            'X-Merchant-Key' => $this->merchant->api_key,
        ]);

        $response->assertStatus(422);
    }
}
