# 👨‍💻 Developer Guide - Crypto Payment Gateway Plugin

Guía técnica para desarrolladores que quieran extender o customizar el plugin.

---

## 🏗️ Estructura del Plugin

```
crypto-payment-gateway/
├── crypto-payment-gateway.php          # Plugin principal
├── includes/
│   ├── class-crypto-gateway.php        # Clase principal
│   ├── class-wc-gateway-crypto-usdt.php # Gateway de pago
│   ├── class-webhook-handler.php       # Manejador webhooks
│   ├── class-logger.php                # Logger
│   └── class-settings.php              # Configuración
├── templates/
│   └── payment-instructions.php        # Template pago
├── assets/
│   ├── css/checkout.css               # Estilos
│   └── js/checkout.js                 # Scripts
├── languages/
│   └── crypto-payment-gateway.pot      # Traduciones
├── README.md                           # Documentación
├── HOOKS.md                            # Hooks disponibles
└── DEVELOPER_GUIDE.md                  # Esta guía
```

---

## 🔌 Puntos de Extensión

### 1. Agregar nuevas acciones de pago

**Archivo:** `includes/class-wc-gateway-crypto-usdt.php`

```php
public function process_payment($order_id)
{
    // ... código existente ...

    // Agregar hook personalizado
    do_action('before_crypto_order_creation', $order);
    
    $payment_order = $this->create_payment_order(...);
    
    // Agregar hook después de crear
    do_action('after_crypto_order_creation', $order, $payment_order);
}
```

### 2. Modificar el template de pago

**Archivo:** `templates/payment-instructions.php`

```php
// Agregar sección personalizada
?>
<div class="custom-payment-section">
    <?php do_action('custom_payment_instructions', $order_id); ?>
</div>
```

### 3. Extender la clase de webhook

**Archivo:** `includes/class-webhook-handler.php`

```php
public static function handle_webhook(\WP_REST_Request $request)
{
    // ... validación ...
    
    // Hook para validaciones personalizadas
    if (!apply_filters('cryptogateway_validate_webhook', true, $data)) {
        return error_response('Validación personalizada falló');
    }
}
```

---

## 🎣 Ejemplos de Hooks Personalizados

### Hook personalizado: Antes de crear orden

```php
// En includes/class-wc-gateway-crypto-usdt.php
add_action('before_crypto_order_creation', function($order) {
    // Ejecutar lógica personalizada
    error_log('Order ' . $order->get_id() . ' about to be processed');
});
```

### Hook personalizado: Después de completar pago

```php
// En includes/class-webhook-handler.php
add_action('after_payment_completion', function($order, $data) {
    // Crear factura automática
    do_action('create_invoice', $order, $data['amount_crypto']);
}, 10, 2);
```

---

## 🧪 Testing

### Crear transacción de prueba

```php
// En wp-cli o en un script de test
$order_id = 123;
$order = wc_get_order($order_id);

// Simular webhook
$webhook_data = [
    'order_id' => 1,
    'external_order_id' => 'order-' . $order_id,
    'status' => 'completed',
    'amount_usd' => '99.99',
    'amount_crypto' => '99.999999',
    'tx_hash' => '0x' . bin2hex(random_bytes(32)),
    'timestamp' => date('c'),
];

// Crear firma
$payload = json_encode($webhook_data);
$gateway = new WC_Gateway_Crypto_USDT();
$signature = hash_hmac('sha256', $payload, $gateway->get_option('webhook_secret'));

// Simular request
do_action('rest_request_after_callbacks', 
    ['HTTP_X_SIGNATURE' => $signature],
    $webhook_data
);
```

### Test unitario

```php
class Test_Crypto_Webhook extends WP_UnitTestCase
{
    public function test_valid_webhook_signature()
    {
        $payload = json_encode(['order_id' => 1, 'status' => 'completed']);
        $secret = 'test-secret';
        $signature = hash_hmac('sha256', $payload, $secret);

        $this->assertTrue(hash_equals($signature, $signature));
    }

    public function test_order_updated_on_webhook()
    {
        $order = wc_create_order();
        $original_status = $order->get_status();

        // Simular webhook
        // ...

        $order->get_status();
        $this->assertEquals('processing', $order->get_status());
    }
}
```

---

## 🛠️ Configuración para Desarrollo

### Activar debug mode

```php
// En wp-config.php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);

// Logs en wp-content/debug.log
```

### Ver logs del plugin

```bash
tail -f wp-content/logs/wc-crypto-payment-gateway-*.log
```

### Usar WP-CLI para testing

