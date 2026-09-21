<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Models\LoanSchedule;
use App\Models\Repayment;
use App\Models\SavingsTransaction;
use App\Services\ChapaService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
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
        $secretKey = $sacco?->chapa_secret_key ?: config('services.chapa.secret_key');

        if (!$sacco || empty($secretKey)) {
            return response()->json([
                'success' => false,
                'message' => 'Your SACCO has not configured online payments.'
            ], 400);
        }

        $amount = (float) $request->amount;
        $type = $request->type;
        $refId = $type === 'loan' ? (int) $request->loan_id : 0;
        $scheduleId = (int) ($request->schedule_id ?? 0);

        if ($type === 'loan') {
            $loan = Loan::where('id', $refId)
                ->where('sacco_id', $sacco->id)
                ->where('member_id', $user->id)
                ->first();

            if (!$loan) {
                return response()->json([
                    'success' => false,
                    'message' => 'Loan not found or does not belong to you.'
                ], 404);
            }
        }
        
        // tx_ref format: CHAPA-{TYPE}-{USER_ID}-{REF_ID}-{SCHEDULE_ID}-{RANDOM}
        $txRef = "CHAPA-{$type}-{$user->id}-{$refId}-{$scheduleId}-" . Str::random(8);

        // Redirect URL after payment
        $baseReturnUrl = $request->input('return_url') ?? (rtrim(config('app.frontend_url', 'http://localhost:5173'), '/') . '/member/payments/verify');
        $separator = str_contains($baseReturnUrl, '?') ? '&' : '?';
        $returnUrl = str_contains($baseReturnUrl, 'tx_ref=') ? $baseReturnUrl : "{$baseReturnUrl}{$separator}tx_ref={$txRef}";

        // Chapa requires an email domain with valid MX/DNS records.
        // For test/seeded accounts (e.g. @example.com, @test.com), fallback to a deliverable domain format.
        $payerEmail = $user->email;
        if (empty($payerEmail) || preg_match('/@(example\.(com|org|net)|test\.(com|org|net))$/i', $payerEmail)) {
            $payerEmail = preg_replace('/@(example\.(com|org|net)|test\.(com|org|net))$/i', '@gmail.com', (string) $payerEmail);
            if (empty($payerEmail) || !filter_var($payerEmail, FILTER_VALIDATE_EMAIL)) {
                $payerEmail = 'test@gmail.com';
            }
        }

        $chapaData = [
            'amount' => $amount,
            'currency' => 'ETB',
            'email' => $payerEmail,
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
                Cache::put("chapa_init_{$txRef}", [
                    'user_id'     => $user->id,
                    'amount'      => $amount,
                    'type'        => $type,
                    'ref_id'      => $refId,
                    'schedule_id' => $scheduleId,
                ], now()->addHours(24));

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
        $txRef = $request->input('tx_ref') ?? $request->input('trx_ref') ?? $request->input('reference');
        if (!$txRef) {
            return response()->json(['success' => false, 'message' => 'Transaction reference is required.'], 400);
        }

        $user = $request->user();
        $sacco = $user->sacco;
        $secretKey = $sacco?->chapa_secret_key ?: config('services.chapa.secret_key');

        if (!$sacco || empty($secretKey)) {
            return response()->json([
                'success' => false,
                'message' => 'Your SACCO has not configured online payments.'
            ], 400);
        }

        // Parse tx_ref: CHAPA-{TYPE}-{USER_ID}-{REF_ID}-{SCHEDULE_ID}-{RANDOM}
        $parts = explode('-', $txRef);
        $type = $parts[1] ?? 'unknown';
        $txRefUserId = (int) ($parts[2] ?? 0);
        $refId = (int) ($parts[3] ?? 0);
        $scheduleId = (int) ($parts[4] ?? 0);

        // Ensure the transaction belongs to the authenticated member
        if ($txRefUserId !== $user->id) {
            return response()->json(['success' => false, 'message' => 'Transaction does not belong to this user.'], 403);
        }

        if ($type === 'loan') {
            $loan = Loan::where('id', $refId)
                ->where('sacco_id', $sacco->id)
                ->where('member_id', $user->id)
                ->first();

            if (!$loan) {
                return response()->json(['success' => false, 'message' => 'Loan not found or does not belong to you.'], 404);
            }
        }

        try {
            $response = $this->chapaService->verify($sacco, $txRef);

            $status = strtolower($response['status'] ?? '');
            $dataStatus = strtolower($response['data']['status'] ?? 'success');

            if ($status === 'success' && in_array($dataStatus, ['success', 'paid'], true)) {

                // Prevent double processing via unique reference_number columns or cache
                if (DB::table('repayments')->where('reference_number', $txRef)->exists() ||
                    DB::table('savings_transactions')->where('reference_number', $txRef)->exists() ||
                    Cache::has("processed_tx_" . $txRef)) {
                    return response()->json(['success' => true, 'message' => 'Payment already processed.']);
                }

                $amount = (float) $response['data']['amount'];

                // Verify the verified amount matches the expected payment amount
                $cachedInit = Cache::get("chapa_init_{$txRef}");
                if ($cachedInit && abs($amount - (float) $cachedInit['amount']) > 0.01) {
                    return response()->json([
                        'success' => false,
                        'message' => 'Verified payment amount does not match expected amount.'
                    ], 400);
                }

                DB::transaction(function () use ($sacco, $user, $amount, $type, $refId, $scheduleId, $txRef) {
                    if ($type === 'loan') {
                        // Lock the schedule row to prevent concurrent updates
                        if ($scheduleId > 0) {
                            $schedule = LoanSchedule::where('id', $scheduleId)
                                ->where('loan_id', $refId)
                                ->lockForUpdate()
                                ->first();
                        } else {
                            $schedule = LoanSchedule::where('loan_id', $refId)
                                ->where('status', '!=', 'paid')
                                ->orderBy('installment_number')
                                ->lockForUpdate()
                                ->first();
                            if ($schedule) {
                                $scheduleId = $schedule->id;
                            }
                        }

                        if (!$schedule) {
                            throw new \RuntimeException('Loan schedule not found.');
                        }

                        $remaining = round(
                            (float) $schedule->total_due +
                            (float) $schedule->penalty_amount -
                            (float) $schedule->amount_paid,
                            2
                        );

                        // Cap the repayment at the remaining amount due
                        $repaymentAmount = max(0.0, min($amount, $remaining));

                        Repayment::create([
                            'sacco_id'         => $sacco->id,
                            'loan_id'          => $refId,
                            'loan_schedule_id' => $scheduleId,
                            'amount'           => $repaymentAmount,
                            'paid_at'          => now()->toDateString(),
                            'method'           => 'chapa',
                            'reference_number' => $txRef,
                            'recorded_by'      => $user->id,
                        ]);

                        // Update schedule balance (mirrors RepaymentController@store)
                        $schedule->amount_paid = round(
                            (float) $schedule->amount_paid + $repaymentAmount,
                            2
                        );

                        if ((float) $schedule->amount_paid >= ((float) $schedule->total_due + (float) $schedule->penalty_amount)) {
                            $schedule->amount_paid = round((float) $schedule->total_due + (float) $schedule->penalty_amount, 2);
                            $schedule->status = 'paid';
                        } elseif ((float) $schedule->amount_paid > 0) {
                            $schedule->status = $schedule->due_date->lt(now()->toDateString()) ? 'overdue' : 'partial';
                        } elseif ($schedule->due_date->lt(now()->toDateString())) {
                            $schedule->status = 'overdue';
                        } else {
                            $schedule->status = 'pending';
                        }

                        $schedule->save();

                        // Complete the loan if all installments are fully paid
                        $loan = Loan::find($refId);
                        if ($loan) {
                            $allPaid = !$loan->schedules()
                                ->where('status', '!=', 'paid')
                                ->exists();

                            if ($allPaid) {
                                $loan->update(['status' => 'completed']);
                            }
                        }

                    } elseif ($type === 'shares') {
                        // Use cache to prevent double processing (no share_transactions table)
                        if (!\Illuminate\Support\Facades\Cache::add("processed_tx_" . $txRef, true, 1440)) {
                            return; // Already processed
                        }

                        $shareValue = max(1, $sacco->share_value ?? 100);
                        $sharesBought = floor($amount / $shareValue);

                        DB::table('users')->where('id', $user->id)->increment('num_shares', $sharesBought);

                    } elseif ($type === 'savings') {
                        // Calculate current balance from latest transaction (mirrors MemberSavingsController)
                        $latestTransaction = SavingsTransaction::where('member_id', $user->id)
                            ->orderByDesc('created_at')
                            ->first();

                        $currentBalance = $latestTransaction && $latestTransaction->balance_after !== null
                            ? (float) $latestTransaction->balance_after
                            : 0.0;

                        SavingsTransaction::create([
                            'member_id'        => $user->id,
                            'type'             => 'deposit',
                            'amount'           => $amount,
                            'balance_after'    => round($currentBalance + $amount, 2),
                            'description'      => 'Online Chapa Deposit',
                            'reference_number' => $txRef,
                            'transaction_date' => now()->toDateString(),
                        ]);
                    }
                });

                return response()->json(['success' => true, 'message' => 'Payment processed successfully.']);
            }

            return response()->json(['success' => false, 'message' => 'Payment verification failed.'], 400);

        } catch (\Illuminate\Database\QueryException $e) {
            if ($e->getCode() === '23000' || str_contains($e->getMessage(), 'Duplicate entry') || str_contains($e->getMessage(), 'UNIQUE constraint failed')) {
                return response()->json(['success' => true, 'message' => 'Payment already processed.']);
            }
            return response()->json(['success' => false, 'message' => 'Payment processing error.'], 400);
        } catch (\Exception $e) {
            return response()->json(['success' => false, 'message' => $e->getMessage() ?: 'Payment verification failed.'], 400);
        }
    }
}
