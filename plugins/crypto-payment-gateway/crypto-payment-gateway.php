<?php
/**
 * Plugin Name: Crypto Payment Gateway - USDT (TRC20)
 * Plugin URI: https://github.com/Nametechdevz/webplayer
 * Description: Pasarela de pagos en USDT (TRC20) blockchain TRON para WooCommerce
 * Version: 1.0.0
 * Author: Crypto Gateway Team
 * Author URI: https://gateway.example.com
 * License: MIT
 * License URI: https://opensource.org/licenses/MIT
 * Text Domain: crypto-payment-gateway
 * Domain Path: /languages
 * WC requires at least: 6.0
 * WC tested up to: 8.0
 * Requires PHP: 8.0
 */

if (!defined('ABSPATH')) {
    exit;
}

define('CRYPTO_GATEWAY_VERSION', '1.0.0');
define('CRYPTO_GATEWAY_PLUGIN_DIR', plugin_dir_path(__FILE__));
define('CRYPTO_GATEWAY_PLUGIN_URL', plugin_dir_url(__FILE__));
define('CRYPTO_GATEWAY_PLUGIN_FILE', __FILE__);

require_once CRYPTO_GATEWAY_PLUGIN_DIR . 'includes/class-crypto-gateway.php';

register_activation_hook(__FILE__, ['Crypto_Payment_Gateway', 'activate']);
register_deactivation_hook(__FILE__, ['Crypto_Payment_Gateway', 'deactivate']);

add_action('plugins_loaded', ['Crypto_Payment_Gateway', 'init']);
