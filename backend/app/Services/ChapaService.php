<?php

namespace App\Services;

use App\Models\Sacco;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Crypt;
use Exception;

class ChapaService
{
    /**
     * Initialize a Chapa transaction for a specific SACCO.
     */
    /**
     * @param array<string, mixed> $data
     * @return array<string, mixed>
     */
    public function initialize(Sacco $sacco, array $data): array
    {
        if (empty($sacco->chapa_secret_key)) {
            throw new Exception("Payment gateway is not configured for this SACCO.");
        }

        // The key is automatically decrypted by Laravel's cast, but if not, decrypt it.
        // Since we added 'encrypted' cast in Sacco.php, we just use it directly.
        $secretKey = $sacco->chapa_secret_key;

        $response = Http::withToken($secretKey)
            ->post('https://api.chapa.co/v1/transaction/initialize', $data);

        if (!$response->successful()) {
            throw new Exception("Failed to initialize Chapa payment: " . $response->body());
        }

        return $response->json();
    }

    /**
     * Verify a Chapa transaction.
     */
    /**
     * @return array<string, mixed>
     */
    public function verify(Sacco $sacco, string $txRef): array
    {
        if (empty($sacco->chapa_secret_key)) {
            throw new Exception("Payment gateway is not configured for this SACCO.");
        }

        $secretKey = $sacco->chapa_secret_key;

        $response = Http::withToken($secretKey)
            ->get("https://api.chapa.co/v1/transaction/verify/{$txRef}");

        if (!$response->successful()) {
            throw new Exception("Failed to verify Chapa payment: " . $response->body());
        }

        return $response->json();
    }
}
