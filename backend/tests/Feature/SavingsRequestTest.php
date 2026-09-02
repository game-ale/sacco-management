<?php

namespace Tests\Feature;

use App\Models\Sacco;
use App\Models\SavingsRequest;
use App\Models\SavingsTransaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SavingsRequestTest extends TestCase
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

    public function test_member_can_create_deposit_request(): void
    {
        $sacco = $this->createSacco();
        $member = User::factory()->create(['sacco_id' => $sacco->id, 'role' => 'member']);

        $response = $this->actingAs($member)
            ->postJson('/api/v1/me/savings-requests', [
                'type' => 'deposit',
                'amount' => 500.00,
                'description' => 'Monthly deposit',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', 'pending')
            ->assertJsonPath('data.amount', 500);

        $this->assertDatabaseHas('savings_requests', [
            'member_id' => $member->id,
            'sacco_id' => $sacco->id,
            'type' => 'deposit',
            'amount' => '500.00',
            'status' => 'pending',
        ]);

        // Verify balance is NOT changed by pending request
        $this->assertDatabaseMissing('savings_transactions', [
            'member_id' => $member->id,
        ]);
    }

    public function test_member_can_create_withdrawal_request_when_sufficient_balance(): void
    {
        $sacco = $this->createSacco();
        $member = User::factory()->create(['sacco_id' => $sacco->id, 'role' => 'member']);

        SavingsTransaction::create([
            'member_id' => $member->id,
            'type' => 'deposit',
            'amount' => 1000.00,
            'balance_after' => 1000.00,
            'description' => 'Initial deposit',
        ]);

        $response = $this->actingAs($member)
            ->postJson('/api/v1/me/savings-requests', [
                'type' => 'withdraw',
                'amount' => 400.00,
                'description' => 'Withdrawal for emergency',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.status', 'pending');
    }

    public function test_withdrawal_request_fails_if_exceeding_balance(): void
    {
        $sacco = $this->createSacco();
        $member = User::factory()->create(['sacco_id' => $sacco->id, 'role' => 'member']);

        SavingsTransaction::create([
            'member_id' => $member->id,
            'type' => 'deposit',
            'amount' => 200.00,
            'balance_after' => 200.00,
            'description' => 'Initial deposit',
        ]);

        $response = $this->actingAs($member)
            ->postJson('/api/v1/me/savings-requests', [
                'type' => 'withdraw',
                'amount' => 500.00,
            ]);

        $response->assertUnprocessable();
    }

    public function test_admin_can_approve_savings_request(): void
    {
        $sacco = $this->createSacco();
        $admin = User::factory()->create(['sacco_id' => $sacco->id, 'role' => 'admin']);
        $member = User::factory()->create(['sacco_id' => $sacco->id, 'role' => 'member']);

        $request = SavingsRequest::create([
            'sacco_id' => $sacco->id,
            'member_id' => $member->id,
            'type' => 'deposit',
            'amount' => 750.00,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($admin)
            ->patchJson("/api/v1/savings-requests/{$request->id}/approve");

        $response->assertOk()
            ->assertJsonPath('data.status', 'approved');

        $this->assertDatabaseHas('savings_requests', [
            'id' => $request->id,
            'status' => 'approved',
            'reviewed_by' => $admin->id,
        ]);

        $this->assertDatabaseHas('savings_transactions', [
            'member_id' => $member->id,
            'type' => 'deposit',
            'amount' => '750.00',
            'balance_after' => '750.00',
        ]);
    }

    public function test_admin_can_reject_savings_request(): void
    {
        $sacco = $this->createSacco();
        $admin = User::factory()->create(['sacco_id' => $sacco->id, 'role' => 'admin']);
        $member = User::factory()->create(['sacco_id' => $sacco->id, 'role' => 'member']);

        $request = SavingsRequest::create([
            'sacco_id' => $sacco->id,
            'member_id' => $member->id,
            'type' => 'deposit',
            'amount' => 750.00,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($admin)
            ->patchJson("/api/v1/savings-requests/{$request->id}/reject", [
                'rejection_reason' => 'Invalid transaction reference.',
            ]);

        $response->assertOk()
            ->assertJsonPath('data.status', 'rejected')
            ->assertJsonPath('data.rejection_reason', 'Invalid transaction reference.');

        // Rejection must NOT modify savings transactions/balance
        $this->assertDatabaseMissing('savings_transactions', [
            'member_id' => $member->id,
        ]);
    }

    public function test_duplicate_approval_is_prevented(): void
    {
        $sacco = $this->createSacco();
        $admin = User::factory()->create(['sacco_id' => $sacco->id, 'role' => 'admin']);
        $member = User::factory()->create(['sacco_id' => $sacco->id, 'role' => 'member']);

        $request = SavingsRequest::create([
            'sacco_id' => $sacco->id,
            'member_id' => $member->id,
            'type' => 'deposit',
            'amount' => 500.00,
            'status' => 'approved',
            'reviewed_by' => $admin->id,
            'reviewed_at' => now(),
        ]);

        $response = $this->actingAs($admin)
            ->patchJson("/api/v1/savings-requests/{$request->id}/approve");

        $response->assertStatus(422);
    }

    public function test_cross_sacco_access_is_blocked(): void
    {
        $saccoA = $this->createSacco('SACCO A');
        $saccoB = $this->createSacco('SACCO B');
        $adminA = User::factory()->create(['sacco_id' => $saccoA->id, 'role' => 'admin']);
        $memberB = User::factory()->create(['sacco_id' => $saccoB->id, 'role' => 'member']);

        $requestB = SavingsRequest::create([
            'sacco_id' => $saccoB->id,
            'member_id' => $memberB->id,
            'type' => 'deposit',
            'amount' => 500.00,
            'status' => 'pending',
        ]);

        $response = $this->actingAs($adminA)
            ->patchJson("/api/v1/savings-requests/{$requestB->id}/approve");

        $response->assertNotFound();
    }
}
