<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\SavingsTransaction;
use App\Models\Loan;
use App\Models\LoanSchedule;
use App\Models\Dividend;
use Illuminate\Http\Request;
use Carbon\Carbon;
use Illuminate\Support\Str;

class DemoController extends Controller
{
    public function seed(Request $request)
    {
        if ($request->query('secret') !== 'gemechu-demo-2026') {
            return response()->json(['error' => 'Unauthorized. Invalid secret key.'], 403);
        }

        $admin = User::whereNotNull('sacco_id')->first();
            
        if (!$admin) {
            return response()->json(['error' => 'No SACCO or Admin found in the database. Please create a SACCO first.'], 404);
        }

        $member = User::where('email', 'alemugemechu72@gmail.com')->first();
        if (!$member) {
            return response()->json(['error' => 'Member not found. Please register this member first.'], 404);
        }

        // Ensure member is in admin's SACCO and has shares
        $member->sacco_id = $admin->sacco_id;
        $member->num_shares = 22; 
        $member->save();

        // Clear existing demo data for this member to avoid duplicate stacking
        SavingsTransaction::where('member_id', $member->id)->delete();
        $loans = Loan::where('member_id', $member->id)->get();
        foreach ($loans as $loan) {
            LoanSchedule::where('loan_id', $loan->id)->delete();
            $loan->delete();
        }
        Dividend::where('user_id', $member->id)->delete();

        // 1. Seed Savings Transactions
        $balance = 0;
        for ($i = 5; $i >= 1; $i--) {
            $amount = 5000;
            $balance += $amount;
            SavingsTransaction::create([
                'member_id' => $member->id,
                'type' => 'deposit',
                'amount' => $amount,
                'balance_after' => $balance,
                'description' => 'Monthly Savings Deposit via Chapa',
                'transaction_date' => Carbon::now()->subMonths($i)->format('Y-m-d'),
            ]);
        }

        // 2. Seed an Active Loan
        $activeLoan = Loan::create([
            'sacco_id' => $admin->sacco_id,
            'member_id' => $member->id,
            'loan_number' => 'LN-' . strtoupper(Str::random(6)),
            'loan_type' => 'Emergency',
            'principal_amount' => 50000,
            'purpose' => 'Home Renovation',
            'status' => 'approved',
            'interest_rate' => 10,
            'term_months' => 6,
            'total_repayable' => 55000,
        ]);

        // Create Loan Schedules (3 paid, 3 pending)
        $monthlyDue = 55000 / 6;
        for ($i = 1; $i <= 6; $i++) {
            $status = $i <= 3 ? 'paid' : 'pending';
            LoanSchedule::create([
                'loan_id' => $activeLoan->id,
                'installment_number' => $i,
                'due_date' => Carbon::now()->addMonths($i - 3)->format('Y-m-d'),
                'principal_due' => 50000 / 6,
                'interest_due' => 5000 / 6,
                'total_due' => $monthlyDue,
                'amount_paid' => $status === 'paid' ? $monthlyDue : 0,
                'penalty_amount' => 0,
                'status' => $status,
            ]);
        }

        // 3. Seed Dividends
        Dividend::create([
            'sacco_id' => $admin->sacco_id,
            'user_id' => $member->id,
            'period' => '2025',
            'num_shares' => 22,
            'share_pct' => 5.5,
            'amount' => 2500.50,
            'total_pool' => 100000,
            'savings_balance' => 25000,
            'savings_pct' => 2.5,
            'share_dividend_amount' => 1500.50,
            'savings_interest_amount' => 1000.00,
            'reserve_percentage' => 10,
            'reserve_amount' => 250.05,
        ]);

        return response()->json([
            'message' => 'Demo data seeded successfully! You can refresh your dashboard now.',
            'member' => $member->email,
            'totals' => [
                'savings' => 25000,
                'shares' => 22,
                'active_loan' => 50000,
                'dividends' => 2500.50
            ]
        ]);
    }
}
