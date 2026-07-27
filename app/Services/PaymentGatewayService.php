<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Str;

/**
 * Thin wrapper service for Bangladesh payment gateways.
 *
 * IMPORTANT: These methods call sandbox/live endpoints based on .env config.
 * You must supply real credentials in .env before going to production.
 * See: BKASH_*, NAGAD_*, SSLCZ_* keys in .env.example
 */
class PaymentGatewayService
{
    // ── BKASH (Tokenized Checkout) ────────────────────────────────────────────

    /** Get a fresh bKash auth token (cached internally by bKash for ~1hr) */
    public function bkashGrantToken(): ?string
    {
        $base = config('services.bkash.base_url');

        $response = Http::withHeaders([
            'username' => config('services.bkash.username'),
            'password' => config('services.bkash.password'),
        ])->post("{$base}/tokenized/checkout/token/grant", [
            'app_key'    => config('services.bkash.app_key'),
            'app_secret' => config('services.bkash.app_secret'),
        ]);

        return $response->json('id_token');
    }

    /** Create a bKash payment — returns bkashURL for redirect */
    public function bkashCreatePayment(string $token, float $amount, string $invoiceNo, string $callbackUrl): array
    {
        $base = config('services.bkash.base_url');

        $response = Http::withToken($token, '')->withHeaders([
            'Authorization' => $token,
            'X-App-Key'     => config('services.bkash.app_key'),
        ])->post("{$base}/tokenized/checkout/create", [
            'mode'                  => '0011',
            'payerReference'        => $invoiceNo,
            'callbackURL'           => $callbackUrl,
            'amount'                => (string) $amount,
            'currency'              => 'BDT',
            'intent'                => 'sale',
            'merchantInvoiceNumber' => $invoiceNo,
        ]);

        return $response->json();
    }

    /** Execute (confirm) a bKash payment after redirect */
    public function bkashExecutePayment(string $token, string $paymentId): array
    {
        $base = config('services.bkash.base_url');

        $response = Http::withHeaders([
            'Authorization' => $token,
            'X-App-Key'     => config('services.bkash.app_key'),
        ])->post("{$base}/tokenized/checkout/execute", ['paymentID' => $paymentId]);

        return $response->json();
    }

    // ── NAGAD ─────────────────────────────────────────────────────────────────

    /**
     * Nagad requires the sensitive-data JSON to be:
     *   1. Signed with the MERCHANT's private key (proves it came from us)
     *   2. Then separately RSA-encrypted with NAGAD's public key (so only
     *      Nagad can read it)
     * Both operations run on the same plaintext JSON string; the signature
     * is not itself encrypted.
     *
     * NOTE: Nagad has more than one documented API variant (e.g. differing
     * in whether the signature algorithm is SHA1withRSA or SHA256withRSA,
     * and in exact field/endpoint naming) depending on merchant/account
     * type. This implementation uses SHA256, the algorithm documented for
     * the standard Online PG merchant checkout flow — confirm this matches
     * what's shown for your specific merchant account in the Nagad portal
     * before going live, and adjust $signatureAlgo below if not.
     */
    public function nagadInitialize(string $orderId, float $amount, string $callbackUrl): array
    {
        $base       = config('services.nagad.base_url');
        $merchantId = config('services.nagad.merchant_id');

        $sensitiveData = [
            'merchantId' => $merchantId,
            'datetime'   => now()->format('YmdHis'),
            'orderId'    => $orderId,
            'challenge'  => bin2hex(random_bytes(20)),
        ];

        [$encryptedSensitiveData, $signature] = $this->signAndEncryptNagadPayload($sensitiveData);

        $response = Http::withHeaders($this->nagadHeaders())
            ->post("{$base}/api/dfs/check-out/initialize/{$merchantId}/{$orderId}", [
                'accountNumber' => $merchantId,
                'dateTime'      => $sensitiveData['datetime'],
                'sensitiveData' => $encryptedSensitiveData,
                'signature'     => $signature,
            ]);

        return $response->json();
    }

