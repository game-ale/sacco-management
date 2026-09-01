<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\StoreRepaymentRequest;
use App\Http\Resources\V1\LoanResource;
use App\Http\Resources\V1\LoanScheduleResource;
use App\Http\Resources\V1\RepaymentResource;
use App\Http\Resources\V1\UserResource;
use App\Http\Traits\ApiResponse;
use App\Models\Loan;
use App\Models\LoanSchedule;
use App\Models\Repayment;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class RepaymentController extends Controller
{
    use ApiResponse;

    /**
     * Record a repayment against a specific loan schedule entry.
     *
     * @param  StoreRepaymentRequest  $request
     * @param  Loan  $loan
     * @return JsonResponse
     */
    public function store(StoreRepaymentRequest $request, Loan $loan): JsonResponse
    {
        $user = $request->user();

        if ($user->isMember()) {
            if ($loan->member_id !== $user->id) {
                return $this->forbidden(
                    'You do not have permission to record repayments for this loan.'
                );
            }
        } elseif (($user->isAdmin() || $user->role === 'sacco_admin') && $loan->sacco_id !== $user->sacco_id) {
            return $this->forbidden(
                'You do not have permission to record repayments for this loan.'
            );
        } elseif (! $user->isAdmin() && $user->role !== 'sacco_admin') {
            return $this->forbidden(
                'You do not have permission to record repayments for this loan.'
            );
        }

        $amountPaid = round((float) $request->validated('amount_paid'), 2);

        if ($amountPaid <= 0) {
            return $this->error(
                'The repayment amount must be greater than zero.',
                422,
                [
                    'amount_paid' => [
                        'The repayment amount must be greater than zero.'
                    ]
                ]
            );
        }

        [$repayment, $schedule] = DB::transaction(function () use (
            $loan,
            $amountPaid,
            $request,
            $user
        ) {
            /*
             * Lock the schedule row before reading amount_paid.
             * This prevents concurrent repayments from using
             * the same remaining balance.
             */
            $schedule = LoanSchedule::where('id', $request->validated('schedule_id'))
                ->where('loan_id', $loan->id)
                ->lockForUpdate()
                ->first();

            if (! $schedule) {
                throw ValidationException::withMessages([
                    'schedule_id' => [
                        'The selected schedule entry does not belong to this loan.'
                    ]
                ]);
            }

            $remaining = round(
                (float) $schedule->total_due +
                (float) $schedule->penalty_amount -
                (float) $schedule->amount_paid,
                2
            );

            /*
             * Never allow repayment to exceed the remaining
             * amount for this installment.
             */
            if ($amountPaid > $remaining) {
                throw ValidationException::withMessages([
                    'amount_paid' => [
                        'The repayment amount exceeds the remaining amount due for this installment.'
                    ]
                ]);
            }

            $repayment = Repayment::create([
                'sacco_id' => $loan->sacco_id,
                'loan_id' => $loan->id,
                'loan_schedule_id' => $schedule->id,
                'amount' => $amountPaid,
                'paid_at' => $request->validated('payment_date'),
                'method' => $request->validated('method') ?? 'manual',
                'recorded_by' => $user->id,
            ]);

            /*
             * Update schedule balance atomically.
             */
            $schedule->amount_paid = round(
                (float) $schedule->amount_paid + $amountPaid,
                2
            );

            /*
             * Determine the schedule status.
             */
            if ((float) $schedule->amount_paid >= ((float) $schedule->total_due + (float) $schedule->penalty_amount)) {
                $schedule->amount_paid = round((float) $schedule->total_due + (float) $schedule->penalty_amount, 2);
                $schedule->status = 'paid';
            } elseif ((float) $schedule->amount_paid > 0) {
                if ($schedule->due_date->lt(now()->toDateString())) {
                    $schedule->status = 'overdue';
                } else {
                    $schedule->status = 'partial';
                }
            } elseif ($schedule->due_date->lt(now()->toDateString())) {
                $schedule->status = 'overdue';
            } else {
                $schedule->status = 'pending';
            }

            $schedule->save();

            /*
             * Automatically complete the loan when every
             * installment has been fully paid.
             */
            $allPaid = ! $loan->schedules()
                ->where('status', '!=', 'paid')
                ->exists();

            if ($allPaid) {
                $loan->update([
                    'status' => 'completed',
                ]);
            }

            return [$repayment, $schedule];
        });

        return $this->created(
            [
                'repayment' => RepaymentResource::make($repayment),
                'updated_schedule_entry' => LoanScheduleResource::make(
                    $schedule->fresh()
                ),
            ],
            'Repayment recorded successfully.'
        );
    }

    /**
     * List all repayments belonging to a specific loan.
     *
     * @param  Request  $request
     * @param  Loan  $loan
     * @return JsonResponse
     */
    public function index(Request $request, Loan $loan): JsonResponse
    {
        $user = $request->user();

        if ($user->isMember()) {
            if ($loan->member_id !== $user->id) {
                return $this->forbidden('You do not have permission to view these repayments.');
            }
        } elseif ($user->isAdmin() || in_array($user->role, ['admin', 'sacco_admin'], true)) {
            if ($loan->sacco_id !== $user->sacco_id) {
                return $this->forbidden('You do not have permission to view these repayments.');
            }
        } else {
            return $this->forbidden('You do not have permission to view these repayments.');
        }

        $repayments = $loan->repayments()->latest('paid_at')->get();

        return $this->success(
            RepaymentResource::collection($repayments),
            'Repayments retrieved successfully.'
        );
    }

    /**
     * List overdue loan installments across the authenticated admin's SACCO.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function overdue(Request $request): JsonResponse
    {
        $user = $request->user();

        $schedules = LoanSchedule::query()
            ->whereHas('loan', function ($query) use ($user): void {
                $query->where('sacco_id', $user->sacco_id);
            })
            ->where('due_date', '<', now()->toDateString())
            ->whereColumn('amount_paid', '<', 'total_due')
            ->with(['loan.user'])
            ->orderBy('due_date')
            ->get();

        $data = $schedules->map(fn (LoanSchedule $schedule) => [
            'schedule_entry' => LoanScheduleResource::make($schedule),
            'member' => UserResource::make($schedule->loan->user),
            'loan' => LoanResource::make($schedule->loan),
        ])->values();

        return $this->success($data, 'Overdue installments retrieved successfully.');
    }
}
