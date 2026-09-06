<?php

namespace Tests\Feature;

use App\Models\Sacco;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicSaccoDirectoryTest extends TestCase
{
    use RefreshDatabase;

    private Sacco $publicSacco;

    private Sacco $privateSacco;

    private Sacco $disallowedSacco;

    private User $superAdmin;

    private User $saccoAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->publicSacco = Sacco::create([
            'name' => 'Addis Teachers SACCO',
            'registration_number' => 'REG-101',
            'status' => 'approved',
            'is_public' => true,
            'is_accepting_members' => true,
            'show_share_info' => true,
            'is_directory_allowed' => true,
            'description' => 'A public SACCO for educators.',
            'location' => 'Addis Ababa',
            'category' => 'Education',
            'eligibility_criteria' => 'Open to all teachers',
            'contact_email' => 'contact@addisteachers.org',
            'contact_phone' => '+251911000111',
            'share_value' => 500.00,
            'min_shares' => 2,
        ]);

        $this->privateSacco = Sacco::create([
            'name' => 'Private Employees SACCO',
            'registration_number' => 'REG-102',
            'status' => 'approved',
            'is_public' => false,
            'is_directory_allowed' => true,
        ]);

        $this->disallowedSacco = Sacco::create([
            'name' => 'Restricted SACCO',
            'registration_number' => 'REG-103',
            'status' => 'approved',
            'is_public' => true,
            'is_directory_allowed' => false,
        ]);

        $this->superAdmin = User::factory()->create([
            'role' => 'superadmin',
            'sacco_id' => null,
        ]);

        $this->saccoAdmin = User::factory()->create([
            'role' => 'admin',
            'sacco_id' => $this->publicSacco->id,
        ]);
    }

    public function test_can_list_publicly_visible_saccos_only(): void
    {
        $response = $this->getJson('/api/v1/public/saccos');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Addis Teachers SACCO');
    }

    public function test_can_filter_public_saccos_by_search_location_and_category(): void
    {
        $response = $this->getJson('/api/v1/public/saccos?search=Addis&location=Addis&category=Education');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Addis Teachers SACCO');

        $emptyResponse = $this->getJson('/api/v1/public/saccos?search=NonExistent');
        $emptyResponse->assertStatus(200)->assertJsonCount(0, 'data');
    }

    public function test_can_view_single_public_sacco_profile(): void
    {
        $response = $this->getJson("/api/v1/public/saccos/{$this->publicSacco->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.name', 'Addis Teachers SACCO')
            ->assertJsonPath('data.show_share_info', true)
            ->assertJsonPath('data.share_value', 500)
            ->assertJsonPath('data.min_shares', 2)
            ->assertJsonPath('data.min_share_purchase_amount', 1000);
    }

    public function test_cannot_view_private_or_disallowed_sacco_profile(): void
    {
        $response1 = $this->getJson("/api/v1/public/saccos/{$this->privateSacco->id}");
        $response1->assertStatus(404);

        $response2 = $this->getJson("/api/v1/public/saccos/{$this->disallowedSacco->id}");
        $response2->assertStatus(404);
    }

    public function test_share_info_hidden_when_show_share_info_is_false(): void
    {
        $this->publicSacco->update(['show_share_info' => false]);

        $response = $this->getJson("/api/v1/public/saccos/{$this->publicSacco->id}");

        $response->assertStatus(200)
            ->assertJsonPath('data.show_share_info', false)
            ->assertJsonPath('data.share_value', null)
            ->assertJsonPath('data.min_share_purchase_amount', null);
    }

    public function test_superadmin_can_toggle_directory_allowance(): void
    {
        $response = $this->actingAs($this->superAdmin)
            ->patchJson("/api/v1/admin/saccos/{$this->publicSacco->id}/directory-allowance", [
                'is_directory_allowed' => false,
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.is_directory_allowed', false);

        $this->assertDatabaseHas('saccos', [
            'id' => $this->publicSacco->id,
            'is_directory_allowed' => false,
        ]);
    }

    public function test_non_superadmin_cannot_toggle_directory_allowance(): void
    {
        $response = $this->actingAs($this->saccoAdmin)
            ->patchJson("/api/v1/admin/saccos/{$this->publicSacco->id}/directory-allowance", [
                'is_directory_allowed' => false,
            ]);

        $response->assertStatus(403);
    }
}
