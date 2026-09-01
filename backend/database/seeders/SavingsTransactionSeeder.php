<?php

namespace Database\Seeders;

use App\Models\SavingsTransaction;
use App\Models\User;
use Illuminate\Database\Seeder;

class SavingsTransactionSeeder extends Seeder
{
    public function run(): void
    {
        $member = User::where('username', 'member')->first();

        SavingsTransaction::create([
            'member_id' => $member->id,
            'type' => 'deposit',
            'amount' => 500.00,
            'balance_after' => 500.00,
            'description' => 'Initial deposit',
            'transaction_date' => now()->toDateString(),
        ]);

        SavingsTransaction::create([
            'member_id' => $member->id,
            'type' => 'withdraw',
            'amount' => 200.00,
            'balance_after' => 300.00,
            'description' => 'Withdrawal for emergency',
            'transaction_date' => now()->toDateString(),
        ]);
    }
}
