<?php

if (!defined('ABSPATH')) {
    exit;
}

class Crypto_Webhook_Handler
{
    public static function handle_webhook(\WP_REST_Request $request)
    {
        try {
            $signature = $request->get_header('X-Signature');
            $payload = $request->get_body();

            if (!self::verify_signature($payload, $signature)) {
                Crypto_Logger::log('Invalid webhook signature', 'warning');
                return new \WP_REST_Response([
                    'success' => false,
                    'message' => 'Invalid signature',
                ], 401);
            }

            $data = $request->get_json_params();

            if (empty($data['external_order_id']) || empty($data['status'])) {
                return new \WP_REST_Response([
                    'success' => false,
                    'message' => 'Missing required fields',
                ], 400);
            }

            $order_id = (int)str_replace('order-', '', $data['external_order_id']);
            $order = wc_get_order($order_id);

            if (!$order) {
                Crypto_Logger::log('Order not found: ' . $order_id, 'warning');
                return new \WP_REST_Response([
                    'success' => false,
                    'message' => 'Order not found',
                ], 404);
            }

            self::process_payment_status($order, $data);

            Crypto_Logger::log('Webhook processed: order ' . $order_id, 'info');

            return new \WP_REST_Response([
                'success' => true,
                'message' => 'Webhook processed',
            ], 200);

        } catch (Exception $e) {
            Crypto_Logger::log('Webhook Error: ' . $e->getMessage(), 'error');
            return new \WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    private static function process_payment_status(\WC_Order $order, array $data)
    {
        if ($data['status'] === 'completed') {
            $order->update_status('processing',
                __('Pago confirmado en blockchain TRON', 'crypto-payment-gateway'));
            $order->add_order_note(sprintf(
                __('Transacción: %s | Monto: %s USDT', 'crypto-payment-gateway'),
                $data['tx_hash'] ?? 'N/A',
                $data['amount_crypto'] ?? 'N/A'
            ));

            do_action('cryptogateway_payment_completed', $order, $data);

            $email_notification = WC()->mailer()->emails['WC_Email_Customer_Processing_Order'];
            if ($email_notification) {
                $email_notification->trigger($order->get_id());
            }
        } elseif ($data['status'] === 'expired') {
            $order->update_status('failed',
                __('Orden de pago expirada. Reintenta con una nueva.', 'crypto-payment-gateway'));

            do_action('cryptogateway_payment_expired', $order);
        }

        update_post_meta($order->get_id(), '_crypto_tx_hash', $data['tx_hash'] ?? null);
        update_post_meta($order->get_id(), '_crypto_webhook_received', current_time('mysql'));
    }

    private static function verify_signature($payload, $signature)
    {
        $gateway = new WC_Gateway_Crypto_USDT();
        $webhook_secret = $gateway->get_option('webhook_secret');

        if (empty($webhook_secret)) {
            return false;
        }

        $expected = hash_hmac('sha256', $payload, $webhook_secret);
        return hash_equals($expected, $signature ?? '');
    }
}
