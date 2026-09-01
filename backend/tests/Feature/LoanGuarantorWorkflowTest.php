<?php

namespace Tests\Feature;

use App\Models\Loan;
use App\Models\LoanGuarantor;
use App\Models\Sacco;
use App\Models\SavingsTransaction;
use App\Models\User;
use App\Notifications\GuarantorRequestNotification;
use App\Notifications\GuarantorResponseNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class LoanGuarantorWorkflowTest extends TestCase
{
    use RefreshDatabase;

    protected Sacco $sacco;
    protected User $applicant;
    protected User $g1;
    protected User $g2;
    protected User $g3;
    protected User $admin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->sacco = Sacco::create([
            'name' => 'Test SACCO',
            'code' => 'SACCO-TEST',
            'registration_number' => 'REG-12345',
            'contact_email' => 'sacco@test.com',
            'contact_phone' => '+251911000000',
            'address' => 'Addis Ababa',
            'status' => 'approved',
            'loan_savings_multiplier' => 3.0,
        ]);

        $this->applicant = User::factory()->create([
            'sacco_id' => $this->sacco->id,
            'role' => 'member',
            'is_active' => true,
        ]);

        // Applicant savings: 10,000 ETB -> 3x Limit = 30,000 ETB
        SavingsTransaction::create([
            'sacco_id' => $this->sacco->id,
            'member_id' => $this->applicant->id,
            'amount' => 10000,
            'type' => 'deposit',
            'balance_after' => 10000,
            'transaction_date' => now(),
        ]);

        // Create 3 potential guarantors
        $this->g1 = User::factory()->create(['sacco_id' => $this->sacco->id, 'role' => 'member', 'is_active' => true]);
        $this->g2 = User::factory()->create(['sacco_id' => $this->sacco->id, 'role' => 'member', 'is_active' => true]);
        $this->g3 = User::factory()->create(['sacco_id' => $this->sacco->id, 'role' => 'member', 'is_active' => true]);

        // Admin
        $this->admin = User::factory()->create(['sacco_id' => $this->sacco->id, 'role' => 'admin', 'is_active' => true]);
    }

    public function test_loan_within_3x_savings_limit_requires_no_guarantors(): void
    {
        $response = $this->actingAs($this->applicant)
            ->postJson('/api/v1/loans', [
                'amount' => 25000, // <= 30,000
                'purpose' => 'Working capital',
                'loan_type' => 'Personal',
                'term_months' => 12,
            ]);

        $response->assertStatus(201);
        $this->assertDatabaseHas('loans', [
            'member_id' => $this->applicant->id,
            'principal_amount' => 25000,
            'status' => 'pending',
        ]);
        $loanId = $response->json('data.id');
        $this->assertDatabaseMissing('loan_guarantors', ['loan_id' => $loanId]);
    }

    public function test_loan_exceeding_3x_savings_fails_if_less_than_3_guarantors_provided(): void
    {
        $response = $this->actingAs($this->applicant)
            ->postJson('/api/v1/loans', [
                'amount' => 50000, // > 30,000
                'purpose' => 'Business expansion',
                'loan_type' => 'Development',
                'term_months' => 24,
                'guarantor_ids' => [$this->g1->id, $this->g2->id], // Only 2 guarantors
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'The requested loan amount exceeds 3x your savings balance (30,000.00). You must select EXACTLY 3 valid guarantors to proceed.');
    }

    public function test_loan_exceeding_3x_savings_fails_if_duplicate_guarantors(): void
    {
        $response = $this->actingAs($this->applicant)
            ->postJson('/api/v1/loans', [
                'amount' => 50000,
                'purpose' => 'Business expansion',
                'loan_type' => 'Development',
                'term_months' => 24,
                'guarantor_ids' => [$this->g1->id, $this->g1->id, $this->g2->id],
            ]);

        $response->assertStatus(422)
            ->assertJsonPath('message', 'Duplicate guarantors are not allowed. Please select 3 distinct members.');
    }

    public function test_loan_exceeding_3x_savings_succeeds_with_exactly_3_guarantors_and_notifies_them(): void
    {
        Notification::fake();

        $response = $this->actingAs($this->applicant)
            ->postJson('/api/v1/loans', [
                'amount' => 60000, // > 30,000 limit
                'purpose' => 'Agricultural equipment',
                'loan_type' => 'Development',
                'term_months' => 24,
                'guarantor_ids' => [$this->g1->id, $this->g2->id, $this->g3->id],
            ]);

        $response->assertStatus(201);
        $loanId = $response->json('data.id');

        $this->assertDatabaseCount('loan_guarantors', 3);
        $this->assertDatabaseHas('loan_guarantors', [
            'loan_id' => $loanId,
            'member_id' => $this->g1->id,
            'status' => 'pending',
        ]);

        Notification::assertSentTo(
            [$this->g1, $this->g2, $this->g3],
            GuarantorRequestNotification::class
        );
    }

    public function test_admin_cannot_approve_loan_above_3x_limit_while_guarantor_acceptance_is_pending(): void
    {
        // Apply for 60,000 loan with 3 guarantors
        $this->actingAs($this->applicant)
            ->postJson('/api/v1/loans', [
                'amount' => 60000,
                'purpose' => 'Equipment purchase',
                'loan_type' => 'Development',
                'term_months' => 24,
                'guarantor_ids' => [$this->g1->id, $this->g2->id, $this->g3->id],
            ]);

        $loan = Loan::latest()->first();

        // Admin attempts approval
        $response = $this->actingAs($this->admin)
            ->patchJson("/api/v1/loans/{$loan->id}/approve", [
                'interest_rate' => 12,
                'term_months' => 24,
            ]);

        $response->assertStatus(422);
        $this->assertStringContainsString('Exactly 3 accepted guarantors are required', $response->json('message'));
        $this->assertEquals('pending', $loan->fresh()->status);
    }

    public function test_guarantor_acceptance_and_rejection_workflow(): void
    {
        Notification::fake();

        // Apply for loan
        $this->actingAs($this->applicant)
            ->postJson('/api/v1/loans', [
                'amount' => 60000,
                'purpose' => 'Equipment purchase',
                'loan_type' => 'Development',
                'term_months' => 24,
                'guarantor_ids' => [$this->g1->id, $this->g2->id, $this->g3->id],
            ]);

        $loan = Loan::latest()->first();

        // Fetch guarantor request for G1
        $g1Requests = $this->actingAs($this->g1)->getJson('/api/v1/guarantor-requests');
        $g1Requests->assertStatus(200);
        $req1Id = $g1Requests->json('data.0.id');

        // G1 accepts
        $acceptResponse = $this->actingAs($this->g1)->patchJson("/api/v1/guarantor-requests/{$req1Id}/accept");
        $acceptResponse->assertStatus(200);
        $this->assertDatabaseHas('loan_guarantors', ['id' => $req1Id, 'status' => 'accepted']);
        Notification::assertSentTo($this->applicant, GuarantorResponseNotification::class);

        // Fetch for G2 and reject
        $g2Requests = $this->actingAs($this->g2)->getJson('/api/v1/guarantor-requests');
        $req2Id = $g2Requests->json('data.0.id');
        $rejectResponse = $this->actingAs($this->g2)->patchJson("/api/v1/guarantor-requests/{$req2Id}/reject");
        $rejectResponse->assertStatus(200);
        $this->assertDatabaseHas('loan_guarantors', ['id' => $req2Id, 'status' => 'rejected']);

        // Admin attempt to approve (1 accepted, 1 rejected, 1 pending) -> MUST FAIL
        $adminApprove = $this->actingAs($this->admin)->patchJson("/api/v1/loans/{$loan->id}/approve", [
            'interest_rate' => 12,
            'term_months' => 24,
        ]);
        $adminApprove->assertStatus(422);
    }

    public function test_admin_can_approve_loan_above_3x_limit_once_all_3_guarantors_have_accepted(): void
    {
        // Apply for loan
        $this->actingAs($this->applicant)
            ->postJson('/api/v1/loans', [
                'amount' => 60000,
                'purpose' => 'Equipment purchase',
                'loan_type' => 'Development',
                'term_months' => 24,
                'guarantor_ids' => [$this->g1->id, $this->g2->id, $this->g3->id],
            ]);

        $loan = Loan::latest()->first();

        // G1 accepts
        $g1Req = LoanGuarantor::where('loan_id', $loan->id)->where('member_id', $this->g1->id)->first();
        $this->actingAs($this->g1)->patchJson("/api/v1/guarantor-requests/{$g1Req->id}/accept");

        // G2 accepts
        $g2Req = LoanGuarantor::where('loan_id', $loan->id)->where('member_id', $this->g2->id)->first();
        $this->actingAs($this->g2)->patchJson("/api/v1/guarantor-requests/{$g2Req->id}/accept");

        // G3 accepts
        $g3Req = LoanGuarantor::where('loan_id', $loan->id)->where('member_id', $this->g3->id)->first();
        $this->actingAs($this->g3)->patchJson("/api/v1/guarantor-requests/{$g3Req->id}/accept");

        // Verify all 3 are accepted
        $this->assertEquals(3, LoanGuarantor::where('loan_id', $loan->id)->where('status', 'accepted')->count());

        // Admin approves
        $response = $this->actingAs($this->admin)
            ->patchJson("/api/v1/loans/{$loan->id}/approve", [
                'interest_rate' => 12,
                'term_months' => 24,
            ]);

        $response->assertStatus(200);
        $this->assertEquals('approved', $loan->fresh()->status);
    }
}
