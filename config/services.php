<?php

return [

    /*
    |--------------------------------------------------------------------------
    | Third Party Services
    |--------------------------------------------------------------------------
    */

    'postmark' => [
        'token' => env('POSTMARK_TOKEN'),
    ],

    'ses' => [
        'key'    => env('AWS_ACCESS_KEY_ID'),
        'secret' => env('AWS_SECRET_ACCESS_KEY'),
        'region' => env('AWS_DEFAULT_REGION', 'us-east-1'),
    ],

    'resend' => [
        'key' => env('RESEND_KEY'),
    ],

    'slack' => [
        'notifications' => [
            'bot_user_oauth_token' => env('SLACK_BOT_USER_OAUTH_TOKEN'),
            'channel'              => env('SLACK_BOT_USER_DEFAULT_CHANNEL'),
        ],
    ],

    // ── bKash Tokenized Checkout ──────────────────────────────────────────────
    'bkash' => [
        'app_key'    => env('BKASH_APP_KEY'),
        'app_secret' => env('BKASH_APP_SECRET'),
        'username'   => env('BKASH_USERNAME'),
        'password'   => env('BKASH_PASSWORD'),
        'base_url'   => env('BKASH_BASE_URL', 'https://tokenized.sandbox.bka.sh/v1.2.0-beta'),
    ],

    // ── Nagad ─────────────────────────────────────────────────────────────────
    'nagad' => [
        'merchant_id'          => env('NAGAD_MERCHANT_ID'),
        // Merchant's own RSA keypair — the private key signs the sensitive
        // data payload before it's sent to Nagad; the public key half is
        // uploaded to the Nagad merchant portal so Nagad can verify it.
        'merchant_private_key' => env('NAGAD_MERCHANT_PRIVATE_KEY'),
        'merchant_public_key'  => env('NAGAD_MERCHANT_PUBLIC_KEY'),
        // Nagad's own public key (downloaded from the merchant portal) —
        // used to RSA-encrypt the sensitive data payload sent *to* Nagad.
        // This is a different key from merchant_public_key above.
        'pg_public_key'        => env('NAGAD_PG_PUBLIC_KEY'),
        'base_url'             => env('NAGAD_BASE_URL', 'https://sandbox.mynagad.com'),
    ],

    // ── SSLCommerz ────────────────────────────────────────────────────────────
    'sslcommerz' => [
        'store_id'       => env('SSLCZ_STORE_ID'),
        'store_password' => env('SSLCZ_STORE_PASSWD'),
        'is_sandboxed'   => env('SSLCZ_IS_SANDBOXED', true),
    ],

];
