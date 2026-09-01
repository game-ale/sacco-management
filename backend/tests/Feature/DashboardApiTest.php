<?php

namespace Tests\Feature;

use App\Models\Sacco;
use App\Models\SavingsTransaction;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class DashboardApiTest extends TestCase
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
            'num_shares' => 10,
        ]);
    }

    public function test_admin_can_view_dashboard_metrics()
    {
        $this->actingAs($this->admin);

        SavingsTransaction::factory()->create([
            'member_id' => $this->member->id,
            'type' => 'deposit',
            'amount' => 500,
        ]);

        $response = $this->getJson('/api/v1/dashboard/metrics');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'total_members' => ['value', 'change'],
                    'total_savings' => ['value', 'change'],
                    'active_loans' => ['count', 'outstanding'],
                    'overdue_repayments' => ['count', 'amount'],
                    'share_capital' => ['shares', 'value']
                ]
            ]);
    }

    public function test_admin_can_view_dashboard_charts()
    {
        $this->actingAs($this->admin);

        $response = $this->getJson('/api/v1/dashboard/charts');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data' => [
                    'trend',
                    'loan_distribution'
                ]
            ]);
    }

    public function test_admin_can_view_dashboard_activity()
    {
        $this->actingAs($this->admin);

        $response = $this->getJson('/api/v1/dashboard/activity');

        $response->assertStatus(200)
            ->assertJsonStructure([
                'success',
                'data'
            ]);
    }
}
