# 🚀 Crypto Payment Gateway - Plugin WooCommerce

**Plugin oficial de WooCommerce para integración con Crypto Payment Gateway SaaS**

Permite que los clientes paguen con USDT (TRC20) en blockchain TRON de forma segura, rápida y sin intermediarios.

---

## ✨ Características

- ✅ Integración completa con WooCommerce 6.0+
- ✅ UI moderna y responsive
- ✅ Código QR para facilitar pagos mobile
- ✅ Countdown de expiración en tiempo real
- ✅ Validación de webhooks con HMAC-SHA256
- ✅ Logging automático de todas las transacciones
- ✅ Actualización automática de órdenes
- ✅ Compatible con PHP 8.0+
- ✅ Seguridad de nivel enterprise

---

## 📋 Requisitos

- **WordPress:** 5.0 o superior
- **WooCommerce:** 6.0 o superior
- **PHP:** 8.0 o superior
- **Crypto Payment Gateway:** Instalado y configurado

---

## 🔧 Instalación

### Opción 1: Instalación Manual

```bash
# 1. Descargar el plugin
cd /path/to/wordpress/wp-content/plugins
git clone https://github.com/Nametechdevz/webplayer.git
cd webplayer/plugins/crypto-payment-gateway

# 2. Activar plugin en WordPress
# Ir a: WordPress Admin → Plugins → Activar "Crypto Payment Gateway"
```

### Opción 2: Instalación desde ZIP

```bash
# 1. Descargar: https://github.com/Nametechdevz/webplayer/releases
# 2. En WordPress Admin → Plugins → Subir Plugin
# 3. Seleccionar: crypto-payment-gateway.zip
# 4. Activar
```

---

## ⚙️ Configuración

### 1. Obtener Credenciales del Gateway

Desde tu panel de Crypto Payment Gateway:

```
1. Login en https://gateway.example.com
2. Crear un nuevo Merchant
3. Copiar:
   - Gateway URL: https://gateway.example.com
   - API Key: abc123xyz789...
   - Webhook Secret: secreto1234567890...
```

### 2. Configurar en WordPress

```
1. WordPress Admin → WooCommerce → Configuración → Pago
2. Buscar: "Crypto Payment Gateway (USDT)"
3. Rellenar:
   - Título: "Pagar con USDT"
   - Descripción: "Paga con criptomonedas"
   - URL del Gateway: https://gateway.example.com
   - API Key del Merchant: abc123xyz789...
   - Webhook Secret: secreto1234567890...
4. Guardar
```

### 3. Verificar Conexión

En WooCommerce → Configuración → Pago → Crypto Payment Gateway:

```
✅ Si aparece una palomita verde = Conexión exitosa
❌ Si aparece una X roja = Revisar credenciales
```

---

## 🎯 Flujo de Compra

```
1. Cliente en checkout
   ↓
2. Selecciona "Pagar con USDT"
   ↓
3. Completa formulario de compra
   ↓
4. Click "Completar orden"
   ↓
5. Plugin solicita orden al Gateway
   ↓
6. Se muestra página de pago con:
   - Dirección TRON
   - Monto exacto en USDT
   - QR code
   - Countdown de expiración
   ↓
7. Cliente envía USDT desde su wallet
   ↓
8. Gateway detecta transacción en blockchain
   ↓
9. Gateway envía webhook al sitio
   ↓
10. WordPress actualiza orden a "Procesando"
    ↓
11. Cliente recibe email de confirmación
```

---

## 📱 Página de Pago

La página muestra:

- **Dirección TRON** con botón copiar
- **Monto exacto** en USDT (6 decimales)
- **QR Code** para escanear
- **Countdown** de tiempo restante (15 minutos)
- **Instrucciones paso a paso**
- **Alertas de seguridad**

---

## 🔐 Seguridad

### Validación de Webhooks

```php
// El plugin valida automáticamente:
1. Header X-Signature presente
2. Firma HMAC-SHA256 válida
3. Orden existe en WordPress
4. Datos completos en payload
5. Idempotencia (no procesa 2 veces)
```

### Almacenamiento Seguro

```php
// En meta datos de orden:
- _crypto_payment_address: Dirección pagada
- _crypto_order_id: ID del gateway
- _crypto_amount: Monto en USDT
- _crypto_tx_hash: Hash de transacción
- _crypto_webhook_received: Timestamp del webhook
```

