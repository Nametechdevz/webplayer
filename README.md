# 🚀 Crypto Payment Gateway - USDT (TRC20)

**Backend production-ready para pasarela de pagos SaaS con monitoreo de blockchain TRON y webhooks seguros**

## ✨ Características

- ✅ **API RESTful** protegida con API Keys
- ✅ **Pool de billeteras TRON** auto-asignables
- ✅ **Monitoreo blockchain** en tiempo real (TronGrid API)
- ✅ **Webhooks seguros** con firma HMAC-SHA256
- ✅ **Cola asíncrona** con reintentos automáticos
- ✅ **Transacciones ACID** en BD con locks
- ✅ **Logging completo** de eventos y errores
- ✅ **Tests unitarios** incluidos
- ✅ **Documentación exhaustiva**
- ✅ **Production-ready**

---

## 🏗️ Arquitectura

```
WooCommerce Plugin
       ↓
  POST /api/v1/orders
       ↓
┌─────────────────────────────────┐
│  CRYPTO PAYMENT GATEWAY         │
│  ┌────────────────────────────┐ │
│  │ PaymentController          │ │
│  │ (Recibe órdenes)           │ │
│  └────────────────────────────┘ │
│  ┌────────────────────────────┐ │
│  │ CheckCryptoPayments        │ │
│  │ (Valida blockchain)        │ │
│  └────────────────────────────┘ │
│  ┌────────────────────────────┐ │
│  │ SendWebhookNotification    │ │
│  │ (Notifica merchant)        │ │
│  └────────────────────────────┘ │
└─────────────────────────────────┘
       ↓
   TronGrid API
       ↓
  TRON Network
       ↓
   Webhook Merchant
       ↓
  WooCommerce (Orden "Pagada")
```

---

## 📦 Componentes Incluidos

### Base de Datos
- **merchants** - Comercios integrados (api_key, webhook_secret)
- **payment_addresses** - Pool de billeteras TRON
- **orders** - Órdenes de pago con estado y expiración

### API
- `POST /api/v1/orders` - Crear orden de pago

### Comandos Artisan
- `php artisan app:check-crypto-payments` - Validar pagos en blockchain

### Jobs
- `SendWebhookNotification` - Enviar webhooks con reintentos

### Modelos Eloquent
- `Merchant`, `PaymentAddress`, `Order` - Con relaciones y helper methods

---

## 🚀 Quick Start

### 1. Instalación

```bash
# Clonar
git clone https://github.com/nametechdevz/webplayer.git
cd webplayer

# Instalar dependencias
composer install

# Configurar
cp .env.example .env
php artisan key:generate

# Base de datos
php artisan migrate --seed
```

### 2. Ejecutar servidor

```bash
php artisan serve
```

### 3. Crear merchant de prueba

```bash
php artisan tinker

>>> $m = \App\Models\Merchant::first()
>>> $m->api_key
"test-api-key-xxxxx"
```

### 4. Realizar petición

```bash
curl -X POST http://localhost:8000/api/v1/orders \
  -H "X-Merchant-Key: test-api-key-xxxxx" \
  -H "Content-Type: application/json" \
  -d '{"amount_usd": 99.99, "external_order_id": "order-123"}'
```

### 5. Iniciar queue worker (en otra terminal)

```bash
php artisan queue:work
```

### 6. Iniciar scheduler (en otra terminal)

```bash
while true; do
  php artisan app:check-crypto-payments
  sleep 30
done
```

---

## 📋 API Endpoints

### Crear Orden

```
POST /api/v1/orders

Headers:
  X-Merchant-Key: {api_key}
  Content-Type: application/json

Body:
{
  "amount_usd": 99.99,
  "external_order_id": "order-12345"
}

Response (201):
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

---

## 🔐 Seguridad

### API Key
- Encriptada en base de datos
- Única por merchant
- Validada en cada request

### HMAC-SHA256
```php
// Gateway envía:
$signature = hash_hmac('sha256', json_encode($payload), $secret);

// Cliente valida:
hash_equals($received, $expected);
```

### Transacciones BD
- Locks para evitar race conditions
- Foreign keys con restrict/cascade
- Índices en búsquedas frecuentes

---

## 📚 Documentación

- [CRYPTO_GATEWAY_DOCUMENTATION.md](./CRYPTO_GATEWAY_DOCUMENTATION.md) - Documentación completa
- [CLIENTE_WOOCOMMERCE_EJEMPLO.php](./CLIENTE_WOOCOMMERCE_EJEMPLO.php) - Implementación ejemplo
- [DEVELOPMENT_COMMANDS.md](./DEVELOPMENT_COMMANDS.md) - Comandos de desarrollo
- [SECURITY_CHECKLIST.md](./SECURITY_CHECKLIST.md) - Checklist de seguridad

---

## 🧪 Testing

```bash
# Todos los tests
php artisan test

# Tests específicos
php artisan test tests/Feature/PaymentControllerTest.php

