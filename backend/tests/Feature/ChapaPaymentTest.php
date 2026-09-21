<?php

namespace Tests\Feature;

use App\Models\Loan;
use App\Models\LoanSchedule;
use App\Models\Repayment;
use App\Models\Sacco;
use App\Models\SavingsTransaction;
use App\Models\User;
use App\Services\ChapaService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class ChapaPaymentTest extends TestCase
{
    use RefreshDatabase;

    private Sacco $sacco;
    private User $member;

    protected function setUp(): void
    {
        parent::setUp();

        $this->sacco = Sacco::create([
            'name' => 'Test SACCO',
            'registration_number' => 'REG-CHAPA-1',
            'status' => 'approved',
            'chapa_secret_key' => 'CHASECK_TEST-1234567890',
            'chapa_public_key' => 'CHAPUBK_TEST-1234567890',
        ]);

        $this->member = User::factory()->create([
            'role' => 'member',
            'sacco_id' => $this->sacco->id,
            'name' => 'Abebe Bikila',
            'email' => 'abebe@example.com',
        ]);
    }

    public function test_member_can_initialize_loan_payment(): void
    {
        $loan = Loan::factory()->create([
            'sacco_id' => $this->sacco->id,
            'member_id' => $this->member->id,
            'status' => 'approved',
        ]);

        $schedule = LoanSchedule::create([
            'loan_id' => $loan->id,
            'installment_number' => 1,
            'due_date' => now()->addMonth()->toDateString(),
            'principal_due' => 800.00,
            'interest_due' => 200.00,
            'total_due' => 1000.00,
            'amount_paid' => 0.00,
            'penalty_amount' => 0.00,
            'status' => 'pending',
        ]);

        $chapaService = Mockery::mock(ChapaService::class);
        $chapaService->shouldReceive('initialize')
            ->once()
            ->andReturn([
                'status' => 'success',
                'data' => [
                    'checkout_url' => 'https://checkout.chapa.co/checkout/test-url',
                ],
            ]);
        $this->app->instance(ChapaService::class, $chapaService);

        $response = $this->actingAs($this->member)
            ->postJson('/api/v1/payments/chapa/initialize', [
                'amount' => 1000.00,
                'type' => 'loan',
                'loan_id' => $loan->id,
                'schedule_id' => $schedule->id,
            ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'checkout_url' => 'https://checkout.chapa.co/checkout/test-url',
            ]);
    }

    public function test_member_can_initialize_savings_deposit(): void
    {
        $chapaService = Mockery::mock(ChapaService::class);
        $chapaService->shouldReceive('initialize')
            ->once()
            ->andReturn([
                'status' => 'success',
                'data' => [
                    'checkout_url' => 'https://checkout.chapa.co/checkout/savings-test-url',
                ],
            ]);
        $this->app->instance(ChapaService::class, $chapaService);

        $response = $this->actingAs($this->member)
            ->postJson('/api/v1/payments/chapa/initialize', [
                'amount' => 500.00,
                'type' => 'savings',
            ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'checkout_url' => 'https://checkout.chapa.co/checkout/savings-test-url',
            ]);
    }

    public function test_member_can_verify_successful_loan_payment(): void
    {
        $loan = Loan::factory()->create([
            'sacco_id' => $this->sacco->id,
            'member_id' => $this->member->id,
            'status' => 'approved',
        ]);

        $schedule = LoanSchedule::create([
            'loan_id' => $loan->id,
            'installment_number' => 1,
            'due_date' => now()->addMonth()->toDateString(),
            'principal_due' => 800.00,
            'interest_due' => 200.00,
            'total_due' => 1000.00,
            'amount_paid' => 0.00,
            'penalty_amount' => 0.00,
            'status' => 'pending',
        ]);

        $txRef = "CHAPA-loan-{$this->member->id}-{$loan->id}-{$schedule->id}-RANDOM01";

        $chapaService = Mockery::mock(ChapaService::class);
        $chapaService->shouldReceive('verify')
            ->once()
            ->with(Mockery::any(), $txRef)
            ->andReturn([
                'status' => 'success',
                'data' => [
                    'amount' => 1000.00,
                    'currency' => 'ETB',
                    'status' => 'success',
                ],
            ]);
        $this->app->instance(ChapaService::class, $chapaService);

        $response = $this->actingAs($this->member)
            ->getJson("/api/v1/payments/chapa/verify?tx_ref={$txRef}");

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Payment processed successfully.',
            ]);

        $this->assertDatabaseHas('repayments', [
            'sacco_id' => $this->sacco->id,
            'loan_id' => $loan->id,
            'loan_schedule_id' => $schedule->id,
            'amount' => 1000.00,
            'method' => 'chapa',
            'reference_number' => $txRef,
            'recorded_by' => $this->member->id,
        ]);

        $schedule->refresh();
        $this->assertEquals(1000.00, (float) $schedule->amount_paid);
        $this->assertEquals('paid', $schedule->status);
    }

    public function test_member_can_verify_successful_savings_deposit(): void
    {
        SavingsTransaction::create([
            'member_id' => $this->member->id,
            'type' => 'deposit',
            'amount' => 200.00,
            'balance_after' => 200.00,
            'description' => 'Initial savings',
            'transaction_date' => now()->toDateString(),
        ]);

        $txRef = "CHAPA-savings-{$this->member->id}-0-0-RANDOM02";

        $chapaService = Mockery::mock(ChapaService::class);
        $chapaService->shouldReceive('verify')
            ->once()
            ->with(Mockery::any(), $txRef)
            ->andReturn([
                'status' => 'success',
                'data' => [
                    'amount' => 300.00,
                    'currency' => 'ETB',
                    'status' => 'success',
                ],
            ]);
        $this->app->instance(ChapaService::class, $chapaService);

        $response = $this->actingAs($this->member)
            ->getJson("/api/v1/payments/chapa/verify?tx_ref={$txRef}");

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Payment processed successfully.',
            ]);

        $this->assertDatabaseHas('savings_transactions', [
            'member_id' => $this->member->id,
            'type' => 'deposit',
            'amount' => 300.00,
            'balance_after' => 500.00,
            'reference_number' => $txRef,
        ]);
    }

    public function test_duplicate_verification_is_idempotent(): void
    {
        $txRef = "CHAPA-savings-{$this->member->id}-0-0-RANDOM03";

        SavingsTransaction::create([
            'member_id' => $this->member->id,
            'type' => 'deposit',
            'amount' => 100.00,
            'balance_after' => 100.00,
            'description' => 'Online Chapa Deposit',
            'reference_number' => $txRef,
            'transaction_date' => now()->toDateString(),
        ]);

        $chapaService = Mockery::mock(ChapaService::class);
        $chapaService->shouldReceive('verify')
            ->once()
            ->andReturn([
                'status' => 'success',
                'data' => [
                    'amount' => 100.00,
                    'status' => 'success',
                ],
            ]);
        $this->app->instance(ChapaService::class, $chapaService);

        $response = $this->actingAs($this->member)
            ->getJson("/api/v1/payments/chapa/verify?tx_ref={$txRef}");

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Payment already processed.',
            ]);

        // Verify count didn't increase
        $this->assertEquals(1, SavingsTransaction::where('reference_number', $txRef)->count());
    }

    public function test_verification_fails_if_tx_ref_belongs_to_another_user(): void
    {
        $otherMember = User::factory()->create([
            'role' => 'member',
            'sacco_id' => $this->sacco->id,
        ]);

        $txRef = "CHAPA-savings-{$otherMember->id}-0-0-RANDOM04";

        $response = $this->actingAs($this->member)
            ->getJson("/api/v1/payments/chapa/verify?tx_ref={$txRef}");

        $response->assertStatus(403)
            ->assertJson([
                'success' => false,
                'message' => 'Transaction does not belong to this user.',
            ]);
    }

    public function test_verification_fails_if_amount_does_not_match_expected(): void
    {
        $txRef = "CHAPA-savings-{$this->member->id}-0-0-RANDOM05";

        \Illuminate\Support\Facades\Cache::put("chapa_init_{$txRef}", [
            'user_id' => $this->member->id,
            'amount' => 500.00,
            'type' => 'savings',
            'ref_id' => 0,
            'schedule_id' => 0,
        ], now()->addHours(1));

        $chapaService = Mockery::mock(ChapaService::class);
        $chapaService->shouldReceive('verify')
            ->once()
            ->andReturn([
                'status' => 'success',
                'data' => [
                    'amount' => 100.00, // Different from initialized 500.00
                    'status' => 'success',
                ],
            ]);
        $this->app->instance(ChapaService::class, $chapaService);

        $response = $this->actingAs($this->member)
            ->getJson("/api/v1/payments/chapa/verify?tx_ref={$txRef}");

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Verified payment amount does not match expected amount.',
            ]);
    }

    public function test_initialization_fails_if_loan_does_not_belong_to_member(): void
    {
        $otherMember = User::factory()->create([
            'role' => 'member',
            'sacco_id' => $this->sacco->id,
        ]);

        $loan = Loan::factory()->create([
            'sacco_id' => $this->sacco->id,
            'member_id' => $otherMember->id,
        ]);

        $response = $this->actingAs($this->member)
            ->postJson('/api/v1/payments/chapa/initialize', [
                'amount' => 100.00,
                'type' => 'loan',
                'loan_id' => $loan->id,
            ]);

        $response->assertStatus(404)
            ->assertJson([
                'success' => false,
                'message' => 'Loan not found or does not belong to you.',
            ]);
    }

    public function test_initialization_fails_if_sacco_has_no_chapa_configured(): void
    {
        $unconfiguredSacco = Sacco::create([
            'name' => 'No Chapa SACCO',
            'registration_number' => 'REG-NO-CHAPA',
            'status' => 'approved',
            'chapa_secret_key' => null,
            'chapa_public_key' => null,
        ]);

        $unconfiguredMember = User::factory()->create([
            'role' => 'member',
            'sacco_id' => $unconfiguredSacco->id,
        ]);

        // Temporarily ensure no global fallback in test
        config(['services.chapa.secret_key' => null]);

        $response = $this->actingAs($unconfiguredMember)
            ->postJson('/api/v1/payments/chapa/initialize', [
                'amount' => 100.00,
                'type' => 'savings',
            ]);

        $response->assertStatus(400)
            ->assertJson([
                'success' => false,
                'message' => 'Your SACCO has not configured online payments.',
            ]);
    }

    public function test_initialize_sets_correct_return_url_pointing_to_frontend_port_5173_with_tx_ref(): void
    {
        config(['app.frontend_url' => 'http://localhost:5173']);

        $chapaService = Mockery::mock(ChapaService::class);
        $chapaService->shouldReceive('initialize')
            ->once()
            ->withArgs(function ($sacco, array $data) {
                return str_starts_with($data['return_url'], 'http://localhost:5173/member/payments/verify?tx_ref=CHAPA-savings-')
                    && $data['return_url'] === "http://localhost:5173/member/payments/verify?tx_ref={$data['tx_ref']}";
            })
            ->andReturn([
                'status' => 'success',
                'data' => [
                    'checkout_url' => 'https://checkout.chapa.co/checkout/test-url',
                ],
            ]);
        $this->app->instance(ChapaService::class, $chapaService);

        $response = $this->actingAs($this->member)
            ->postJson('/api/v1/payments/chapa/initialize', [
                'amount' => 250.00,
                'type' => 'savings',
            ]);

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'checkout_url' => 'https://checkout.chapa.co/checkout/test-url',
            ]);
    }

    public function test_initialize_respects_custom_return_url_from_frontend(): void
    {
        $chapaService = Mockery::mock(ChapaService::class);
        $chapaService->shouldReceive('initialize')
            ->once()
            ->withArgs(function ($sacco, array $data) {
                return str_starts_with($data['return_url'], 'http://localhost:5173/member/payments/verify?tx_ref=');
            })
            ->andReturn([
                'status' => 'success',
                'data' => [
                    'checkout_url' => 'https://checkout.chapa.co/checkout/test-url',
                ],
            ]);
        $this->app->instance(ChapaService::class, $chapaService);

        $response = $this->actingAs($this->member)
            ->postJson('/api/v1/payments/chapa/initialize', [
                'amount' => 150.00,
                'type' => 'savings',
                'return_url' => 'http://localhost:5173/member/payments/verify',
            ]);

        $response->assertOk();
    }

    public function test_verify_supports_trx_ref_parameter_alias(): void
    {
        $txRef = "CHAPA-savings-{$this->member->id}-0-0-ALIAS01";

        $chapaService = Mockery::mock(ChapaService::class);
        $chapaService->shouldReceive('verify')
            ->once()
            ->with(Mockery::any(), $txRef)
            ->andReturn([
                'status' => 'success',
                'data' => [
                    'amount' => 150.00,
                    'status' => 'success',
                ],
            ]);
        $this->app->instance(ChapaService::class, $chapaService);

        $response = $this->actingAs($this->member)
            ->getJson("/api/v1/payments/chapa/verify?trx_ref={$txRef}");

        $response->assertOk()
            ->assertJson([
                'success' => true,
                'message' => 'Payment processed successfully.',
            ]);

        $this->assertDatabaseHas('savings_transactions', [
            'member_id' => $this->member->id,
            'type' => 'deposit',
            'amount' => 150.00,
            'reference_number' => $txRef,
        ]);
    }

    public function test_loan_payment_completes_loan_when_all_installments_paid(): void
    {
        $loan = Loan::factory()->create([
            'sacco_id' => $this->sacco->id,
            'member_id' => $this->member->id,
            'status' => 'approved',
        ]);

        $schedule = LoanSchedule::create([
            'loan_id' => $loan->id,
            'installment_number' => 1,
            'due_date' => now()->addMonth()->toDateString(),
            'principal_due' => 400.00,
            'interest_due' => 100.00,
            'total_due' => 500.00,
            'amount_paid' => 0.00,
            'penalty_amount' => 0.00,
            'status' => 'pending',
        ]);

        $txRef = "CHAPA-loan-{$this->member->id}-{$loan->id}-{$schedule->id}-ALLPAID1";

        $chapaService = Mockery::mock(ChapaService::class);
        $chapaService->shouldReceive('verify')
            ->once()
            ->with(Mockery::any(), $txRef)
            ->andReturn([
                'status' => 'success',
                'data' => [
                    'amount' => 500.00,
                    'status' => 'success',
                ],
            ]);
        $this->app->instance(ChapaService::class, $chapaService);

        $response = $this->actingAs($this->member)
            ->getJson("/api/v1/payments/chapa/verify?tx_ref={$txRef}");

        $response->assertOk();

        $schedule->refresh();
        $this->assertEquals(500.00, (float) $schedule->amount_paid);
        $this->assertEquals('paid', $schedule->status);

        $loan->refresh();
        $this->assertEquals('completed', $loan->status);
    }

    public function test_loan_payment_marks_schedule_partial_when_underpaid(): void
    {
        $loan = Loan::factory()->create([
            'sacco_id' => $this->sacco->id,
            'member_id' => $this->member->id,
            'status' => 'approved',
        ]);

        $schedule = LoanSchedule::create([
            'loan_id' => $loan->id,
            'installment_number' => 1,
            'due_date' => now()->addMonth()->toDateString(),
            'principal_due' => 800.00,
            'interest_due' => 200.00,
            'total_due' => 1000.00,
            'amount_paid' => 0.00,
            'penalty_amount' => 0.00,
            'status' => 'pending',
        ]);

        $txRef = "CHAPA-loan-{$this->member->id}-{$loan->id}-{$schedule->id}-PARTIAL1";

        $chapaService = Mockery::mock(ChapaService::class);
        $chapaService->shouldReceive('verify')
            ->once()
            ->with(Mockery::any(), $txRef)
            ->andReturn([
                'status' => 'success',
                'data' => [
                    'amount' => 400.00,
                    'status' => 'success',
                ],
            ]);
        $this->app->instance(ChapaService::class, $chapaService);

        $response = $this->actingAs($this->member)
            ->getJson("/api/v1/payments/chapa/verify?tx_ref={$txRef}");

        $response->assertOk();

        $schedule->refresh();
        $this->assertEquals(400.00, (float) $schedule->amount_paid);
        $this->assertEquals('partial', $schedule->status);

        $loan->refresh();
        $this->assertEquals('approved', $loan->status);
    }
}
