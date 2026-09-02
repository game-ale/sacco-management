<?php

namespace Tests\Feature;

use App\Models\Loan;
use App\Models\LoanSchedule;
use App\Models\PaymentRequest;
use App\Models\Sacco;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PaymentRequestTest extends TestCase
{
    use RefreshDatabase;

    private function createSacco(string $name = 'Test SACCO'): Sacco
    {
        return Sacco::create([
            'name' => $name,
            'registration_number' => 'REG-' . uniqid(),
            'status' => 'approved',
        ]);
    }

    public function test_member_can_create_payment_request(): void
    {
        $sacco = $this->createSacco();
        $member = User::factory()->create(['sacco_id' => $sacco->id, 'role' => 'member']);
        $loan = Loan::factory()->create([
            'sacco_id' => $sacco->id,
            'member_id' => $member->id,
            'status' => 'active',
        ]);
        $schedule = LoanSchedule::create([
            'loan_id' => $loan->id,
            'installment_number' => 1,
            'due_date' => now()->addMonth()->toDateString(),
            'principal_due' => 1000.00,
            'interest_due' => 100.00,
            'total_due' => 1100.00,
            'amount_paid' => 0.00,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($member)
            ->postJson("/api/v1/loans/{$loan->id}/payment-requests", [
                'schedule_id' => $schedule->id,
                'amount_paid' => 1100.00,
                'payment_date' => now()->toDateString(),
                'method' => 'bank_transfer',
                'notes' => 'Ref #12345',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.amount', 1100);

        $this->assertDatabaseHas('payment_requests', [
            'loan_id' => $loan->id,
            'member_id' => $member->id,
            'loan_schedule_id' => $schedule->id,
            'amount' => '1100.00',
            'status' => 'pending',
        ]);

        // Pending payment must NOT create a completed repayment or update schedule
        $this->assertDatabaseMissing('repayments', [
            'loan_id' => $loan->id,
        ]);

        $this->assertDatabaseHas('loan_schedules', [
            'id' => $schedule->id,
            'amount_paid' => '0.00',
            'status' => 'pending',
        ]);
    }

    public function test_member_cannot_submit_payment_for_another_members_loan(): void
    {
        $sacco = $this->createSacco();
        $memberA = User::factory()->create(['sacco_id' => $sacco->id, 'role' => 'member']);
        $memberB = User::factory()->create(['sacco_id' => $sacco->id, 'role' => 'member']);
        $loanB = Loan::factory()->create([
            'sacco_id' => $sacco->id,
            'member_id' => $memberB->id,
            'status' => 'active',
        ]);
        $schedule = LoanSchedule::create([
            'loan_id' => $loanB->id,
            'installment_number' => 1,
            'due_date' => now()->addMonth()->toDateString(),
            'principal_due' => 1000.00,
            'interest_due' => 100.00,
            'total_due' => 1100.00,
            'amount_paid' => 0.00,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($memberA)
            ->postJson("/api/v1/loans/{$loanB->id}/payment-requests", [
                'schedule_id' => $schedule->id,
                'amount_paid' => 1100.00,
                'payment_date' => now()->toDateString(),
            ]);

        $response->assertForbidden();
    }

    public function test_admin_can_approve_payment_request(): void
    {
        $sacco = $this->createSacco();
        $admin = User::factory()->create(['sacco_id' => $sacco->id, 'role' => 'admin']);
        $member = User::factory()->create(['sacco_id' => $sacco->id, 'role' => 'member']);
        $loan = Loan::factory()->create([
            'sacco_id' => $sacco->id,
            'member_id' => $member->id,
            'status' => 'active',
        ]);
        $schedule = LoanSchedule::create([
            'loan_id' => $loan->id,
            'installment_number' => 1,
            'due_date' => now()->addMonth()->toDateString(),
            'principal_due' => 1000.00,
            'interest_due' => 100.00,
            'total_due' => 1100.00,
            'amount_paid' => 0.00,
            'status' => 'pending',
        ]);

        $paymentRequest = PaymentRequest::create([
            'sacco_id' => $sacco->id,
            'member_id' => $member->id,
            'loan_id' => $loan->id,
            'loan_schedule_id' => $schedule->id,
            'amount' => 1100.00,
            'method' => 'bank_transfer',
            'payment_date' => now()->toDateString(),
            'status' => 'pending',
        ]);

        $response = $this->actingAs($admin)
            ->patchJson("/api/v1/payment-requests/{$paymentRequest->id}/approve");

        $response->assertOk()
            ->assertJsonPath('data.status', 'approved');

        // Check repayment created
        $this->assertDatabaseHas('repayments', [
            'loan_id' => $loan->id,
            'loan_schedule_id' => $schedule->id,
            'amount' => '1100.00',
        ]);

        // Check schedule updated to paid
        $this->assertDatabaseHas('loan_schedules', [
            'id' => $schedule->id,
            'amount_paid' => '1100.00',
            'status' => 'paid',
        ]);
    }

    public function test_admin_can_reject_payment_request(): void
    {
        $sacco = $this->createSacco();
        $admin = User::factory()->create(['sacco_id' => $sacco->id, 'role' => 'admin']);
        $member = User::factory()->create(['sacco_id' => $sacco->id, 'role' => 'member']);
        $loan = Loan::factory()->create([
            'sacco_id' => $sacco->id,
            'member_id' => $member->id,
            'status' => 'active',
        ]);
        $schedule = LoanSchedule::create([
            'loan_id' => $loan->id,
            'installment_number' => 1,
            'due_date' => now()->addMonth()->toDateString(),
            'principal_due' => 1000.00,
            'interest_due' => 100.00,
            'total_due' => 1100.00,
            'amount_paid' => 0.00,
            'status' => 'pending',
        ]);

        $paymentRequest = PaymentRequest::create([
            'sacco_id' => $sacco->id,
            'member_id' => $member->id,
            'loan_id' => $loan->id,
            'loan_schedule_id' => $schedule->id,
            'amount' => 1100.00,
            'method' => 'bank_transfer',
            'payment_date' => now()->toDateString(),
            'status' => 'pending',
        ]);

        $response = $this->actingAs($admin)
            ->patchJson("/api/v1/payment-requests/{$paymentRequest->id}/reject", [
                'rejection_reason' => 'Payment receipt not attached.',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'rejected')
            ->assertJsonPath('data.rejection_reason', 'Payment receipt not attached.');

        // Rejection must NOT create repayment or alter schedule
        $this->assertDatabaseMissing('repayments', [
            'loan_id' => $loan->id,
        ]);

        $this->assertDatabaseHas('loan_schedules', [
            'id' => $schedule->id,
            'amount_paid' => '0.00',
            'status' => 'pending',
        ]);
    }
}