    /**
     * Sign the plaintext sensitive-data JSON with the merchant's private
     * key, then RSA-encrypt that same plaintext with Nagad's public key.
     * Returns [encryptedSensitiveDataBase64, signatureBase64].
     */
    private function signAndEncryptNagadPayload(array $sensitiveData, int $signatureAlgo = OPENSSL_ALGO_SHA256): array
    {
        $merchantPrivateKey = config('services.nagad.merchant_private_key');
        $nagadPublicKey     = config('services.nagad.pg_public_key');

        if (!$merchantPrivateKey || !$nagadPublicKey) {
            throw new \RuntimeException(
                'Nagad is not fully configured: NAGAD_MERCHANT_PRIVATE_KEY and '
                . 'NAGAD_PG_PUBLIC_KEY must both be set before Nagad payments can be initiated.'
            );
        }

        $plaintext = json_encode($sensitiveData, JSON_UNESCAPED_SLASHES);

        $privateKey = openssl_pkey_get_private($merchantPrivateKey);
        if ($privateKey === false) {
            throw new \RuntimeException('NAGAD_MERCHANT_PRIVATE_KEY is not a valid PEM-formatted RSA private key.');
        }
        $signed = openssl_sign($plaintext, $signatureBinary, $privateKey, $signatureAlgo);
        if (!$signed) {
            throw new \RuntimeException('Failed to sign Nagad sensitive data with the merchant private key.');
        }

        $publicKey = openssl_pkey_get_public($nagadPublicKey);
        if ($publicKey === false) {
            throw new \RuntimeException('NAGAD_PG_PUBLIC_KEY is not a valid PEM-formatted RSA public key.');
        }
        $encrypted = openssl_public_encrypt($plaintext, $encryptedBinary, $publicKey, OPENSSL_PKCS1_PADDING);
        if (!$encrypted) {
            throw new \RuntimeException('Failed to RSA-encrypt Nagad sensitive data with Nagad\'s public key.');
        }

        return [base64_encode($encryptedBinary), base64_encode($signatureBinary)];
    }

    private function nagadHeaders(): array
    {
        return [
            'X-KM-Api-Version' => 'v-0.2.0',
            'X-KM-IP-V4'       => request()->ip() ?? '127.0.0.1',
            'X-KM-Client-Type' => 'PC_WEB',
        ];
    }

    /**
     * Verify a Nagad payment server-to-server using the payment_ref_id Nagad
     * gave us at initialize time. NEVER trust the client-supplied "status"
     * query param from the callback redirect alone — always confirm with
     * Nagad's own verify endpoint first, exactly like bKash's executePayment
     * and SSLCommerz's validate step already do.
     */
    public function nagadVerifyPayment(string $paymentRefId): array
    {
        $base = config('services.nagad.base_url');

        $response = Http::withHeaders($this->nagadHeaders())
            ->get("{$base}/api/dfs/verify/payment/{$paymentRefId}");

        return $response->json();
    }

    // ── SSLCOMMERZ ────────────────────────────────────────────────────────────

    /** Initiate an SSLCommerz session — returns GatewayPageURL for redirect */
    public function sslcommerzInitiate(array $params): array
    {
        $sandbox = config('services.sslcommerz.is_sandboxed', true);
        $base    = $sandbox
            ? 'https://sandbox.sslcommerz.com/gwprocess/v4/api.php'
            : 'https://securepay.sslcommerz.com/gwprocess/v4/api.php';

        $payload = array_merge([
            'store_id'    => config('services.sslcommerz.store_id'),
            'store_passwd'=> config('services.sslcommerz.store_password'),
            'currency'    => 'BDT',
        ], $params);

        $response = Http::asForm()->post($base, $payload);

        return $response->json();
    }

    /** Validate an SSLCommerz IPN/callback by re-querying their validator API */
    public function sslcommerzValidate(string $valId): array
    {
        $sandbox = config('services.sslcommerz.is_sandboxed', true);
        $base    = $sandbox
            ? 'https://sandbox.sslcommerz.com/validator/api/validationserverAPI.php'
            : 'https://securepay.sslcommerz.com/validator/api/validationserverAPI.php';

        $response = Http::get($base, [
            'val_id'     => $valId,
            'store_id'   => config('services.sslcommerz.store_id'),
            'store_passwd' => config('services.sslcommerz.store_password'),
            'format'     => 'json',
        ]);

        return $response->json();
    }

    // ── SHARED ────────────────────────────────────────────────────────────────

    public static function generateInvoiceNumber(): string
    {
        return 'EDU-' . now()->format('Ymd') . '-' . strtoupper(Str::random(6));
    }
}
