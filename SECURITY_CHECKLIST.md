# 🔐 Security Checklist para Producción

Antes de deployar a producción, verifica que todos estos puntos estén completados.

---

## 🌐 Configuración General

- [ ] `APP_ENV` = `production` en `.env`
- [ ] `APP_DEBUG` = `false` en `.env`
- [ ] `APP_URL` = URL HTTPS de tu dominio
- [ ] `.env` NO está en git (agregar a `.gitignore`)
- [ ] `.env.example` tiene valores dummy

### Comando de verificación:

```bash
grep -E "APP_ENV|APP_DEBUG|APP_URL" .env

# Correcto:
# APP_ENV=production
# APP_DEBUG=false
# APP_URL=https://gateway.example.com
```

---

## 🔑 Seguridad de API Keys

### Merchant API Keys

- [ ] Cada merchant tiene API key única y compleja (32+ caracteres)
- [ ] API keys están encriptadas en BD
- [ ] API keys NO aparecen en logs (solo primeros 10 caracteres)
- [ ] Webhook secrets están encriptados en BD
- [ ] Secrets NO aparecen en logs

### Comando para generar keys:

```php
php artisan tinker

>>> \Illuminate\Support\Str::random(32)  // API Key
>>> \Illuminate\Support\Str::random(64)  // Webhook Secret
```

### En logs:

```php
// ✅ CORRECTO: Solo primeros 10 caracteres
Log::warning('Invalid key: ' . substr($apiKey, 0, 10) . '...');

// ❌ INCORRECTO: No loguear la key completa
Log::warning('Invalid key: ' . $apiKey);
```

---

## 🔒 Validación de Requests

- [ ] Todos los inputs están validados
- [ ] Headers `X-Merchant-Key` es requerido
- [ ] Content-Type es validado (`application/json`)
- [ ] Montos están limitados (min/max)
- [ ] IDs externos están sanitizados
- [ ] Rate limiting configurado

### Validaciones implementadas:

```php
$validated = $request->validate([
    'amount_usd' => 'required|numeric|min:0.01|max:999999.99',
    'external_order_id' => 'required|string|max:255',
]);
```

### Rate Limiting:

```php
// En RouteServiceProvider o api.php
Route::middleware('throttle:60,1')->group(function () {
    Route::post('/api/v1/orders', [PaymentController::class, 'createOrder']);
});

// Alternativamente en .env
RATE_LIMIT=60
```

---

## 🔐 HMAC-SHA256 para Webhooks

- [ ] Webhook signature se genera con `hash_hmac('sha256', ...)`
- [ ] Header `X-Signature` contiene la firma
- [ ] Cliente usa `hash_equals()` para comparación (timing-safe)
- [ ] Payload es exactamente el mismo JSON

### Generación:

```php
$payload = json_encode($data, JSON_UNESCAPED_SLASHES);
$signature = hash_hmac('sha256', $payload, $merchant->webhook_secret);
// Enviar en header: X-Signature: {$signature}
```

### Validación en cliente:

```php
$signature = $_SERVER['HTTP_X_SIGNATURE'] ?? '';
$payload = file_get_contents('php://input');

$expected = hash_hmac('sha256', $payload, WEBHOOK_SECRET);

if (!hash_equals($expected, $signature)) {
    http_response_code(401);
    die('Unauthorized');
}
```

---

## 🗄️ Base de Datos

### Seguridad de BD

- [ ] `DB_PASSWORD` es fuerte (20+ caracteres)
- [ ] Usuario de BD tiene permisos mínimos (no root)
- [ ] BD está en servidor separado (no en webserver)
- [ ] Backups automáticos cada 24 horas
- [ ] SSL para conexión a BD

### Configuración:

```env
DB_CONNECTION=mysql
DB_HOST=db.example.com
DB_PORT=3306
DB_DATABASE=crypto_gateway
DB_USERNAME=crypto_user
DB_PASSWORD=GENERAR_CON_openssl_rand_-_base64_20
```

### Generar contraseña fuerte:

```bash
openssl rand -base64 20
# Ejemplo: aBcDeFgHiJkLmNoPqRsT
```

---

## 🔄 Migraciones y Datos

- [ ] Migraciones están versionadas y testeadas
- [ ] Índices están en BD (búsquedas rápidas)
- [ ] Foreign keys están configuradas
- [ ] Timestamps están presentes
- [ ] Soft deletes NO está usado (delete, no hide)

### Verificar índices:

```bash
php artisan migrate --pretend  # Ver cambios sin ejecutar

# En BD:
SHOW INDEXES FROM orders;
SHOW INDEXES FROM payment_addresses;
SHOW INDEXES FROM merchants;
```

---

## 🔐 Transacciones de BD

