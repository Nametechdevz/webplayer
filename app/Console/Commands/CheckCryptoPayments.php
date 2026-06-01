<?php

namespace App\Console\Commands;

use App\Jobs\SendWebhookNotification;
use App\Models\Order;
use GuzzleHttp\Client;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class CheckCryptoPayments extends Command
{
    protected $signature = 'app:check-crypto-payments';
    protected $description = 'Check for completed crypto payments on TRON blockchain';

    private const TRONGRID_API = 'https://api.trongrid.io';
    private const USDT_CONTRACT = 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t';
    private const USDT_DECIMALS = 1_000_000;
    private const ORDER_EXPIRATION_MINUTES = 15;

    public function handle(): int
    {
        try {
            $this->validatePendingOrders();
            $this->expireOrdersIfNeeded();
            return self::SUCCESS;
        } catch (\Exception $e) {
            Log::error('Error in CheckCryptoPayments command', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);
            return self::FAILURE;
        }
    }

    private function validatePendingOrders(): void
    {
        $orders = Order::where('status', 'pending')
            ->where('expires_at', '>', now())
            ->with(['paymentAddress', 'merchant'])
            ->get();

        if ($orders->isEmpty()) {
            $this->info('No pending orders to validate');
            return;
        }

        $client = new Client([
            'timeout' => 10,
            'connect_timeout' => 5,
        ]);

        foreach ($orders as $order) {
            try {
                $this->checkOrderPayment($order, $client);
            } catch (\Exception $e) {
                Log::error('Error checking order payment', [
                    'order_id' => $order->id,
                    'message' => $e->getMessage(),
                ]);
            }
        }
    }

    private function checkOrderPayment(Order $order, Client $client): void
    {
        $address = $order->paymentAddress->address;
        $expectedAmount = (int)($order->amount_crypto * self::USDT_DECIMALS);

        try {
            $response = $client->get(self::TRONGRID_API . '/v1/accounts/' . $address . '/transactions/trc20');
            $data = json_decode($response->getBody(), true);

            if (!isset($data['data'])) {
                $this->info("No transactions found for address: {$address}");
                return;
            }

            $transaction = $this->findMatchingTransaction($data['data'], $expectedAmount);

            if (!$transaction) {
                $this->info("No matching transaction found for order: {$order->id}");
                return;
            }

            $this->processCompletedPayment($order, $transaction['transaction_id']);
        } catch (\GuzzleHttp\Exception\RequestException $e) {
            Log::error('TronGrid API error', [
                'address' => $address,
                'message' => $e->getMessage(),
            ]);
        }
    }

    private function findMatchingTransaction(array $transactions, int $expectedAmount): ?array
    {
        foreach ($transactions as $transaction) {
            if (!$this->isValidTransaction($transaction, $expectedAmount)) {
                continue;
            }

            return $transaction;
        }

        return null;
    }

    private function isValidTransaction(array $transaction, int $expectedAmount): bool
    {
        if ($transaction['type'] !== 'Transfer') {
            return false;
        }

        if ($transaction['token_info']['address'] !== self::USDT_CONTRACT) {
            return false;
        }

        if ((int)$transaction['value'] !== $expectedAmount) {
            return false;
        }

        return (int)$transaction['result'] === 1;
    }

    private function processCompletedPayment(Order $order, string $txHash): void
    {
        $order->markAsCompleted($txHash);
        $order->paymentAddress->markAsAvailable();

        SendWebhookNotification::dispatch($order);

        Log::info('Payment completed', [
            'order_id' => $order->id,
            'tx_hash' => $txHash,
        ]);

        $this->info("Order {$order->id} marked as completed with tx: {$txHash}");
    }

    private function expireOrdersIfNeeded(): void
    {
        $expiredOrders = Order::where('status', 'pending')
            ->where('expires_at', '<', now())
            ->with('paymentAddress')
            ->get();

        foreach ($expiredOrders as $order) {
            $order->markAsExpired();
            $order->paymentAddress->markAsAvailable();

            Log::info('Order expired', [
                'order_id' => $order->id,
            ]);

            $this->info("Order {$order->id} marked as expired");
        }
    }
}
