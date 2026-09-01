<?php

namespace Tests\Feature;

use App\Models\Sacco;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MemberSharesTest extends TestCase
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

        $this->mySacco = Sacco::create([
            'name' => 'My SACCO',
            'registration_number' => 'REG-MINE',
            'status' => 'approved',
        ]);
        $this->myAdmin = User::factory()->create(['role' => 'admin', 'sacco_id' => $this->mySacco->id]);
        $this->myMember = User::factory()->create(['role' => 'member', 'sacco_id' => $this->mySacco->id, 'num_shares' => 5]);

        $this->otherSacco = Sacco::create([
            'name' => 'Other SACCO',
            'registration_number' => 'REG-OTHER',
            'status' => 'approved',
        ]);
        $this->otherAdmin = User::factory()->create(['role' => 'admin', 'sacco_id' => $this->otherSacco->id]);
        $this->otherMember = User::factory()->create(['role' => 'member', 'sacco_id' => $this->otherSacco->id, 'num_shares' => 10]);
    }

    // ─── PATCH /api/members/{id}/shares ───────────────────────────────

    public function test_admin_can_update_a_members_shares(): void
    {
        $response = $this->actingAs($this->myAdmin)->patchJson("/api/members/{$this->myMember->id}/shares", [
            'num_shares' => 25,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.num_shares', 25);

        $this->assertDatabaseHas('users', [
            'id' => $this->myMember->id,
            'num_shares' => 25,
        ]);
    }

    public function test_num_shares_accepts_zero(): void
    {
        $response = $this->actingAs($this->myAdmin)->patchJson("/api/members/{$this->myMember->id}/shares", [
            'num_shares' => 0,
        ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.num_shares', 0);

        $this->assertDatabaseHas('users', [
            'id' => $this->myMember->id,
            'num_shares' => 0,
        ]);
    }

    public function test_negative_num_shares_are_rejected(): void
    {
        $response = $this->actingAs($this->myAdmin)->patchJson("/api/members/{$this->myMember->id}/shares", [
            'num_shares' => -5,
        ]);

        $response->assertStatus(422)->assertJsonValidationErrors('num_shares');
    }

    public function test_non_integer_num_shares_are_rejected(): void
    {
        $responseFloat = $this->actingAs($this->myAdmin)->patchJson("/api/members/{$this->myMember->id}/shares", [
            'num_shares' => 10.5,
        ]);
        $responseFloat->assertStatus(422)->assertJsonValidationErrors('num_shares');

        $responseString = $this->actingAs($this->myAdmin)->patchJson("/api/members/{$this->myMember->id}/shares", [
            'num_shares' => 'not_an_int',
        ]);
        $responseString->assertStatus(422)->assertJsonValidationErrors('num_shares');
    }

    public function test_unauthenticated_users_are_rejected(): void
    {
        $response = $this->patchJson("/api/members/{$this->myMember->id}/shares", [
            'num_shares' => 10,
        ]);

        $response->assertStatus(401);
    }

    public function test_non_admin_users_are_rejected(): void
    {
        $response = $this->actingAs($this->myMember)->patchJson("/api/members/{$this->myMember->id}/shares", [
            'num_shares' => 10,
        ]);

        $response->assertStatus(403);
    }

    public function test_admin_cannot_update_a_member_belonging_to_another_sacco(): void
    {
        $response = $this->actingAs($this->myAdmin)->patchJson("/api/members/{$this->otherMember->id}/shares", [
            'num_shares' => 50,
        ]);

        $response->assertStatus(403);

        $this->assertDatabaseHas('users', [
            'id' => $this->otherMember->id,
            'num_shares' => 10, // Unchanged
        ]);
    }
}
