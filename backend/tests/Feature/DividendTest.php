<?php

namespace Tests\Feature;

use App\Models\Dividend;
use App\Models\Sacco;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DividendTest extends TestCase
{
    use RefreshDatabase;

    private Sacco $mySacco;

    private User $myAdmin;

    private User $member1;

    private User $member2;

    private Sacco $otherSacco;

    private User $otherAdmin;

    private User $otherMember;

    protected function setUp(): void
    {
        parent::setUp();

        $this->mySacco = Sacco::create([
            'name' => 'My SACCO',
            'registration_number' => 'REG-001',
            'status' => 'approved',
        ]);
        $this->myAdmin = User::factory()->create([
            'role' => 'admin',
            'sacco_id' => $this->mySacco->id,
        ]);
        $this->member1 = User::factory()->create([
            'role' => 'member',
            'sacco_id' => $this->mySacco->id,
            'num_shares' => 10,
        ]);
        \App\Models\SavingsTransaction::factory()->create([
            'member_id' => $this->member1->id,
            'type' => 'deposit',
            'amount' => 1000,
            'balance_after' => 1000,
        ]);

        $this->member2 = User::factory()->create([
            'role' => 'member',
            'sacco_id' => $this->mySacco->id,
            'num_shares' => 40,
        ]);
        \App\Models\SavingsTransaction::factory()->create([
            'member_id' => $this->member2->id,
            'type' => 'deposit',
            'amount' => 9000,
            'balance_after' => 9000,
        ]);

        $this->otherSacco = Sacco::create([
            'name' => 'Other SACCO',
            'registration_number' => 'REG-002',
            'status' => 'approved',
        ]);
        $this->otherAdmin = User::factory()->create([
            'role' => 'admin',
            'sacco_id' => $this->otherSacco->id,
        ]);
        $this->otherMember = User::factory()->create([
            'role' => 'member',
            'sacco_id' => $this->otherSacco->id,
            'num_shares' => 50,
        ]);
        \App\Models\SavingsTransaction::factory()->create([
            'member_id' => $this->otherMember->id,
            'type' => 'deposit',
            'amount' => 5000,
            'balance_after' => 5000,
        ]);
    }

    // 1. Admin can calculate dividend preview
    public function test_admin_can_calculate_dividend_preview(): void
    {
        $response = $this->actingAs($this->myAdmin)->postJson('/api/v1/dividends/calculate', [
            'period' => '2026',
            'total_pool' => 100000,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    // 2. Preview returns correct total_shares
    public function test_preview_returns_correct_total_shares(): void
    {
        $response = $this->actingAs($this->myAdmin)->postJson('/api/v1/dividends/calculate', [
            'period' => '2026',
            'total_pool' => 100000,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.total_shares', 50);
    }

    // 3. Preview calculates correct share percentages
    public function test_preview_calculates_correct_share_percentages(): void
    {
        $response = $this->actingAs($this->myAdmin)->postJson('/api/v1/dividends/calculate', [
            'period' => '2026',
            'total_pool' => 100000,
        ]);

        $response->assertStatus(200);
        $preview = collect($response->json('data.preview'));

        $member1Preview = $preview->firstWhere('member_id', $this->member1->id);
        $member2Preview = $preview->firstWhere('member_id', $this->member2->id);

        $this->assertEquals(20.0, $member1Preview['share_pct']);
        $this->assertEquals(80.0, $member2Preview['share_pct']);
    }

    // 4. Preview calculates correct dividend amounts (shares + savings - reserve)
    public function test_preview_calculates_correct_dividend_amounts(): void
    {
        // Pool: 100,000
        // Reserve 20% = 20,000
        // Distributable = 80,000
        // Share Pool (70%) = 56,000
        // Savings Pool (30%) = 24,000
        //
        // Member 1:
        // Shares: 10/50 = 20% of 56,000 = 11,200
        // Savings: 1,000/10,000 = 10% of 24,000 = 2,400
        // Total = 13,600
        //
        // Member 2:
        // Shares: 40/50 = 80% of 56,000 = 44,800
        // Savings: 9,000/10,000 = 90% of 24,000 = 21,600
        // Total = 66,400

        $response = $this->actingAs($this->myAdmin)->postJson('/api/v1/dividends/calculate', [
            'period' => '2026',
            'total_pool' => 100000,
            'reserve_percentage' => 20,
        ]);

        $response->assertStatus(200);
        
        // Check pools
        $response->assertJsonPath('data.reserve_amount', 20000)
                 ->assertJsonPath('data.distributable_pool', 80000)
                 ->assertJsonPath('data.share_pool', 56000)
                 ->assertJsonPath('data.savings_pool', 24000);

        $preview = collect($response->json('data.preview'));

        $member1Preview = $preview->firstWhere('member_id', $this->member1->id);
        $member2Preview = $preview->firstWhere('member_id', $this->member2->id);

        $this->assertEquals(11200.0, $member1Preview['share_dividend_amount']);
        $this->assertEquals(2400.0, $member1Preview['savings_interest_amount']);
        $this->assertEquals(13600.0, $member1Preview['amount']);

        $this->assertEquals(44800.0, $member2Preview['share_dividend_amount']);
        $this->assertEquals(21600.0, $member2Preview['savings_interest_amount']);
        $this->assertEquals(66400.0, $member2Preview['amount']);
    }

    // 5. Preview does NOT save dividend records
    public function test_preview_does_not_save_dividend_records(): void
    {
        $this->actingAs($this->myAdmin)->postJson('/api/v1/dividends/calculate', [
            'period' => '2026',
            'total_pool' => 100000,
            'reserve_percentage' => 20,
        ]);

        $this->assertDatabaseCount('dividends', 0);
    }

    // 6. Admin can distribute dividends
    public function test_admin_can_distribute_dividends(): void
    {
        $response = $this->actingAs($this->myAdmin)->postJson('/api/v1/dividends/distribute', [
            'period' => '2026',
            'total_pool' => 100000,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('success', true);
    }

    // 7. Distribution saves the correct records and creates SavingsTransactions
    public function test_distribution_saves_the_correct_records_and_transactions(): void
    {
        $this->actingAs($this->myAdmin)->postJson('/api/v1/dividends/distribute', [
            'period' => '2026',
            'total_pool' => 100000,
            'reserve_percentage' => 20,
        ]);

        $this->assertDatabaseHas('dividends', [
            'sacco_id' => $this->mySacco->id,
            'user_id' => $this->member1->id,
            'period' => '2026',
            'reserve_percentage' => 20,
            'amount' => 13600.00,
        ]);

        $this->assertDatabaseHas('dividends', [
            'sacco_id' => $this->mySacco->id,
            'user_id' => $this->member2->id,
            'period' => '2026',
            'amount' => 66400.00,
        ]);

        // Check SavingsTransactions
        $this->assertDatabaseHas('savings_transactions', [
            'member_id' => $this->member1->id,
            'type' => 'deposit',
            'amount' => 13600.00,
            'balance_after' => 14600.00,
        ]);
        
        $this->assertDatabaseHas('savings_transactions', [
            'member_id' => $this->member2->id,
            'type' => 'deposit',
            'amount' => 66400.00,
            'balance_after' => 75400.00,
        ]);

        // Check user table updated (Wait, user doesn't have savings_balance column. 
        // The balance is fetched dynamically via subqueries in controllers.
        // We can verify that the latest transaction for member 1 has balance_after 14600)
        $latestTx1 = \App\Models\SavingsTransaction::where('member_id', $this->member1->id)->latest('id')->first();
        $this->assertEquals(14600.00, $latestTx1->balance_after);
        
        $latestTx2 = \App\Models\SavingsTransaction::where('member_id', $this->member2->id)->latest('id')->first();
        $this->assertEquals(75400.00, $latestTx2->balance_after);
    }

    // 8. Distribution returns the correct count
    public function test_distribution_returns_the_correct_count(): void
    {
        $response = $this->actingAs($this->myAdmin)->postJson('/api/v1/dividends/distribute', [
            'period' => '2026',
            'total_pool' => 100000,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.count', 2);
    }

    // 9. Distribution is scoped to the admin's SACCO
    public function test_distribution_is_scoped_to_the_admins_sacco(): void
    {
        $this->actingAs($this->myAdmin)->postJson('/api/v1/dividends/distribute', [
            'period' => '2026',
            'total_pool' => 100000,
        ]);

        $this->assertDatabaseCount('dividends', 2);
        $this->assertEquals(
            2,
            Dividend::where('sacco_id', $this->mySacco->id)->count()
        );
    }

    // 10. Members from another SACCO are never included
    public function test_members_from_another_sacco_are_never_included(): void
    {
        $this->actingAs($this->myAdmin)->postJson('/api/v1/dividends/distribute', [
            'period' => '2026',
            'total_pool' => 100000,
        ]);

        $this->assertDatabaseMissing('dividends', [
            'user_id' => $this->otherMember->id,
        ]);
    }

    // 11. Member can view their own dividend history
    public function test_member_can_view_their_own_dividend_history(): void
    {
        Dividend::create([
            'sacco_id' => $this->mySacco->id,
            'user_id' => $this->member1->id,
            'period' => '2026',
            'num_shares' => 10,
            'share_pct' => 20.0,
            'amount' => 20000.0,
            'total_pool' => 100000.0,
        ]);

        $response = $this->actingAs($this->member1)->getJson('/api/v1/me/dividends');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.member_id', $this->member1->id)
            ->assertJsonPath('data.0.amount', 20000);
    }

    // 12. Member cannot access admin calculate endpoint
    public function test_member_cannot_access_admin_calculate_endpoint(): void
    {
        $response = $this->actingAs($this->member1)->postJson('/api/v1/dividends/calculate', [
            'period' => '2026',
            'total_pool' => 100000,
        ]);

        $response->assertStatus(403);
    }

    // 13. Member cannot access admin distribute endpoint
    public function test_member_cannot_access_admin_distribute_endpoint(): void
    {
        $response = $this->actingAs($this->member1)->postJson('/api/v1/dividends/distribute', [
            'period' => '2026',
            'total_pool' => 100000,
        ]);

        $response->assertStatus(403);
    }

    // 14. A member cannot access another member's dividend history
    public function test_a_member_cannot_access_another_members_dividend_history(): void
    {
        Dividend::create([
            'sacco_id' => $this->mySacco->id,
            'user_id' => $this->member2->id,
            'period' => '2026',
            'num_shares' => 40,
            'share_pct' => 80.0,
            'amount' => 80000.0,
            'total_pool' => 100000.0,
        ]);

        $response = $this->actingAs($this->member1)->getJson('/api/v1/me/dividends');

        $response->assertStatus(200)
            ->assertJsonCount(0, 'data');
    }

    // 15. Missing period fails validation
    public function test_missing_period_fails_validation(): void
    {
        $response = $this->actingAs($this->myAdmin)->postJson('/api/v1/dividends/calculate', [
            'total_pool' => 100000,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('period');
    }

    // 16. Missing total_pool fails validation
    public function test_missing_total_pool_fails_validation(): void
    {
        $response = $this->actingAs($this->myAdmin)->postJson('/api/v1/dividends/calculate', [
            'period' => '2026',
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('total_pool');
    }

    // 17. total_pool <= 0 fails validation
    public function test_total_pool_less_than_or_equal_to_zero_fails_validation(): void
    {
        $responseZero = $this->actingAs($this->myAdmin)->postJson('/api/v1/dividends/calculate', [
            'period' => '2026',
            'total_pool' => 0,
        ]);
        $responseZero->assertStatus(422)->assertJsonValidationErrors('total_pool');

        $responseNeg = $this->actingAs($this->myAdmin)->postJson('/api/v1/dividends/calculate', [
            'period' => '2026',
            'total_pool' => -500,
        ]);
        $responseNeg->assertStatus(422)->assertJsonValidationErrors('total_pool');
    }

    // 18. Zero total shares is handled correctly
    public function test_zero_total_shares_is_handled_correctly(): void
    {
        $emptySacco = Sacco::create([
            'name' => 'Empty SACCO',
            'registration_number' => 'REG-EMPTY',
            'status' => 'approved',
        ]);
        $emptyAdmin = User::factory()->create([
            'role' => 'admin',
            'sacco_id' => $emptySacco->id,
        ]);
        User::factory()->create([
            'role' => 'member',
            'sacco_id' => $emptySacco->id,
            'num_shares' => 0,
        ]);

        $response = $this->actingAs($emptyAdmin)->postJson('/api/v1/dividends/calculate', [
            'period' => '2026',
            'total_pool' => 100000,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.total_shares', 0)
            ->assertJsonPath('data.preview.0.share_pct', 0)
            ->assertJsonPath('data.preview.0.amount', 0);
    }

    // 19. Duplicate distribution for the same period is handled according to chosen rule
    public function test_duplicate_distribution_for_same_period_is_rejected(): void
    {
        $this->actingAs($this->myAdmin)->postJson('/api/v1/dividends/distribute', [
            'period' => '2026',
            'total_pool' => 100000,
        ])->assertStatus(200);

        $responseSecond = $this->actingAs($this->myAdmin)->postJson('/api/v1/dividends/distribute', [
            'period' => '2026',
            'total_pool' => 100000,
        ]);

        $responseSecond->assertStatus(422)
            ->assertJsonPath('success', false);
    }
}