- [ ] Operaciones críticas en transacciones
- [ ] Locks están en lugar para race conditions
- [ ] Rollback automático en errores

### Ejemplo (PaymentController):

```php
DB::transaction(function () {
    $address = PaymentAddress::where('status', 'available')
        ->lockForUpdate()  // ✅ LOCK CRÍTICO
        ->first();
    
    if (!$address) {
        throw new Exception('No hay direcciones disponibles');
    }
    
    $address->markAsOccupied();
    Order::create([...]);
});
```

---

## 📡 HTTPS Obligatorio

- [ ] APP_URL = `https://`
- [ ] SSL/TLS válido (Let's Encrypt)
- [ ] Certificado no expirado
- [ ] Redirección HTTP → HTTPS
- [ ] HSTS habilitado (Strict-Transport-Security)

### En Nginx:

```nginx
server {
    listen 80;
    server_name gateway.example.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name gateway.example.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    
    add_header Strict-Transport-Security "max-age=31536000" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-Frame-Options "DENY" always;
}
```

---

## 📊 Logging Seguro

- [ ] `LOG_LEVEL=info` en producción
- [ ] NO loguear datos sensibles (API keys, secrets)
- [ ] Logs rotados diariamente
- [ ] Logs con acceso restringido (chmod 600)
- [ ] Alertas para errores críticos

### En .env:

```env
LOG_CHANNEL=stack
LOG_LEVEL=info
LOG_DAILY_DAYS=14  # Guardar 14 días
```

### Nunca loguear:

```php
// ❌ MALO
Log::info('Merchant API Key: ' . $merchant->api_key);
Log::info('Webhook Secret: ' . $merchant->webhook_secret);
Log::info('Full payload: ' . json_encode($payload));

// ✅ BUENO
Log::info('Merchant payment created', ['merchant_id' => $merchant->id]);
Log::info('Webhook sent', ['order_id' => $order->id]);
Log::error('Validation failed', ['field' => 'amount_usd']);
```

---

## 🔐 Variables de Entorno

- [ ] `.env` está en `.gitignore`
- [ ] `.env.production` está seguro en servidor
- [ ] Variables sensibles están en `config:cache`
- [ ] No hay defaults peligrosos

### Proteger .env:

```bash
# En servidor
chmod 600 .env
chmod 600 .env.production

# Verificar git
git status | grep .env  # NO debe aparecer

# En .gitignore
echo ".env" >> .gitignore
echo ".env.*.local" >> .gitignore
```

---

## 🚀 Queue y Jobs

- [ ] Queue connection es Redis o Database (no sync en prod)
- [ ] Queue worker está corriendo con Supervisor
- [ ] Failed jobs son loguedos
- [ ] Reintentos están limitados (5 máximo)
- [ ] Backoff está configurado (esperar entre reintentos)

### Supervisor config:

```ini
[program:crypto-gateway-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /path/to/artisan queue:work redis --sleep=3 --tries=5
autostart=true
autorestart=true
numprocs=4
stopasgroup=true
stopwaitsecs=600
user=www-data
stdout_logfile=/var/log/crypto-worker.log
stderr_logfile=/var/log/crypto-worker-error.log
```

---

## 📡 API Endpoints

- [ ] Solo POST permitido (GET no modifica datos)
- [ ] CORS configurado correctamente
- [ ] Headers validados
- [ ] Response codes correctos (201, 401, 422, 500)
- [ ] Error messages NO revelan estructura interna

### Response seguro:

```php
// ✅ CORRECTO
return response()->json([
    'success' => false,
    'message' => 'Validation error',
    'errors' => $errors,
], 422);

// ❌ INCORRECTO - Expone estructura de BD
return response()->json([
    'error' => 'Unique constraint violation on column merchant_id',
], 500);
```

---

## 🔍 Validación de Blockchain

- [ ] Transacción existe en TronGrid
- [ ] Contrato USDT es correcto (TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t)
- [ ] Monto coincide exactamente (con decimales)
- [ ] Status de transacción es exitoso (result === 1)
- [ ] Confirmaciones suficientes (TronGrid valida internamente)

### En CheckCryptoPayments:

```php
private function isValidTransaction(array $transaction, int $expectedAmount): bool
{
    if ($transaction['type'] !== 'Transfer') {
        return false;  // ✅ Validar tipo
    }

    if ($transaction['token_info']['address'] !== self::USDT_CONTRACT) {
        return false;  // ✅ Validar contrato
    }

    if ((int)$transaction['value'] !== $expectedAmount) {
        return false;  // ✅ Validar monto exacto
    }

    return (int)$transaction['result'] === 1;  // ✅ Validar status
}
```

---

## 🛡️ Headers de Seguridad

- [ ] `X-Content-Type-Options: nosniff`
- [ ] `X-Frame-Options: DENY`
- [ ] `X-XSS-Protection: 1; mode=block`
- [ ] `Referrer-Policy: strict-origin-when-cross-origin`

### En `app/Http/Middleware/SetSecurityHeaders.php`:

```php
public function handle(Request $request, Closure $next)
{
    $response = $next($request);
    
    $response->header('X-Content-Type-Options', 'nosniff');
    $response->header('X-Frame-Options', 'DENY');
    $response->header('X-XSS-Protection', '1; mode=block');
    $response->header('Referrer-Policy', 'strict-origin-when-cross-origin');
    
    return $response;
}
```

Agregar en `app/Http/Kernel.php`:

```php
protected $middleware = [
    // ...
    \App\Http\Middleware\SetSecurityHeaders::class,
];
```

---

## 🔄 Backups

- [ ] Backups automáticos cada 24 horas
- [ ] Backups están encriptados
- [ ] Backups están fuera del servidor
- [ ] Restore testing cada semana
- [ ] Retención: 30 días mínimo

### Script de backup:

```bash
#!/bin/bash

BACKUP_DIR="/backups/crypto-gateway"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Backup de BD
mysqldump -u$DB_USER -p$DB_PASSWORD $DB_NAME | \
    gzip > $BACKUP_DIR/db_$TIMESTAMP.sql.gz

# Backup de archivos
tar -czf $BACKUP_DIR/files_$TIMESTAMP.tar.gz /path/to/app

# Upload a S3
aws s3 cp $BACKUP_DIR/ s3://backups/crypto-gateway/ --recursive

# Limpiar backups antiguos (30 días)
find $BACKUP_DIR -name "*.gz" -mtime +30 -delete
```

Agregar a crontab:

```cron
0 2 * * * /opt/backups/backup-crypto-gateway.sh
```

---

## 🎯 Monitoreo y Alertas

- [ ] ErrorTracking (Sentry, Rollbar)
- [ ] Uptime monitoring
- [ ] Database size monitoring
- [ ] Disk space alerts
- [ ] Queue lag monitoring
- [ ] Failed job alerts

### Con Sentry:

```bash
composer require sentry/sentry-laravel

php artisan vendor:publish --provider="Sentry\Laravel\ServiceProvider"
```

En `.env`:

```env
SENTRY_LARAVEL_DSN=https://examplePublicKey@o0.ingest.sentry.io/0
```

---

## 🔐 Testing de Seguridad

```bash
# 1. Verificar vulnerabilidades de dependencias
composer audit

# 2. Code analysis
php ./vendor/bin/phpstan analyse

# 3. Security headers
curl -I https://gateway.example.com

# 4. SSL Check
openssl s_client -connect gateway.example.com:443

# 5. API Test
curl -X POST https://gateway.example.com/api/v1/orders \
  -H "X-Merchant-Key: invalid" \
  # Debe retornar 401
```

---

## ✅ Pre-Deployment Checklist

```bash
#!/bin/bash

echo "🔍 Pre-Deployment Security Checklist"
echo "===================================="

# 1. Env variables
echo -n "✓ APP_ENV=production? "
grep "^APP_ENV=production" .env && echo "✅" || echo "❌"

echo -n "✓ APP_DEBUG=false? "
grep "^APP_DEBUG=false" .env && echo "✅" || echo "❌"

# 2. Tests
echo -n "✓ Tests pass? "
php artisan test --colors=never > /dev/null && echo "✅" || echo "❌"

# 3. Dependencies
echo -n "✓ No vulnerabilities? "
composer audit --no-dev > /dev/null && echo "✅" || echo "❌"

# 4. Code quality
echo -n "✓ Code passes analysis? "
php ./vendor/bin/phpstan analyse > /dev/null && echo "✅" || echo "❌"

# 5. .env not in git
echo -n "✓ .env not in git? "
! git ls-files | grep -q "^\.env$" && echo "✅" || echo "❌"

# 6. Secrets not in logs
echo -n "✓ No secrets in repo? "
! git log -p | grep -iE "api.?key|secret|password" > /dev/null && echo "✅" || echo "❌"

echo ""
echo "🚀 Ready for deployment!"
```

---

## 📞 Incidentes de Seguridad

Si detectas una vulnerabilidad:

1. **NO** commits públicos
2. **NO** issues públicas en GitHub
3. Email privado a `security@example.com`
4. Aguarda confirmación
5. Coordina fix
6. Coordina release

---

## 📖 Referencias

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Laravel Security](https://laravel.com/docs/11.x/security)
- [PHP Security](https://www.php.net/manual/es/security.php)
- [TronGrid Docs](https://trongrid.io/documentation-api)

---

**Última revisión:** Junio 2024
**Próxima revisión:** Septiembre 2024

¡Seguridad es responsabilidad de todos! 🔐
