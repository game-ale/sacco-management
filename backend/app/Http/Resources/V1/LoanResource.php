<?php

namespace App\Http\Resources\V1;

use App\Models\Loan;
use App\Models\SavingsTransaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property Loan $resource
 * @property-read int $id
 * @property-read int $sacco_id
 * @property-read int $member_id
 * @property-read float $principal_amount
 * @property-read string $purpose
 * @property-read string $status
 * @property-read float|null $interest_rate
 * @property-read int|null $term_months
 * @property-read float|null $total_repayable
 * @property-read float|null $monthly_installment
 * @property-read string|null $rejection_reason
 * @property-read Carbon|null $approved_at
 * @property-read Carbon|null $disbursed_at
 * @property-read int|null $approved_by
 * @property-read Carbon|null $created_at
 * @property-read Carbon|null $updated_at
 * @property-read mixed $user
 * @property-read mixed $schedules
 * @property-read mixed $repayments
 * @property-read mixed $guarantors
 * @property-read mixed $sacco
 * @property-read string $loan_number
 */
class LoanResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $applicant = $this->user;

        // Current savings calculation
        $latestTx = SavingsTransaction::where('member_id', $this->member_id)
            ->latest('transaction_date')
            ->latest('id')
            ->first();
        $currentSavings = $latestTx ? (float) $latestTx->balance_after : 0.0;

        // SACCO settings
        $sacco = $this->sacco ?? ($applicant ? $applicant->sacco : null);
        $multiplier = $sacco ? (float) ($sacco->loan_savings_multiplier ?? 3.0) : 3.0;
        $shareValue = $sacco ? (float) ($sacco->share_value ?? 100.0) : 100.0;

        $max3xLimit = $currentSavings * $multiplier;
        $numShares = $applicant ? (int) ($applicant->num_shares ?? 0) : 0;
        $shareCapital = $numShares * $shareValue;

        $principal = (float) $this->principal_amount;
        $isWithin3xLimit = $principal <= $max3xLimit;
        $requiresGuarantors = !$isWithin3xLimit;

        // Guarantors collection
        $guarantorsData = [];
        $allAccepted = true;
        if ($this->resource->relationLoaded('guarantors')) {
            foreach ($this->guarantors as $g) {
                if ($g->status !== 'accepted') {
                    $allAccepted = false;
                }
                $guarantorsData[] = [
                    'id' => $g->id,
                    'member_id' => $g->member_id,
                    'name' => $g->member->name ?? 'Member #' . $g->member_id,
                    'email' => $g->member->email ?? null,
                    'phone' => $g->member->phone ?? null,
                    'national_id' => $g->member->national_id ?? null,
                    'amount_guaranteed' => (float) $g->amount_guaranteed,
                    'status' => $g->status,
                ];
            }
        } else {
            $allAccepted = false;
        }

        return [
            'id' => $this->id,
            'loan_number' => $this->loan_number,
            'sacco_id' => $this->sacco_id,
            'user_id' => $this->member_id,
            'member_id' => $this->member_id,
            'amount' => (float) $this->principal_amount,
            'purpose' => $this->purpose,
            'status' => $this->status,
            'interest_rate' => $this->interest_rate !== null ? (float) $this->interest_rate : null,
            'term_months' => $this->term_months,
            'total_repayable' => $this->total_repayable !== null ? (float) $this->total_repayable : null,
            'monthly_installment' => $this->monthly_installment !== null ? (float) $this->monthly_installment : null,
            'rejection_reason' => $this->rejection_reason,
            'approved_at' => $this->approved_at?->toDateTimeString(),
            'disbursed_at' => $this->disbursed_at?->toDateTimeString(),
            'approved_by' => $this->approved_by,
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
            'user' => UserResource::make($this->whenLoaded('user')),
            'member' => UserResource::make($this->whenLoaded('user')),
            'repayment_schedule' => LoanScheduleResource::collection($this->whenLoaded('schedules')),
            'repayments' => RepaymentResource::collection($this->whenLoaded('repayments')),
            'guarantors' => $guarantorsData,
            'financial_position' => [
                'current_savings' => $currentSavings,
                'num_shares' => $numShares,
                'share_capital' => $shareCapital,
                'max_3x_limit' => $max3xLimit,
                'requested_amount' => $principal,
                'is_within_3x_limit' => $isWithin3xLimit,
                'requires_guarantors' => $requiresGuarantors,
                'all_guarantors_accepted' => $requiresGuarantors ? (count($guarantorsData) === 3 && $allAccepted) : true,
                'is_eligible_for_approval' => $isWithin3xLimit || (count($guarantorsData) === 3 && $allAccepted),
            ],
        ];
    }
}
