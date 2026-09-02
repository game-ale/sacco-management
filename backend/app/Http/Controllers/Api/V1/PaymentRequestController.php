<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\PaymentRequestResource;
use App\Http\Traits\ApiResponse;
use App\Models\Loan;
use App\Models\LoanSchedule;
use App\Models\PaymentRequest;
use App\Models\Repayment;
use App\Models\User;
use App\Notifications\PaymentRequestStatusNotification;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class PaymentRequestController extends Controller
{
    use ApiResponse;

    /**
     * Member submits a payment request for an eligible loan/installment.
     */
    public function store(Request $request, Loan $loan): JsonResponse
    {
        $user = $request->user();

        if ($loan->member_id !== $user->id) {
            return $this->forbidden('You do not have permission to submit payment requests for this loan.');
        }

        if ($loan->sacco_id !== $user->sacco_id) {
            return $this->forbidden('You do not have permission to submit payment requests for this loan.');
        }

        $validated = $request->validate([
            'schedule_id' => 'required|exists:loan_schedules,id',
            'amount_paid' => 'required|numeric|min:0.01',
            'payment_date' => 'required|date',
            'method' => 'nullable|string|max:50',
            'notes' => 'nullable|string|max:500',
        ]);

        $schedule = LoanSchedule::where('id', $validated['schedule_id'])
            ->where('loan_id', $loan->id)
            ->first();

        if (! $schedule) {
            return $this->error('The selected schedule entry does not belong to this loan.', 422, [
                'schedule_id' => ['The selected schedule entry does not belong to this loan.'],
            ]);
        }

        $amountPaid = round((float) $validated['amount_paid'], 2);

        $remaining = round(
            (float) $schedule->total_due +
            (float) $schedule->penalty_amount -
            (float) $schedule->amount_paid,
            2
        );

        if ($amountPaid > $remaining) {
            return $this->error('The payment amount exceeds the remaining amount due for this installment.', 422, [
                'amount_paid' => ['The payment amount exceeds the remaining amount due for this installment.'],
            ]);
        }

        $paymentRequest = PaymentRequest::create([
            'sacco_id' => $loan->sacco_id,
            'member_id' => $user->id,
            'loan_id' => $loan->id,
            'loan_schedule_id' => $schedule->id,
            'amount' => $amountPaid,
            'method' => $validated['method'] ?? 'manual',
            'payment_date' => $validated['payment_date'],
            'notes' => $validated['notes'] ?? null,
            'status' => 'pending',
        ]);

        ActivityLogger::log('payment_request_created', "Payment request created for loan {$loan->id} by member {$user->id}", $request, [
            'payment_request_id' => $paymentRequest->id,
            'amount' => $amountPaid,
        ]);

        // Notify SACCO admins
        $admins = User::where('sacco_id', $user->sacco_id)
            ->whereIn('role', ['admin', 'sacco_admin'])
            ->get();

        foreach ($admins as $admin) {
            $admin->notify(new PaymentRequestStatusNotification($paymentRequest, 'submitted'));
        }

        return $this->created(
            PaymentRequestResource::make($paymentRequest->load(['member', 'loan', 'loanSchedule'])),
            'Payment request submitted successfully for admin approval.'
        );
    }

    /**
     * Member views their own payment requests.
     */
    public function indexOwn(Request $request): JsonResponse
    {
        $user = $request->user();

        $requests = PaymentRequest::where('member_id', $user->id)
            ->with(['loan', 'loanSchedule', 'reviewer'])
            ->orderByDesc('created_at')
            ->paginate(15);

        return $this->success(
            PaymentRequestResource::collection($requests),
            'Payment requests retrieved successfully.'
        );
    }

    /**
     * Member views details of a specific payment request.
     */
    public function showOwn(Request $request, PaymentRequest $paymentRequest): JsonResponse
    {
        $user = $request->user();

        if ($paymentRequest->member_id !== $user->id) {
            return $this->forbidden('You do not have permission to view this payment request.');
        }

        return $this->success(
            PaymentRequestResource::make($paymentRequest->load(['member', 'loan', 'loanSchedule', 'reviewer'])),
            'Payment request details retrieved successfully.'
        );
    }

    /**
     * SACCO Admin lists payment requests for their SACCO.
     */
    public function indexAdmin(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = PaymentRequest::where('sacco_id', $user->sacco_id)
            ->with(['member', 'loan', 'loanSchedule', 'reviewer']);

        if ($request->has('status') && in_array($request->status, ['pending', 'approved', 'rejected'], true)) {
            $query->where('status', $request->status);
        }

        $requests = $query->orderByDesc('created_at')->paginate(15);

        return $this->success(
            PaymentRequestResource::collection($requests),
            'Payment requests retrieved successfully.'
        );
    }

    /**
     * SACCO Admin views details of a payment request.
     */
    public function showAdmin(Request $request, PaymentRequest $paymentRequest): JsonResponse
    {
        $user = $request->user();

        if ($paymentRequest->sacco_id !== $user->sacco_id) {
            return $this->forbidden('You do not have permission to view this payment request.');
        }

        return $this->success(
            PaymentRequestResource::make($paymentRequest->load(['member', 'loan', 'loanSchedule', 'reviewer'])),
            'Payment request details retrieved successfully.'
        );
    }

    /**
     * SACCO Admin approves a payment request.
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $paymentRequest = PaymentRequest::where('id', $id)
            ->where('sacco_id', $user->sacco_id)
            ->first();

        if (! $paymentRequest) {
            return $this->notFound('Payment request not found.');
        }

        if ($paymentRequest->status !== 'pending') {
            return $this->error('This payment request has already been processed.', 422);
        }

        try {
            DB::transaction(function () use ($paymentRequest, $user, $request): void {
                $paymentRequest = PaymentRequest::where('id', $paymentRequest->id)->lockForUpdate()->firstOrFail();

                if ($paymentRequest->status !== 'pending') {
                    throw ValidationException::withMessages([
                        'request' => ['This payment request has already been processed.'],
                    ]);
                }

                $schedule = LoanSchedule::where('id', $paymentRequest->loan_schedule_id)
                    ->where('loan_id', $paymentRequest->loan_id)
                    ->lockForUpdate()
                    ->firstOrFail();

                $amountPaid = round((float) $paymentRequest->amount, 2);

                $remaining = round(
                    (float) $schedule->total_due +
                    (float) $schedule->penalty_amount -
                    (float) $schedule->amount_paid,
                    2
                );

                if ($amountPaid > $remaining) {
                    throw ValidationException::withMessages([
                        'amount' => ['The payment request amount exceeds the remaining amount due for this installment.'],
                    ]);
                }

                // Create confirmed Repayment
                $repayment = Repayment::create([
                    'sacco_id' => $paymentRequest->sacco_id,
                    'loan_id' => $paymentRequest->loan_id,
                    'loan_schedule_id' => $schedule->id,
                    'amount' => $amountPaid,
                    'paid_at' => $paymentRequest->payment_date,
                    'method' => $paymentRequest->method ?? 'manual',
                    'recorded_by' => $user->id,
                ]);

                // Update schedule balance and status
                $schedule->amount_paid = round((float) $schedule->amount_paid + $amountPaid, 2);
                $totalDue = round((float) $schedule->total_due + (float) $schedule->penalty_amount, 2);

                if ((float) $schedule->amount_paid >= $totalDue) {
                    $schedule->amount_paid = $totalDue;
                    $schedule->status = 'paid';
                } elseif ((float) $schedule->amount_paid > 0) {
                    $schedule->status = $schedule->due_date->lt(now()->toDateString()) ? 'overdue' : 'partial';
                } elseif ($schedule->due_date->lt(now()->toDateString())) {
                    $schedule->status = 'overdue';
                } else {
                    $schedule->status = 'pending';
                }

                $schedule->save();

                // Check loan completion
                $loan = Loan::findOrFail($paymentRequest->loan_id);
                $allPaid = ! $loan->schedules()->where('status', '!=', 'paid')->exists();

                if ($allPaid) {
                    $loan->update(['status' => 'completed']);
                }

                // Update request status
                $paymentRequest->update([
                    'status' => 'approved',
                    'reviewed_by' => $user->id,
                    'reviewed_at' => now(),
                ]);

                ActivityLogger::log('payment_request_approved', "Payment request #{$paymentRequest->id} approved by admin {$user->id}", $request, [
                    'payment_request_id' => $paymentRequest->id,
                    'repayment_id' => $repayment->id,
                    'amount' => $amountPaid,
                ]);

                // Notify member
                $paymentRequest->member->notify(new PaymentRequestStatusNotification($paymentRequest, 'approved'));
            });
        } catch (ValidationException $e) {
            return $this->error($e->getMessage(), 422, $e->errors());
        }

        return $this->success(
            PaymentRequestResource::make($paymentRequest->fresh(['member', 'loan', 'loanSchedule', 'reviewer'])),
            'Payment request approved successfully.'
        );
    }

    /**
     * SACCO Admin rejects a payment request.
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $paymentRequest = PaymentRequest::where('id', $id)
            ->where('sacco_id', $user->sacco_id)
            ->first();

        if (! $paymentRequest) {
            return $this->notFound('Payment request not found.');
        }

        if ($paymentRequest->status !== 'pending') {
            return $this->error('This payment request has already been processed.', 422);
        }

        $validated = $request->validate([
            'rejection_reason' => 'nullable|string|max:500',
        ]);

        $paymentRequest->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['rejection_reason'] ?? null,
            'reviewed_by' => $user->id,
            'reviewed_at' => now(),
        ]);

        ActivityLogger::log('payment_request_rejected', "Payment request #{$paymentRequest->id} rejected by admin {$user->id}", $request, [
            'payment_request_id' => $paymentRequest->id,
            'rejection_reason' => $validated['rejection_reason'] ?? null,
        ]);

        // Notify member
        $paymentRequest->member->notify(new PaymentRequestStatusNotification($paymentRequest, 'rejected'));

        return $this->success(
            PaymentRequestResource::make($paymentRequest->fresh(['member', 'loan', 'loanSchedule', 'reviewer'])),
            'Payment request rejected successfully.'
        );
    }
}