# Con coverage
php artisan test --coverage
```

---

## 📊 Flujo Completo

1. **Cliente realiza petición**: POST `/api/v1/orders` con amount_usd y external_order_id
2. **Gateway crea orden**: Asigna dirección TRON, calcula equivalente en USDT, expira en 15 min
3. **Cliente envía USDT**: Transfiere USDT a la dirección proporcionada
4. **Scheduler valida**: Cada minuto, CheckCryptoPayments consulta TronGrid
5. **Pago confirmado**: Detección de transacción, cambio a "completed"
6. **Job dispachado**: SendWebhookNotification entra a queue
7. **Webhook enviado**: POST a merchant con payload firmado
8. **Cliente procesa**: Valida firma HMAC, actualiza orden a "Pagada"

---

## 🔧 Configuración

### .env variables importantes

```env
# Base de datos
DB_CONNECTION=mysql
DB_DATABASE=crypto_gateway

# Queue
QUEUE_CONNECTION=redis
REDIS_HOST=127.0.0.1

# API
APP_URL=https://gateway.example.com
APP_DEBUG=false
APP_ENV=production

# Logging
LOG_LEVEL=info
```

### Scheduler (cron)

```bash
* * * * * cd /path/to/project && php artisan schedule:run >> /dev/null 2>&1
```

Esto ejecutará `app:check-crypto-payments` automáticamente cada minuto.

---

## 📈 Escalabilidad

- ✅ Índices en BD para búsquedas O(1)
- ✅ Queue asíncrona para webhooks
- ✅ Locks de BD para concurrencia
- ✅ Múltiples workers configurables
- ✅ Soporta miles de órdenes/día

---

## 🐛 Troubleshooting

### Órdenes no se marcan como completadas
```bash
# Ver logs
tail -f storage/logs/laravel.log

# Testear conexión TronGrid
curl https://api.trongrid.io/v1/accounts/TN.../transactions/trc20

# Verificar órdenes pendientes
php artisan tinker
>>> \App\Models\Order::where('status', 'pending')->get()
```

### Webhooks no se envían
```bash
# Verificar queue worker está corriendo
ps aux | grep queue:work

# Ver jobs fallidos
php artisan queue:failed

# Retry
php artisan queue:retry all
```

### No hay direcciones disponibles
```bash
php artisan tinker
>>> \App\Models\PaymentAddress::create(['address' => 'NUEVA_DIRECCION'])
```

---

## 📖 Estructura de Archivos

```
webplayer/
├── app/
│   ├── Console/
│   │   ├── Commands/
│   │   │   └── CheckCryptoPayments.php
│   │   └── Kernel.php
│   ├── Http/
│   │   ├── Controllers/
│   │   │   └── PaymentController.php
│   │   └── Middleware/
│   │       └── ApiKeyAuth.php
│   ├── Jobs/
│   │   └── SendWebhookNotification.php
│   └── Models/
│       ├── Merchant.php
│       ├── PaymentAddress.php
│       └── Order.php
├── database/
│   ├── factories/
│   ├── migrations/
│   └── seeders/
├── routes/
│   └── api.php
├── tests/
│   └── Feature/
│       └── PaymentControllerTest.php
├── CRYPTO_GATEWAY_DOCUMENTATION.md
├── CLIENTE_WOOCOMMERCE_EJEMPLO.php
├── DEVELOPMENT_COMMANDS.md
├── SECURITY_CHECKLIST.md
└── .env.example
```

---

## 🔄 Workflow

### Development
```bash
git checkout -b feature/my-feature
php artisan migrate
php artisan test
git commit -am "feature: description"
git push origin feature/my-feature
```

### Production Deploy
```bash
git checkout main
git pull origin main
composer install --no-dev
php artisan migrate --force
php artisan config:cache
php artisan queue:work redis &
php artisan schedule:run
```

---

## 💡 Tips

### Generar API Key para merchant
```php
php artisan tinker
>>> \Illuminate\Support\Str::random(32)
```

### Ver datos en BD
```bash
php artisan tinker
>>> \App\Models\Order::with('merchant', 'paymentAddress')->get()
```

### Monitorear logs en tiempo real
```bash
tail -f storage/logs/laravel.log | grep -E "Payment|Webhook"
```

### Ejecutar tests con coverage
```bash
php artisan test --coverage --coverage-html=coverage
# Abrir coverage/index.html
```

---

## 🤝 Contribuir

1. Fork el proyecto
2. Crear rama feature (`git checkout -b feature/AmazingFeature`)
3. Commit cambios (`git commit -m 'Add AmazingFeature'`)
4. Push a rama (`git push origin feature/AmazingFeature`)
5. Abrir Pull Request

---

## 📝 Licencia

Este proyecto está bajo licencia MIT.

---

## 🚀 Roadmap

- [ ] Soporte para múltiples redes blockchain (Ethereum, Polygon)
- [ ] Dashboard admin con estadísticas
- [ ] Webhook retry automático mejorado
- [ ] Rate limiting por merchant
- [ ] Analytics y reportes
- [ ] Soporte para refunds
- [ ] 2FA para API sensitive operations

---

## 📞 Soporte

Para preguntas o problemas:
1. Revisar documentación en `CRYPTO_GATEWAY_DOCUMENTATION.md`
2. Ver logs en `storage/logs/laravel.log`
3. Abrir issue en GitHub

---

**Hecho con ❤️ para la comunidad crypto**

¡Que prosperes tu pasarela de pagos! 🚀
