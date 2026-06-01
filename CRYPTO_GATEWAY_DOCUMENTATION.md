# 🚀 Pasarela de Pagos SaaS - USDT (TRC20)

Núcleo backend production-ready para una pasarela de pagos descentralizada que monitorea la blockchain de TRON y notifica a tiendas externas mediante webhooks firmados con HMAC-SHA256.

## 📋 Tabla de Contenidos

- [Arquitectura](#arquitectura)
- [Componentes](#componentes)
- [Instalación](#instalación)
- [Configuración](#configuración)
- [Uso](#uso)
- [API Endpoints](#api-endpoints)
- [Seguridad](#seguridad)
- [Monitoreo](#monitoreo)

## 🏗️ Arquitectura

```
┌─────────────────────────────────────────────────────────────┐
│                    WooCommerce Plugin                        │
│                   (Cliente Externo)                          │
└────────────┬────────────────────────────────────────────────┘
             │ POST /api/v1/orders
             │ (X-Merchant-Key Header)
             ▼
┌─────────────────────────────────────────────────────────────┐
│              CRYPTO PAYMENT GATEWAY (Laravel)                │
├─────────────────────────────────────────────────────────────┤
│ • API Controller (Recibe órdenes)                            │
│ • Modelos (Merchants, Orders, PaymentAddresses)              │
│ • Pool de Wallets (Direcciones disponibles)                  │
└────────────┬────────────────────────────────────────────────┘
             │
    ┌────────┴────────┐
    ▼                 ▼
┌─────────────┐  ┌──────────────────────┐
│   Redis     │  │ Artisan Command      │
│   Queue     │  │ (check-crypto-       │
│             │  │  payments)           │
└─────────────┘  │ Cada minuto          │
    ▲            │ Valida órdenes       │
    │            │ en blockchain        │
    └────────────┤ Dispara jobs         │
                 └──────────────────────┘
                 │
                 ▼
         ┌──────────────────┐
         │ TronGrid API     │
         │ (Blockchain)     │
         └──────────────────┘
             │
             │ Lee transacciones
             │ de direcciones
             │
         ┌──────────────────┐
         │ TRON Network     │
         │ (Smart Contract) │
         └──────────────────┘

    Job enviado (SendWebhookNotification)
             │
             ▼
    ┌──────────────────┐
    │ Webhook del      │
    │ Merchant         │
    │ (firmado HMAC)   │
    └──────────────────┘
             │
             ▼
    ┌──────────────────┐
    │ WooCommerce      │
    │ Actualiza orden  │
    │ "Pago recibido"  │
    └──────────────────┘
```

## 📦 Componentes

### 1. **Migraciones de Base de Datos**

#### `merchants` - Almacena los comercios integrados
```sql
- id (Primary Key)
- name (Nombre del comercio)
- api_key (UNIQUE, Clave de API encriptada)
- webhook_url (URL para notificaciones)
- webhook_secret (Secreto para firmar webhooks)
- status (active | inactive | suspended)
- timestamps
```

#### `payment_addresses` - Pool de billeteras TRON
```sql
- id (Primary Key)
- address (UNIQUE, Dirección de TRON)
- status (available | occupied)
- last_used_at (Timestamp del último uso)
- timestamps
```

#### `orders` - Órdenes de pago
```sql
- id (Primary Key)
- merchant_id (Foreign Key)
- payment_address_id (Foreign Key)
- external_order_id (ID del pedido del comercio)
- amount_usd (Monto en dólares)
- amount_crypto (Equivalente en USDT con 6 decimales)
- status (pending | completed | expired)
- tx_hash (Hash de la transacción en blockchain)
- expires_at (Vencimiento de la orden: 15 minutos)
- timestamps
```

### 2. **Modelos Eloquent**

#### `Merchant` 
- Representa un comercio integrado
- Relación: hasMany(Order)
- Métodos útiles para validación y gestión

#### `PaymentAddress`
- Representa una dirección de billetera TRON
- Relaciones: hasMany(Order)
- Métodos: `isAvailable()`, `markAsOccupied()`, `markAsAvailable()`

#### `Order`
- Representa una orden de pago
- Relaciones: belongsTo(Merchant), belongsTo(PaymentAddress)
- Estados: pending, completed, expired
- Métodos: `isPending()`, `isCompleted()`, `isExpired()`, `markAsCompleted($txHash)`, `markAsExpired()`

### 3. **Controlador API: PaymentController**

**Endpoint:** `POST /api/v1/orders`

**Headers requeridos:**
```
X-Merchant-Key: {api_key_del_comercio}
Content-Type: application/json
```

**Payload:**
```json
{
  "amount_usd": 99.99,
  "external_order_id": "pedido-12345"
}
```

**Respuesta (201 Created):**
```json
{
  "success": true,
  "data": {
    "order_id": 1,
    "payment_address": "TN3W4H6rK8...",
    "amount_crypto": "99.999999",
    "amount_usd": "99.99",
    "expires_at": "2024-01-01T15:30:00Z"
  }
}
```

**Lógica:**
1. ✅ Valida la API key en header
2. ✅ Verifica que el comercio esté activo
3. ✅ Valida monto USD y external_order_id
4. ✅ Busca una dirección disponible (con lock para evitar race conditions)
5. ✅ Convierte USD a USDT (1:1 por defecto)
6. ✅ Marca la dirección como "occupied"
7. ✅ Crea la orden con expiración a 15 minutos
8. ✅ Retorna los datos para que el cliente muestre la dirección de pago

### 4. **Comando Artisan: CheckCryptoPayments**

**Ejecución:** Cada minuto vía Laravel Scheduler

```bash
php artisan app:check-crypto-payments
```

**Lógica:**

#### A. Validar Órdenes Pendientes
1. Obtiene todas las órdenes con status "pending" que aún no han expirado
2. Para cada orden:
   - Realiza request HTTP a TronGrid API: `GET /v1/accounts/{address}/transactions/trc20`
   - Itera las transacciones buscando:
     - Contrato USDT válido: `TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t`
     - Monto exacto (considerando 6 decimales: valor_usd * 1,000,000)
     - Status de transacción exitoso (result === 1)
   - Si encuentra match:
     - Actualiza orden: status = "completed", tx_hash = transaction_id
     - Libera billetera: status = "available"
     - Dispara Job: SendWebhookNotification

#### B. Expirar Órdenes Vencidas
1. Obtiene órdenes con status "pending" que excedieron los 15 minutos
2. Actualiza status a "expired"
3. Libera las billeteras (status = "available")

**Manejo de Errores:**
- Try-catch en cada iteración de orden
- Logging detallado de errores de API
- Reintentos automáticos si TronGrid no responde

### 5. **Job: SendWebhookNotification**

**Configuración:**
- Cola: Redis (recomendado) o Database
- Intentos: 5 intentos
- Backoff: 60 segundos entre intentos

**Payload enviado (POST):**
```json
{
  "order_id": 1,
  "external_order_id": "pedido-12345",
  "status": "completed",
  "amount_usd": "99.99",
  "amount_crypto": "99.999999",
  "tx_hash": "1234567890abcdef...",
  "timestamp": "2024-01-01T15:30:00Z"
}
```

**Headers:**
```
X-Signature: {hmac_sha256_signature}
Content-Type: application/json
```

**Generación de Signature:**
```php
$signature = hash_hmac(
    'sha256',
    json_encode($payload),
    $merchant->webhook_secret
);
```

**Validación en cliente externo:**
```php
$receivedSignature = $_SERVER['HTTP_X_SIGNATURE'];
$payload = file_get_contents('php://input');
$expectedSignature = hash_hmac('sha256', $payload, $merchant_webhook_secret);

if (!hash_equals($receivedSignature, $expectedSignature)) {
    http_response_code(401);
    die('Unauthorized: Invalid signature');
}
```

---

## 🔧 Instalación

### Requisitos Previos

```
PHP >= 8.2
Laravel 11.x
MySQL 8.0 o PostgreSQL 12+
Redis 6.0+ (para Queue)
Composer
```

### Pasos

1. **Clonar repositorio:**
```bash
git clone https://github.com/nametechdevz/webplayer.git
cd webplayer
```

2. **Instalar dependencias:**
```bash
composer install
```

3. **Copiar archivo de configuración:**
```bash
cp .env.example .env
```

4. **Generar clave de aplicación:**
```bash
php artisan key:generate
```

5. **Configurar base de datos en .env:**
```
DB_HOST=127.0.0.1
DB_DATABASE=crypto_gateway
DB_USERNAME=root
DB_PASSWORD=your_password
```

6. **Ejecutar migraciones:**
```bash
php artisan migrate
```

7. **Crear un comercio de prueba:**
```bash
php artisan tinker

# Dentro del tinker console:
$merchant = \App\Models\Merchant::create([
    'name' => 'WooCommerce Test Shop',
    'api_key' => \Illuminate\Support\Str::random(32),
    'webhook_url' => 'https://shop.example.com/webhook/crypto',
    'webhook_secret' => \Illuminate\Support\Str::random(64),
    'status' => 'active',
]);

// Guarda el api_key y webhook_secret
```

8. **Agregar direcciones de billetera:**
```bash
# En tinker:
\App\Models\PaymentAddress::create(['address' => 'TN3W4H6rK8...']);
\App\Models\PaymentAddress::create(['address' => 'TA7Z9K2mX5...']);
// ... más direcciones
```

---

## ⚙️ Configuración

### Variables de Entorno (.env)

```env
# Base de datos
DB_CONNECTION=mysql
DB_HOST=127.0.0.1
DB_PORT=3306
DB_DATABASE=crypto_gateway
DB_USERNAME=root
DB_PASSWORD=secret

# Cola (Redis recomendado)
QUEUE_CONNECTION=redis
REDIS_HOST=127.0.0.1
REDIS_PASSWORD=null
REDIS_PORT=6379

# TronGrid (No cambiar)
TRONGRID_API_URL=https://api.trongrid.io
USDT_CONTRACT_ADDRESS=TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t

# Logging
LOG_CHANNEL=stack
LOG_LEVEL=info
```

### Configurar Scheduler

#### Opción 1: Usando cron (Recomendado para producción)

Agregar a crontab:
```bash
* * * * * cd /ruta/proyecto && php artisan schedule:run >> /dev/null 2>&1
```

Esto ejecutará `app:check-crypto-payments` cada minuto automáticamente.

#### Opción 2: Ejecutar comando manualmente en desarrollo
```bash
php artisan app:check-crypto-payments
```

#### Opción 3: Ejecutar en loop cada 30 segundos (Desarrollo)
```bash
while true; do
  php artisan app:check-crypto-payments
  sleep 30
done
```

### Configurar Cola (Queue Worker)

```bash
php artisan queue:work redis --queue=default --sleep=3 --tries=5
```

O en producción con Supervisor:

```ini
[program:crypto-gateway-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /ruta/proyecto/artisan queue:work redis --queue=default --sleep=3 --tries=5
autostart=true
autorestart=true
numprocs=4
redirect_stderr=true
stdout_logfile=/var/log/crypto-gateway-worker.log
```

---

## 🌐 Uso

### 1. Cliente WooCommerce realiza petición

```bash
curl -X POST https://gateway.example.com/api/v1/orders \
  -H "X-Merchant-Key: abc123xyz789..." \
  -H "Content-Type: application/json" \
  -d '{
    "amount_usd": 99.99,
    "external_order_id": "order-5678"
  }'
```

### 2. Gateway responde con dirección de pago

```json
{
  "success": true,
  "data": {
    "order_id": 1,
    "payment_address": "TN3W4H6rK8mL9nO0pQ1rS2tU3vW4xY5z",
    "amount_crypto": "99.999999",
    "amount_usd": "99.99",
    "expires_at": "2024-01-01T15:30:00Z"
  }
}
```

### 3. Usuario envía USDT a esa dirección desde su wallet

El usuario abre su wallet TRON, envía 99.999999 USDT a TN3W4H6rK8mL9nO0pQ1rS2tU3vW4xY5z

### 4. Scheduler valida cada minuto

Cada minuto, `app:check-crypto-payments` consulta TronGrid:
- Detecta la transacción en blockchain
- Verifica monto y contrato
- Marca orden como "completed"
- Dispara webhook

### 5. WooCommerce recibe notificación

```bash
POST https://shop.example.com/webhook/crypto
Headers:
  X-Signature: a1b2c3d4e5f6...
  Content-Type: application/json

Body:
{
  "order_id": 1,
  "external_order_id": "order-5678",
  "status": "completed",
  "amount_usd": "99.99",
  "amount_crypto": "99.999999",
  "tx_hash": "1234567890abcdef...",
  "timestamp": "2024-01-01T15:30:00Z"
}
```

### 6. WooCommerce valida y actualiza

```php
$signature = $_SERVER['HTTP_X_SIGNATURE'];
$payload = file_get_contents('php://input');

if (!hash_equals(
    $signature,
    hash_hmac('sha256', $payload, MERCHANT_WEBHOOK_SECRET)
)) {
    http_response_code(401);
    die('Unauthorized');
}

$data = json_decode($payload, true);
// Actualizar pedido como "Pago recibido"
update_order_status($data['external_order_id'], 'completed');
```

---

## 🔐 Seguridad

### API Key Management

```php
// ✅ Correcto: Encriptado en DB (automático con Laravel)
$merchant = Merchant::create([
    'api_key' => \Illuminate\Support\Str::random(32),
]);

// ✅ En logs: Solo primeros 10 caracteres
Log::warning('Invalid key: ' . substr($apiKey, 0, 10) . '...');
```

### HMAC-SHA256 Webhook Verification

```php
// Gateway envía:
$signature = hash_hmac('sha256', json_encode($payload), $secret);

// Cliente valida:
hash_equals($received_sig, $expected_sig); // Timing-safe comparison
```

### Rate Limiting (Recomendado)

```php
// En RouteServiceProvider:
Route::middleware('throttle:60,1')->group(function () {
    Route::post('/api/v1/orders', [PaymentController::class, 'createOrder']);
});
```

### Lock en Base de Datos

```php
PaymentAddress::where('status', 'available')
    ->lockForUpdate()  // ✅ Evita race conditions
    ->first();
```

### HTTPS Obligatorio

```php
// En .env
APP_URL=https://gateway.example.com

// Middleware incluido en Laravel automáticamente en producción
```

---

## 📊 Monitoreo

### Logs

```bash
# Todos los eventos importantes quedan registrados:
tail -f storage/logs/laravel.log | grep -E "(Payment|Webhook|Error)"
```

**Ejemplos de logs:**

```
[2024-01-01 10:30:00] local.INFO: Payment order created {"order_id":1,"merchant_id":1,"external_order_id":"order-5678","amount_usd":"99.99"}

[2024-01-01 10:31:00] local.INFO: Payment completed {"order_id":1,"tx_hash":"1234567890abcdef"}

[2024-01-01 10:31:05] local.INFO: Webhook notification sent successfully {"order_id":1,"merchant_id":1,"status_code":200}

[2024-01-01 10:46:00] local.INFO: Order expired {"order_id":2}
```

### Queries de Diagnóstico

```sql
-- Órdenes pendientes
SELECT * FROM orders WHERE status = 'pending' AND expires_at > NOW();

-- Órdenes expiradas no procesadas
SELECT * FROM orders WHERE status = 'pending' AND expires_at <= NOW();

-- Billeteras disponibles
SELECT * FROM payment_addresses WHERE status = 'available';

-- Historial de un pedido
SELECT * FROM orders WHERE external_order_id = 'order-5678' ORDER BY created_at;

-- Comercios activos
SELECT id, name, status FROM merchants WHERE status = 'active';
```

### Dashboard de Métricas (Recomendado)

```bash
# Crear artisan command para métricas:
php artisan make:command ShowMetrics

# Implementar:
public function handle()
{
    $pendingOrders = Order::where('status', 'pending')->count();
    $completedToday = Order::where('status', 'completed')
        ->whereDate('updated_at', today())
        ->count();
    $failedWebhooks = Job::failed()->count();
    
    $this->info("Pending Orders: $pendingOrders");
    $this->info("Completed Today: $completedToday");
    $this->info("Failed Jobs: $failedWebhooks");
}
```

---

## 🚨 Solución de Problemas

### Problema: Las órdenes no se marcan como completadas

**Posibles causas:**
1. TronGrid API no responde
2. La dirección TRON es inválida
3. El monto enviado no coincide exactamente
4. La transacción aún no está confirmada en blockchain

**Solución:**
```bash
# Ver logs
tail -f storage/logs/laravel.log

# Testear conexión a TronGrid
curl https://api.trongrid.io/v1/accounts/TN3W4H6rK8.../transactions/trc20

# Verificar órdenes pendientes
php artisan tinker
Order::where('status', 'pending')->get()
```

### Problema: Webhook no se envía

**Posibles causas:**
1. Redis queue no está corriendo
2. Webhook URL del merchant es inválida
3. Network firewall bloqueando request

**Solución:**
```bash
# Verificar queue worker
ps aux | grep queue:work

# Reiniciar worker
php artisan queue:restart

# Ver jobs fallidos
php artisan queue:failed

# Retry failed jobs
php artisan queue:retry all
```

### Problema: Error "No available payment addresses"

**Causa:** Se agotaron las billeteras disponibles

**Solución:**
```bash
# Agregar más direcciones
php artisan tinker

for ($i = 0; $i < 10; $i++) {
    \App\Models\PaymentAddress::create([
        'address' => 'NUEVA_DIRECCION_TRON_' . $i
    ]);
}
```

---

## 📈 Escalabilidad

### Para 1000+ órdenes/día:

1. **Índices de BD:** Ya incluidos ✅
2. **Caché:** Agregar Redis para caché de transacciones
3. **Sharding:** Distribuir direcciones por particiones
4. **Workers múltiples:** `numprocs=8` en Supervisor
5. **Load balancer:** Nginx con múltiples instancias
6. **Monitoring:** NewRelic, DataDog, o Sentry

---

## 📝 Ejemplo Completo en WooCommerce

```php
<?php
// En tu plugin WooCommerce: gateway-crypto.php

class WC_Gateway_Crypto extends WC_Payment_Gateway {
    
    public function process_payment($order_id) {
        $order = wc_get_order($order_id);
        
        try {
            $response = wp_remote_post('https://gateway.example.com/api/v1/orders', [
                'headers' => [
                    'X-Merchant-Key' => $this->api_key,
                    'Content-Type' => 'application/json',
                ],
                'body' => json_encode([
                    'amount_usd' => $order->get_total(),
                    'external_order_id' => 'order-' . $order_id,
                ]),
            ]);
            
            $data = json_decode(wp_remote_retrieve_body($response), true);
            
            if ($data['success']) {
                // Guardar detalles de pago
                update_post_meta($order_id, '_crypto_payment_address', 
                    $data['data']['payment_address']);
                update_post_meta($order_id, '_crypto_order_id', 
                    $data['data']['order_id']);
                
                // Mostrar dirección de pago
                wc_add_notice(sprintf(
                    'Envía %s USDT a: <strong>%s</strong>',
                    $data['data']['amount_crypto'],
                    $data['data']['payment_address']
                ));
                
                $order->update_status('pending');
                return ['result' => 'success'];
            }
        } catch (Exception $e) {
            wc_add_notice('Error: ' . $e->getMessage(), 'error');
        }
        
        return ['result' => 'failure'];
    }
    
    // Webhook endpoint en WooCommerce
    public function handle_webhook() {
        $signature = $_SERVER['HTTP_X_SIGNATURE'] ?? '';
        $payload = file_get_contents('php://input');
        
        if (!hash_equals(
            $signature,
            hash_hmac('sha256', $payload, $this->webhook_secret)
        )) {
            http_response_code(401);
            wp_die('Unauthorized');
        }
        
        $data = json_decode($payload, true);
        $order = wc_get_order(str_replace('order-', '', $data['external_order_id']));
        
        if ($data['status'] === 'completed') {
            $order->update_status('processing');
            $order->add_order_note('Pago recibido: ' . $data['tx_hash']);
        }
        
        wp_die('OK', 200);
    }
}
```

---

## 🎯 Resumen de Características

✅ **Seguridad:**
- API Key encriptada
- HMAC-SHA256 para webhooks
- Race condition prevention con locks
- Timing-safe comparisons

✅ **Confiabilidad:**
- Reintentos automáticos (5 intentos)
- Logging detallado de todos los eventos
- Transacciones de BD atómicas
- Manejo robusto de errores

✅ **Performance:**
- Índices de BD optimizados
- Queue asíncrona con Redis
- Caché de direcciones disponibles
- Operaciones en lote cuando es posible

✅ **Escalabilidad:**
- Arquitectura de microservicios lista
- Soporta miles de órdenes diarias
- Workers múltiples configurables
- Monitoreo integrado

¡Listo para producción! 🚀
