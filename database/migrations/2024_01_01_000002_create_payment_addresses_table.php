<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_addresses', function (Blueprint $table) {
            $table->id();
            $table->string('address')->unique();
            $table->enum('status', ['available', 'occupied'])->default('available');
            $table->timestamp('last_used_at')->nullable();
            $table->timestamps();

            $table->index('status');
            $table->index('address');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_addresses');
    }
};
