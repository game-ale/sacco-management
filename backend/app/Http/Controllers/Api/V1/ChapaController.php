<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Models\Repayment;
use App\Models\SavingsTransaction;
use App\Services\ChapaService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class ChapaController extends Controller
{
    protected ChapaService $chapaService;

    public function __construct(ChapaService $chapaService)
    {
        $this->chapaService = $chapaService;
    }

    /**
     * Initialize a payment from a member to their SACCO.
     */
    public function initialize(Request $request): JsonResponse
    {
        $request->validate([
            'amount' => 'required|numeric|min:1',
            'type' => 'required|in:loan,savings,shares',
            'loan_id' => 'required_if:type,loan|exists:loans,id',
            'schedule_id' => 'nullable|exists:loan_schedules,id',
        ]);

        $user = $request->user();
        $sacco = $user->sacco;

        if (!$sacco || empty($sacco->chapa_secret_key)) {
            return response()->json([
                'success' => false,
                'message' => 'Your SACCO has not configured online payments.'
            ], 400);
        }

        $amount = $request->amount;
        $type = $request->type;
        $refId = $type === 'loan' ? $request->loan_id : 0;
        $scheduleId = $request->schedule_id ?? 0;
        
        // tx_ref format: CHAPA-{TYPE}-{USER_ID}-{REF_ID}-{SCHEDULE_ID}-{RANDOM}
        $txRef = "CHAPA-{$type}-{$user->id}-{$refId}-{$scheduleId}-" . Str::random(8);

        // Redirect URL after payment
        $returnUrl = url("/member/payments/verify?tx_ref={$txRef}");

        $chapaData = [
            'amount' => $amount,
            'currency' => 'ETB',
            'email' => $user->email,
            'first_name' => explode(' ', $user->name)[0],
            'last_name' => explode(' ', $user->name)[1] ?? '',
            'tx_ref' => $txRef,
            'callback_url' => url('/api/v1/payments/chapa/webhook'),
            'return_url' => $returnUrl,
            'customization' => [
                'title' => 'SACCO Payment',
                'description' => ucfirst($type) . ' Payment'
            ]
        ];

        try {
            $response = $this->chapaService->initialize($sacco, $chapaData);
            
            if ($response['status'] === 'success') {
                return response()->json([
                    'success' => true,
                    'checkout_url' => $response['data']['checkout_url']
                ]);
            }
            
            return response()->json(['success' => false, 'message' => 'Failed to generate checkout link.'], 500);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }

    /**
     * Verify a payment (can be called by frontend after redirect, or by webhook).
     */
    public function verify(Request $request): JsonResponse
    {
        $txRef = $request->tx_ref;
        if (!$txRef) {
            return response()->json(['success' => false, 'message' => 'Transaction reference is required.'], 400);
        }

        $user = $request->user();
        $sacco = $user->sacco;

        try {
            $response = $this->chapaService->verify($sacco, $txRef);

            if ($response['status'] === 'success') {
                
                // Prevent double processing
                if (DB::table('repayments')->where('reference_number', $txRef)->exists() || 
                    DB::table('savings_transactions')->where('reference_number', $txRef)->exists()) {
                    return response()->json(['success' => true, 'message' => 'Payment already processed.']);
                }

                $amount = $response['data']['amount'];
                
                // Parse tx_ref: CHAPA-{TYPE}-{USER_ID}-{REF_ID}-{SCHEDULE_ID}-{RANDOM}
                $parts = explode('-', $txRef);
                $type = $parts[1] ?? 'unknown';
                $refId = $parts[3] ?? 0;
                $scheduleId = $parts[4] ?? 0;

                DB::transaction(function () use ($sacco, $user, $amount, $type, $refId, $scheduleId, $txRef) {
                    if ($type === 'loan') {
                        Repayment::create([
                            'sacco_id' => $sacco->id,
                            'loan_id' => $refId,
                            'loan_schedule_id' => $scheduleId,
                            'member_id' => $user->id,
                            'amount' => $amount,
                            'payment_date' => now()->toDateString(),
                            'payment_method' => 'chapa',
                            'reference_number' => $txRef,
                            'status' => 'completed',
                        ]);
                        // In a full implementation, you would also update the loan schedule balance here.
                    } elseif ($type === 'shares') {
                        // We check if this txRef was processed (using a generic logic or assuming it's safe within transaction if we had a generic table)
                        // For simplicity, we just add the shares. In production, we should log this in a share_transactions table or use a cache key to prevent double processing since we don't have a share_transactions table.
                        if (!\Illuminate\Support\Facades\Cache::add("processed_tx_" . $txRef, true, 1440)) {
                            return; // Already processed
                        }
                        
                        $shareValue = max(1, $sacco->share_value ?? 100);
                        $sharesBought = floor($amount / $shareValue);
                        
                        DB::table('users')->where('id', $user->id)->increment('num_shares', $sharesBought);
                        
                    } elseif ($type === 'savings') {
                        $currentBalance = $user->savings_balance ?? 0;
                        SavingsTransaction::create([
                            'sacco_id' => $sacco->id,
                            'member_id' => $user->id,
                            'type' => 'deposit',
                            'amount' => $amount,
                            'balance_after' => $currentBalance + $amount,
                            'description' => 'Online Chapa Deposit',
                            'reference_number' => $txRef,
                            'transaction_date' => now()->toDateString(),
                        ]);
                    }
                });

                return response()->json(['success' => true, 'message' => 'Payment processed successfully.']);
            }

            return response()->json(['success' => false, 'message' => 'Payment verification failed.'], 400);

        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage()], 500);
        }
    }
}
