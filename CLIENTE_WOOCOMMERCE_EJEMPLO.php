<?php
/**
 * Plugin: Crypto Payment Gateway for WooCommerce
 * Descripción: Integración ejemplo para recibir pagos en USDT (TRC20)
 *
 * Este archivo muestra cómo implementar el cliente en WooCommerce
 * para consumir la API de la pasarela y validar webhooks.
 */

if (!defined('ABSPATH')) {
    exit;
}

class WC_Gateway_Crypto_USDT extends WC_Payment_Gateway
{
    private $gateway_api_url = 'https://gateway.example.com/api/v1';
    private $merchant_api_key = 'your-merchant-api-key-here';
    private $webhook_secret = 'your-webhook-secret-here';

    public function __construct()
    {
        $this->id = 'crypto_usdt_gateway';
        $this->method_title = 'Crypto Payment Gateway (USDT)';
        $this->method_description = 'Paga con USDT (TRC20) en blockchain TRON';
        $this->has_fields = false;
        $this->supports = ['products', 'refunds'];

        // Cargar opciones
        $this->init_settings();
        $this->title = $this->get_option('title');
        $this->description = $this->get_option('description');

        // Guardar configuración
        add_action('woocommerce_update_options_payment_gateways_' . $this->id,
            [$this, 'process_admin_options']);

        // Endpoint para webhook
        add_action('rest_api_init', [$this, 'register_webhook_endpoint']);
    }

    /**
     * Procesar el pago cuando el cliente elige esta opción
     */
    public function process_payment($order_id)
    {
        try {
            $order = wc_get_order($order_id);

            // Paso 1: Solicitar orden de pago al gateway
            $payment_order = $this->create_payment_order(
                $order->get_total(),
                'order-' . $order_id
            );

            if (!$payment_order['success']) {
                throw new Exception('No se pudo crear la orden de pago');
            }

            // Paso 2: Guardar datos de pago en la orden de WooCommerce
            update_post_meta($order_id, '_crypto_payment_address',
                $payment_order['data']['payment_address']);
            update_post_meta($order_id, '_crypto_order_id',
                $payment_order['data']['order_id']);
            update_post_meta($order_id, '_crypto_amount',
                $payment_order['data']['amount_crypto']);
            update_post_meta($order_id, '_crypto_expires_at',
                $payment_order['data']['expires_at']);

            // Paso 3: Actualizar estado de la orden a "Pendiente pago"
            $order->update_status('pending',
                'Esperando confirmación de pago en blockchain');

            // Paso 4: Redirigir a página de confirmación
            return [
                'result' => 'success',
                'redirect' => $order->get_checkout_payment_url(true),
            ];

        } catch (Exception $e) {
            wc_add_notice('Error: ' . $e->getMessage(), 'error');
            WC_Log_Handler_File::log('Crypto Gateway Error', $e->getMessage());
            return ['result' => 'failure'];
        }
    }

    /**
     * Crear una orden de pago en el gateway
     */
    private function create_payment_order($amount_usd, $external_order_id)
    {
        $response = wp_remote_post($this->gateway_api_url . '/orders', [
            'method' => 'POST',
            'timeout' => 10,
            'redirection' => 0,
            'httpversion' => '1.0',
            'blocking' => true,
            'headers' => [
                'X-Merchant-Key' => $this->merchant_api_key,
                'Content-Type' => 'application/json',
                'User-Agent' => 'WooCommerce-CryptoGateway/1.0',
            ],
            'body' => json_encode([
                'amount_usd' => (float)$amount_usd,
                'external_order_id' => $external_order_id,
            ]),
        ]);

        if (is_wp_error($response)) {
            throw new Exception('Error de conexión: ' . $response->get_error_message());
        }

        $status_code = wp_remote_retrieve_response_code($response);
        $body = wp_remote_retrieve_body($response);
        $data = json_decode($body, true);

        if ($status_code !== 201 || !$data['success']) {
            throw new Exception($data['message'] ?? 'Error al crear orden de pago');
        }

        return $data;
    }

