<?php

namespace Tests\Feature;

use App\Models\SavingsTransaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MemberSavingsTest extends TestCase
{
    use RefreshDatabase;

    public function test_sacco_admin_can_view_member_savings(): void
    {
        $admin = User::factory()->create(['role' => 'sacco_admin']);
        $member = User::factory()->create();

        $this->assertInstanceOf(User::class, $admin);
        $this->assertInstanceOf(User::class, $member);

        SavingsTransaction::create([
            'member_id' => $member->id,
            'type' => 'deposit',
            'amount' => 100.00,
            'balance_after' => 100.00,
            'description' => 'Initial deposit',
        ]);

        $response = $this->actingAs($admin)
            ->getJson("/api/v1/members/{$member->id}/savings");

        $response->assertOk()
            ->assertJsonStructure([
                'data' => [
                    'balance',
                    'transactions' => [
                        'data' => [
                            ['id', 'type', 'amount', 'balance_after', 'description', 'date'],
                        ],
                    ],
                ],
            ]);
    }

    public function test_member_can_view_own_savings_but_not_others(): void
    {
        $memberA = User::factory()->create();
        $memberB = User::factory()->create();

        $this->assertInstanceOf(User::class, $memberA);
        $this->assertInstanceOf(User::class, $memberB);

        SavingsTransaction::create([
            'member_id' => $memberA->id,
            'type' => 'deposit',
            'amount' => 50.00,
            'balance_after' => 50.00,
            'description' => 'Deposit',
        ]);

        // Member A can view own
        $responseA = $this->actingAs($memberA)->getJson("/api/v1/members/{$memberA->id}/savings");
        $responseA->assertOk()->assertJsonFragment(['balance' => 50.0]);

        // Member A cannot view Member B
        $responseB = $this->actingAs($memberA)->getJson("/api/v1/members/{$memberB->id}/savings");
        $responseB->assertForbidden();
    }

    public function test_unauthenticated_user_cannot_view_savings(): void
    {
        $member = User::factory()->create();

        $response = $this->getJson("/api/v1/members/{$member->id}/savings");

        $response->assertUnauthorized();
    }

    public function test_member_can_view_own_savings_balance_and_history(): void
    {
        $member = User::factory()->create(['role' => 'member']);

        $this->assertInstanceOf(User::class, $member);

        SavingsTransaction::create([
            'member_id' => $member->id,
            'type' => 'deposit',
            'amount' => 100.00,
            'balance_after' => 100.00,
            'description' => 'Initial deposit',
        ]);

        $response = $this->actingAs($member)
            ->getJson('/api/v1/me/savings');

        $response->assertOk()
            ->assertJsonPath('data.balance', 100)
            ->assertJsonStructure([
                'data' => [
                    'balance',
                    'transactions' => [
                        'data' => [
                            ['id', 'type', 'amount', 'balance_after', 'description', 'date'],
                        ],
                    ],
                ],
            ]);
    }

    public function test_sacco_admin_can_deposit_to_member_savings(): void
    {
        $admin = User::factory()->create(['role' => 'sacco_admin']);
        $member = User::factory()->create();

        $this->assertInstanceOf(User::class, $admin);
        $this->assertInstanceOf(User::class, $member);

        $response = $this->actingAs($admin)
            ->postJson("/api/v1/members/{$member->id}/savings/deposit", [
                'amount' => 125.50,
                'description' => 'Monthly contribution',
                'transaction_date' => '2026-08-12',
            ]);

        $response->assertCreated()
            ->assertJsonPath('data.new_balance', 125.5)
            ->assertJsonStructure([
                'data' => [
                    'transaction' => ['id', 'type', 'amount', 'balance_after', 'description', 'date'],
                    'new_balance',
                ],
            ]);

        $this->assertDatabaseHas('savings_transactions', [
            'member_id' => $member->id,
            'type' => 'deposit',
            'amount' => '125.50',
            'description' => 'Monthly contribution',
        ]);
    }

    public function test_sacco_admin_cannot_withdraw_more_than_current_balance(): void
    {
        $admin = User::factory()->create(['role' => 'sacco_admin']);
        $member = User::factory()->create();

        $this->assertInstanceOf(User::class, $admin);
        $this->assertInstanceOf(User::class, $member);

        SavingsTransaction::create([
            'member_id' => $member->id,
            'type' => 'deposit',
            'amount' => 40.00,
            'balance_after' => 40.00,
            'description' => 'Initial deposit',
        ]);

        $response = $this->actingAs($admin)
            ->postJson("/api/v1/members/{$member->id}/savings/withdraw", [
                'amount' => 50.00,
                'description' => 'Too much',
                'transaction_date' => '2026-08-12',
            ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['amount']);
    }
}
