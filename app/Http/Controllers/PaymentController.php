<?php

namespace App\Http\Controllers;

use App\Models\Merchant;
use App\Models\Order;
use App\Models\PaymentAddress;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class PaymentController extends Controller
{
    private const USDT_DECIMALS = 1_000_000;
    private const ORDER_EXPIRATION_MINUTES = 15;

    public function createOrder(Request $request): JsonResponse
    {
        try {
            $apiKey = $request->header('X-Merchant-Key');

            if (!$apiKey) {
                return response()->json([
                    'success' => false,
                    'message' => 'X-Merchant-Key header is required',
                ], 401);
            }

            $merchant = Merchant::where('api_key', $apiKey)
                ->where('status', 'active')
                ->first();

            if (!$merchant) {
                Log::warning('Invalid merchant API key attempt', [
                    'api_key' => substr($apiKey, 0, 10) . '...',
                ]);
                return response()->json([
                    'success' => false,
                    'message' => 'Invalid or inactive merchant',
                ], 401);
            }

            $validated = $request->validate([
                'amount_usd' => 'required|numeric|min:0.01|max:999999.99',
                'external_order_id' => 'required|string|max:255',
            ]);

            $order = DB::transaction(function () use ($merchant, $validated) {
                $paymentAddress = PaymentAddress::where('status', 'available')
                    ->lockForUpdate()
                    ->first();

                if (!$paymentAddress) {
                    Log::error('No available payment addresses', [
                        'merchant_id' => $merchant->id,
                    ]);
                    throw new \Exception('No available payment addresses');
                }

                $amountCrypto = $this->convertUsdToCrypto((float)$validated['amount_usd']);

                $paymentAddress->markAsOccupied();

                return Order::create([
                    'merchant_id' => $merchant->id,
                    'payment_address_id' => $paymentAddress->id,
                    'external_order_id' => $validated['external_order_id'],
                    'amount_usd' => $validated['amount_usd'],
                    'amount_crypto' => $amountCrypto,
                    'expires_at' => now()->addMinutes(self::ORDER_EXPIRATION_MINUTES),
                ]);
            });

            Log::info('Payment order created', [
                'order_id' => $order->id,
                'merchant_id' => $merchant->id,
                'external_order_id' => $validated['external_order_id'],
                'amount_usd' => $validated['amount_usd'],
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'order_id' => $order->id,
                    'payment_address' => $order->paymentAddress->address,
                    'amount_crypto' => (string)$order->amount_crypto,
                    'amount_usd' => (string)$order->amount_usd,
                    'expires_at' => $order->expires_at->toIso8601String(),
                ],
            ], 201);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::warning('Validation error in createOrder', [
                'errors' => $e->errors(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Validation error',
                'errors' => $e->errors(),
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error creating payment order', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return response()->json([
                'success' => false,
                'message' => 'Failed to create payment order',
            ], 500);
        }
    }

    private function convertUsdToCrypto(float $amountUsd): float
    {
        return $amountUsd;
    }
}
