<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('orders', function (Blueprint $table) {
            $table->id();
            $table->foreignId('merchant_id')->constrained('merchants')->onDelete('cascade');
            $table->foreignId('payment_address_id')->constrained('payment_addresses')->onDelete('restrict');
            $table->string('external_order_id');
            $table->decimal('amount_usd', 15, 2);
            $table->decimal('amount_crypto', 15, 6);
            $table->enum('status', ['pending', 'completed', 'expired'])->default('pending');
            $table->string('tx_hash')->nullable();
            $table->timestamp('expires_at');
            $table->timestamps();

            $table->index(['merchant_id', 'status']);
            $table->index('payment_address_id');
            $table->index('status');
            $table->index('expires_at');
            $table->unique(['merchant_id', 'external_order_id']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('orders');
    }
};
