<?php

if (!defined('ABSPATH')) {
    exit;
}

class Crypto_Settings
{
    public static function get_webhook_url()
    {
        return rest_url('crypto-gateway/v1/webhook');
    }

    public static function get_settings()
    {
        $gateway = new WC_Gateway_Crypto_USDT();
        return [
            'enabled' => $gateway->get_option('enabled'),
            'title' => $gateway->get_option('title'),
            'description' => $gateway->get_option('description'),
            'gateway_url' => $gateway->get_option('gateway_url'),
            'webhook_url' => self::get_webhook_url(),
        ];
    }

    public static function validate_connection($gateway_url, $api_key)
    {
        $response = wp_remote_get($gateway_url . '/api/v1/health', [
            'headers' => [
                'X-Merchant-Key' => $api_key,
            ],
            'timeout' => 5,
        ]);

        return !is_wp_error($response) && wp_remote_retrieve_response_code($response) === 200;
    }
}
