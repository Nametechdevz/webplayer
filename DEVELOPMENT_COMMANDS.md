# 🛠️ Comandos de Desarrollo y Testing

## 📚 Tabla de Contenidos

1. [Instalación Inicial](#instalación-inicial)
2. [Servidor de Desarrollo](#servidor-de-desarrollo)
3. [Base de Datos](#base-de-datos)
4. [Testing](#testing)
5. [Cola (Queue)](#cola-queue)
6. [Debugging](#debugging)
7. [Monitoreo](#monitoreo)

---

## 📦 Instalación Inicial

### Instalación completa del proyecto

```bash
# 1. Clonar repositorio
git clone https://github.com/nametechdevz/webplayer.git
cd webplayer

# 2. Instalar dependencias
composer install

# 3. Copiar configuración
cp .env.example .env

# 4. Generar clave de aplicación
php artisan key:generate

# 5. Migrar base de datos
php artisan migrate

# 6. Seed de datos (crear merchant de prueba)
php artisan db:seed

# 7. Instalar dependencias de frontend (si las hay)
npm install && npm run dev

# ✅ Listo!
```

---

## 🚀 Servidor de Desarrollo

### Iniciar servidor Laravel

```bash
php artisan serve
# Acceso: http://localhost:8000
```

### Iniciar servidor con acceso remoto

```bash
php artisan serve --host=0.0.0.0 --port=8000
# Acceso: http://tu-ip:8000
```

### Modo de desarrollo con hotreload

```bash
php artisan serve &
npm run watch &
```

### Iniciar Redis (para Queue)

```bash
redis-server
# En Docker:
docker run -d -p 6379:6379 redis:latest
```

---

## 🗄️ Base de Datos

### Crear nueva migración

```bash
# Crear tabla
php artisan make:migration create_table_name

# Crear con modelo
php artisan make:model ModelName -m

# Crear con controller
php artisan make:model ModelName -mc
```

### Ejecutar migraciones

```bash
# Correr todas las migraciones pendientes
php artisan migrate

# Revertir última migración
php artisan migrate:rollback

# Revertir todas las migraciones
php artisan migrate:reset

# Revertir y ejecutar nuevamente
php artisan migrate:refresh

# Revertir, ejecutar y seed
php artisan migrate:refresh --seed
```

### Seed de datos

```bash
# Ejecutar DatabaseSeeder
php artisan db:seed

# Ejecutar un seeder específico
php artisan db:seed --class=MerchantSeeder

# Refrescar y seed
php artisan migrate:refresh --seed
```

### Ejecutar Tinker (REPL)

```bash
php artisan tinker

# Dentro de tinker:
>>> $merchant = \App\Models\Merchant::first()
>>> $merchant->api_key
>>> $orders = $merchant->orders()->get()
>>> exit
```

### Ejemplo: Crear merchant en Tinker

```bash
php artisan tinker

>>> use App\Models\Merchant;
>>> $merchant = Merchant::create([
...     'name' => 'Mi Tienda',
...     'api_key' => 'test-key-' . \Illuminate\Support\Str::random(24),
...     'webhook_url' => 'https://shop.example.com/webhook',
...     'webhook_secret' => \Illuminate\Support\Str::random(64),
...     'status' => 'active',
... ])
>>> $merchant
>>> exit
```

---

## 🧪 Testing

### Ejecutar todos los tests

```bash
php artisan test

# Con output detallado
php artisan test --verbose

# Con coverage
php artisan test --coverage

# Solo tests de Feature
php artisan test tests/Feature

# Solo un archivo de test
php artisan test tests/Feature/PaymentControllerTest.php
```

### Crear nuevo test

```bash
# Test de Feature
php artisan make:test PaymentGatewayTest

# Test de Unit
php artisan make:test PaymentGatewayTest --unit
```

### Ejecutar test específico

```bash
# Ejecutar un método específico
php artisan test tests/Feature/PaymentControllerTest.php --filter=test_create_order_with_valid_data

# Con patrón
php artisan test --filter=create_order
```

### Database testing

```bash
# Los tests usan :testing database por defecto
# Ver config/database.php

# Usar DB transactions para tests más rápidos
use Illuminate\Foundation\Testing\DatabaseTransactions;

class PaymentControllerTest extends TestCase
{
    use DatabaseTransactions;
    
    // ...
}
```

---

## 📨 Cola (Queue)

### Iniciar Queue Worker

```bash
# Básico
php artisan queue:work

# Con Redis
php artisan queue:work redis

# Con reinicio automático
php artisan queue:work --timeout=60

# Multiple workers
php artisan queue:work --queue=default,secondary
```

### Procesar job específico

```bash
# Procesar jobs una sola vez
php artisan queue:work --once

# Procesar un job
php artisan queue:work --queue=webhooks
```

### Ver jobs fallidos

```bash
# Listar jobs fallidos
php artisan queue:failed

# Retry un job
php artisan queue:retry {id}

# Retry todos
php artisan queue:retry all

# Forget (eliminar) un job
php artisan queue:forget {id}

# Ver tabla de failed jobs
php artisan tinker
>>> \Illuminate\Queue\Failed\FailedJobProvider::all()
```

### Testing con Jobs

```bash
// En tests
use Illuminate\Support\Facades\Queue;

Queue::fake();

// Ejecutar acción que dispara job
$this->postJson('/api/v1/orders', [...]);

// Verificar que job fue despachado
Queue::assertPushed(\App\Jobs\SendWebhookNotification::class);
```

---

## 🐛 Debugging

### Usar dd() - Dump and Die

```php
dd($variable); // Muestra y detiene ejecución
dump($variable); // Muestra pero continúa
```

### Log

```php
use Illuminate\Support\Facades\Log;

Log::info('Mensaje', ['context' => $data]);
Log::warning('Advertencia', ['data' => $data]);
Log::error('Error', ['exception' => $e]);

// Ver logs en tiempo real
tail -f storage/logs/laravel.log
```

### Debug con Debugbar (opcional)

```bash
composer require barryvdh/laravel-debugbar --dev

# En .env
APP_DEBUG=true
```

### Monitorear requests

```bash
# Ver todas las requests
php artisan tinker
>>> \Illuminate\Support\Facades\Log::listen(...)
```

### Inspeccionar modelo

```php
$order = Order::find(1);

// Ver atributos
$order->getAttributes();

// Ver cambios pendientes
$order->getDirty();

// Ver cambios originales
$order->getOriginal();

// Ver relaciones cargadas
$order->getRelations();
```

---

## 📊 Monitoreo

### Ver estado de la aplicación

```bash
# Health check
php artisan tinker
>>> echo json_encode(['status' => 'ok', 'database' => true, 'cache' => true])
```

### Estadísticas de base de datos

```bash
php artisan tinker

>>> \App\Models\Order::where('status', 'pending')->count()
>>> \App\Models\Order::where('status', 'completed')->whereDate('created_at', today())->sum('amount_usd')
>>> \App\Models\PaymentAddress::where('status', 'available')->count()
```

### Monitorear blockchain checks

```bash
# Ejecutar manual
php artisan app:check-crypto-payments

# Ver output
php artisan app:check-crypto-payments -v

# Simular en loop (desarrollo)
while true; do
  php artisan app:check-crypto-payments
  sleep 30
done
```

### Monitorear logs

```bash
# Ver logs en tiempo real
tail -f storage/logs/laravel.log

# Filtrar por tipo
tail -f storage/logs/laravel.log | grep ERROR
tail -f storage/logs/laravel.log | grep "Payment"
tail -f storage/logs/laravel.log | grep "Webhook"

# Ver últimas 50 líneas
tail -50 storage/logs/laravel.log

# Buscar líneas específicas
grep "order_id" storage/logs/laravel.log
```

---

## 🔄 Workflow de Desarrollo Completo

### Desarrollo de una feature

```bash
# 1. Crear rama
git checkout -b feature/nueva-funcionalidad

# 2. Crear migración si es necesario
php artisan make:migration add_field_to_orders

# 3. Editar migración
# vim database/migrations/...

# 4. Ejecutar migración
php artisan migrate

# 5. Crear/editar modelos y tests
php artisan make:test NewFeatureTest

# 6. Escribir tests
# vim tests/Feature/NewFeatureTest.php

# 7. Implementar funcionalidad
# vim app/Http/Controllers/...

# 8. Ejecutar tests
php artisan test

# 9. Ver logs para debugging
tail -f storage/logs/laravel.log

# 10. Commit
git add .
git commit -m "feature: implementar nueva funcionalidad"

# 11. Push
git push origin feature/nueva-funcionalidad

# 12. Crear PR
```

### Debugging de un problema

```bash
# 1. Ver logs
tail -f storage/logs/laravel.log | grep -E "ERROR|Exception"

# 2. Usar tinker para explorar
php artisan tinker
>>> $order = \App\Models\Order::find(1)
>>> $order->merchant
>>> $order->paymentAddress

# 3. Ejecutar comando manualmente
php artisan app:check-crypto-payments --verbose

# 4. Testear endpoint
curl -X POST http://localhost:8000/api/v1/orders \
  -H "X-Merchant-Key: api-key" \
  -H "Content-Type: application/json" \
  -d '{"amount_usd": 99.99, "external_order_id": "test"}'

# 5. Ver estado de queue
php artisan queue:failed

# 6. Hacer dump de datos
php artisan tinker
>>> \App\Models\Order::all()
>>> exit
```

---

## 📌 Aliases Útiles

Agregar a `~/.bashrc` o `~/.zshrc`:

```bash
alias pa='php artisan'
alias pat='php artisan tinker'
alias pas='php artisan serve'
alias pam='php artisan migrate'
alias pamr='php artisan migrate:refresh --seed'
alias qw='php artisan queue:work'
alias logs='tail -f storage/logs/laravel.log'
```

Luego:
```bash
pa serve                    # Iniciar servidor
pat                         # Tinker
pam                         # Migrar
qw                          # Queue worker
logs                        # Ver logs
```

---

## 💡 Tips Productivos

### 1. Usar PostgreSQL en desarrollo

```bash
# .env
DB_CONNECTION=pgsql
DB_HOST=127.0.0.1
DB_DATABASE=crypto_gateway
DB_USERNAME=postgres
DB_PASSWORD=password
```

### 2. IDE Helpers para autocomplete

```bash
composer require --dev barryvdh/laravel-ide-helper

php artisan ide-helper:generate
php artisan ide-helper:models
```

### 3. Code formatting

```bash
composer require --dev laravel/pint

./vendor/bin/pint
```

### 4. Staticanalysis

```bash
composer require --dev phpstan/phpstan

./vendor/bin/phpstan analyse
```

### 5. Git Hooks (pre-commit)

```bash
# Crear .git/hooks/pre-commit
#!/bin/bash
php artisan test
php ./vendor/bin/pint --test
```

---

## 🚀 Deploy Checklist

```bash
# 1. Tests pasen
php artisan test --coverage

# 2. Logs limpios
tail storage/logs/laravel.log

# 3. Environment correcto
grep APP_ENV .env

# 4. Secrets seguros
grep -E "KEY|SECRET" .env

# 5. Migraciones listas
php artisan migrate --pretend

# 6. Queue worker running
ps aux | grep queue:work

# 7. Cron job configurado
crontab -l | grep "schedule:run"

# ✅ Deploy!
```

---

¡Happy coding! 🎉
