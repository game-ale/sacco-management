<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Members\DepositSavingsRequest;
use App\Http\Requests\V1\Members\ShowOwnSavingsRequest;
use App\Http\Requests\V1\Members\ShowSavingsRequest;
use App\Http\Requests\V1\Members\WithdrawSavingsRequest;
use App\Http\Resources\V1\MemberSavingsActionResource;
use App\Http\Resources\V1\MemberSavingsResource;
use App\Http\Traits\ApiResponse;
use App\Models\SavingsTransaction;
use App\Models\User;
use App\Services\ActivityLogger;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\ValidationException;

class MemberSavingsController extends Controller
{
    use ApiResponse;

    public function show(ShowSavingsRequest $request, User $member): MemberSavingsResource|JsonResponse
    {
        if ($member->sacco_id !== $request->user()->sacco_id || $member->role !== 'member') {
            return $this->forbidden('You do not have permission to view savings for this member.');
        }

        $payload = $this->buildSavingsPayload($member);

        ActivityLogger::log('view_savings', "Viewed savings for member {$member->id}", $request, ['member_id' => $member->id]);

        return MemberSavingsResource::make($payload)->additional([]);
    }

    public function showOwn(ShowOwnSavingsRequest $request): MemberSavingsResource|JsonResponse
    {
        $member = $request->user();

        $payload = $this->buildSavingsPayload($member);

        ActivityLogger::log('view_own_savings', 'Viewed own savings balance', $request, ['member_id' => $member->id]);

        return MemberSavingsResource::make($payload)->additional([]);
    }

    public function deposit(DepositSavingsRequest $request, int $id): MemberSavingsActionResource|JsonResponse
    {
        $member = User::find($id);

        if (! $member) {
            return $this->notFound(__('auth.user_not_found'));
        }

        if ($member->sacco_id !== $request->user()->sacco_id || $member->role !== 'member') {
            return $this->forbidden('You do not have permission to modify savings for this member.');
        }

        $currentBalance = $this->calculateBalance($member->id);
        $newBalance = round((float) $currentBalance + (float) $request->amount, 2);
        $transactionDate = $request->transaction_date
            ? Carbon::parse($request->transaction_date)->toDateString()
            : now()->toDateString();

        $transaction = DB::transaction(function () use ($member, $request, $newBalance, $transactionDate) {
            $transaction = SavingsTransaction::create([
                'member_id' => $member->id,
                'type' => 'deposit',
                'amount' => $request->amount,
                'balance_after' => $newBalance,
                'description' => $request->description,
                'transaction_date' => $transactionDate,
            ]);

            ActivityLogger::log('savings_deposit', "Deposit recorded for member {$member->id}", $request, [
                'member_id' => $member->id,
                'transaction_id' => $transaction->id,
                'amount' => $request->amount,
                'balance_after' => $newBalance,
            ]);

            return $transaction;
        });

        return MemberSavingsActionResource::make((object) [
            'transaction' => $transaction,
            'new_balance' => $newBalance,
        ])->response()->setStatusCode(201);
    }

    public function withdraw(WithdrawSavingsRequest $request, int $id): MemberSavingsActionResource|JsonResponse
    {
        $member = User::find($id);

        if (! $member) {
            return $this->notFound(__('auth.user_not_found'));
        }

        if ($member->sacco_id !== $request->user()->sacco_id || $member->role !== 'member') {
            return $this->forbidden('You do not have permission to modify savings for this member.');
        }

        $currentBalance = $this->calculateBalance($member->id);

        if ((float) $request->amount > (float) $currentBalance) {
            throw ValidationException::withMessages([
                'amount' => ['The withdrawal amount exceeds the current savings balance.'],
            ]);
        }

        $newBalance = round((float) $currentBalance - (float) $request->amount, 2);
        $transactionDate = $request->transaction_date
            ? Carbon::parse($request->transaction_date)->toDateString()
            : now()->toDateString();

        $transaction = DB::transaction(function () use ($member, $request, $newBalance, $transactionDate) {
            $transaction = SavingsTransaction::create([
                'member_id' => $member->id,
                'type' => 'withdraw',
                'amount' => $request->amount,
                'balance_after' => $newBalance,
                'description' => $request->description,
                'transaction_date' => $transactionDate,
            ]);

            ActivityLogger::log('savings_withdrawal', "Withdrawal recorded for member {$member->id}", $request, [
                'member_id' => $member->id,
                'transaction_id' => $transaction->id,
                'amount' => $request->amount,
                'balance_after' => $newBalance,
            ]);

            return $transaction;
        });

        return MemberSavingsActionResource::make((object) [
            'transaction' => $transaction,
            'new_balance' => $newBalance,
        ])->response()->setStatusCode(201);
    }

    protected function buildSavingsPayload(User $member): object
    {
        $transactions = SavingsTransaction::where('member_id', $member->id)
            ->orderByDesc('created_at')
            ->paginate(15);

        return (object) [
            'balance' => $this->calculateBalance($member->id),
            'transactions' => $transactions,
        ];
    }

    /**
     * Calculate member balance from transactions.
     *
     * @param  int  $memberId
     * @param  Collection<int, SavingsTransaction>|null  $transactions
     * @return float
     */
    protected function calculateBalance(int $memberId, ?Collection $transactions = null): float
    {
        $transactions = $transactions ?? SavingsTransaction::where('member_id', $memberId)
            ->orderByDesc('created_at')
            ->limit(50)
            ->get();

        $latest = $transactions->first();

        if ($latest && $latest->balance_after !== null) {
            return (float) $latest->balance_after;
        }

        $deposits = (float) $transactions->where('type', 'deposit')->sum('amount');
        $withdrawals = (float) $transactions->where('type', 'withdraw')->sum('amount');

        return round($deposits - $withdrawals, 2);
    }
}
