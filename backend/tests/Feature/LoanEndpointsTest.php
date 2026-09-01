<?php

namespace Tests\Feature;

use App\Models\Loan;
use App\Models\Sacco;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class LoanEndpointsTest extends TestCase
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

        // Give memberA1 enough savings for the 3x multiplier (5000 / 3 = ~1667)
        \App\Models\SavingsTransaction::create([
            'member_id' => $this->memberA1->id,
            'type' => 'deposit',
            'amount' => 5000,
            'balance_after' => 5000,
            'description' => 'Initial deposit',
            'transaction_date' => now(),
        ]);

        // SACCO B
        $this->saccoB = Sacco::create([
            'name' => 'SACCO Beta',
            'registration_number' => 'REG-BETA',
            'status' => 'approved',
        ]);
        $this->adminB = User::factory()->create(['role' => 'admin', 'sacco_id' => $this->saccoB->id]);
        $this->memberB = User::factory()->create(['role' => 'member', 'sacco_id' => $this->saccoB->id]);
    }

    // ─── 1. GET /api/v1/loans ──────────────────────────────────────────

    public function test_admin_can_list_loans_in_their_sacco(): void
    {
        Loan::factory()->create(['sacco_id' => $this->saccoA->id, 'member_id' => $this->memberA1->id, 'status' => 'pending']);
        Loan::factory()->create(['sacco_id' => $this->saccoA->id, 'member_id' => $this->memberA2->id, 'status' => 'approved']);
        Loan::factory()->create(['sacco_id' => $this->saccoB->id, 'member_id' => $this->memberB->id, 'status' => 'pending']);

        $response = $this->actingAs($this->adminA)->getJson('/api/v1/loans');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_admin_can_filter_loans_by_status(): void
    {
        Loan::factory()->create(['sacco_id' => $this->saccoA->id, 'member_id' => $this->memberA1->id, 'status' => 'pending']);
        Loan::factory()->create(['sacco_id' => $this->saccoA->id, 'member_id' => $this->memberA2->id, 'status' => 'approved']);

        $response = $this->actingAs($this->adminA)->getJson('/api/v1/loans?status=pending');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status', 'pending');
    }

    public function test_member_cannot_list_all_sacco_loans(): void
    {
        $response = $this->actingAs($this->memberA1)->getJson('/api/v1/loans');
        $response->assertStatus(403);
    }

    public function test_unauthenticated_cannot_access_loans_list(): void
    {
        $response = $this->getJson('/api/v1/loans');
        $response->assertStatus(401);
    }

    // ─── 2. POST /api/v1/loans ─────────────────────────────────────────

    public function test_member_can_apply_for_a_loan(): void
    {
        $payload = [
            'amount' => 5000.00,
            'purpose' => 'Business inventory purchase',
            'loan_type' => 'Personal',
            'term_months' => 12,
        ];

        $response = $this->actingAs($this->memberA1)->postJson('/api/v1/loans', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.amount', 5000)
            ->assertJsonPath('data.purpose', 'Business inventory purchase')
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.sacco_id', $this->saccoA->id)
            ->assertJsonPath('data.user_id', $this->memberA1->id);

        $this->assertDatabaseHas('loans', [
            'sacco_id' => $this->saccoA->id,
            'member_id' => $this->memberA1->id,
            'principal_amount' => 5000.00,
            'loan_type' => 'Personal',
            'status' => 'pending',
        ]);
    }

    public function test_apply_loan_validates_required_fields(): void
    {
        $response = $this->actingAs($this->memberA1)->postJson('/api/v1/loans', []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['amount', 'purpose', 'loan_type', 'term_months']);
    }

    public function test_apply_loan_validates_positive_amount(): void
    {
        $response = $this->actingAs($this->memberA1)->postJson('/api/v1/loans', [
            'amount' => -100,
            'purpose' => 'Invalid amount loan',
            'loan_type' => 'Personal',
            'term_months' => 12,
        ]);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['amount']);
    }

    public function test_admin_cannot_apply_for_loan(): void
    {
        $response = $this->actingAs($this->adminA)->postJson('/api/v1/loans', [
            'amount' => 1000.00,
            'purpose' => 'Admin trying to get loan',
            'loan_type' => 'Personal',
            'term_months' => 12,
        ]);

        $response->assertStatus(403);
    }

    // ─── 3. GET /api/v1/loans/{id} ─────────────────────────────────────

    public function test_admin_can_view_loan_in_their_sacco(): void
    {
        $loan = Loan::factory()->create(['sacco_id' => $this->saccoA->id, 'member_id' => $this->memberA1->id]);

        $response = $this->actingAs($this->adminA)->getJson("/api/v1/loans/{$loan->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $loan->id);
    }

    public function test_admin_cannot_view_loan_in_another_sacco(): void
    {
        $loan = Loan::factory()->create(['sacco_id' => $this->saccoB->id, 'member_id' => $this->memberB->id]);

        $response = $this->actingAs($this->adminA)->getJson("/api/v1/loans/{$loan->id}");

        $response->assertStatus(403);
    }

    public function test_member_can_view_their_own_loan(): void
    {
        $loan = Loan::factory()->create(['sacco_id' => $this->saccoA->id, 'member_id' => $this->memberA1->id]);

        $response = $this->actingAs($this->memberA1)->getJson("/api/v1/loans/{$loan->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.id', $loan->id);
    }

    public function test_member_cannot_view_another_members_loan(): void
    {
        $loan = Loan::factory()->create(['sacco_id' => $this->saccoA->id, 'member_id' => $this->memberA2->id]);

        $response = $this->actingAs($this->memberA1)->getJson("/api/v1/loans/{$loan->id}");

        $response->assertStatus(403);
    }

    // ─── 4. PATCH /api/v1/loans/{id}/approve ──────────────────────────

    public function test_admin_can_approve_pending_loan(): void
    {
        $loan = Loan::factory()->create([
            'sacco_id' => $this->saccoA->id,
            'member_id' => $this->memberA1->id,
            'principal_amount' => 12000.00,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->adminA)->patchJson("/api/v1/loans/{$loan->id}/approve", [
            'interest_rate' => 10.00,
            'term_months' => 12,
        ]);

        // Interest = 12000 * 0.10 * (12/12) = 1200. Total = 13200. Monthly = 1100.
        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'approved')
            ->assertJsonPath('data.interest_rate', 10)
            ->assertJsonPath('data.term_months', 12)
            ->assertJsonPath('data.total_repayable', 13200)
            ->assertJsonPath('data.monthly_installment', 1100);

        $this->assertDatabaseHas('loans', [
            'id' => $loan->id,
            'status' => 'approved',
            'total_repayable' => 13200.00,
            'monthly_installment' => 1100.00,
        ]);
    }

    public function test_approve_validates_required_fields(): void
    {
        $loan = Loan::factory()->create(['sacco_id' => $this->saccoA->id, 'member_id' => $this->memberA1->id, 'status' => 'pending']);

        $response = $this->actingAs($this->adminA)->patchJson("/api/v1/loans/{$loan->id}/approve", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['interest_rate', 'term_months']);
    }

    public function test_cannot_approve_non_pending_loan(): void
    {
        $loan = Loan::factory()->create(['sacco_id' => $this->saccoA->id, 'member_id' => $this->memberA1->id, 'status' => 'rejected']);

        $response = $this->actingAs($this->adminA)->patchJson("/api/v1/loans/{$loan->id}/approve", [
            'interest_rate' => 10.00,
            'term_months' => 12,
        ]);

        $response->assertStatus(400);
    }

    public function test_admin_cannot_approve_loan_of_other_sacco(): void
    {
        $loan = Loan::factory()->create(['sacco_id' => $this->saccoB->id, 'member_id' => $this->memberB->id, 'status' => 'pending']);

        $response = $this->actingAs($this->adminA)->patchJson("/api/v1/loans/{$loan->id}/approve", [
            'interest_rate' => 10.00,
            'term_months' => 12,
        ]);

        $response->assertStatus(403);
    }

    // ─── 5. PATCH /api/v1/loans/{id}/reject ───────────────────────────

    public function test_admin_can_reject_pending_loan(): void
    {
        $loan = Loan::factory()->create(['sacco_id' => $this->saccoA->id, 'member_id' => $this->memberA1->id, 'status' => 'pending']);

        $response = $this->actingAs($this->adminA)->patchJson("/api/v1/loans/{$loan->id}/reject", [
            'rejection_reason' => 'Insufficient credit score',
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'rejected')
            ->assertJsonPath('data.rejection_reason', 'Insufficient credit score');

        $this->assertDatabaseHas('loans', [
            'id' => $loan->id,
            'status' => 'rejected',
            'rejection_reason' => 'Insufficient credit score',
        ]);
    }

    public function test_reject_validates_rejection_reason(): void
    {
        $loan = Loan::factory()->create(['sacco_id' => $this->saccoA->id, 'member_id' => $this->memberA1->id, 'status' => 'pending']);

        $response = $this->actingAs($this->adminA)->patchJson("/api/v1/loans/{$loan->id}/reject", []);

        $response->assertStatus(422)
            ->assertJsonValidationErrors(['rejection_reason']);
    }

    public function test_cannot_reject_non_pending_loan(): void
    {
        $loan = Loan::factory()->create(['sacco_id' => $this->saccoA->id, 'member_id' => $this->memberA1->id, 'status' => 'approved']);

        $response = $this->actingAs($this->adminA)->patchJson("/api/v1/loans/{$loan->id}/reject", [
            'rejection_reason' => 'Already approved loan',
        ]);

        $response->assertStatus(400);
    }

    // ─── 6. PATCH /api/v1/loans/{id}/disburse ─────────────────────────

    public function test_admin_can_disburse_approved_loan_and_generate_schedule(): void
    {
        $loan = Loan::factory()->create([
            'sacco_id' => $this->saccoA->id,
            'member_id' => $this->memberA1->id,
            'principal_amount' => 12000.00,
            'status' => 'approved',
            'interest_rate' => 10.00,
            'term_months' => 6,
            'total_repayable' => 12600.00,
            'monthly_installment' => 2100.00,
        ]);

        $response = $this->actingAs($this->adminA)->patchJson("/api/v1/loans/{$loan->id}/disburse");

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'active')
            ->assertJsonCount(6, 'data.repayment_schedule');

        $this->assertDatabaseHas('loans', [
            'id' => $loan->id,
            'status' => 'active',
        ]);

        $this->assertDatabaseCount('loan_schedules', 6);
        $this->assertDatabaseHas('loan_schedules', [
            'loan_id' => $loan->id,
            'installment_number' => 1,
            'total_due' => 2100.00,
            'status' => 'pending',
        ]);
    }

    public function test_cannot_disburse_unapproved_loan(): void
    {
        $loan = Loan::factory()->create(['sacco_id' => $this->saccoA->id, 'member_id' => $this->memberA1->id, 'status' => 'pending']);

        $response = $this->actingAs($this->adminA)->patchJson("/api/v1/loans/{$loan->id}/disburse");

        $response->assertStatus(400);
    }

    public function test_admin_cannot_disburse_loan_of_other_sacco(): void
    {
        $loan = Loan::factory()->create(['sacco_id' => $this->saccoB->id, 'member_id' => $this->memberB->id, 'status' => 'approved']);

        $response = $this->actingAs($this->adminA)->patchJson("/api/v1/loans/{$loan->id}/disburse");

        $response->assertStatus(403);
    }

    // ─── 7. GET /api/v1/me/loans ───────────────────────────────────────

    public function test_member_can_list_their_own_loans(): void
    {
        Loan::factory()->create(['sacco_id' => $this->saccoA->id, 'member_id' => $this->memberA1->id]);
        Loan::factory()->create(['sacco_id' => $this->saccoA->id, 'member_id' => $this->memberA1->id]);
        Loan::factory()->create(['sacco_id' => $this->saccoA->id, 'member_id' => $this->memberA2->id]);

        $response = $this->actingAs($this->memberA1)->getJson('/api/v1/me/loans');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_admin_cannot_access_my_loans_endpoint(): void
    {
        $response = $this->actingAs($this->adminA)->getJson('/api/v1/me/loans');
        $response->assertStatus(403);
    }
}
