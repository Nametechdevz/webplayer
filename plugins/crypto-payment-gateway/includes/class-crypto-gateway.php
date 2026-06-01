<?php

if (!defined('ABSPATH')) {
    exit;
}

class Crypto_Payment_Gateway
{
    private static $instance = null;

    public static function init()
    {
        if (is_null(self::$instance)) {
            self::$instance = new self();
        }
        return self::$instance;
    }

    public function __construct()
    {
        $this->load_dependencies();
        $this->register_hooks();
    }

    private function load_dependencies()
    {
        require_once CRYPTO_GATEWAY_PLUGIN_DIR . 'includes/class-wc-gateway-crypto-usdt.php';
        require_once CRYPTO_GATEWAY_PLUGIN_DIR . 'includes/class-webhook-handler.php';
        require_once CRYPTO_GATEWAY_PLUGIN_DIR . 'includes/class-logger.php';
        require_once CRYPTO_GATEWAY_PLUGIN_DIR . 'includes/class-settings.php';
    }

    private function register_hooks()
    {
        add_filter('woocommerce_payment_gateways', [$this, 'register_gateway']);
        add_action('wp_enqueue_scripts', [$this, 'enqueue_scripts']);
        add_action('rest_api_init', [$this, 'register_webhook_route']);
        add_filter('plugin_action_links_' . plugin_basename(CRYPTO_GATEWAY_PLUGIN_FILE),
            [$this, 'plugin_action_links']);
    }

    public function register_gateway($gateways)
    {
        $gateways[] = 'WC_Gateway_Crypto_USDT';
        return $gateways;
    }

    public function enqueue_scripts()
    {
        if (is_checkout()) {
            wp_enqueue_style(
                'crypto-gateway-checkout',
                CRYPTO_GATEWAY_PLUGIN_URL . 'assets/css/checkout.css',
                [],
                CRYPTO_GATEWAY_VERSION
            );

            wp_enqueue_script(
                'crypto-gateway-checkout',
                CRYPTO_GATEWAY_PLUGIN_URL . 'assets/js/checkout.js',
                ['jquery'],
                CRYPTO_GATEWAY_VERSION,
                true
            );

            wp_localize_script('crypto-gateway-checkout', 'cryptoGateway', [
                'ajaxUrl' => admin_url('admin-ajax.php'),
            ]);
        }
    }

    public function register_webhook_route()
    {
        register_rest_route('crypto-gateway/v1', '/webhook', [
            'methods' => 'POST',
            'callback' => ['Crypto_Webhook_Handler', 'handle_webhook'],
            'permission_callback' => '__return_true',
        ]);
    }

    public function plugin_action_links($links)
    {
        $settings_link = sprintf(
            '<a href="%s">%s</a>',
            admin_url('admin.php?page=wc-settings&tab=checkout&section=crypto_usdt'),
            __('Configurar', 'crypto-payment-gateway')
        );
        array_unshift($links, $settings_link);
        return $links;
    }

    public static function activate()
    {
        if (!class_exists('WooCommerce')) {
            deactivate_plugins(plugin_basename(CRYPTO_GATEWAY_PLUGIN_FILE));
            wp_die('Este plugin requiere WooCommerce activo.');
        }

        Crypto_Logger::log('Plugin activado', 'info');
    }

    public static function deactivate()
    {
        Crypto_Logger::log('Plugin desactivado', 'info');
    }
}
