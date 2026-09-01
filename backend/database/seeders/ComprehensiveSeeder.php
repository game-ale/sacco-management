<?php

namespace Database\Seeders;

use App\Models\Dividend;
use App\Models\Loan;
use App\Models\LoanSchedule;
use App\Models\Repayment;
use App\Models\Sacco;
use App\Models\SavingsTransaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class ComprehensiveSeeder extends Seeder
{
    public function run(): void
    {
        $sacco = Sacco::where('name', 'Demo SACCO Ltd')->first();
        if (! $sacco) {
            return;
        }

        // Restore user's specific account
        User::create([
            'name' => 'Gemchu Alemu',
            'username' => 'gemechu',
            'email' => 'lion@gmail.com',
            'role' => 'admin',
            'sacco_id' => $sacco->id,
            'password' => Hash::make('password'),
            'email_verified_at' => now(),
            'num_shares' => 0,
        ]);

        // 1. Members
        $members = [];
        $ethiopianNames = [
            'Abebe Tadesse', 'Bizuayehu Mekonnen', 'Dawit Tesfaye', 'Emebet Alemu',
            'Fikre Selassie', 'Genet Yilma', 'Hailu Kebede', 'Kaleb Assefa',
            'Mekdes Bekele', 'Tigist Haile'
        ];

        foreach ($ethiopianNames as $i => $name) {
            $members[] = User::create([
                'name' => $name,
                'username' => 'member' . ($i + 1),
                'email' => strtolower(explode(' ', $name)[0]) . '@example.com',
                'role' => 'member',
                'sacco_id' => $sacco->id,
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'num_shares' => rand(10, 200),
                'created_at' => Carbon::now()->subMonths(rand(6, 24)),
            ]);
        }

        // 2. Savings Transactions
        foreach ($members as $member) {
            $balance = 0;
            // 4 transactions per member
            for ($j = 0; $j < 4; $j++) {
                $isDeposit = rand(1, 10) <= 8; // 80% deposits
                $amount = $isDeposit ? rand(1000, 5000) : rand(500, 2000);

                if (! $isDeposit && $balance < $amount) {
                    $isDeposit = true; // force deposit if insufficient funds
                    $amount = rand(1000, 5000);
                }

                $balance = $isDeposit ? $balance + $amount : $balance - $amount;

                SavingsTransaction::create([
                    'member_id' => $member->id,
                    'type' => $isDeposit ? 'deposit' : 'withdraw',
                    'amount' => $amount,
                    'balance_after' => $balance,
                    'description' => $isDeposit ? 'Monthly contribution' : 'Emergency withdrawal',
                    'transaction_date' => Carbon::now()->subMonths(4 - $j)->addDays(rand(1, 28))->toDateString(),
                ]);
            }
        }

        // 3. Loans
        $loanStatuses = [
            'pending', 'pending',
            'approved',
            'active', 'active', 'active',
            'closed',
            'rejected'
        ];

        foreach ($loanStatuses as $i => $status) {
            $member = $members[$i % count($members)];
            $amount = rand(10, 100) * 1000; // 10k to 100k
            $term = rand(6, 24);
            $interest = 12.5;

            $loan = Loan::create([
                'sacco_id' => $sacco->id,
                'member_id' => $member->id,
                'loan_number' => 'LN-' . date('Y') . '-' . str_pad((string) ($i + 1), 3, '0', STR_PAD_LEFT),
                'principal_amount' => $amount,
                'purpose' => ['Business expansion', 'Home renovation', 'School fees', 'Medical emergency'][rand(0, 3)],
                'status' => $status,
                'interest_rate' => in_array($status, ['pending', 'rejected']) ? null : $interest,
                'term_months' => in_array($status, ['pending', 'rejected']) ? null : $term,
                'total_repayable' => in_array($status, ['pending', 'rejected']) ? null : $amount * (1 + ($interest / 100) * ($term / 12)),
                'monthly_installment' => in_array($status, ['pending', 'rejected']) ? null : ($amount * (1 + ($interest / 100) * ($term / 12))) / $term,
                'rejection_reason' => $status === 'rejected' ? 'Insufficient savings history' : null,
                'approved_at' => in_array($status, ['approved', 'active', 'closed']) ? Carbon::now()->subMonths($term) : null,
                'disbursed_at' => in_array($status, ['active', 'closed']) ? Carbon::now()->subMonths($term)->addDays(2) : null,
                'created_at' => Carbon::now()->subMonths($term)->subDays(5),
            ]);

            // Schedules and Repayments
            if (in_array($status, ['active', 'closed'])) {
                $installment = $loan->monthly_installment;
                $principalPart = $loan->principal_amount / $term;

                $paidInstallments = $status === 'closed' ? $term : rand(1, $term - 2);

                for ($m = 1; $m <= $term; $m++) {
                    $dueDate = Carbon::parse($loan->disbursed_at)->addMonths($m);
                    $isPaid = $m <= $paidInstallments;
                    $isOverdue = ! $isPaid && $dueDate->isPast();

                    $schedStatus = $isPaid ? 'paid' : ($isOverdue ? 'overdue' : 'pending');

                    $schedule = LoanSchedule::create([
                        'loan_id' => $loan->id,
                        'installment_number' => $m,
                        'due_date' => $dueDate->toDateString(),
                        'principal_due' => $principalPart,
                        'interest_due' => $installment - $principalPart,
                        'total_due' => $installment,
                        'amount_paid' => $isPaid ? $installment : 0,
                        'status' => $schedStatus,
                    ]);

                    if ($isPaid) {
                        Repayment::create([
                            'sacco_id' => $sacco->id,
                            'loan_id' => $loan->id,
                            'recorded_by' => $member->id,
                            'loan_schedule_id' => $schedule->id,
                            'amount' => $installment,
                            'paid_at' => $dueDate->subDays(rand(0, 5))->toDateString(),
                            'method' => 'manual',
                        ]);
                    }
                }
            }
        }

        // 4. Dividends
        $totalShares = collect($members)->sum('num_shares');
        $pool = 500000;

        foreach ($members as $member) {
            $ownership = ($member->num_shares / $totalShares) * 100;
            $amount = ($ownership / 100) * $pool;

            Dividend::create([
                'sacco_id' => $sacco->id,
                'user_id' => $member->id,
                'period' => 'FY 2024/2025',
                'num_shares' => $member->num_shares,
                'share_pct' => round($ownership, 2),
                'amount' => round($amount, 2),
                'total_pool' => $pool,
            ]);
        }
    }
}
