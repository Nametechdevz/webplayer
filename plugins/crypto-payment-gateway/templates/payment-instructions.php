<?php

if (!defined('ABSPATH')) {
    exit;
}

$qr_url = 'https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=tron:' . urlencode($address);
?>

<div class="crypto-payment-instructions">
    <div class="crypto-header">
        <h2><?php _e('Envía tu pago en USDT (TRC20)', 'crypto-payment-gateway'); ?></h2>
        <p><?php _e('Completa tu pago siguiendo los pasos a continuación', 'crypto-payment-gateway'); ?></p>
    </div>

    <div class="crypto-payment-details">
        <div class="detail-box">
            <label><?php _e('Dirección de Pago:', 'crypto-payment-gateway'); ?></label>
            <div class="address-container">
                <code id="payment-address" class="address-code"><?php echo esc_html($address); ?></code>
                <button type="button" class="copy-button" onclick="cryptoGateway.copyAddress(this)">
                    <?php _e('Copiar', 'crypto-payment-gateway'); ?>
                </button>
            </div>
        </div>

        <div class="detail-box">
            <label><?php _e('Monto a Enviar:', 'crypto-payment-gateway'); ?></label>
            <code class="amount-code"><?php echo esc_html($amount); ?> USDT</code>
        </div>

        <div class="detail-box">
            <label><?php _e('Tiempo Restante:', 'crypto-payment-gateway'); ?></label>
            <div id="countdown" class="countdown" data-expires="<?php echo esc_attr($expires_at); ?>">
                15:00
            </div>
        </div>
    </div>

    <div class="crypto-qr-code">
        <img src="<?php echo esc_url($qr_url); ?>" alt="QR Code TRON" />
        <p class="qr-hint"><?php _e('O escanea este código QR con tu wallet TRON', 'crypto-payment-gateway'); ?></p>
    </div>

    <div class="crypto-instructions">
        <h3><?php _e('Pasos para completar el pago:', 'crypto-payment-gateway'); ?></h3>
        <ol>
            <li><?php _e('Abre tu wallet TRON (TronLink, Ledger, Coinbase Wallet, etc.)', 'crypto-payment-gateway'); ?></li>
            <li><?php _e('Selecciona "Enviar" y elige USDT', 'crypto-payment-gateway'); ?></li>
            <li><?php _e('Pega la dirección de pago arriba', 'crypto-payment-gateway'); ?></li>
            <li><?php printf(__('Ingresa el monto exacto: <strong>%s USDT</strong>', 'crypto-payment-gateway'), esc_html($amount)); ?></li>
            <li><?php _e('Revisa bien la dirección y el monto', 'crypto-payment-gateway'); ?></li>
            <li><?php _e('Confirma y envía la transacción', 'crypto-payment-gateway'); ?></li>
            <li><?php _e('¡Esperaremos confirmación en blockchain! ⏳', 'crypto-payment-gateway'); ?></li>
        </ol>
    </div>

    <div class="crypto-alert info-alert">
        <strong><?php _e('ℹ️ Información:', 'crypto-payment-gateway'); ?></strong>
        <p><?php _e('Recibirás una confirmación automática cuando se confirme el pago en la blockchain TRON.', 'crypto-payment-gateway'); ?></p>
    </div>

    <div class="crypto-alert warning-alert">
        <strong><?php _e('⚠️ Importante:', 'crypto-payment-gateway'); ?></strong>
        <p><?php printf(__('Este enlace de pago expirará en <span id="time-remaining">15 minutos</span>. Si no envías el pago a tiempo, deberás crear un nuevo pedido.', 'crypto-payment-gateway')); ?></p>
    </div>

    <style>
        .crypto-payment-instructions {
            background: #f9f9f9;
            border: 1px solid #e0e0e0;
            border-radius: 10px;
            padding: 30px;
            max-width: 700px;
            margin: 20px auto;
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
        }

        .crypto-header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 2px solid #0066cc;
            padding-bottom: 20px;
        }

        .crypto-header h2 {
            margin: 0 0 10px;
            color: #333;
            font-size: 24px;
        }

        .crypto-header p {
            margin: 0;
            color: #666;
            font-size: 14px;
        }

        .detail-box {
            background: white;
            padding: 15px;
            border-radius: 8px;
            margin-bottom: 15px;
            border-left: 4px solid #0066cc;
        }

        .detail-box label {
            display: block;
            font-weight: 600;
            color: #333;
            margin-bottom: 8px;
            font-size: 14px;
        }

        .address-container {
            display: flex;
            gap: 10px;
            align-items: center;
        }

        .address-code,
        .amount-code {
            background: #f0f0f0;
            padding: 10px;
            border-radius: 5px;
            word-break: break-all;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            flex: 1;
            display: block;
        }

        .amount-code {
            display: block;
            font-size: 18px;
            font-weight: bold;
            color: #0066cc;
        }

        .copy-button {
            background: #0066cc;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
            font-size: 14px;
            font-weight: 600;
            white-space: nowrap;
            transition: background 0.3s;
        }

        .copy-button:hover {
            background: #0052a3;
        }

        .copy-button.copied {
            background: #28a745;
        }

        .countdown {
            font-size: 28px;
            font-weight: bold;
            color: #d9534f;
            text-align: center;
            padding: 10px;
        }

        .crypto-qr-code {
            text-align: center;
            margin: 30px 0;
            padding: 20px;
            background: white;
            border-radius: 8px;
        }

        .crypto-qr-code img {
            max-width: 300px;
            border: 2px solid #ddd;
            padding: 10px;
            background: white;
            border-radius: 5px;
        }

        .qr-hint {
            margin-top: 15px;
            color: #666;
            font-size: 14px;
        }

        .crypto-instructions {
            background: white;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }

        .crypto-instructions h3 {
            margin-top: 0;
            color: #333;
            font-size: 18px;
        }

        .crypto-instructions ol {
            margin: 15px 0;
            padding-left: 20px;
            line-height: 1.8;
        }

        .crypto-instructions li {
            margin-bottom: 10px;
            color: #555;
        }

        .crypto-alert {
            padding: 15px;
            border-radius: 5px;
            margin: 15px 0;
            border-left: 4px solid;
        }

        .crypto-alert strong {
            display: block;
            margin-bottom: 8px;
        }

        .crypto-alert p {
            margin: 0;
            font-size: 14px;
            line-height: 1.6;
        }

        .info-alert {
            background: #e3f2fd;
            border-color: #2196f3;
            color: #1565c0;
        }

        .warning-alert {
            background: #fff3cd;
            border-color: #ffc107;
            color: #856404;
        }

        @media (max-width: 600px) {
            .crypto-payment-instructions {
                padding: 20px;
            }

            .crypto-header h2 {
                font-size: 20px;
            }

            .address-container {
                flex-direction: column;
            }

            .copy-button {
                width: 100%;
            }

            .crypto-qr-code img {
                max-width: 250px;
            }
        }
    </style>

    <script>
        if (typeof cryptoGateway === 'undefined') {
            var cryptoGateway = {};
        }

        cryptoGateway.copyAddress = function(button) {
            const address = document.getElementById('payment-address').textContent;
            navigator.clipboard.writeText(address).then(() => {
                button.textContent = '<?php _e('¡Copiado!', 'crypto-payment-gateway'); ?>';
                button.classList.add('copied');
                setTimeout(() => {
                    button.textContent = '<?php _e('Copiar', 'crypto-payment-gateway'); ?>';
                    button.classList.remove('copied');
                }, 2000);
            }).catch(err => {
                alert('<?php _e('Error al copiar', 'crypto-payment-gateway'); ?>');
            });
        };

        function updateCountdown() {
            const countdownEl = document.getElementById('countdown');
            const expiresAt = new Date(countdownEl.dataset.expires);
            const now = new Date();
            const diff = expiresAt - now;

            if (diff <= 0) {
                countdownEl.textContent = '<?php _e('Expirado', 'crypto-payment-gateway'); ?>';
                countdownEl.style.color = '#999';
                return;
            }

            const minutes = Math.floor(diff / 60000);
            const seconds = Math.floor((diff % 60000) / 1000);
            const timeStr = minutes + ':' + seconds.toString().padStart(2, '0');

            countdownEl.textContent = timeStr;

            const timeRemaining = document.getElementById('time-remaining');
            if (timeRemaining) {
                timeRemaining.textContent = minutes > 0 ?
                    minutes + ' <?php _e('minutos', 'crypto-payment-gateway'); ?>' :
                    seconds + ' <?php _e('segundos', 'crypto-payment-gateway'); ?>';
            }
        }

        updateCountdown();
        setInterval(updateCountdown, 1000);
    </script>
</div>
