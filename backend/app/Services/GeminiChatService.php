<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use Exception;

class GeminiChatService
{
    /**
     * Generate a response using the Gemini API.
     *
     * @param string $prompt
     * @param string $systemInstruction
     * @return string
     * @throws Exception
     */
    public function generateResponse(string $prompt, string $systemInstruction = ''): string
    {
        /** @var string|null $apiKey */
        $apiKey = config('services.gemini.api_key');
        if (empty($apiKey)) {
            // Fallback: read directly from environment (useful in Docker deployments)
            $envKey = getenv('GEMINI_API_KEY');
            $apiKey = is_string($envKey) ? $envKey : null;
        }
        if (empty($apiKey)) {
            throw new Exception("Gemini API key is not configured. Please set GEMINI_API_KEY in your environment variables.");
        }

        $url = "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent?key={$apiKey}";

        $payload = [
            'contents' => [
                [
                    'role' => 'user',
                    'parts' => [['text' => $prompt]]
                ]
            ]
        ];

        if (!empty($systemInstruction)) {
            $payload['systemInstruction'] = [
                'parts' => [['text' => $systemInstruction]]
            ];
        }

        $response = Http::withHeaders([
            'Content-Type' => 'application/json'
        ])->post($url, $payload);

        if (!$response->successful()) {
            throw new Exception("API Error: " . $response->body());
        }

        $data = $response->json();
        
        if (isset($data['candidates'][0]['content']['parts'][0]['text'])) {
            return $data['candidates'][0]['content']['parts'][0]['text'];
        }

        throw new Exception("Invalid response format from Gemini API.");
    }
}
