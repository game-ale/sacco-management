<?php

namespace Tests\Feature;

use App\Models\Loan;
use App\Models\LoanSchedule;
use App\Models\Repayment;
use App\Models\Sacco;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use RuntimeException;
use Tests\TestCase;

class RepaymentEndpointsTest extends TestCase
{
    use RefreshDatabase;

    private Sacco $saccoA;

    private User $adminA;

    private User $memberA1;

    private User $memberA2;

    private Sacco $saccoB;

    private User $adminB;

    private User $memberB;

    protected function setUp(): void
    {
        parent::setUp();

        // SACCO A
        $this->saccoA = Sacco::create([
            'name' => 'SACCO Alpha',
            'registration_number' => 'REG-ALPHA',
            'status' => 'approved',
        ]);
        $this->adminA = User::factory()->create(['role' => 'admin', 'sacco_id' => $this->saccoA->id]);
        $this->memberA1 = User::factory()->create(['role' => 'member', 'sacco_id' => $this->saccoA->id]);
        $this->memberA2 = User::factory()->create(['role' => 'member', 'sacco_id' => $this->saccoA->id]);

        // SACCO B
        $this->saccoB = Sacco::create([
            'name' => 'SACCO Beta',
            'registration_number' => 'REG-BETA',
            'status' => 'approved',
        ]);
        $this->adminB = User::factory()->create(['role' => 'admin', 'sacco_id' => $this->saccoB->id]);
        $this->memberB = User::factory()->create(['role' => 'member', 'sacco_id' => $this->saccoB->id]);
    }

    private function createActiveLoanWithSchedule(User $member, Sacco $sacco, float $totalDue = 1000.00): array
    {
        $loan = Loan::factory()->create([
            'sacco_id' => $sacco->id,
            'member_id' => $member->id,
            'principal_amount' => $totalDue,
            'status' => 'active',
            'interest_rate' => 0,
            'term_months' => 1,
            'total_repayable' => $totalDue,
            'monthly_installment' => $totalDue,
        ]);

        $schedule = LoanSchedule::create([
            'loan_id' => $loan->id,
            'installment_number' => 1,
            'due_date' => now()->addMonth()->toDateString(),
            'principal_due' => $totalDue,
            'interest_due' => 0.00,
            'total_due' => $totalDue,
            'amount_paid' => 0.00,
            'status' => 'pending',
        ]);

        return [$loan, $schedule];
    }

    // ─── 1. POST /api/v1/loans/{id}/repayments ─────────────────────────

