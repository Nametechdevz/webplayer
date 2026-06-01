<?php

namespace App\Jobs;

use App\Models\Order;
use GuzzleHttp\Client;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Queue\Queueable;
use Illuminate\Support\Facades\Log;

class SendWebhookNotification implements ShouldQueue
{
    use Queueable;

    public int $tries = 5;
    public int $backoff = 60;

    public function __construct(private Order $order)
    {
    }

    public function handle(): void
    {
        try {
            $merchant = $this->order->merchant;
            $payload = $this->buildPayload();
            $signature = $this->generateSignature($payload, $merchant->webhook_secret);

            $client = new Client([
                'timeout' => 10,
                'connect_timeout' => 5,
            ]);

            $response = $client->post($merchant->webhook_url, [
                'headers' => [
                    'X-Signature' => $signature,
                    'Content-Type' => 'application/json',
                ],
                'json' => $payload,
            ]);

            if ($response->getStatusCode() >= 200 && $response->getStatusCode() < 300) {
                Log::info('Webhook notification sent successfully', [
                    'order_id' => $this->order->id,
                    'merchant_id' => $merchant->id,
                    'status_code' => $response->getStatusCode(),
                ]);
                return;
            }

            Log::warning('Webhook returned non-2xx status', [
                'order_id' => $this->order->id,
                'status_code' => $response->getStatusCode(),
            ]);
        } catch (\GuzzleHttp\Exception\RequestException $e) {
            Log::error('Webhook request failed', [
                'order_id' => $this->order->id,
                'merchant_id' => $this->order->merchant_id,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        } catch (\Exception $e) {
            Log::error('Unexpected error sending webhook', [
                'order_id' => $this->order->id,
                'message' => $e->getMessage(),
            ]);
            throw $e;
        }
    }

    private function buildPayload(): array
    {
        return [
            'order_id' => $this->order->id,
            'external_order_id' => $this->order->external_order_id,
            'status' => $this->order->status,
            'amount_usd' => (string)$this->order->amount_usd,
            'amount_crypto' => (string)$this->order->amount_crypto,
            'tx_hash' => $this->order->tx_hash,
            'timestamp' => now()->toIso8601String(),
        ];
    }

    private function generateSignature(array $payload, string $secret): string
    {
        $jsonPayload = json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
        return hash_hmac('sha256', $jsonPayload, $secret);
    }
}
