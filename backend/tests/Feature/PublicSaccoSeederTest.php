<?php

namespace Tests\Feature;

use App\Models\Sacco;
use Database\Seeders\PublicSaccoSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicSaccoSeederTest extends TestCase
{
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->seed(PublicSaccoSeeder::class);
    }

    public function test_seeder_populates_all_six_saccos_correctly(): void
    {
        $this->assertDatabaseCount('saccos', 6);

        // Check Record 1: Teachers SACCO (Public + Accepting)
        $this->assertDatabaseHas('saccos', [
            'registration_number' => 'REG-PUB-TEACH-001',
            'status' => 'approved',
            'is_public' => true,
            'is_directory_allowed' => true,
            'is_accepting_members' => true,
            'show_share_info' => true,
            'category' => 'Teachers',
            'location' => 'Addis Ababa',
        ]);

        // Check Record 2: Farmers Union (Public + Not Accepting)
        $this->assertDatabaseHas('saccos', [
            'registration_number' => 'REG-PUB-FARM-002',
            'status' => 'approved',
            'is_public' => true,
            'is_directory_allowed' => true,
            'is_accepting_members' => false,
            'show_share_info' => true,
            'category' => 'Farmers',
            'location' => 'Adama',
        ]);

        // Check Record 3: Transport SACCO (Share Info Hidden)
        $this->assertDatabaseHas('saccos', [
            'registration_number' => 'REG-PUB-TRANS-003',
            'status' => 'approved',
            'is_public' => true,
            'is_directory_allowed' => true,
            'is_accepting_members' => true,
            'show_share_info' => false,
            'category' => 'Transport',
            'location' => 'Bishoftu',
        ]);

        // Check Record 4: Federal Employees (Directory Disabled)
        $this->assertDatabaseHas('saccos', [
            'registration_number' => 'REG-RESTRICT-004',
            'status' => 'approved',
            'is_public' => true,
            'is_directory_allowed' => false,
        ]);

        // Check Record 5: Hawassa (Pending Approval)
        $this->assertDatabaseHas('saccos', [
            'registration_number' => 'REG-PEND-COMM-005',
            'status' => 'pending',
            'is_public' => true,
            'is_directory_allowed' => true,
        ]);

        // Check Record 6: Jimma Coffee Farmers
        $this->assertDatabaseHas('saccos', [
            'registration_number' => 'REG-PUB-COFFEE-006',
            'status' => 'approved',
            'is_public' => true,
            'is_directory_allowed' => true,
            'category' => 'Farmers',
            'location' => 'Jimma',
        ]);
    }

    public function test_only_approved_public_directory_allowed_saccos_appear_in_public_index(): void
    {
        $response = $this->getJson('/api/v1/public/saccos');

        $response->assertStatus(200)
            ->assertJsonCount(4, 'data');

        $regNumbers = collect($response->json('data'))->pluck('name')->toArray();

        $this->assertContains('Addis Teachers Credit & Savings SACCO', $regNumbers);
        $this->assertContains('Oromia Farmers Union SACCO', $regNumbers);
        $this->assertContains('Bishoftu Transport Operators SACCO', $regNumbers);
        $this->assertContains('Jimma Kaffa Coffee Producers SACCO', $regNumbers);

        $this->assertNotContains('Federal Civil Servants SACCO', $regNumbers);
        $this->assertNotContains('Hawassa Lakeside Micro SACCO', $regNumbers);
    }

    public function test_public_sacco_directory_filtering(): void
    {
        // Search by name
        $resSearch = $this->getJson('/api/v1/public/saccos?search=Teachers');
        $resSearch->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Addis Teachers Credit & Savings SACCO');

        // Location filter
        $resLoc = $this->getJson('/api/v1/public/saccos?location=Bishoftu');
        $resLoc->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.name', 'Bishoftu Transport Operators SACCO');

        // Category filter
        $resCat = $this->getJson('/api/v1/public/saccos?category=Farmers');
        $resCat->assertStatus(200)
            ->assertJsonCount(2, 'data');
    }

    public function test_accepting_members_toggle_and_share_info_hidden(): void
    {
        $farmersSacco = Sacco::where('registration_number', 'REG-PUB-FARM-002')->firstOrFail();
        $transportSacco = Sacco::where('registration_number', 'REG-PUB-TRANS-003')->firstOrFail();

        // Check accepting members is false for Farmers Union
        $resFarmers = $this->getJson("/api/v1/public/saccos/{$farmersSacco->id}");
        $resFarmers->assertStatus(200)
            ->assertJsonPath('data.is_accepting_members', false);

        // Check share info is hidden for Transport SACCO
        $resTransport = $this->getJson("/api/v1/public/saccos/{$transportSacco->id}");
        $resTransport->assertStatus(200)
            ->assertJsonPath('data.show_share_info', false)
            ->assertJsonPath('data.share_value', null)
            ->assertJsonPath('data.min_shares', null)
            ->assertJsonPath('data.min_share_purchase_amount', null);
    }

    public function test_restricted_and_pending_saccos_return_404_on_public_show(): void
    {
        $restrictedSacco = Sacco::where('registration_number', 'REG-RESTRICT-004')->firstOrFail();
        $pendingSacco = Sacco::where('registration_number', 'REG-PEND-COMM-005')->firstOrFail();

        $this->getJson("/api/v1/public/saccos/{$restrictedSacco->id}")->assertStatus(404);
        $this->getJson("/api/v1/public/saccos/{$pendingSacco->id}")->assertStatus(404);
    }
}
