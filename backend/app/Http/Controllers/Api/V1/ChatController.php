<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Services\GeminiChatService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;

class ChatController extends Controller
{
    protected GeminiChatService $chatService;

    public function __construct(GeminiChatService $chatService)
    {
        $this->chatService = $chatService;
    }

    /**
     * Handle chat requests from members.
     *
     * @param Request $request
     * @return JsonResponse
     */
    public function ask(Request $request): JsonResponse
    {
        $request->validate([
            'message' => 'required|string|max:1000'
        ]);

        $user = $request->user();
        $sacco = $user->sacco;
        $message = $request->message;

        $currency = $sacco ? $sacco->currency : 'ETB';
        $saccoName = $sacco ? $sacco->name : 'your SACCO';

        $context = "You are a helpful, friendly assistant for a SACCO (Savings and Credit Cooperative Organization) Management System. ";
        $context .= "The user asking you this is a member named {$user->name}. ";
        $context .= "They belong to the SACCO named {$saccoName}. ";
        $context .= "Here is their current account data:\n";
        $context .= "- Savings Balance: {$user->savings_balance} {$currency}\n";
        $context .= "- Number of Shares: {$user->num_shares}\n";
        $context .= "\nKeep your answers concise, friendly, and helpful. Format with simple markdown. If they ask about something you don't know, suggest they contact their SACCO Admin.";

        try {
            $reply = $this->chatService->generateResponse($message, $context);
            return response()->json(['success' => true, 'reply' => $reply]);
        } catch (\Exception $e) {
            // Fallback for missing API Key or network issues
            return $this->handleFaqFallback($message, $e->getMessage());
        }
    }

    /**
     * Basic rule-based fallback when Gemini API is unavailable
     */
    private function handleFaqFallback(string $message, string $errorMsg): JsonResponse
    {
        $messageLower = strtolower($message);
        
        $reply = "I'm currently in Offline FAQ Mode. (Error: {$errorMsg}). ";
        
        if (str_contains($messageLower, 'savings') || str_contains($messageLower, 'deposit')) {
            $reply .= "To deposit savings, go to the 'Savings' tab and click 'Deposit'. You can pay online via Chapa or upload a manual receipt.";
        } elseif (str_contains($messageLower, 'loan')) {
            $reply .= "To apply for a loan, go to the 'Loans' tab and click 'Apply for Loan'. Your maximum loan amount depends on your savings.";
        } elseif (str_contains($messageLower, 'share') || str_contains($messageLower, 'dividend')) {
            $reply .= "You can view your shares and dividends in the 'Dividends' tab.";
        } else {
            $reply .= "I can answer basic questions about savings, loans, and shares. What would you like to know?";
        }

        return response()->json([
            'success' => false,
            'is_fallback' => true,
            'reply' => $reply,
            'error' => $errorMsg
        ]);
    }
}