    /**
     * Mostrar detalles de pago en la página de confirmación
     */
    public function thankyou_page($order_id)
    {
        $address = get_post_meta($order_id, '_crypto_payment_address', true);
        $amount = get_post_meta($order_id, '_crypto_amount', true);
        $expires_at = get_post_meta($order_id, '_crypto_expires_at', true);
        $order = wc_get_order($order_id);

        if ($order->get_status() === 'pending' && $address) {
            ?>
            <div class="crypto-payment-info">
                <h2>Envía tu pago en USDT (TRC20)</h2>

                <div class="payment-details">
                    <p>
                        <strong>Dirección de pago:</strong><br/>
                        <code id="payment-address"><?php echo esc_html($address); ?></code>
                        <button class="copy-btn" onclick="copyToClipboard()">Copiar</button>
                    </p>

                    <p>
                        <strong>Monto:</strong><br/>
                        <code><?php echo esc_html($amount); ?> USDT</code>
                    </p>

                    <p>
                        <strong>Vencimiento:</strong><br/>
                        <span id="countdown" data-expires="<?php echo esc_attr($expires_at); ?>"></span>
                    </p>
                </div>

                <div class="qr-code">
                    <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=tron:<?php echo esc_attr($address); ?>"
                         alt="QR Code TRON" />
                </div>

                <div class="instructions">
                    <h3>Instrucciones:</h3>
                    <ol>
                        <li>Abre tu wallet TRON (TronLink, Ledger, etc.)</li>
                        <li>Selecciona enviar USDT</li>
                        <li>Pega la dirección de pago arriba</li>
                        <li>Ingresa el monto exacto: <?php echo esc_html($amount); ?> USDT</li>
                        <li>Confirma la transacción</li>
                        <li>¡Esperaremos confirmación en blockchain! ⏳</li>
                    </ol>
                </div>

                <style>
                    .crypto-payment-info {
                        background: #f5f5f5;
                        padding: 20px;
                        border-radius: 8px;
                        max-width: 600px;
                    }

                    .payment-details {
                        background: white;
                        padding: 15px;
                        border-radius: 5px;
                        margin: 15px 0;
                        border-left: 4px solid #0066cc;
                    }

                    .payment-details code {
                        display: block;
                        background: #f0f0f0;
                        padding: 10px;
                        border-radius: 3px;
                        word-break: break-all;
                        font-family: monospace;
                        font-size: 12px;
                        margin: 5px 0;
                    }

                    .copy-btn {
                        background: #0066cc;
                        color: white;
                        border: none;
                        padding: 8px 12px;
                        border-radius: 3px;
                        cursor: pointer;
                        font-size: 12px;
                        margin-top: 5px;
                    }

                    .copy-btn:hover {
                        background: #0052a3;
                    }

                    .qr-code {
                        text-align: center;
                        margin: 20px 0;
                    }

                    .qr-code img {
                        max-width: 300px;
                        border: 1px solid #ddd;
                        padding: 10px;
                        background: white;
                    }

                    .instructions {
                        background: white;
                        padding: 15px;
                        border-radius: 5px;
                        margin-top: 15px;
                    }

                    .instructions ol {
                        margin: 10px 0;
                        padding-left: 20px;
                    }

                    .instructions li {
                        margin: 8px 0;
                        line-height: 1.6;
                    }

                    #countdown {
                        color: #d9534f;
                        font-weight: bold;
                    }
                </style>

                <script>
                    function copyToClipboard() {
                        const address = document.getElementById('payment-address').textContent;
                        navigator.clipboard.writeText(address).then(() => {
                            alert('Dirección copiada al portapapeles');
                        });
                    }

                    function updateCountdown() {
                        const expiresAt = new Date(
                            document.getElementById('countdown').dataset.expires
                        );
                        const now = new Date();
                        const diff = expiresAt - now;

                        if (diff <= 0) {
                            document.getElementById('countdown').textContent =
                                'Orden expirada';
                            return;
                        }

                        const minutes = Math.floor(diff / 60000);
                        const seconds = Math.floor((diff % 60000) / 1000);

                        document.getElementById('countdown').textContent =
                            `${minutes}:${seconds.toString().padStart(2, '0')}`;
                    }

                    updateCountdown();
                    setInterval(updateCountdown, 1000);
                </script>
            </div>
            <?php
        }
    }

    /**
     * Registrar endpoint para webhook
     */
    public function register_webhook_endpoint()
    {
        register_rest_route('crypto-gateway/v1', '/webhook', [
            'methods' => 'POST',
            'callback' => [$this, 'handle_webhook'],
            'permission_callback' => '__return_true', // La validación es por firma HMAC
        ]);
    }

    /**
     * Manejar el webhook del gateway
     */
    public function handle_webhook(\WP_REST_Request $request)
    {
        try {
            // Paso 1: Validar firma HMAC
            $signature = $request->get_header('X-Signature');
            $payload = $request->get_body();

            if (!$this->verify_webhook_signature($payload, $signature)) {
                return new \WP_REST_Response([
                    'success' => false,
                    'message' => 'Webhook signature invalid',
                ], 401);
            }

            // Paso 2: Procesar datos
            $data = $request->get_json_params();

            if (empty($data['external_order_id']) || empty($data['status'])) {
                throw new Exception('Datos de webhook incompletos');
            }

            // Paso 3: Obtener orden de WooCommerce
            $order_id = str_replace('order-', '', $data['external_order_id']);
            $order = wc_get_order((int)$order_id);

            if (!$order) {
                throw new Exception('Orden de WooCommerce no encontrada');
            }

            // Paso 4: Actualizar estado según webhook
            if ($data['status'] === 'completed') {
                $order->update_status('processing',
                    'Pago confirmado en blockchain TRON');
                $order->add_order_note(
                    'Transacción: ' . $data['tx_hash'] .
                    ' | Monto: ' . $data['amount_crypto'] . ' USDT'
                );

                // Enviar email al cliente
                WC()->mailer()->emails['WC_Email_Customer_Processing_Order']
                    ->trigger($order->get_id());
            } else if ($data['status'] === 'expired') {
                $order->update_status('failed',
                    'Orden de pago expirada. Reintenta con una nueva.');
            }

            // Guardar datos de la transacción
            update_post_meta($order_id, '_crypto_tx_hash',
                $data['tx_hash'] ?? null);
            update_post_meta($order_id, '_crypto_webhook_received',
                current_time('mysql'));

            return new \WP_REST_Response([
                'success' => true,
                'message' => 'Webhook processed successfully',
            ], 200);

        } catch (Exception $e) {
            WC_Log_Handler_File::log('Crypto Gateway Webhook Error',
                $e->getMessage());

            return new \WP_REST_Response([
                'success' => false,
                'message' => $e->getMessage(),
            ], 500);
        }
    }

    /**
     * Verificar firma HMAC del webhook
     */
    private function verify_webhook_signature($payload, $signature)
    {
        $expected_signature = hash_hmac(
            'sha256',
            $payload,
            $this->webhook_secret
        );

        // Comparación timing-safe
        return hash_equals($expected_signature, $signature ?? '');
    }

    /**
     * Inicializar opciones del gateway
     */
    public function init_form_fields()
    {
        $this->form_fields = [
            'enabled' => [
                'title' => 'Habilitar',
                'type' => 'checkbox',
                'label' => 'Habilitar Crypto Gateway',
                'default' => 'no',
            ],
            'title' => [
                'title' => 'Título',
                'type' => 'text',
                'description' => 'Título que verá el cliente',
                'default' => 'Pagar con USDT',
                'desc_tip' => true,
            ],
            'description' => [
                'title' => 'Descripción',
                'type' => 'textarea',
                'description' => 'Descripción de la opción de pago',
                'default' => 'Paga con USDT (TRC20) en blockchain TRON',
            ],
            'api_key' => [
                'title' => 'API Key del Gateway',
                'type' => 'password',
                'description' => 'Tu clave API de merchant',
                'desc_tip' => true,
            ],
            'webhook_secret' => [
                'title' => 'Webhook Secret',
                'type' => 'password',
                'description' => 'Secreto para validar webhooks',
                'desc_tip' => true,
            ],
        ];
    }
}

/**
 * Registrar gateway en WooCommerce
 */
function register_crypto_gateway($methods)
{
    $methods[] = 'WC_Gateway_Crypto_USDT';
    return $methods;
}

add_filter('woocommerce_payment_gateways', 'register_crypto_gateway');

?>
