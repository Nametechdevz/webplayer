<?php

if (!defined('ABSPATH')) {
    exit;
}

class Crypto_Logger
{
    private static $logger = null;

    public static function log($message, $level = 'info')
    {
        if (self::$logger === null) {
            self::$logger = wc_get_logger();
        }

        self::$logger->log($level, $message, [
            'source' => 'crypto-payment-gateway',
        ]);
    }

    public static function info($message)
    {
        self::log($message, 'info');
    }

    public static function warning($message)
    {
        self::log($message, 'warning');
    }

    public static function error($message)
    {
        self::log($message, 'error');
    }
}
