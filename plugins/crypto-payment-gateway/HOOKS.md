# 🪝 Hooks Disponibles

El plugin Crypto Payment Gateway ofrece varios hooks (acciones y filtros) que puedes usar para personalizar el comportamiento.

---

## 📍 Acciones (Actions)

### `cryptogateway_payment_completed`

Se ejecuta cuando un pago se confirma en blockchain.

**Parámetros:**
- `$order` (WC_Order) - La orden de WooCommerce
- `$data` (array) - Datos del webhook

**Ejemplo:**

```php
add_action('cryptogateway_payment_completed', function($order, $data) {
    // Enviar email personalizado
    $to = $order->get_billing_email();
    $subject = 'Pago confirmado en blockchain TRON';
    $message = sprintf(
        'Tu pago de %s USDT ha sido confirmado.\nHash: %s',
        $data['amount_crypto'],
        $data['tx_hash']
    );
    wp_mail($to, $subject, $message);

    // Registrar en log
    error_log('Payment completed for order: ' . $order->get_id());

    // Ejecutar acción personalizada
    do_action('my_custom_order_paid', $order, $data);
}, 10, 2);
```

**Caso de uso:**
- Enviar emails personalizados
- Crear registros en sistemas externos
- Disparar webhooks propios
- Actualizar inventario automáticamente

---

### `cryptogateway_payment_expired`

Se ejecuta cuando una orden de pago expira (15 minutos sin pago).

**Parámetros:**
- `$order` (WC_Order) - La orden de WooCommerce

**Ejemplo:**

```php
add_action('cryptogateway_payment_expired', function($order) {
    // Notificar al administrador
    $admin_email = get_option('admin_email');
    wp_mail(
        $admin_email,
        'Orden expirada sin pago: #' . $order->get_id(),
        'La orden #' . $order->get_id() . ' expiró sin recibir pago.'
    );

    // Guardar en log
    error_log('Order expired: ' . $order->get_id());
});
```

**Caso de uso:**
- Notificar al administrador de órdenes expiradas
- Limpiar datos temporales
- Ejecutar análisis de conversión

---

## 🎨 Filtros (Filters)

### `cryptogateway_payment_address_text`

Filtra el texto de la dirección de pago mostrada.

**Parámetros:**
- `$address` (string) - La dirección TRON

**Retorna:**
- string - La dirección modificada

**Ejemplo:**

```php
add_filter('cryptogateway_payment_address_text', function($address) {
    // Mostrar solo los últimos 6 caracteres
    return '...' . substr($address, -6);
});
```

---

### `cryptogateway_webhook_payload`

Filtra los datos del webhook antes de procesarlo.

**Parámetros:**
- `$payload` (array) - Datos del webhook

**Retorna:**
- array - Payload modificado

**Ejemplo:**

```php
add_filter('cryptogateway_webhook_payload', function($payload) {
    // Log adicional
    error_log('Webhook received: ' . json_encode($payload));
    return $payload;
});
```

---

## 📊 Ejemplos Avanzados

### Integración con CRM

```php
add_action('cryptogateway_payment_completed', function($order, $data) {
    // Integrar con HubSpot, Salesforce, etc.
    $customer = new Customer_Manager();
    $customer->update_payment_status(
        $order->get_user_id(),
        'paid',
        $data['tx_hash']
    );
}, 10, 2);
```

### Notificaciones por SMS

```php
add_action('cryptogateway_payment_completed', function($order, $data) {
    // Usar Twilio o similar
    $phone = $order->get_billing_phone();
    send_sms($phone, sprintf(
        'Tu pago de %s USDT ha sido confirmado. Orden: %d',
        $data['amount_crypto'],
        $order->get_id()
    ));
}, 10, 2);
```

### Actualización de base de datos personalizada

```php
add_action('cryptogateway_payment_completed', function($order, $data) {
    global $wpdb;

    // Guardar en tabla personalizada
    $wpdb->insert('wp_crypto_transactions', [
        'order_id' => $order->get_id(),
        'tx_hash' => $data['tx_hash'],
        'amount' => $data['amount_crypto'],
        'status' => $data['status'],
        'timestamp' => current_time('mysql'),
    ]);
}, 10, 2);
```

### Analytics personalizado

```php
add_action('cryptogateway_payment_completed', function($order, $data) {
    // Enviar a Google Analytics
    wp_remote_post('https://www.google-analytics.com/collect', [
        'body' => http_build_query([
            'v' => 1,
            'tid' => 'UA-XXXXX-Y',
            'cid' => $order->get_customer_id(),
            't' => 'event',
            'ec' => 'ecommerce',
            'ea' => 'purchase',
            'ev' => (int)($order->get_total() * 100),
        ]),
    ]);
}, 10, 2);
```

---

## 🔍 Depuración de Hooks

### Ver qué hooks se ejecutan

```php
// Agregar en functions.php
add_action('all', function($tag) {
    if (strpos($tag, 'cryptogateway') !== false) {
        error_log('Hook executed: ' . $tag);
    }
});
```

### Ejecutar hook manualmente (para testing)

```php
// En el admin o via WP-CLI
do_action('cryptogateway_payment_completed', $order, [
    'order_id' => 123,
    'status' => 'completed',
    'amount_crypto' => '99.999999',
    'tx_hash' => '0x1234...',
]);
```

---

## 📚 Referencia Completa

| Hook | Tipo | Parámetros | Descripción |
|------|------|-----------|-----------|
| `cryptogateway_payment_completed` | Action | ($order, $data) | Pago confirmado |
| `cryptogateway_payment_expired` | Action | ($order) | Orden expirada |
| `cryptogateway_webhook_payload` | Filter | ($payload) | Datos del webhook |
| `cryptogateway_payment_address_text` | Filter | ($address) | Texto de dirección |

---

¿Necesitas más hooks? Puedes solicitar nuevos hooks creando un issue en GitHub.
