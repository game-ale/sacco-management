<?php

namespace Tests\Feature;

use App\Models\Sacco;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
use Tests\TestCase;

class DashboardTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_view_dashboard_statistics(): void
    {
        $sacco = Sacco::create([
            'name' => 'Test SACCO',
            'registration_number' => 'TEST-001',
            'status' => 'approved',
        ]);

        $admin = User::factory()->create([
            'role' => 'admin',
            'sacco_id' => $sacco->id,
        ]);

        User::factory()->count(3)->create([
            'role' => 'member',
            'sacco_id' => $sacco->id,
        ]);

        Sanctum::actingAs($admin);

        $response = $this->getJson('/api/v1/dashboard');

        $response
            ->assertOk()
            ->assertJsonPath('data.total_members', 3);
    }

    public function test_admin_can_only_see_members_from_their_sacco(): void
    {
        $saccoA = Sacco::create([
            'name' => 'SACCO A',
            'registration_number' => 'SACCO-A',
            'status' => 'approved',
        ]);

        $saccoB = Sacco::create([
            'name' => 'SACCO B',
            'registration_number' => 'SACCO-B',
            'status' => 'approved',
        ]);

        $adminA = User::factory()->create([
            'role' => 'admin',
            'sacco_id' => $saccoA->id,
        ]);

        User::factory()->count(2)->create([
            'role' => 'member',
            'sacco_id' => $saccoA->id,
        ]);

        User::factory()->count(3)->create([
            'role' => 'member',
            'sacco_id' => $saccoB->id,
        ]);

        Sanctum::actingAs($adminA);

        $response = $this->getJson('/api/v1/dashboard');

        $response
            ->assertOk()
            ->assertJsonPath('data.total_members', 2);
    }
}