---

## 📊 Estados de Orden

| Estado | Descripción |
|--------|-------------|
| **Pendiente** | Esperando pago en blockchain |
| **Procesando** | Pago confirmado, preparando envío |
| **Fallido** | Orden expiró sin pago |

---

## 🔍 Verificación de Transacciones

### Ver logs de transacciones

```
WordPress Admin → WooCommerce → Logs
Filtrar por: crypto-payment-gateway
```

### Ver detalles de orden

```
WordPress Admin → Pedidos → Click en pedido
Scroll down → Notas de la orden
```

Ejemplo de nota:
```
Transacción: 0x1234567890abcdef... | Monto: 99.999999 USDT
```

---

## 🐛 Troubleshooting

### Plugin no aparece en WooCommerce

```
1. Verificar: WordPress Admin → Plugins
2. ¿Está activado "Crypto Payment Gateway"?
3. ¿WooCommerce está activo?
4. ¿PHP >= 8.0?
```

### Órdenes no se actualizan después de pago

```
1. Verificar webhook URL: WooCommerce → Pago → Crypto
   - Debe ser: https://tudominio.com/wp-json/crypto-gateway/v1/webhook
   
2. En Gateway, agregar webhook URL:
   - Setting: webhook_url
   - Value: https://tudominio.com/wp-json/crypto-gateway/v1/webhook
   
3. Verificar: WordPress Admin → WooCommerce → Logs
   - Buscar errores de webhook
```

### Error: "Gateway no configurado correctamente"

```
1. Ir a: WordPress Admin → WooCommerce → Configuración → Pago
2. Verificar que estos campos NO estén vacíos:
   - URL del Gateway
   - API Key del Merchant
   - Webhook Secret
3. Guardar cambios
```

### Cliente no ve opción de pago

```
1. ¿Plugin está habilitado? ✅
2. ¿Está en el país permitido? (si hay restricción)
3. ¿Monto mínimo? (configurar en WooCommerce)
4. ¿El navegador tiene cache? Limpiar
```

---

## 📝 Customización

### Cambiar textos

En WordPress Admin → WooCommerce → Configuración → Pago → Crypto Gateway:

- Título: Cambiar "Pagar con USDT" por otro
- Descripción: Personalizar mensaje

### Cambiar colores

Editar: `assets/css/checkout.css`

```css
/* Colores principales */
#0066cc /* Azul */
#d9534f /* Rojo alerta */
#28a745 /* Verde éxito */
```

### Agregar hooks personalizados

```php
// Al confirmar pago
add_action('cryptogateway_payment_completed', function($order, $data) {
    // Tu lógica aquí
    error_log('Pago completado: ' . $order->get_id());
}, 10, 2);

// Al expirar orden
add_action('cryptogateway_payment_expired', function($order) {
    // Tu lógica aquí
    error_log('Orden expirada: ' . $order->get_id());
});
```

---

## 🆘 Soporte Técnico

### Documentación

- [Documentación completa del Gateway](../../CRYPTO_GATEWAY_DOCUMENTATION.md)
- [Checklist de seguridad](../../SECURITY_CHECKLIST.md)
- [Comandos de desarrollo](../../DEVELOPMENT_COMMANDS.md)

### Logs y Debugging

```
Ubicación de logs: wp-content/logs/wc-crypto-payment-gateway-*.log

Ver últimas transacciones:
tail -f wp-content/logs/wc-crypto-payment-gateway-*.log
```

### Contacto

- **Email:** support@gateway.example.com
- **GitHub Issues:** https://github.com/Nametechdevz/webplayer/issues
- **Discord:** https://discord.gg/cryptogateway

---

## 📄 Licencia

MIT License - Libre para uso comercial y personal

---

## 🙏 Agradecimientos

Hecho con ❤️ para la comunidad de pagos cripto en WordPress

---

## 📈 Roadmap

- [ ] Soporte para múltiples redes blockchain
- [ ] Dashboard con estadísticas de ventas
- [ ] Integración con plugins de suscripción
- [ ] Refunds automáticos
- [ ] Conversión automática de tasas

---

**Versión:** 1.0.0  
**Última actualización:** Junio 2024  
**Autores:** Crypto Gateway Team
