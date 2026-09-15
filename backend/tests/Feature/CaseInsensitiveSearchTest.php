<?php

namespace Tests\Feature;

use App\Models\Loan;
use App\Models\MembershipRequest;
use App\Models\Sacco;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CaseInsensitiveSearchTest extends TestCase
{
    use RefreshDatabase;

    private Sacco $sacco;
    private User $admin;
    private User $member;
    private User $superAdmin;

    protected function setUp(): void
    {
        parent::setUp();

        $this->sacco = Sacco::create([
            'name' => 'Awash Cooperative SACCO',
            'registration_number' => 'REG-AWASH-999',
            'status' => 'approved',
            'region' => 'Oromia',
            'is_public' => true,
            'is_directory_allowed' => true,
        ]);

        $this->admin = User::factory()->create([
            'name' => 'Admin User',
            'role' => 'admin',
            'sacco_id' => $this->sacco->id,
        ]);

        $this->member = User::factory()->create([
            'name' => 'Johnathan Smith',
            'email' => 'John.Smith@Example.com',
            'username' => 'JohnSmith',
            'role' => 'member',
            'sacco_id' => $this->sacco->id,
            'is_active' => true,
        ]);

        $this->superAdmin = User::factory()->create([
            'name' => 'Platform Superadmin',
            'role' => 'superadmin',
            'sacco_id' => null,
        ]);
    }

    public function test_global_search_is_case_insensitive_for_members_and_loans(): void
    {
        $loan = Loan::create([
            'sacco_id' => $this->sacco->id,
            'member_id' => $this->member->id,
            'loan_number' => 'LN-AWASH-001',
            'principal_amount' => 5000,
            'purpose' => 'Business expansion',
            'interest_rate' => 10,
            'term_months' => 12,
            'total_repayable' => 5500,
            'status' => 'active',
            'monthly_installment' => 458.33,
        ]);

        // Search members with lowercase 'john'
        $response = $this->actingAs($this->admin)->getJson('/api/v1/search?q=john');
        $response->assertStatus(200)
            ->assertJsonPath('data.members.0.id', $this->member->id);

        // Search members with uppercase 'SMITH'
        $response = $this->actingAs($this->admin)->getJson('/api/v1/search?q=SMITH');
        $response->assertStatus(200)
            ->assertJsonPath('data.members.0.id', $this->member->id);

        // Search loans with lowercase 'ln-awash'
        $response = $this->actingAs($this->admin)->getJson('/api/v1/search?q=ln-awash');
        $response->assertStatus(200)
            ->assertJsonPath('data.loans.0.id', $loan->id)
            // Ensure the user relationship is loaded (member_id must be in the select)
            ->assertJsonPath('data.loans.0.user.name', $this->member->name);

        // Search loans by member name (uppercase)
        $response = $this->actingAs($this->admin)->getJson('/api/v1/search?q=JOHNATHAN');
        $response->assertStatus(200)
            ->assertJsonPath('data.loans.0.id', $loan->id)
            ->assertJsonPath('data.loans.0.user.name', $this->member->name);
    }

    public function test_superadmin_search_is_case_insensitive(): void
    {
        $request = MembershipRequest::create([
            'sacco_id' => $this->sacco->id,
            'full_name' => 'Sarah Connor',
            'email' => 'Sarah.Connor@Example.com',
            'phone_number' => '+251911223344',
            'national_id' => 'NAT-SARAH-01',
            'status' => 'pending',
            'monthly_income' => 15000,
            'monthly_savings_commitment' => 1500,
        ]);

        // Search SACCO with lowercase 'awash'
        $response = $this->actingAs($this->superAdmin)->getJson('/api/v1/admin/search?q=awash');
        $response->assertStatus(200)
            ->assertJsonPath('data.saccos.0.id', $this->sacco->id);

        // Search user with lowercase 'john'
        $response = $this->actingAs($this->superAdmin)->getJson('/api/v1/admin/search?q=john');
        $response->assertStatus(200)
            ->assertJsonPath('data.users.0.id', $this->member->id);

        // Search request with lowercase 'sarah'
        $response = $this->actingAs($this->superAdmin)->getJson('/api/v1/admin/search?q=sarah');
        $response->assertStatus(200)
            ->assertJsonPath('data.membership_requests.0.id', $request->id);
    }

    public function test_superadmin_users_search_is_case_insensitive(): void
    {
        $response = $this->actingAs($this->superAdmin)->getJson('/api/v1/admin/users?search=john');
        $response->assertStatus(200)
            ->assertJsonPath('data.0.id', $this->member->id);

        $responseUpper = $this->actingAs($this->superAdmin)->getJson('/api/v1/admin/users?search=JOHN');
        $responseUpper->assertStatus(200)
            ->assertJsonPath('data.0.id', $this->member->id);
    }

    public function test_admin_sacco_management_search_is_case_insensitive(): void
    {
        $response = $this->actingAs($this->superAdmin)->getJson('/api/v1/admin/saccos?search=awash');
        $response->assertStatus(200)
            ->assertJsonPath('data.0.id', $this->sacco->id);

        $responseUpper = $this->actingAs($this->superAdmin)->getJson('/api/v1/admin/saccos?search=REG-AWASH');
        $responseUpper->assertStatus(200)
            ->assertJsonPath('data.0.id', $this->sacco->id);
    }

    public function test_membership_requests_search_is_case_insensitive(): void
    {
        $request = MembershipRequest::create([
            'sacco_id' => $this->sacco->id,
            'full_name' => 'Michael Jackson',
            'email' => 'Michael@Example.com',
            'phone_number' => '+251911556677',
            'national_id' => 'NAT-MJ-01',
            'status' => 'pending',
            'monthly_income' => 20000,
            'monthly_savings_commitment' => 2000,
        ]);

        $response = $this->actingAs($this->admin)->getJson('/api/v1/membership-requests?search=michael');
        $response->assertStatus(200)
            ->assertJsonPath('data.0.id', $request->id);

        $responseUpper = $this->actingAs($this->admin)->getJson('/api/v1/membership-requests?search=MICHAEL@');
        $responseUpper->assertStatus(200)
            ->assertJsonPath('data.0.id', $request->id);
    }

    public function test_guarantor_search_is_case_insensitive(): void
    {
        $applicant = User::factory()->create([
            'name' => 'Borrower User',
            'role' => 'member',
            'sacco_id' => $this->sacco->id,
        ]);

        $response = $this->actingAs($applicant)->getJson('/api/v1/guarantors/search?search=john');
        $response->assertStatus(200)
            ->assertJsonPath('data.0.id', $this->member->id);

        $responseUpper = $this->actingAs($applicant)->getJson('/api/v1/guarantors/search?search=SMITH');
        $responseUpper->assertStatus(200)
            ->assertJsonPath('data.0.id', $this->member->id);
    }
}
