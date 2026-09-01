<?php

namespace Tests\Feature;

use App\Models\Sacco;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SaccoSettingsTest extends TestCase
{
    use RefreshDatabase;

    private User $myAdmin;

    private User $myMember;

    private Sacco $mySacco;

    private User $otherAdmin;

    private Sacco $otherSacco;

    protected function setUp(): void
    {
        parent::setUp();

        $this->mySacco = Sacco::create([
            'name' => 'My SACCO',
            'registration_number' => 'REG-MINE',
            'status' => 'approved',
            'share_value' => 100.00,
            'currency' => 'KES',
        ]);
        $this->myAdmin = User::factory()->create(['role' => 'admin', 'sacco_id' => $this->mySacco->id]);
        $this->myMember = User::factory()->create(['role' => 'member', 'sacco_id' => $this->mySacco->id]);

        $this->otherSacco = Sacco::create([
            'name' => 'Other SACCO',
            'registration_number' => 'REG-OTHER',
            'status' => 'approved',
            'share_value' => 500.00,
            'currency' => 'USD',
        ]);
        $this->otherAdmin = User::factory()->create(['role' => 'admin', 'sacco_id' => $this->otherSacco->id]);
    }

    // ─── GET /api/settings ──────────────────────────────────────────────

    public function test_authenticated_sacco_admin_can_retrieve_settings(): void
    {
        $response = $this->actingAs($this->myAdmin)->getJson('/api/settings');

        $response->assertStatus(200)
            ->assertJson([
                'success' => true,
                'data' => [
                    'share_value' => 100,
                    'currency' => 'KES',
                ],
            ]);
    }

    public function test_unauthenticated_users_cannot_retrieve_settings(): void
    {
        $response = $this->getJson('/api/settings');
        $response->assertStatus(401);
    }

    public function test_non_admin_users_cannot_retrieve_settings(): void
    {
        $response = $this->actingAs($this->myMember)->getJson('/api/settings');
        $response->assertStatus(403);
    }

    public function test_settings_from_another_sacco_cannot_be_accessed(): void
    {
        $responseMy = $this->actingAs($this->myAdmin)->getJson('/api/settings');
        $responseMy->assertStatus(200)->assertJsonPath('data.share_value', 100);

        $responseOther = $this->actingAs($this->otherAdmin)->getJson('/api/settings');
        $responseOther->assertStatus(200)->assertJsonPath('data.share_value', 500);
    }

    // ─── PUT /api/settings ──────────────────────────────────────────────

    public function test_admin_can_update_share_value(): void
    {
        $response = $this->actingAs($this->myAdmin)->putJson('/api/settings', [
            'share_value' => 250,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.share_value', 250);

        $this->assertDatabaseHas('saccos', [
            'id' => $this->mySacco->id,
            'share_value' => 250.00,
        ]);
    }

    public function test_share_value_must_be_greater_than_zero(): void
    {
        $responseZero = $this->actingAs($this->myAdmin)->putJson('/api/settings', [
            'share_value' => 0,
        ]);
        $responseZero->assertStatus(422)->assertJsonValidationErrors('share_value');

        $responseNegative = $this->actingAs($this->myAdmin)->putJson('/api/settings', [
            'share_value' => -50,
        ]);
        $responseNegative->assertStatus(422)->assertJsonValidationErrors('share_value');
    }

    public function test_invalid_share_value_returns_validation_errors(): void
    {
        $response = $this->actingAs($this->myAdmin)->putJson('/api/settings', [
            'share_value' => 'invalid_number',
        ]);
        $response->assertStatus(422)->assertJsonValidationErrors('share_value');
    }

    public function test_admin_can_only_update_their_own_sacco_settings(): void
    {
        $this->actingAs($this->myAdmin)->putJson('/api/settings', [
            'share_value' => 300,
        ]);

        $this->assertDatabaseHas('saccos', [
            'id' => $this->mySacco->id,
            'share_value' => 300.00,
        ]);

        $this->assertDatabaseHas('saccos', [
            'id' => $this->otherSacco->id,
            'share_value' => 500.00,
        ]);
    }

    public function test_non_admin_users_cannot_update_settings(): void
    {
        $response = $this->actingAs($this->myMember)->putJson('/api/settings', [
            'share_value' => 200,
        ]);
        $response->assertStatus(403);
    }
}
