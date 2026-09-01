<?php

namespace Database\Factories;

use App\Models\Loan;
use App\Models\User;
use Illuminate\Database\Eloquent\Factories\Factory;
use Illuminate\Support\Str;

/**
 * @extends Factory<Loan>
 */
class LoanFactory extends Factory
{
    protected $model = Loan::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        return [
            'sacco_id' => 1,
            'member_id' => User::factory(),
            'loan_number' => 'LN-' . strtoupper(Str::random(8)),
            'loan_type' => 'Personal',
            'principal_amount' => 1000.00,
            'purpose' => 'Business expansion',
            'status' => 'pending',
        ];
    }
}
