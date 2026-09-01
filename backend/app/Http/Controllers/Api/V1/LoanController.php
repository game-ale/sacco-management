<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\ApplyLoanRequest;
use App\Http\Requests\Api\V1\ApproveLoanRequest;
use App\Http\Requests\Api\V1\RejectLoanRequest;
use App\Http\Resources\V1\LoanResource;
use App\Http\Traits\ApiResponse;
use App\Models\Loan;
use App\Models\LoanSchedule;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Notification;
use App\Notifications\LoanApplicationSubmitted;
use App\Notifications\GuarantorRequestNotification;
use App\Models\User;
use App\Models\LoanGuarantor;
use App\Models\SavingsTransaction;

class LoanController extends Controller
{
    use ApiResponse;

    /**
     * List all loans belonging to the authenticated admin's SACCO.
     *
     * @param  Request  $request
     * @return AnonymousResourceCollection
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Loan::where('sacco_id', $request->user()->sacco_id)->with(['user', 'guarantors.member']);

        if ($request->has('status')) {
            $status = (string) $request->query('status');
            if (in_array($status, ['pending', 'approved', 'rejected', 'active', 'closed'], true)) {
                $query->where('status', $status);
            }
        }

        $loans = $query->latest()->paginate(15);

        return LoanResource::collection($loans);
    }

    /**
     * Member applies for a loan.
     *
     * @param  ApplyLoanRequest  $request
     * @return JsonResponse
     */
    public function store(ApplyLoanRequest $request): JsonResponse
    {
        $user = $request->user();

        $latestTransaction = SavingsTransaction::where('member_id', $user->id)
            ->latest('transaction_date')
            ->latest('id')
            ->first();

        $savingsBalance = $latestTransaction ? (float) $latestTransaction->balance_after : 0;
        
        $sacco = $user->sacco;
        $multiplier = $sacco ? (float) $sacco->loan_savings_multiplier : 3.0;
        $maxAllowedWithoutGuarantor = $savingsBalance * $multiplier;
        
        // Build array of guarantor IDs from request
        $guarantorIds = [];
        if ($request->has('guarantor_ids') && is_array($request->guarantor_ids)) {
            $guarantorIds = array_map('intval', $request->guarantor_ids);
        } elseif ($request->guarantor_id) {
            $guarantorIds = [(int) $request->guarantor_id];
        }

        if ($request->amount > $maxAllowedWithoutGuarantor) {
            // Rule: Loans exceeding 3x savings REQUIRE EXACTLY 3 GUARANTORS
            if (count($guarantorIds) !== 3) {
                return $this->error('The requested loan amount exceeds 3x your savings balance (' . number_format($maxAllowedWithoutGuarantor, 2) . '). You must select EXACTLY 3 valid guarantors to proceed.', 422);
            }

            // Check for duplicates
            if (count(array_unique($guarantorIds)) !== 3) {
                return $this->error('Duplicate guarantors are not allowed. Please select 3 distinct members.', 422);
            }
            
            // Check self-guarantee
            if (in_array($user->id, $guarantorIds, true)) {
                return $this->error('You cannot select yourself as a guarantor.', 422);
            }
            
            // Validate all 3 guarantors exist, active, member role, same sacco
            $validGuarantors = User::whereIn('id', $guarantorIds)
                ->where('sacco_id', $user->sacco_id)
                ->where('role', 'member')
                ->where('is_active', true)
                ->get();

            if ($validGuarantors->count() !== 3) {
                return $this->error('One or more selected guarantors are invalid, inactive, or not from your SACCO.', 422);
            }
        }

        DB::beginTransaction();
        try {
            $loan = Loan::create([
                'sacco_id' => $user->sacco_id,
                'member_id' => $user->id,
                'loan_number' => 'LN-' . strtoupper(Str::random(8)),
                'loan_type' => $request->loan_type,
                'term_months' => $request->term_months,
                'principal_amount' => $request->amount,
                'purpose' => $request->purpose,
                'status' => 'pending',
            ]);

            if ($request->amount > $maxAllowedWithoutGuarantor && count($guarantorIds) === 3) {
                $amountGuaranteedPerPerson = round(($request->amount - $maxAllowedWithoutGuarantor) / 3, 2);
                if ($amountGuaranteedPerPerson <= 0) {
                    $amountGuaranteedPerPerson = round($request->amount / 3, 2);
                }

                foreach ($guarantorIds as $gid) {
                    LoanGuarantor::create([
                        'loan_id' => $loan->id,
                        'member_id' => $gid,
                        'amount_guaranteed' => $amountGuaranteedPerPerson,
                        'status' => 'pending'
                    ]);
                }

                // Send guarantee request notifications to all 3 guarantors
                $guarantorsToNotify = User::whereIn('id', $guarantorIds)->get();
                foreach ($guarantorsToNotify as $gUser) {
                    Notification::send($gUser, new GuarantorRequestNotification($loan, $amountGuaranteedPerPerson));
                }
            }
            
            DB::commit();

            // Notify SACCO Admins
            $admins = User::where('sacco_id', $user->sacco_id)
                          ->where('role', 'admin')
                          ->get();
            if ($admins->isNotEmpty()) {
                Notification::send($admins, new LoanApplicationSubmitted($loan));
            }

            return $this->created(
                LoanResource::make($loan->load(['guarantors.member', 'user'])),
                'Loan application submitted successfully.'
            );
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }

    /**
     * View loan details including repayment schedule and repayments.
     *
     * @param  Request  $request
     * @param  Loan  $loan
     * @return JsonResponse
     */
    public function show(Request $request, Loan $loan): JsonResponse
    {
        $user = $request->user();

        if ($user->isMember()) {
            if ($loan->member_id !== $user->id) {
                return $this->forbidden('You do not have permission to view this loan.');
            }
        } elseif ($user->isAdmin() || in_array($user->role, ['admin', 'sacco_admin'], true)) {
            if ($loan->sacco_id !== $user->sacco_id) {
                return $this->forbidden('You do not have permission to view this loan.');
            }
        } else {
            return $this->forbidden('You do not have permission to view this loan.');
        }

        $loan->load(['schedules', 'repayments', 'user', 'guarantors.member']);

        return $this->success(
            LoanResource::make($loan),
            'Loan details retrieved successfully.'
        );
    }

    /**
     * Approve a pending loan.
     *
     * @param  ApproveLoanRequest  $request
     * @param  Loan  $loan
     * @return JsonResponse
     */
    public function approve(ApproveLoanRequest $request, Loan $loan): JsonResponse
    {
        if ($loan->sacco_id !== $request->user()->sacco_id) {
            return $this->forbidden('You do not have permission to approve this loan.');
        }

        if ($loan->status !== 'pending') {
            return $this->error('Only pending loans can be approved.', 400);
        }

        // Re-check applicant's CURRENT savings balance and 3X limit
        $latestTransaction = SavingsTransaction::where('member_id', $loan->member_id)
            ->latest('transaction_date')
            ->latest('id')
            ->first();

        $currentSavings = $latestTransaction ? (float) $latestTransaction->balance_after : 0;
        $sacco = $loan->sacco;
        $multiplier = (float) ($sacco->loan_savings_multiplier ?? 3.0);
        $currentMaxWithoutGuarantor = $currentSavings * $multiplier;

        // If current requested amount exceeds current 3x limit, enforce EXACTLY 3 ACCEPTED GUARANTORS
        if ($loan->principal_amount > $currentMaxWithoutGuarantor) {
            $guarantors = LoanGuarantor::where('loan_id', $loan->id)->get();
            $totalCount = $guarantors->count();
            $acceptedCount = $guarantors->where('status', 'accepted')->count();
            $pendingCount = $guarantors->where('status', 'pending')->count();
            $rejectedCount = $guarantors->where('status', 'rejected')->count();

            if ($totalCount !== 3 || $acceptedCount !== 3) {
                return $this->error(
                    "Loan cannot be approved because the requested amount (ETB " . number_format((float)$loan->principal_amount, 2) . ") exceeds the applicant's current 3x savings limit (ETB " . number_format($currentMaxWithoutGuarantor, 2) . "). Exactly 3 accepted guarantors are required. Current guarantor status: {$acceptedCount} accepted, {$pendingCount} pending, {$rejectedCount} rejected out of {$totalCount} guarantors.",
                    422
                );
            }
        }

        $interestRate = (float) $request->interest_rate;
        $termMonths = (int) $request->term_months;
        $totalInterest = round(((float) $loan->principal_amount) * ($interestRate / 100) * ($termMonths / 12), 2);
        $totalRepayable = round(((float) $loan->principal_amount) + $totalInterest, 2);
        $monthlyInstallment = round($totalRepayable / $termMonths, 2);

        $loan->update([
            'status' => 'approved',
            'interest_rate' => $interestRate,
            'term_months' => $termMonths,
            'total_repayable' => $totalRepayable,
            'monthly_installment' => $monthlyInstallment,
            'approved_at' => now(),
            'approved_by' => $request->user()->id,
        ]);

        return $this->success(
            LoanResource::make($loan->fresh(['guarantors.member', 'user'])),
            'Loan approved successfully.'
        );
    }

    /**
     * Reject a pending loan.
     *
     * @param  RejectLoanRequest  $request
     * @param  Loan  $loan
     * @return JsonResponse
     */
    public function reject(RejectLoanRequest $request, Loan $loan): JsonResponse
    {
        if ($loan->sacco_id !== $request->user()->sacco_id) {
            return $this->forbidden('You do not have permission to reject this loan.');
        }

        if ($loan->status !== 'pending') {
            return $this->error('Only pending loans can be rejected.', 400);
        }

        $loan->update([
            'status' => 'rejected',
            'rejection_reason' => $request->rejection_reason,
        ]);

        return $this->success(
            LoanResource::make($loan->fresh()),
            'Loan rejected successfully.'
        );
    }

    /**
     * Disburse an approved loan and generate repayment schedule.
     *
     * @param  Request  $request
     * @param  Loan  $loan
     * @return JsonResponse
     */
    public function disburse(Request $request, Loan $loan): JsonResponse
    {
        if ($loan->sacco_id !== $request->user()->sacco_id) {
            return $this->forbidden('You do not have permission to disburse this loan.');
        }

        if ($loan->status !== 'approved') {
            return $this->error('Only approved loans can be disbursed.', 400);
        }

        DB::transaction(function () use ($loan): void {
            $loan->update([
                'status' => 'active',
                'disbursed_at' => now(),
            ]);

            $loan->schedules()->delete();

            $termMonths = (int) $loan->term_months;
            $principalAmount = (float) $loan->principal_amount;
            $totalRepayable = (float) $loan->total_repayable;
            $totalInterest = round($totalRepayable - $principalAmount, 2);

            $principalPerInstallment = round($principalAmount / $termMonths, 2);
            $interestPerInstallment = round($totalInterest / $termMonths, 2);

            $accumulatedPrincipal = 0.00;
            $accumulatedInterest = 0.00;
            for ($i = 1; $i <= $termMonths; $i++) {
                if ($i === $termMonths) {
                    $principalDue = round($principalAmount - $accumulatedPrincipal, 2);
                    $interestDue = round($totalInterest - $accumulatedInterest, 2);
                } else {
                    $principalDue = $principalPerInstallment;
                    $interestDue = $interestPerInstallment;
                    $accumulatedPrincipal += $principalDue;
                    $accumulatedInterest += $interestDue;
                }

                LoanSchedule::create([
                    'loan_id' => $loan->id,
                    'installment_number' => $i,
                    'due_date' => now()->addMonths($i)->toDateString(),
                    'principal_due' => $principalDue,
                    'interest_due' => $interestDue,
                    'total_due' => round($principalDue + $interestDue, 2),
                    'amount_paid' => 0.00,
                    'status' => 'pending',
                ]);
            }
        });

        return $this->success(
            LoanResource::make($loan->fresh(['schedules'])),
            'Loan disbursed successfully.'
        );
    }

    /**
     * Return only the authenticated member's loans.
     *
     * @param  Request  $request
     * @return AnonymousResourceCollection
     */
    public function myLoans(Request $request): AnonymousResourceCollection
    {
        $loans = Loan::where('member_id', $request->user()->id)->latest()->paginate(15);

        return LoanResource::collection($loans);
    }
}
