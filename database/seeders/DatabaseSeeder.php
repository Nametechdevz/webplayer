<?php

namespace Database\Seeders;

use App\Models\Merchant;
use App\Models\Order;
use App\Models\PaymentAddress;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Crear un merchant de prueba
        $merchant = Merchant::create([
            'name' => 'WooCommerce Test Store',
            'api_key' => 'test-api-key-' . Str::random(24),
            'webhook_url' => 'http://localhost:8000/webhook/crypto',
            'webhook_secret' => Str::random(64),
            'status' => 'active',
        ]);

        echo "\n✅ Merchant creado:\n";
        echo "   Nombre: {$merchant->name}\n";
        echo "   API Key: {$merchant->api_key}\n";
        echo "   Webhook Secret: {$merchant->webhook_secret}\n\n";

        // Crear 10 direcciones de pago disponibles
        PaymentAddress::factory(10)->create([
            'status' => 'available',
        ]);

        echo "✅ 10 direcciones de pago creadas\n\n";

        // Crear órdenes de prueba en diferentes estados
        // Órdenes pendientes (recientes)
        Order::factory(3)->create([
            'merchant_id' => $merchant->id,
            'status' => 'pending',
            'expires_at' => now()->addMinutes(10),
        ]);

        // Órdenes completadas
        Order::factory(5)->completed()->create([
            'merchant_id' => $merchant->id,
        ]);

        // Órdenes expiradas
        Order::factory(2)->expired()->create([
            'merchant_id' => $merchant->id,
        ]);

        echo "✅ Órdenes de prueba creadas:\n";
        echo "   - 3 pendientes\n";
        echo "   - 5 completadas\n";
        echo "   - 2 expiradas\n\n";

        echo "🎉 Database seeding completado!\n";
        echo "\n📋 Para usar en desarrollo:\n";
        echo "   curl -X POST http://localhost:8000/api/v1/orders \\\n";
        echo "     -H 'X-Merchant-Key: {$merchant->api_key}' \\\n";
        echo "     -H 'Content-Type: application/json' \\\n";
        echo "     -d '{\"amount_usd\": 99.99, \"external_order_id\": \"order-test\"}'\n\n";
    }
}
