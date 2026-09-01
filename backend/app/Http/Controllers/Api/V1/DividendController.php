<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\CalculateDividendRequest;
use App\Http\Resources\V1\DividendResource;
use App\Http\Traits\ApiResponse;
use App\Models\Dividend;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DividendController extends Controller
{
    use ApiResponse;

    /**
     * Calculate dividend distribution preview without saving records.
     *
     * @param  CalculateDividendRequest  $request
     * @return JsonResponse
     */
    public function calculate(CalculateDividendRequest $request): JsonResponse
    {
        $admin = $request->user();
        $period = $request->validated('period');
        $totalPool = (float) $request->validated('total_pool');
        $reservePercentage = (float) ($request->validated('reserve_percentage') ?? 0);

        $reserveAmount = round($totalPool * ($reservePercentage / 100), 2);
        $distributablePool = $totalPool - $reserveAmount;
        
        $sharePool = round($distributablePool * 0.70, 2);
        $savingsPool = $distributablePool - $sharePool;

        $members = User::where('sacco_id', $admin->sacco_id)
            ->where('role', 'member')
            ->addSelect([
                'savings_balance' => \App\Models\SavingsTransaction::select('balance_after')
                    ->whereColumn('member_id', 'users.id')
                    ->latest('id')
                    ->limit(1)
            ])
            ->get();

        $totalShares = (int) $members->sum('num_shares');
        $totalSavings = (float) $members->sum('savings_balance');

        $preview = $members->map(function ($member) use ($totalShares, $totalSavings, $sharePool, $savingsPool) {
            $shares = (int) ($member->num_shares ?? 0);
            $savings = (float) ($member->savings_balance ?? 0);
            
            $sharePct = $totalShares > 0 ? round(($shares / $totalShares) * 100, 2) : 0.0;
            $savingsPct = $totalSavings > 0 ? round(($savings / $totalSavings) * 100, 2) : 0.0;
            
            $shareDividend = $totalShares > 0 ? round(($sharePool * $shares) / $totalShares, 2) : 0.0;
            $savingsInterest = $totalSavings > 0 ? round(($savingsPool * $savings) / $totalSavings, 2) : 0.0;
            $totalAmount = $shareDividend + $savingsInterest;

            return [
                'member_id' => $member->id,
                'name' => $member->name,
                'shares' => $shares,
                'share_pct' => $sharePct,
                'savings_balance' => $savings,
                'savings_pct' => $savingsPct,
                'share_dividend_amount' => $shareDividend,
                'savings_interest_amount' => $savingsInterest,
                'amount' => $totalAmount,
            ];
        })->values();

        return $this->success([
            'preview' => $preview,
            'total_pool' => $totalPool,
            'reserve_percentage' => $reservePercentage,
            'reserve_amount' => $reserveAmount,
            'distributable_pool' => $distributablePool,
            'share_pool' => $sharePool,
            'savings_pool' => $savingsPool,
            'total_shares' => $totalShares,
            'total_savings' => $totalSavings,
        ], 'Dividend preview calculated successfully.');
    }

    /**
     * Calculate and save dividend distribution.
     *
     * @param  CalculateDividendRequest  $request
     * @return JsonResponse
     */
    public function distribute(CalculateDividendRequest $request): JsonResponse
    {
        $admin = $request->user();
        $saccoId = $admin->sacco_id;
        $period = $request->validated('period');
        $totalPool = (float) $request->validated('total_pool');
        $reservePercentage = (float) ($request->validated('reserve_percentage') ?? 0);

        // Prevent duplicate distributions for the same SACCO + period
        if (Dividend::where('sacco_id', $saccoId)->where('period', $period)->exists()) {
            return $this->error("Dividends for period '{$period}' have already been distributed.", 422);
        }

        $reserveAmount = round($totalPool * ($reservePercentage / 100), 2);
        $distributablePool = $totalPool - $reserveAmount;
        
        $sharePool = round($distributablePool * 0.70, 2);
        $savingsPool = $distributablePool - $sharePool;

        $members = User::where('sacco_id', $saccoId)
            ->where('role', 'member')
            ->addSelect([
                'savings_balance' => \App\Models\SavingsTransaction::select('balance_after')
                    ->whereColumn('member_id', 'users.id')
                    ->latest('id')
                    ->limit(1)
            ])
            ->get();

        $totalShares = (int) $members->sum('num_shares');
        $totalSavings = (float) $members->sum('savings_balance');

        $dividendList = [];

        DB::transaction(function () use ($members, $totalShares, $totalSavings, $totalPool, $sharePool, $savingsPool, $reservePercentage, $reserveAmount, $period, $saccoId, &$dividendList) {
            foreach ($members as $member) {
                $shares = (int) ($member->num_shares ?? 0);
                $savings = (float) ($member->savings_balance ?? 0);
                
                $sharePct = $totalShares > 0 ? round(($shares / $totalShares) * 100, 4) : 0.0;
                $savingsPct = $totalSavings > 0 ? round(($savings / $totalSavings) * 100, 4) : 0.0;
                
                $shareDividend = $totalShares > 0 ? round(($sharePool * $shares) / $totalShares, 2) : 0.0;
                $savingsInterest = $totalSavings > 0 ? round(($savingsPool * $savings) / $totalSavings, 2) : 0.0;
                $totalAmount = $shareDividend + $savingsInterest;

                Dividend::create([
                    'sacco_id' => $saccoId,
                    'user_id' => $member->id,
                    'period' => $period,
                    'num_shares' => $shares,
                    'share_pct' => $sharePct,
                    'savings_balance' => $savings,
                    'savings_pct' => $savingsPct,
                    'share_dividend_amount' => $shareDividend,
                    'savings_interest_amount' => $savingsInterest,
                    'reserve_percentage' => $reservePercentage,
                    'reserve_amount' => $reserveAmount,
                    'amount' => $totalAmount,
                    'total_pool' => $totalPool,
                ]);

                if ($totalAmount > 0) {
                    $newBalance = $savings + $totalAmount;
                    
                    \App\Models\SavingsTransaction::create([
                        'member_id' => $member->id,
                        'type' => 'deposit',
                        'amount' => $totalAmount,
                        'balance_after' => $newBalance,
                        'description' => "Dividend and Interest Distribution for {$period}",
                        'transaction_date' => now()->toDateString(),
                    ]);
                }

                $dividendList[] = [
                    'member_id' => $member->id,
                    'amount' => $totalAmount,
                ];
            }
        });

        return $this->success([
            'dividends' => $dividendList,
            'count' => count($dividendList),
        ], 'Dividends distributed successfully.');
    }

    /**
     * Get dividend history for the SACCO admin.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function adminHistory(Request $request): JsonResponse
    {
        $admin = $request->user();

        $history = DB::table('dividends')
            ->where('sacco_id', $admin->sacco_id)
            ->select('period', 'total_pool', DB::raw('MIN(created_at) as distribution_date'), DB::raw('COUNT(user_id) as member_count'))
            ->groupBy('period', 'total_pool')
            ->orderByDesc('distribution_date')
            ->get()
            ->map(function (mixed $item) {
                return [
                    'period' => $item->period,
                    'distribution_date' => Carbon::parse($item->distribution_date)->toDateString(),
                    'total_pool' => round((float) $item->total_pool, 2),
                    'member_count' => $item->member_count,
                    'status' => 'completed',
                ];
            });

        return $this->success(
            $history,
            'Dividend history retrieved successfully.'
        );
    }

    /**
     * Get dividend history for the authenticated member.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function memberHistory(Request $request): JsonResponse
    {
        $user = $request->user();

        if (! $user->isMember()) {
            return $this->forbidden('Only members can access dividend history.');
        }

        $dividends = Dividend::where('user_id', $user->id)
            ->latest()
            ->get();

        return $this->success(
            DividendResource::collection($dividends),
            'Dividend history retrieved successfully.'
        );
    }
}