    public function test_admin_can_record_a_repayment(): void
    {
        [$loan, $schedule] = $this->createActiveLoanWithSchedule($this->memberA1, $this->saccoA, 1000.00);

        $response = $this->actingAs($this->adminA)->postJson("/api/v1/loans/{$loan->id}/repayments", [
            'schedule_id' => $schedule->id,
            'amount_paid' => 400.00,
            'payment_date' => '2026-08-16',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.repayment.loan_id', $loan->id)
            ->assertJsonPath('data.repayment.loan_schedule_id', $schedule->id)
            ->assertJsonPath('data.repayment.sacco_id', $this->saccoA->id)
            ->assertJsonPath('data.repayment.amount', 400)
            ->assertJsonPath('data.repayment.recorded_by', $this->adminA->id)
            ->assertJsonPath('data.updated_schedule_entry.amount_paid', 400)
            ->assertJsonPath('data.updated_schedule_entry.status', 'partial');

        $this->assertDatabaseHas('repayments', [
            'sacco_id' => $this->saccoA->id,
            'loan_id' => $loan->id,
            'loan_schedule_id' => $schedule->id,
            'amount' => 400.00,
            'recorded_by' => $this->adminA->id,
        ]);

        $this->assertDatabaseHas('loan_schedules', [
            'id' => $schedule->id,
            'amount_paid' => 400.00,
            'status' => 'partial',
        ]);
    }

    public function test_member_can_record_a_repayment_for_their_own_loan(): void
    {
        [$loan, $schedule] = $this->createActiveLoanWithSchedule($this->memberA1, $this->saccoA, 1000.00);

        $response = $this->actingAs($this->memberA1)->postJson("/api/v1/loans/{$loan->id}/repayments", [
            'schedule_id' => $schedule->id,
            'amount_paid' => 400.00,
            'payment_date' => '2026-08-16',
            'method' => 'cash',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.repayment.recorded_by', $this->memberA1->id)
            ->assertJsonPath('data.updated_schedule_entry.amount_paid', 400);
    }

    public function test_member_cannot_record_a_repayment_for_another_members_loan(): void
    {
        [$loan, $schedule] = $this->createActiveLoanWithSchedule($this->memberA1, $this->saccoA);

        $response = $this->actingAs($this->memberA2)->postJson("/api/v1/loans/{$loan->id}/repayments", [
            'schedule_id' => $schedule->id,
            'amount_paid' => 100.00,
            'payment_date' => '2026-08-16',
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseCount('repayments', 0);
    }
    public function test_repayment_requires_schedule_id(): void
    {
        [$loan, $schedule] = $this->createActiveLoanWithSchedule($this->memberA1, $this->saccoA);

        $response = $this->actingAs($this->adminA)->postJson("/api/v1/loans/{$loan->id}/repayments", [
            'amount_paid' => 400.00,
            'payment_date' => '2026-08-16',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['schedule_id']);
    }

    public function test_repayment_requires_amount_paid(): void
    {
        [$loan, $schedule] = $this->createActiveLoanWithSchedule($this->memberA1, $this->saccoA);

        $response = $this->actingAs($this->adminA)->postJson("/api/v1/loans/{$loan->id}/repayments", [
            'schedule_id' => $schedule->id,
            'payment_date' => '2026-08-16',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['amount_paid']);
    }

    public function test_repayment_rejects_zero_or_negative_amount(): void
    {
        [$loan, $schedule] = $this->createActiveLoanWithSchedule($this->memberA1, $this->saccoA);

        $response = $this->actingAs($this->adminA)->postJson("/api/v1/loans/{$loan->id}/repayments", [
            'schedule_id' => $schedule->id,
            'amount_paid' => -50,
            'payment_date' => '2026-08-16',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['amount_paid']);
    }

    public function test_repayment_requires_valid_payment_date(): void
    {
        [$loan, $schedule] = $this->createActiveLoanWithSchedule($this->memberA1, $this->saccoA);

        $response = $this->actingAs($this->adminA)->postJson("/api/v1/loans/{$loan->id}/repayments", [
            'schedule_id' => $schedule->id,
            'amount_paid' => 100,
            'payment_date' => 'not-a-date',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['payment_date']);
    }

    public function test_repayment_rejected_when_schedule_belongs_to_another_loan(): void
    {
        [$loan] = $this->createActiveLoanWithSchedule($this->memberA1, $this->saccoA);
        [, $otherSchedule] = $this->createActiveLoanWithSchedule($this->memberA2, $this->saccoA);

        $response = $this->actingAs($this->adminA)->postJson("/api/v1/loans/{$loan->id}/repayments", [
            'schedule_id' => $otherSchedule->id,
            'amount_paid' => 100,
            'payment_date' => '2026-08-16',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['schedule_id']);
    }

    public function test_admin_from_another_sacco_cannot_record_repayment(): void
    {
        [$loan, $schedule] = $this->createActiveLoanWithSchedule($this->memberB, $this->saccoB);

        $response = $this->actingAs($this->adminA)->postJson("/api/v1/loans/{$loan->id}/repayments", [
            'schedule_id' => $schedule->id,
            'amount_paid' => 100,
            'payment_date' => '2026-08-16',
        ]);

        $response->assertStatus(403);
    }

    public function test_repayment_cannot_exceed_remaining_amount_due(): void
    {
        [$loan, $schedule] = $this->createActiveLoanWithSchedule($this->memberA1, $this->saccoA, 1000.00);

        $response = $this->actingAs($this->adminA)->postJson("/api/v1/loans/{$loan->id}/repayments", [
            'schedule_id' => $schedule->id,
            'amount_paid' => 1500.00,
            'payment_date' => '2026-08-16',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors(['amount_paid']);
    }

    public function test_fully_paid_loan_is_automatically_marked_completed(): void
    {
        [$loan, $schedule] = $this->createActiveLoanWithSchedule($this->memberA1, $this->saccoA, 500.00);

        $response = $this->actingAs($this->adminA)->postJson("/api/v1/loans/{$loan->id}/repayments", [
            'schedule_id' => $schedule->id,
            'amount_paid' => 500.00,
            'payment_date' => '2026-08-16',
        ]);

        $response->assertStatus(201)
            ->assertJsonPath('data.updated_schedule_entry.status', 'paid');

        $this->assertDatabaseHas('loans', [
            'id' => $loan->id,
            'status' => 'completed',
        ]);
    }

    public function test_transaction_rolls_back_when_repayment_processing_fails(): void
    {
        [$loan, $schedule] = $this->createActiveLoanWithSchedule($this->memberA1, $this->saccoA, 500.00);

        Repayment::creating(function (): void {
            throw new RuntimeException('Simulated failure');
        });

        $response = $this->actingAs($this->adminA)->postJson("/api/v1/loans/{$loan->id}/repayments", [
            'schedule_id' => $schedule->id,
            'amount_paid' => 500.00,
            'payment_date' => '2026-08-16',
        ]);

        Repayment::flushEventListeners();

        $response->assertStatus(500);

        $this->assertDatabaseCount('repayments', 0);
        $this->assertDatabaseHas('loan_schedules', [
            'id' => $schedule->id,
            'amount_paid' => 0,
            'status' => 'pending',
        ]);
        $this->assertDatabaseHas('loans', [
            'id' => $loan->id,
            'status' => 'active',
        ]);
    }

    // ─── 2. GET /api/v1/loans/{id}/repayments ──────────────────────────

    public function test_admin_can_view_repayments_for_their_sacco_loan(): void
    {
        [$loan, $schedule] = $this->createActiveLoanWithSchedule($this->memberA1, $this->saccoA);
        Repayment::create([
            'sacco_id' => $loan->sacco_id,
            'loan_id' => $loan->id,
            'loan_schedule_id' => $schedule->id,
            'amount' => 200.00,
            'paid_at' => '2026-08-01',
            'method' => 'manual',
            'recorded_by' => $this->adminA->id,
        ]);

        $response = $this->actingAs($this->adminA)->getJson("/api/v1/loans/{$loan->id}/repayments");

        $response->assertStatus(200)->assertJsonCount(1, 'data');
    }

    public function test_member_can_view_their_own_loan_repayments(): void
    {
        [$loan, $schedule] = $this->createActiveLoanWithSchedule($this->memberA1, $this->saccoA);
        Repayment::create([
            'sacco_id' => $loan->sacco_id,
            'loan_id' => $loan->id,
            'loan_schedule_id' => $schedule->id,
            'amount' => 200.00,
            'paid_at' => '2026-08-01',
            'method' => 'manual',
            'recorded_by' => $this->adminA->id,
        ]);

        $response = $this->actingAs($this->memberA1)->getJson("/api/v1/loans/{$loan->id}/repayments");

        $response->assertStatus(200)->assertJsonCount(1, 'data');
    }

    public function test_member_cannot_view_another_members_loan_repayments(): void
    {
        [$loan] = $this->createActiveLoanWithSchedule($this->memberA1, $this->saccoA);

        $response = $this->actingAs($this->memberA2)->getJson("/api/v1/loans/{$loan->id}/repayments");

        $response->assertStatus(403);
    }

    public function test_admin_cannot_view_another_saccos_loan_repayments(): void
    {
        [$loan] = $this->createActiveLoanWithSchedule($this->memberB, $this->saccoB);

        $response = $this->actingAs($this->adminA)->getJson("/api/v1/loans/{$loan->id}/repayments");

        $response->assertStatus(403);
    }

    public function test_nonexistent_loan_returns_404_for_repayment_list(): void
    {
        $response = $this->actingAs($this->adminA)->getJson('/api/v1/loans/999999/repayments');

        $response->assertStatus(404);
    }

    // ─── 3. GET /api/v1/repayments/overdue ─────────────────────────────

    public function test_overdue_installments_are_returned(): void
    {
        [$loan, $schedule] = $this->createActiveLoanWithSchedule($this->memberA1, $this->saccoA);
        $schedule->update(['due_date' => now()->subDays(5)->toDateString()]);

        $response = $this->actingAs($this->adminA)->getJson('/api/v1/repayments/overdue');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.schedule_entry.id', $schedule->id)
            ->assertJsonPath('data.0.member.id', $this->memberA1->id)
            ->assertJsonPath('data.0.loan.id', $loan->id);
    }

    public function test_fully_paid_installments_are_not_returned_as_overdue(): void
    {
        [, $schedule] = $this->createActiveLoanWithSchedule($this->memberA1, $this->saccoA);
        $schedule->update([
            'due_date' => now()->subDays(5)->toDateString(),
            'status' => 'paid',
            'amount_paid' => $schedule->total_due,
        ]);

        $response = $this->actingAs($this->adminA)->getJson('/api/v1/repayments/overdue');

        $response->assertStatus(200)->assertJsonCount(0, 'data');
    }

    public function test_admin_only_sees_their_saccos_overdue_installments(): void
    {
        [, $scheduleA] = $this->createActiveLoanWithSchedule($this->memberA1, $this->saccoA);
        $scheduleA->update(['due_date' => now()->subDays(5)->toDateString()]);

        [, $scheduleB] = $this->createActiveLoanWithSchedule($this->memberB, $this->saccoB);
        $scheduleB->update(['due_date' => now()->subDays(5)->toDateString()]);

        $response = $this->actingAs($this->adminA)->getJson('/api/v1/repayments/overdue');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.schedule_entry.id', $scheduleA->id);
    }

    public function test_future_installments_are_not_returned_as_overdue(): void
    {
        $this->createActiveLoanWithSchedule($this->memberA1, $this->saccoA);

        $response = $this->actingAs($this->adminA)->getJson('/api/v1/repayments/overdue');

        $response->assertStatus(200)->assertJsonCount(0, 'data');
    }

    public function test_member_cannot_access_overdue_installments_endpoint(): void
    {
        $response = $this->actingAs($this->memberA1)->getJson('/api/v1/repayments/overdue');

        $response->assertStatus(403);
    }
}
