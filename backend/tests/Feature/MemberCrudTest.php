<?php

namespace Tests\Feature;

use App\Models\Sacco;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MemberCrudTest extends TestCase
{
    use RefreshDatabase;

    private User $myAdmin;

    private User $myMember;

    private Sacco $mySacco;

    private User $otherAdmin;

    private User $otherMember;

    private Sacco $otherSacco;

    protected function setUp(): void
    {
        parent::setUp();

        // My SACCO
        $this->mySacco = Sacco::create([
            'name' => 'My SACCO',
            'registration_number' => 'REG-MINE',
            'status' => 'approved',
        ]);
        $this->myAdmin = User::factory()->create(['role' => 'admin', 'sacco_id' => $this->mySacco->id]);
        $this->myMember = User::factory()->create(['role' => 'member', 'sacco_id' => $this->mySacco->id]);

        // Other SACCO
        $this->otherSacco = Sacco::create([
            'name' => 'Other SACCO',
            'registration_number' => 'REG-OTHER',
            'status' => 'approved',
        ]);
        $this->otherAdmin = User::factory()->create(['role' => 'admin', 'sacco_id' => $this->otherSacco->id]);
        $this->otherMember = User::factory()->create(['role' => 'member', 'sacco_id' => $this->otherSacco->id]);
    }

    // ─── Authorization ───────────────────────────────────────────────

    public function test_unauthenticated_cannot_access_members(): void
    {
        $response = $this->getJson('/api/v1/members');
        $response->assertStatus(401);
    }

    public function test_regular_member_cannot_access_members_api(): void
    {
        $response = $this->actingAs($this->myMember)->getJson('/api/v1/members');
        $response->assertStatus(403);
    }

    // ─── List Members (Index) ────────────────────────────────────────

    public function test_admin_can_only_list_members_in_their_sacco(): void
    {
        $response = $this->actingAs($this->myAdmin)->getJson('/api/v1/members');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $this->myMember->id);
    }

    // ─── Create Member (Store) ───────────────────────────────────────

    public function test_admin_can_create_a_member(): void
    {
        $payload = [
            'name' => 'New Guy',
            'email' => 'newguy@example.com',
            'username' => 'newguy',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $response = $this->actingAs($this->myAdmin)->postJson('/api/v1/members', $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.name', 'New Guy');

        $this->assertDatabaseHas('users', [
            'email' => 'newguy@example.com',
            'role' => 'member',
            'sacco_id' => $this->mySacco->id, // Automatically isolated to admin's sacco
        ]);
    }

    public function test_store_validates_unique_email(): void
    {
        $payload = [
            'name' => 'New Guy',
            'email' => $this->otherMember->email, // Already exists!
            'username' => 'newguy123',
            'password' => 'password123',
            'password_confirmation' => 'password123',
        ];

        $response = $this->actingAs($this->myAdmin)->postJson('/api/v1/members', $payload);
        $response->assertStatus(422)->assertJsonValidationErrors('email');
    }

    // ─── Show Member ─────────────────────────────────────────────────

    public function test_admin_can_view_own_member(): void
    {
        $response = $this->actingAs($this->myAdmin)->getJson("/api/v1/members/{$this->myMember->id}");
        $response->assertStatus(200)->assertJsonPath('data.id', $this->myMember->id);
    }

    public function test_admin_cannot_view_member_of_other_sacco(): void
    {
        $response = $this->actingAs($this->myAdmin)->getJson("/api/v1/members/{$this->otherMember->id}");
        $response->assertStatus(403);
    }

    // ─── Update Member ───────────────────────────────────────────────

    public function test_admin_can_update_own_member(): void
    {
        $response = $this->actingAs($this->myAdmin)->putJson("/api/v1/members/{$this->myMember->id}", [
            'name' => 'Updated Name'
        ]);

        $response->assertStatus(200)->assertJsonPath('data.name', 'Updated Name');
        $this->assertDatabaseHas('users', ['id' => $this->myMember->id, 'name' => 'Updated Name']);
    }

    public function test_admin_cannot_update_member_of_other_sacco(): void
    {
        $response = $this->actingAs($this->myAdmin)->putJson("/api/v1/members/{$this->otherMember->id}", [
            'name' => 'Hacked Name'
        ]);

        $response->assertStatus(403);
        $this->assertDatabaseMissing('users', ['id' => $this->otherMember->id, 'name' => 'Hacked Name']);
    }

    // ─── Delete Member ───────────────────────────────────────────────

    public function test_admin_can_delete_own_member(): void
    {
        $response = $this->actingAs($this->myAdmin)->deleteJson("/api/v1/members/{$this->myMember->id}");

        $response->assertStatus(200);
        $this->assertDatabaseMissing('users', ['id' => $this->myMember->id]);
    }

    public function test_admin_cannot_delete_member_of_other_sacco(): void
    {
        $response = $this->actingAs($this->myAdmin)->deleteJson("/api/v1/members/{$this->otherMember->id}");

        $response->assertStatus(403);
        $this->assertDatabaseHas('users', ['id' => $this->otherMember->id]);
    }
}
