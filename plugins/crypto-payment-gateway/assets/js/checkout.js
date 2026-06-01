/**
 * Crypto Payment Gateway - Checkout Script
 */

(function($) {
    'use strict';

    const CryptoCheckout = {
        init: function() {
            $(document.body).on('payment_method_selected', this.onPaymentMethodSelected.bind(this));
        },

        onPaymentMethodSelected: function() {
            const selectedMethod = $('input[name="payment_method"]:checked').val();

            if (selectedMethod === 'crypto_usdt_gateway') {
                this.handleCryptoMethodSelected();
            }
        },

        handleCryptoMethodSelected: function() {
            console.log('Crypto Payment Gateway selected');
        },

        showLoading: function(message) {
            const loader = $('<div class="crypto-gateway-loading">' +
                '<span class="crypto-gateway-spinner"></span> ' + message +
                '</div>');
            $('body').append(loader);
            return loader;
        },

        hideLoading: function(loader) {
            if (loader) {
                loader.remove();
            }
        },

        showError: function(message) {
            const error = $('<div class="crypto-gateway-error">' + message + '</div>');
            $('.woocommerce-notices-wrapper').prepend(error);
        },

        showSuccess: function(message) {
            const success = $('<div class="crypto-gateway-success">' + message + '</div>');
            $('.woocommerce-notices-wrapper').prepend(success);
        }
    };

    $(document).ready(function() {
        CryptoCheckout.init();
    });

    window.CryptoCheckout = CryptoCheckout;

})(jQuery);
