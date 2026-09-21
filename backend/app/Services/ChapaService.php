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
        $secretKey = $sacco->chapa_secret_key ?: config('services.chapa.secret_key');

        if (empty($secretKey)) {
            throw new Exception("Payment gateway is not configured for this SACCO.");
        }

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
        $secretKey = $sacco->chapa_secret_key ?: config('services.chapa.secret_key');

        if (empty($secretKey)) {
            throw new Exception("Payment gateway is not configured for this SACCO.");
        }

        $response = Http::withToken($secretKey)
            ->get("https://api.chapa.co/v1/transaction/verify/{$txRef}");

        if (!$response->successful()) {
            throw new Exception("Failed to verify Chapa payment: " . $response->body());
        }

        return $response->json();
    }
}