```bash
# Ver opciones del plugin
wp option get --grep="crypto"

# Ejecutar comando personalizado
wp eval 'do_action("cryptogateway_payment_completed", wc_get_order(123), []);'

# Ver logs
wp logs-view --lines=50 --source=crypto-payment-gateway
```

---

## 📦 Customizaciones Comunes

### 1. Agregar campo personalizado en checkout

**Archivo:** `includes/class-wc-gateway-crypto-usdt.php`

```php
public function payment_fields()
{
    if ($this->description) {
        echo wpautop(wptexturize($this->description));
    }

    // Agregar campo
    echo '<div id="custom-field">';
    echo '<label>Referencia (opcional):</label>';
    echo '<input type="text" id="crypto_reference" name="crypto_reference" />';
    echo '</div>';
}

public function process_payment($order_id)
{
    $reference = sanitize_text_field($_POST['crypto_reference'] ?? '');
    update_post_meta($order_id, '_crypto_reference', $reference);
    // ...
}
```

### 2. Cambiar tiempo de expiración

**Modificar en:** `includes/class-wc-gateway-crypto-usdt.php`

```php
// Buscar y cambiar:
// De: 'expires_at' => now()->addMinutes(15)
// A:  'expires_at' => now()->addMinutes(30) // 30 minutos
```

O usar filtro:

```php
add_filter('cryptogateway_expiration_minutes', function() {
    return 30; // 30 minutos
});
```

### 3. Agregar logo personalizado

**Archivo:** `templates/payment-instructions.php`

```php
<div class="crypto-payment-logo">
    <img src="<?php echo esc_url(plugin_dir_url(__FILE__) . 'logo.png'); ?>" 
         alt="Logo" />
</div>
```

---

## 🔐 Seguridad en Desarrollo

### Validación de nonce

```php
if (!wp_verify_nonce($_POST['nonce'], 'crypto_gateway_nonce')) {
    wp_die('Security check failed');
}
```

### Sanitización de inputs

```php
$gateway_url = esc_url_raw($_POST['gateway_url'] ?? '');
$api_key = sanitize_text_field($_POST['api_key'] ?? '');
```

### Escapado de outputs

```php
<div><?php echo esc_html($order->get_id()); ?></div>
<a href="<?php echo esc_url($payment_url); ?>">Link</a>
<input value="<?php echo esc_attr($address); ?>" />
```

---

## 📊 Logging de Debug

```php
// Usar clase Logger
Crypto_Logger::info('Payment created for order: ' . $order->get_id());
Crypto_Logger::error('API Error: ' . $error_message);
Crypto_Logger::warning('Invalid configuration detected');
```

---

## 🚀 Publicación de Cambios

### Versionado semántico

```
Version format: MAJOR.MINOR.PATCH
- MAJOR: Cambios incompatibles
- MINOR: Nuevas funcionalidades compatibles
- PATCH: Fixes de bugs
```

### Crear versión nueva

```bash
# 1. Actualizar versión en crypto-payment-gateway.php
# define('CRYPTO_GATEWAY_VERSION', '1.1.0');

# 2. Actualizar README.md
# Version: 1.1.0

# 3. Crear tag en git
git tag -a v1.1.0 -m "Release version 1.1.0"
git push origin v1.1.0
```

---

## 📝 Estándares de Código

### WordPress Coding Standards

```bash
# Instalar phpcs
composer require --dev wp-coding-standards/wpcs

# Verificar código
./vendor/bin/phpcs includes/ --standard=WordPress
./vendor/bin/phpcbf includes/ --standard=WordPress  # Auto-fix
```

### Documentación de función

```php
/**
 * Crea una orden de pago en el gateway.
 *
 * @param float  $amount_usd        Monto en dólares
 * @param string $external_order_id ID externo de orden
 *
 * @return array|null Array con datos de orden o null si error
 */
private function create_payment_order($amount_usd, $external_order_id)
{
    // ...
}
```

---

## 🤝 Contribuciones

Para contribuir al plugin:

1. Fork el repositorio
2. Crear rama feature: `git checkout -b feature/my-feature`
3. Commit cambios: `git commit -m "Add my feature"`
4. Push: `git push origin feature/my-feature`
5. Crear Pull Request

---

## 📚 Recursos Útiles

- [WooCommerce Plugin Development](https://woocommerce.com/document/create-a-plugin/)
- [WordPress Security](https://developer.wordpress.org/security/)
- [WooCommerce Actions & Filters](https://docs.woocommerce.com/document/hooks/)
- [PHP Security Best Practices](https://www.php.net/manual/en/security.php)

---

**¡Happy coding!** 🚀

Cualquier duda o issue, abre un GitHub Issue o contacta a support@gateway.example.com
