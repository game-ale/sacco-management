<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\Loan;
use App\Models\Repayment;
use App\Models\Sacco;
use App\Models\SavingsTransaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class SuperadminReportsController extends Controller
{
    use ApiResponse;

    /**
     * Platform overview statistics.
     *
     * Returns total savings, total loans disbursed, total repayments collected,
     * and platform growth percentage.
     *
     * @return JsonResponse
     */
    public function overview(): JsonResponse
    {
        $deposits = (float) SavingsTransaction::where('type', 'deposit')->sum('amount');
        $withdrawals = (float) SavingsTransaction::where('type', 'withdraw')->sum('amount');
        $totalSavings = round(max(0, $deposits - $withdrawals), 2);

        $totalLoansDisbursed = round((float) Loan::whereIn('status', ['active', 'completed'])
            ->sum('principal_amount'), 2);

        $totalRepaymentsCollected = round((float) Repayment::sum('amount'), 2);

        // Platform growth: % increase in members over the last month
        $startOfCurrentMonth = Carbon::now()->startOfMonth();
        $startOfLastMonth = $startOfCurrentMonth->copy()->subMonth();
        $endOfLastMonth = $startOfLastMonth->copy()->endOfMonth();

        $currentMonthMembers = User::where('role', 'member')
            ->where('created_at', '>=', $startOfCurrentMonth)
            ->count();
        $lastMonthMembers = User::where('role', 'member')
            ->whereBetween('created_at', [
                $startOfLastMonth,
                $endOfLastMonth,
            ])
            ->count();
        $platformGrowth = $lastMonthMembers > 0
            ? round((($currentMonthMembers - $lastMonthMembers) / $lastMonthMembers) * 100, 1)
            : ($currentMonthMembers > 0 ? 100.0 : 0.0);

        $totalMembers = User::where('role', 'member')->count();

        return $this->success([
            'total_savings' => $totalSavings,
            'total_loans_disbursed' => $totalLoansDisbursed,
            'total_repayments_collected' => $totalRepaymentsCollected,
            'platform_growth' => $platformGrowth,
            'total_members' => $totalMembers,
        ], 'Platform overview retrieved successfully.');
    }

    /**
     * SACCO performance comparison table.
     *
     * Returns per-SACCO breakdown of members, savings, active loans, and repayment rate.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function saccoComparison(Request $request): JsonResponse
    {
        $saccos = Sacco::where('status', 'approved')
            ->withCount(['members', 'loans as active_loans_count' => function ($q): void {
                $q->where('status', 'active');
            }])
            ->get();

        $comparison = $saccos->map(function (Sacco $sacco) {
            $memberIds = $sacco->users()->pluck('id');

            // Calculate savings
            $deposits = (float) SavingsTransaction::whereIn('member_id', $memberIds)
                ->where('type', 'deposit')->sum('amount');
            $withdrawals = (float) SavingsTransaction::whereIn('member_id', $memberIds)
                ->where('type', 'withdraw')->sum('amount');
            $savings = round(max(0, $deposits - $withdrawals), 2);

            // Calculate repayment rate
            $totalExpected = (float) $sacco->loans()
                ->whereIn('status', ['active', 'completed'])
                ->sum('principal_amount');
            $totalRepaid = (float) Repayment::whereIn('loan_id', $sacco->loans()->pluck('id'))
                ->sum('amount');
            $repaymentRate = $totalExpected > 0
                ? round(($totalRepaid / $totalExpected) * 100, 1)
                : 0;

            return [
                'id' => $sacco->id,
                'name' => $sacco->name,
                'status' => $sacco->status,
                'members_count' => $sacco->members_count,
                'total_savings' => $savings,
                'active_loans_count' => (int) $sacco->active_loans_count,
                'repayment_rate' => $repaymentRate,
            ];
        });

        // Sort support
        $sort = $request->query('sort', 'savings_desc');
        $comparison = match ($sort) {
            'members_desc' => $comparison->sortByDesc('members_count')->values(),
            'members_asc' => $comparison->sortBy('members_count')->values(),
            'savings_asc' => $comparison->sortBy('total_savings')->values(),
            'repayment_desc' => $comparison->sortByDesc('repayment_rate')->values(),
            'repayment_asc' => $comparison->sortBy('repayment_rate')->values(),
            default => $comparison->sortByDesc('total_savings')->values(),
        };

        return $this->success($comparison, 'SACCO comparison retrieved successfully.');
    }

    /**
     * Growth trends over time.
     *
     * Returns monthly time-series data for total members, total savings, and total loans.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function growthTrends(Request $request): JsonResponse
    {
        $period = $request->query('period', '1Y');
        $months = match ($period) {
            '3M' => 3,
            '6M' => 6,
            'All' => 24,
            default => 12,
        };

        $trends = collect();
        $startOfCurrentMonth = Carbon::now()->startOfMonth();

        for ($i = $months - 1; $i >= 0; $i--) {
            $date = $startOfCurrentMonth->copy()->subMonths($i);
            $endOfMonth = $date->copy()->endOfMonth();

            // Cumulative members up to end of month
            $members = User::where('role', 'member')
                ->where('created_at', '<=', $endOfMonth)
                ->count();

            // Cumulative savings up to end of month
            $deposits = (float) SavingsTransaction::where('type', 'deposit')
                ->where('created_at', '<=', $endOfMonth)
                ->sum('amount');
            $withdrawals = (float) SavingsTransaction::where('type', 'withdraw')
                ->where('created_at', '<=', $endOfMonth)
                ->sum('amount');
            $savings = round(max(0, $deposits - $withdrawals), 2);

            // Cumulative loans disbursed up to end of month
            $loans = (float) Loan::whereIn('status', ['active', 'completed'])
                ->where('created_at', '<=', $endOfMonth)
                ->sum('principal_amount');

            $trends->push([
                'month' => $date->format('M Y'),
                'month_short' => $date->format('M'),
                'members' => $members,
                'savings' => $savings,
                'loans' => round($loans, 2),
            ]);
        }

        return $this->success($trends, 'Growth trends retrieved successfully.');
    }

    /**
     * Geographic distribution of SACCOs.
     *
     * Returns SACCOs grouped by region with counts.
     *
     * @return JsonResponse
     */
    public function geographicDistribution(): JsonResponse
    {
        $distribution = Sacco::select('region', DB::raw('COUNT(*) as count'))
            ->whereNotNull('region')
            ->groupBy('region')
            ->orderByDesc('count')
            ->get()
            ->map(function (Sacco $item) {
                return [
                    'region' => $item->region,
                    'count' => (int) $item->getAttribute('count'),
                ];
            });

        $total = $distribution->sum('count');

        $distribution = $distribution->map(function ($item) use ($total) {
            $item['percentage'] = $total > 0 ? round(($item['count'] / $total) * 100, 1) : 0;
            return $item;
        });

        // Also include SACCOs with no region set
        $noRegionCount = Sacco::whereNull('region')->count();
        if ($noRegionCount > 0) {
            $grandTotal = (int) ($total + $noRegionCount);
            $distribution->push([
                'region' => 'Unspecified',
                'count' => $noRegionCount,
                'percentage' => round(($noRegionCount / $grandTotal) * 100, 1),
            ]);
            // Recalculate percentages with grand total
            $distribution = $distribution->map(function (array $item) use ($grandTotal) {
                $item['percentage'] = round(((int) $item['count'] / $grandTotal) * 100, 1);
                return $item;
            });
        }

        return $this->success($distribution->values(), 'Geographic distribution retrieved successfully.');
    }
}
