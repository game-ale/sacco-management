<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\Loan;
use App\Models\LoanSchedule;
use App\Models\SavingsTransaction;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    use ApiResponse;

    /**
     * Get dashboard statistics for the authenticated admin's SACCO.
     */
    public function index(Request $request): JsonResponse
    {
        $saccoId = $request->user()->sacco_id;

        // Total members in this SACCO.
        $totalMembers = User::where('sacco_id', $saccoId)
            ->where('role', 'member')
            ->count();

        // Total savings deposits minus withdrawals.
        $totalDeposits = SavingsTransaction::whereHas('user', function ($query) use ($saccoId): void {
            $query->where('sacco_id', $saccoId);
        })
            ->where('type', 'deposit')
            ->sum('amount');

        $totalWithdrawals = SavingsTransaction::whereHas('user', function ($query) use ($saccoId): void {
            $query->where('sacco_id', $saccoId);
        })
            ->where('type', 'withdraw')
            ->sum('amount');

        $totalSavings = $totalDeposits - $totalWithdrawals;

        // Active loans belonging to this SACCO.
        $activeLoans = Loan::where('sacco_id', $saccoId)
            ->where('status', 'active')
            ->count();

        // Outstanding balance from active loans.
        $outstandingBalance = Loan::where('sacco_id', $saccoId)
            ->where('status', 'active')
            ->sum('total_repayable');

        // Number of overdue loan schedules.
        $overdueCount = LoanSchedule::whereHas('loan', function ($query) use ($saccoId): void {
            $query->where('sacco_id', $saccoId);
        })
            ->where('status', 'overdue')
            ->count();

        // Total share capital.
        $totalShares = User::where('sacco_id', $saccoId)
            ->where('role', 'member')
            ->sum('num_shares');

        $shareValue = $request->user()->sacco->share_value ?? 0;

        $totalShareCapital = $totalShares * $shareValue;

        return $this->success(
            [
                'total_members' => $totalMembers,
                'total_savings' => $totalSavings,
                'active_loans' => $activeLoans,
                'outstanding_balance' => $outstandingBalance,
                'overdue_count' => $overdueCount,
                'total_share_capital' => $totalShareCapital,
            ],
            'Dashboard statistics retrieved successfully.'
        );
    }

    public function metrics(Request $request): JsonResponse
    {
        $saccoId = $request->user()->sacco_id;
        $now = now();
        $startOfMonth = $now->copy()->startOfMonth();

        // 1. Members
        $totalMembers = User::where('sacco_id', $saccoId)->where('role', 'member')->count();
        $newMembers = User::where('sacco_id', $saccoId)->where('role', 'member')
            ->where('created_at', '>=', $startOfMonth)
            ->count();

        // 2. Savings
        $deposits = SavingsTransaction::whereHas('user', function ($q) use ($saccoId) {
            $q->where('sacco_id', $saccoId);
        })->where('type', 'deposit')->sum('amount');
        $withdrawals = SavingsTransaction::whereHas('user', function ($q) use ($saccoId) {
            $q->where('sacco_id', $saccoId);
        })->where('type', 'withdraw')->sum('amount');
        $totalSavings = $deposits - $withdrawals;

        $newDeposits = SavingsTransaction::whereHas('user', function ($q) use ($saccoId) {
            $q->where('sacco_id', $saccoId);
        })->where('type', 'deposit')->where('created_at', '>=', $startOfMonth)->sum('amount');

        $newWithdrawals = SavingsTransaction::whereHas('user', function ($q) use ($saccoId) {
            $q->where('sacco_id', $saccoId);
        })->where('type', 'withdraw')->where('created_at', '>=', $startOfMonth)->sum('amount');
        $newSavings = $newDeposits - $newWithdrawals;

        // 3. Active Loans
        $activeLoans = Loan::where('sacco_id', $saccoId)->where('status', 'active')->count();
        $outstandingQuery = DB::table('loans')
            ->join('loan_schedules', 'loans.id', '=', 'loan_schedules.loan_id')
            ->where('loans.sacco_id', $saccoId)
            ->where('loans.status', 'active')
            ->selectRaw('SUM(loan_schedules.total_due - loan_schedules.amount_paid) as outstanding')
            ->first();
        $outstandingAmount = $outstandingQuery->outstanding ?? 0;

        // 4. Overdue Repayments
        $overdueQuery = DB::table('loan_schedules')
            ->join('loans', 'loans.id', '=', 'loan_schedules.loan_id')
            ->where('loans.sacco_id', $saccoId)
            ->where('loan_schedules.due_date', '<', $now->toDateString())
            ->where('loan_schedules.status', '!=', 'paid')
            ->selectRaw('COUNT(loan_schedules.id) as overdue_count, SUM(loan_schedules.total_due - loan_schedules.amount_paid) as overdue_amount')
            ->first();
        $overdueCount = $overdueQuery->overdue_count ?? 0;
        $overdueAmount = $overdueQuery->overdue_amount ?? 0;

        // 5. Share Capital
        $sacco = $request->user()->sacco;
        $totalShares = User::where('sacco_id', $saccoId)->where('role', 'member')->sum('num_shares');
        $shareCapital = $totalShares * ($sacco->share_value ?? 0);

        return $this->success([
            'total_members' => [
                'value' => $totalMembers,
                'change' => $newMembers,
            ],
            'total_savings' => [
                'value' => round((float) $totalSavings, 2),
                'change' => round((float) $newSavings, 2),
            ],
            'active_loans' => [
                'value' => $activeLoans,
                'outstanding_amount' => round((float) $outstandingAmount, 2),
                'count' => $activeLoans,
                'outstanding' => round((float) $outstandingAmount, 2),
            ],
            'overdue_repayments' => [
                'count' => $overdueCount,
                'amount' => round((float) $overdueAmount, 2),
            ],
            'share_capital' => [
                'value' => round((float) $shareCapital, 2),
                'total_shares' => (int) $totalShares,
                'shares' => (int) $totalShares,
            ],
        ], 'Metrics retrieved successfully.');
    }

    public function charts(Request $request): JsonResponse
    {
        $saccoId = $request->user()->sacco_id;

        // 1. Savings & Loans Trend (last 6 months)
        $months = [];
        $trend = [];

        for ($i = 5; $i >= 0; $i--) {
            $monthStart = now()->subMonths($i)->startOfMonth();
            $monthEnd = now()->subMonths($i)->endOfMonth();
            $monthName = $monthStart->format('M');

            $deposits = SavingsTransaction::whereHas('user', function ($q) use ($saccoId) {
                $q->where('sacco_id', $saccoId);
            })->where('type', 'deposit')->whereBetween('transaction_date', [$monthStart->toDateString(), $monthEnd->toDateString()])->sum('amount');

            $withdrawals = SavingsTransaction::whereHas('user', function ($q) use ($saccoId) {
                $q->where('sacco_id', $saccoId);
            })->where('type', 'withdraw')->whereBetween('transaction_date', [$monthStart->toDateString(), $monthEnd->toDateString()])->sum('amount');

            // For loans, sum of disbursed amounts
            $loans = Loan::where('sacco_id', $saccoId)
                ->whereIn('status', ['active', 'closed'])
                ->whereBetween('disbursed_at', [$monthStart, $monthEnd])
                ->sum('principal_amount');

            $trend[] = [
                'month' => $monthName,
                'savings' => round((float) ($deposits - $withdrawals), 2),
                'loans' => round((float) $loans, 2),
            ];
        }

        // 2. Loan Status Distribution
        $loanStatuses = DB::table('loans')
            ->where('sacco_id', $saccoId)
            ->select('status as name', DB::raw('count(*) as value'))
            ->groupBy('status')
            ->get();

        return $this->success([
            'trend' => $trend,
            'loan_distribution' => $loanStatuses
        ], 'Charts retrieved successfully.');
    }

    public function activity(Request $request): JsonResponse
    {
        $saccoId = $request->user()->sacco_id;

        $savings = DB::table('savings_transactions')
            ->join('users', 'users.id', '=', 'savings_transactions.member_id')
            ->where('users.sacco_id', $saccoId)
            ->select('savings_transactions.id', 'savings_transactions.transaction_date as date', 'users.name as member', 'savings_transactions.type as category', 'savings_transactions.description', 'savings_transactions.amount', DB::raw("'completed' as status"), 'savings_transactions.created_at');

        $loans = DB::table('loans')
            ->join('users', 'users.id', '=', 'loans.member_id')
            ->where('loans.sacco_id', $saccoId)
            ->select('loans.id', DB::raw('DATE(loans.created_at) as date'), 'users.name as member', DB::raw("'loan' as category"), 'loans.purpose as description', 'loans.principal_amount as amount', 'loans.status', 'loans.created_at');

        $repayments = DB::table('repayments')
            ->join('loans', 'loans.id', '=', 'repayments.loan_id')
            ->join('users', 'users.id', '=', 'loans.member_id')
            ->where('loans.sacco_id', $saccoId)
            ->select('repayments.id', 'repayments.paid_at as date', 'users.name as member', DB::raw("'repayment' as category"), DB::raw("'Loan Repayment' as description"), 'repayments.amount', DB::raw("'completed' as status"), 'repayments.created_at');

        $activities = $savings->unionAll($loans)->unionAll($repayments)
            ->orderBy('created_at', 'desc')
            ->limit(10)
            ->get();

        foreach ($activities as $act) {
            $act->amount = round((float) $act->amount, 2);
        }

        return $this->success($activities, 'Recent activity retrieved successfully.');
    }
}
