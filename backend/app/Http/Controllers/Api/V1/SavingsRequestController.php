<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\SavingsRequestResource;
use App\Http\Traits\ApiResponse;
use App\Models\SavingsRequest;
use App\Models\SavingsTransaction;
use App\Models\User;
use App\Notifications\SavingsRequestStatusNotification;
use App\Services\ActivityLogger;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class SavingsRequestController extends Controller
{
    use ApiResponse;

    /**
     * Member creates a savings request (deposit or withdrawal).
     */
    public function store(Request $request): JsonResponse
    {
        $user = $request->user();

        $validated = $request->validate([
            'type' => 'required|in:deposit,withdraw',
            'amount' => 'required|numeric|min:0.01',
            'description' => 'nullable|string|max:500',
        ]);

        $amount = round((float) $validated['amount'], 2);

        if ($validated['type'] === 'withdraw') {
            $currentBalance = $this->calculateBalance($user->id);
            if ($amount > $currentBalance) {
                return $this->error(
                    'The withdrawal amount exceeds your current savings balance.',
                    422,
                    ['amount' => ['The withdrawal amount exceeds your current savings balance.']]
                );
            }
        }

        $savingsRequest = SavingsRequest::create([
            'sacco_id' => $user->sacco_id,
            'member_id' => $user->id,
            'type' => $validated['type'],
            'amount' => $amount,
            'description' => $validated['description'] ?? null,
            'status' => 'pending',
        ]);

        ActivityLogger::log('savings_request_created', "Savings {$validated['type']} request created by member {$user->id}", $request, [
            'savings_request_id' => $savingsRequest->id,
            'amount' => $amount,
        ]);

        // Notify SACCO admins
        $admins = User::where('sacco_id', $user->sacco_id)
            ->whereIn('role', ['admin', 'sacco_admin'])
            ->get();

        foreach ($admins as $admin) {
            $admin->notify(new SavingsRequestStatusNotification($savingsRequest, 'submitted'));
        }

        return $this->created(
            SavingsRequestResource::make($savingsRequest->load('member')),
            'Savings request submitted successfully.'
        );
    }

    /**
     * Member views their own savings requests.
     */
    public function indexOwn(Request $request): JsonResponse
    {
        $user = $request->user();

        $requests = SavingsRequest::where('member_id', $user->id)
            ->orderByDesc('created_at')
            ->paginate(15);

        return $this->success(
            SavingsRequestResource::collection($requests),
            'Savings requests retrieved successfully.'
        );
    }

    /**
     * Member views details of a specific savings request.
     */
    public function showOwn(Request $request, SavingsRequest $savingsRequest): JsonResponse
    {
        $user = $request->user();

        if ($savingsRequest->member_id !== $user->id) {
            return $this->forbidden('You do not have permission to view this savings request.');
        }

        return $this->success(
            SavingsRequestResource::make($savingsRequest->load(['member', 'reviewer'])),
            'Savings request details retrieved successfully.'
        );
    }

    /**
     * SACCO Admin lists savings requests for their SACCO.
     */
    public function indexAdmin(Request $request): JsonResponse
    {
        $user = $request->user();

        $query = SavingsRequest::where('sacco_id', $user->sacco_id)
            ->with(['member', 'reviewer']);

        if ($request->has('status') && in_array($request->status, ['pending', 'approved', 'rejected'], true)) {
            $query->where('status', $request->status);
        }

        $requests = $query->orderByDesc('created_at')->paginate(15);

        return $this->success(
            SavingsRequestResource::collection($requests),
            'Savings requests retrieved successfully.'
        );
    }

    /**
     * SACCO Admin views details of a savings request.
     */
    public function showAdmin(Request $request, SavingsRequest $savingsRequest): JsonResponse
    {
        $user = $request->user();

        if ($savingsRequest->sacco_id !== $user->sacco_id) {
            return $this->forbidden('You do not have permission to view this savings request.');
        }

        return $this->success(
            SavingsRequestResource::make($savingsRequest->load(['member', 'reviewer'])),
            'Savings request details retrieved successfully.'
        );
    }

    /**
     * SACCO Admin approves a savings request.
     */
    public function approve(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $savingsRequest = SavingsRequest::where('id', $id)
            ->where('sacco_id', $user->sacco_id)
            ->first();

        if (! $savingsRequest) {
            return $this->notFound('Savings request not found.');
        }

        if ($savingsRequest->status !== 'pending') {
            return $this->error('This savings request has already been processed.', 422);
        }

        try {
            DB::transaction(function () use ($savingsRequest, $user, $request): void {
                // Re-lock and refresh
                $savingsRequest = SavingsRequest::where('id', $savingsRequest->id)->lockForUpdate()->firstOrFail();

                if ($savingsRequest->status !== 'pending') {
                    throw ValidationException::withMessages([
                        'request' => ['This savings request has already been processed.'],
                    ]);
                }

                $memberId = $savingsRequest->member_id;
                $currentBalance = $this->calculateBalance($memberId);
                $amount = (float) $savingsRequest->amount;

                if ($savingsRequest->type === 'withdraw') {
                    if ($amount > $currentBalance) {
                        throw ValidationException::withMessages([
                            'amount' => ['The requested withdrawal amount exceeds the member\'s current balance.'],
                        ]);
                    }
                    $newBalance = round($currentBalance - $amount, 2);
                } else {
                    $newBalance = round($currentBalance + $amount, 2);
                }

                // Create atomic SavingsTransaction
                SavingsTransaction::create([
                    'member_id' => $memberId,
                    'type' => $savingsRequest->type,
                    'amount' => $amount,
                    'balance_after' => $newBalance,
                    'description' => $savingsRequest->description ?? "Approved {$savingsRequest->type} request #{$savingsRequest->id}",
                    'transaction_date' => now()->toDateString(),
                ]);

                // Mark savings request as approved
                $savingsRequest->update([
                    'status' => 'approved',
                    'reviewed_by' => $user->id,
                    'reviewed_at' => now(),
                ]);

                ActivityLogger::log('savings_request_approved', "Savings request #{$savingsRequest->id} approved by admin {$user->id}", $request, [
                    'savings_request_id' => $savingsRequest->id,
                    'amount' => $amount,
                    'new_balance' => $newBalance,
                ]);

                // Notify member
                $savingsRequest->member->notify(new SavingsRequestStatusNotification($savingsRequest, 'approved'));
            });
        } catch (ValidationException $e) {
            return $this->error($e->getMessage(), 422, $e->errors());
        }

        return $this->success(
            SavingsRequestResource::make($savingsRequest->fresh(['member', 'reviewer'])),
            'Savings request approved successfully.'
        );
    }

    /**
     * SACCO Admin rejects a savings request.
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $savingsRequest = SavingsRequest::where('id', $id)
            ->where('sacco_id', $user->sacco_id)
            ->first();

        if (! $savingsRequest) {
            return $this->notFound('Savings request not found.');
        }

        if ($savingsRequest->status !== 'pending') {
            return $this->error('This savings request has already been processed.', 422);
        }

        $validated = $request->validate([
            'rejection_reason' => 'nullable|string|max:500',
        ]);

        $savingsRequest->update([
            'status' => 'rejected',
            'rejection_reason' => $validated['rejection_reason'] ?? null,
            'reviewed_by' => $user->id,
            'reviewed_at' => now(),
        ]);

        ActivityLogger::log('savings_request_rejected', "Savings request #{$savingsRequest->id} rejected by admin {$user->id}", $request, [
            'savings_request_id' => $savingsRequest->id,
            'rejection_reason' => $validated['rejection_reason'] ?? null,
        ]);

        // Notify member
        $savingsRequest->member->notify(new SavingsRequestStatusNotification($savingsRequest, 'rejected'));

        return $this->success(
            SavingsRequestResource::make($savingsRequest->fresh(['member', 'reviewer'])),
            'Savings request rejected successfully.'
        );
    }

    /**
     * Calculate member balance from completed transactions.
     */
    protected function calculateBalance(int $memberId): float
    {
        $latest = SavingsTransaction::where('member_id', $memberId)
            ->orderByDesc('created_at')
            ->first();

        if ($latest && $latest->balance_after !== null) {
            return (float) $latest->balance_after;
        }

        $deposits = (float) SavingsTransaction::where('member_id', $memberId)->where('type', 'deposit')->sum('amount');
        $withdrawals = (float) SavingsTransaction::where('member_id', $memberId)->where('type', 'withdraw')->sum('amount');

        return round($deposits - $withdrawals, 2);
    }
}
