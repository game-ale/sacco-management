<?php

namespace Tests\Feature;

use App\Models\Sacco;
use App\Models\User;
use App\Notifications\SaccoApplicationStatusNotification;
use App\Notifications\SaccoRegistrationSubmittedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Notification;
use Tests\TestCase;

class AdminSaccoTest extends TestCase
{
    use RefreshDatabase;

    private User $superadmin;

    private User $regularUser;

    private Sacco $pendingSacco;

    private Sacco $approvedSacco;

    protected function setUp(): void
    {
        parent::setUp();

        $this->superadmin = User::factory()->create([
            'role' => 'superadmin',
            'sacco_id' => null,
        ]);

        $this->approvedSacco = Sacco::create([
            'name' => 'Approved SACCO',
            'registration_number' => 'REG-APPROVED',
            'status' => 'approved',
        ]);

        $this->regularUser = User::factory()->create([
            'role' => 'member',
            'sacco_id' => $this->approvedSacco->id,
        ]);

        $this->pendingSacco = Sacco::create([
            'name' => 'Pending SACCO',
            'registration_number' => 'REG-PENDING',
            'status' => 'pending',
        ]);
    }

    // ─── Authorization Tests ─────────────────────────────────────────

    public function test_unauthenticated_user_cannot_list_saccos(): void
    {
        $response = $this->getJson('/api/v1/admin/saccos');

        $response->assertStatus(401);
    }

    public function test_non_superadmin_cannot_list_saccos(): void
    {
        $response = $this->actingAs($this->regularUser)
            ->getJson('/api/v1/admin/saccos');

        $response->assertStatus(403);
    }

    // ─── List SACCOs & Search ─────────────────────────────────────────

    public function test_superadmin_can_list_all_saccos(): void
    {
        $response = $this->actingAs($this->superadmin)
            ->getJson('/api/v1/admin/saccos');

        $response->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_superadmin_can_filter_saccos_by_status(): void
    {
        $response = $this->actingAs($this->superadmin)
            ->getJson('/api/v1/admin/saccos?status=pending');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.status', 'pending');
    }

    public function test_superadmin_can_search_saccos(): void
    {
        $response = $this->actingAs($this->superadmin)
            ->getJson('/api/v1/admin/saccos?search=REG-PENDING');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Pending SACCO');
    }

    // ─── Export SACCOs ───────────────────────────────────────────────

    public function test_superadmin_can_export_saccos_csv(): void
    {
        $response = $this->actingAs($this->superadmin)
            ->get('/api/v1/admin/saccos/export?status=pending');

        $response->assertStatus(200);
        $response->assertHeader('content-type', 'text/csv; charset=UTF-8');
        $this->assertStringContainsString('Pending SACCO', $response->streamedContent());
    }

    // ─── Dashboard Stats ─────────────────────────────────────────────

    public function test_superadmin_can_get_dashboard_stats(): void
    {
        $response = $this->actingAs($this->superadmin)
            ->getJson('/api/v1/admin/dashboard/stats');

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.total_saccos', 2)
            ->assertJsonPath('data.approved_saccos', 1)
            ->assertJsonPath('data.pending_saccos', 1)
            ->assertJsonPath('data.total_members', 1);
    }

    // ─── Show SACCO & Extended Details ───────────────────────────────

    public function test_superadmin_can_view_single_sacco(): void
    {
        $response = $this->actingAs($this->superadmin)
            ->getJson("/api/v1/admin/saccos/{$this->pendingSacco->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Pending SACCO')
            ->assertJsonPath('data.registration_number', 'REG-PENDING');
    }

    public function test_superadmin_can_get_extended_sacco_details(): void
    {
        $response = $this->actingAs($this->superadmin)
            ->getJson("/api/v1/admin/saccos/{$this->approvedSacco->id}/details");

        $response->assertStatus(200)
            ->assertJsonPath('success', true)
            ->assertJsonPath('data.sacco.name', 'Approved SACCO');
    }

    // ─── Approve SACCO ───────────────────────────────────────────────

    public function test_superadmin_can_approve_pending_sacco(): void
    {
        $response = $this->actingAs($this->superadmin)
            ->patchJson("/api/v1/admin/saccos/{$this->pendingSacco->id}/approve");

        $response->assertStatus(200)
            ->assertJsonPath('message', 'SACCO has been approved successfully.');

        $this->assertDatabaseHas('saccos', [
            'id' => $this->pendingSacco->id,
            'status' => 'approved',
        ]);
    }

    public function test_cannot_approve_already_approved_sacco(): void
    {
        $response = $this->actingAs($this->superadmin)
            ->patchJson("/api/v1/admin/saccos/{$this->approvedSacco->id}/approve");

        $response->assertStatus(422);
    }

    // ─── Reject SACCO ────────────────────────────────────────────────

    public function test_superadmin_can_reject_pending_sacco(): void
    {
        $response = $this->actingAs($this->superadmin)
            ->patchJson("/api/v1/admin/saccos/{$this->pendingSacco->id}/reject", [
                'rejection_reason' => 'Incomplete documentation provided.',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('message', 'SACCO has been rejected.');

        $this->assertDatabaseHas('saccos', [
            'id' => $this->pendingSacco->id,
            'status' => 'rejected',
            'rejection_reason' => 'Incomplete documentation provided.',
        ]);
    }

    public function test_cannot_reject_already_approved_sacco(): void
    {
        $response = $this->actingAs($this->superadmin)
            ->patchJson("/api/v1/admin/saccos/{$this->approvedSacco->id}/reject");

        $response->assertStatus(422);
    }

    // ─── Notification Tests ───────────────────────────────────────────

    public function test_superadmin_receives_notification_when_sacco_registration_submitted(): void
    {
        Notification::fake();

        $superadmin = User::factory()->create([
            'role' => 'superadmin',
            'sacco_id' => null,
        ]);

        $response = $this->postJson('/api/v1/saccos/register', [
            'sacco_name' => 'Northern Growth SACCO',
            'registration_number' => 'NG-2026-001',
            'admin_name' => 'Jane Admin',
            'admin_email' => 'jane.admin@example.com',
            'admin_username' => 'janeadmin',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
            'national_id' => '123456789',
            'region' => 'Nairobi',
            'zone' => 'Zone 1',
            'town' => 'Nairobi',
        ]);

        $response->assertStatus(201);

        Notification::assertSentTo(
            $superadmin,
            SaccoRegistrationSubmittedNotification::class,
            function ($notification) {
                return $notification->sacco->name === 'Northern Growth SACCO';
            }
        );
    }

    public function test_sacco_admin_receives_status_notification_on_approval(): void
    {
        Notification::fake();

        $admin = User::factory()->create([
            'role' => 'admin',
            'sacco_id' => $this->pendingSacco->id,
        ]);

        $response = $this->actingAs($this->superadmin)
            ->patchJson("/api/v1/admin/saccos/{$this->pendingSacco->id}/approve");

        $response->assertStatus(200);

        Notification::assertSentTo(
            $admin,
            SaccoApplicationStatusNotification::class,
            function ($notification) {
                return $notification->status === 'approved'
                    && $notification->sacco->id === $this->pendingSacco->id;
            }
        );
    }
}
