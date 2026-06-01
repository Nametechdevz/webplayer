<?php

if (!defined('ABSPATH')) {
    exit;
}

class WC_Gateway_Crypto_USDT extends WC_Payment_Gateway
{
    private $gateway_url = '';
    private $api_key = '';
    private $webhook_secret = '';

    public function __construct()
    {
        $this->id = 'crypto_usdt_gateway';
        $this->method_title = __('Crypto Payment Gateway (USDT)', 'crypto-payment-gateway');
        $this->method_description = __('Paga con USDT (TRC20) en blockchain TRON', 'crypto-payment-gateway');
        $this->has_fields = false;
        $this->supports = ['products', 'refunds'];

        $this->init_form_fields();
        $this->init_settings();

        $this->title = $this->get_option('title');
        $this->description = $this->get_option('description');
        $this->gateway_url = $this->get_option('gateway_url');
        $this->api_key = $this->get_option('api_key');
        $this->webhook_secret = $this->get_option('webhook_secret');

        add_action('woocommerce_update_options_payment_gateways_' . $this->id,
            [$this, 'process_admin_options']);
        add_action('woocommerce_thankyou_' . $this->id,
            [$this, 'thankyou_page']);
    }

    public function init_form_fields()
    {
        $this->form_fields = [
            'enabled' => [
                'title' => __('Habilitar/Deshabilitar', 'crypto-payment-gateway'),
                'type' => 'checkbox',
                'label' => __('Habilitar Crypto Payment Gateway', 'crypto-payment-gateway'),
                'default' => 'no',
            ],
            'title' => [
                'title' => __('Título', 'crypto-payment-gateway'),
                'type' => 'text',
                'description' => __('Título que verá el cliente en checkout', 'crypto-payment-gateway'),
                'default' => __('Pagar con USDT', 'crypto-payment-gateway'),
                'desc_tip' => true,
            ],
            'description' => [
                'title' => __('Descripción', 'crypto-payment-gateway'),
                'type' => 'textarea',
                'description' => __('Descripción del método de pago', 'crypto-payment-gateway'),
                'default' => __('Paga de forma segura con USDT en blockchain TRON', 'crypto-payment-gateway'),
            ],
            'gateway_url' => [
                'title' => __('URL del Gateway', 'crypto-payment-gateway'),
                'type' => 'url',
                'description' => __('URL base de tu pasarela de pagos', 'crypto-payment-gateway'),
                'placeholder' => 'https://gateway.example.com',
                'desc_tip' => true,
            ],
            'api_key' => [
                'title' => __('API Key del Merchant', 'crypto-payment-gateway'),
                'type' => 'password',
                'description' => __('Tu clave API del merchant', 'crypto-payment-gateway'),
                'desc_tip' => true,
            ],
            'webhook_secret' => [
                'title' => __('Webhook Secret', 'crypto-payment-gateway'),
                'type' => 'password',
                'description' => __('Secreto para validar webhooks', 'crypto-payment-gateway'),
                'desc_tip' => true,
            ],
        ];
    }

    public function process_payment($order_id)
    {
        try {
            $order = wc_get_order($order_id);

            if (!$this->is_configured()) {
                throw new Exception(__('Gateway no configurado correctamente', 'crypto-payment-gateway'));
            }

            $payment_order = $this->create_payment_order(
                $order->get_total(),
                'order-' . $order_id
            );

            if (!$payment_order || !isset($payment_order['data'])) {
                throw new Exception(__('No se pudo crear la orden de pago', 'crypto-payment-gateway'));
            }

            update_post_meta($order_id, '_crypto_payment_address',
                $payment_order['data']['payment_address']);
            update_post_meta($order_id, '_crypto_order_id',
                $payment_order['data']['order_id']);
            update_post_meta($order_id, '_crypto_amount',
                $payment_order['data']['amount_crypto']);
            update_post_meta($order_id, '_crypto_expires_at',
                $payment_order['data']['expires_at']);

            $order->update_status('pending',
                __('Esperando confirmación de pago en blockchain', 'crypto-payment-gateway'));

            WC()->cart->empty_cart();

            return [
                'result' => 'success',
                'redirect' => $order->get_checkout_payment_url(true),
            ];

        } catch (Exception $e) {
            wc_add_notice(__('Error: ', 'crypto-payment-gateway') . $e->getMessage(), 'error');
            Crypto_Logger::log('Crypto Gateway Error: ' . $e->getMessage(), 'error');
            return ['result' => 'failure'];
        }
    }

    private function create_payment_order($amount_usd, $external_order_id)
    {
        $response = wp_remote_post($this->gateway_url . '/api/v1/orders', [
            'method' => 'POST',
            'timeout' => 10,
            'redirection' => 0,
            'httpversion' => '1.0',
            'blocking' => true,
            'headers' => [
                'X-Merchant-Key' => $this->api_key,
                'Content-Type' => 'application/json',
                'User-Agent' => 'WooCommerce-CryptoGateway/' . CRYPTO_GATEWAY_VERSION,
            ],
            'body' => json_encode([
                'amount_usd' => (float)$amount_usd,
                'external_order_id' => $external_order_id,
            ]),
        ]);

        if (is_wp_error($response)) {
            Crypto_Logger::log('TronGrid API Error: ' . $response->get_error_message(), 'error');
            return null;
        }

        $status_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if ($status_code !== 201) {
            Crypto_Logger::log('Gateway Error: ' . ($data['message'] ?? 'Unknown error'), 'error');
            return null;
        }

        Crypto_Logger::log('Payment order created: ' . $data['data']['order_id'], 'info');
        return $data;
    }

    public function thankyou_page($order_id)
    {
        $address = get_post_meta($order_id, '_crypto_payment_address', true);
        $amount = get_post_meta($order_id, '_crypto_amount', true);
        $expires_at = get_post_meta($order_id, '_crypto_expires_at', true);
        $order = wc_get_order($order_id);

        if ($order->get_status() === 'pending' && $address) {
            include CRYPTO_GATEWAY_PLUGIN_DIR . 'templates/payment-instructions.php';
        }
    }

    private function is_configured()
    {
        return !empty($this->gateway_url) && !empty($this->api_key) && !empty($this->webhook_secret);
    }
}
