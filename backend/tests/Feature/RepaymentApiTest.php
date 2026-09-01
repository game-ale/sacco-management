<?php

namespace Tests\Feature;

use App\Models\Loan;
use App\Models\LoanSchedule;
use App\Models\Sacco;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RepaymentApiTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->sacco = Sacco::create([
            'name' => 'Test Sacco',
            'registration_number' => 'TS123',
            'share_value' => 100
        ]);
        $this->admin = User::factory()->create([
            'sacco_id' => $this->sacco->id,
            'role' => 'admin',
        ]);
        $this->member = User::factory()->create([
            'sacco_id' => $this->sacco->id,
            'role' => 'member',
        ]);
        $this->loan = Loan::factory()->create([
            'sacco_id' => $this->sacco->id,
            'member_id' => $this->member->id,
            'status' => 'active',
            'principal_amount' => 1000,
        ]);
    }

    public function test_admin_can_record_repayment()
    {
        $this->actingAs($this->admin);

        $schedule = LoanSchedule::create([
            'loan_id' => $this->loan->id,
            'installment_number' => 1,
            'due_date' => now()->addDays(30),
            'principal_due' => 100,
            'interest_due' => 0,
            'total_due' => 100,
            'amount_paid' => 0,
            'status' => 'pending',
        ]);

        $response = $this->postJson("/api/v1/loans/{$this->loan->id}/repayments", [
            'schedule_id' => $schedule->id,
            'amount_paid' => 100,
            'payment_date' => now()->toDateString(),
            'notes' => 'Full payment',
        ]);


        $response->assertStatus(201);

        $this->assertDatabaseHas('repayments', [
            'loan_schedule_id' => $schedule->id,
            'amount' => 100,
        ]);

        $this->assertDatabaseHas('loan_schedules', [
            'id' => $schedule->id,
            'status' => 'paid',
            'amount_paid' => 100,
        ]);
    }

    public function test_admin_can_get_overdue_repayments()
    {
        $this->actingAs($this->admin);

        LoanSchedule::create([
            'loan_id' => $this->loan->id,
            'installment_number' => 1,
            'due_date' => now()->subDays(5),
            'principal_due' => 100,
            'interest_due' => 0,
            'total_due' => 100,
            'amount_paid' => 0,
            'status' => 'pending',
        ]);

        $response = $this->getJson('/api/v1/repayments/overdue');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data');
    }
}
