<?php

namespace Tests\Feature;

use App\Models\Invitation;
use App\Models\MembershipRequest;
use App\Models\Sacco;
use App\Models\User;
use App\Notifications\MembershipRequestApprovedNotification;
use App\Notifications\MembershipRequestRejectedNotification;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;
use Illuminate\Support\Str;
use Tests\TestCase;

class MembershipRequestTest extends TestCase
{
    use RefreshDatabase;

    private Sacco $saccoA;

    private Sacco $saccoB;

    private User $adminA;

    private User $adminB;

    protected function setUp(): void
    {
        parent::setUp();

        Notification::fake();

        $this->saccoA = Sacco::create([
            'name' => 'SACCO Alpha',
            'registration_number' => 'REG-A',
            'status' => 'approved',
            'is_public' => true,
            'is_accepting_members' => true,
            'is_directory_allowed' => true,
        ]);

        $this->saccoB = Sacco::create([
            'name' => 'SACCO Beta',
            'registration_number' => 'REG-B',
            'status' => 'approved',
            'is_public' => true,
            'is_accepting_members' => false,
            'is_directory_allowed' => true,
        ]);

        $this->adminA = User::factory()->create([
            'role' => 'admin',
            'sacco_id' => $this->saccoA->id,
        ]);

        $this->adminB = User::factory()->create([
            'role' => 'admin',
            'sacco_id' => $this->saccoB->id,
        ]);
    }

    public function test_public_visitor_can_submit_membership_request(): void
    {
        $payload = [
            'full_name' => 'Abebe Bikila',
            'email' => 'abebe@example.com',
            'phone_number' => '+251911223344',
            'national_id' => 'ID12345',
            'message' => 'I want to join your SACCO.',
        ];

        $response = $this->postJson("/api/v1/public/saccos/{$this->saccoA->id}/membership-requests", $payload);

        $response->assertStatus(201)
            ->assertJsonPath('data.full_name', 'Abebe Bikila')
            ->assertJsonPath('data.status', 'pending');

        $this->assertDatabaseHas('membership_requests', [
            'sacco_id' => $this->saccoA->id,
            'email' => 'abebe@example.com',
            'status' => 'pending',
        ]);
    }

    public function test_cannot_submit_request_when_sacco_not_accepting_members(): void
    {
        $payload = [
            'full_name' => 'Kebede Tessema',
            'email' => 'kebede@example.com',
            'phone_number' => '+251911223355',
        ];

        $response = $this->postJson("/api/v1/public/saccos/{$this->saccoB->id}/membership-requests", $payload);

        $response->assertStatus(422);
    }

    public function test_cannot_submit_duplicate_pending_request(): void
    {
        MembershipRequest::create([
            'sacco_id' => $this->saccoA->id,
            'full_name' => 'Existing Applicant',
            'email' => 'duplicate@example.com',
            'phone_number' => '+251911999888',
            'status' => 'pending',
        ]);

        $payload = [
            'full_name' => 'Existing Applicant',
            'email' => 'duplicate@example.com',
            'phone_number' => '+251911999888',
        ];

        $response = $this->postJson("/api/v1/public/saccos/{$this->saccoA->id}/membership-requests", $payload);

        $response->assertStatus(422);
    }

    public function test_cannot_submit_request_if_email_is_already_a_member(): void
    {
        User::factory()->create([
            'role' => 'member',
            'sacco_id' => $this->saccoA->id,
            'email' => 'member@example.com',
        ]);

        $payload = [
            'full_name' => 'Member Duplicate',
            'email' => 'member@example.com',
            'phone_number' => '+251911999888',
        ];

        $response = $this->postJson("/api/v1/public/saccos/{$this->saccoA->id}/membership-requests", $payload);

        $response->assertStatus(422);
    }

    public function test_admin_can_list_and_view_requests_for_own_sacco_only(): void
    {
        $reqA = MembershipRequest::create([
            'sacco_id' => $this->saccoA->id,
            'full_name' => 'Applicant A',
            'email' => 'appA@example.com',
            'phone_number' => '+251911111111',
            'status' => 'pending',
        ]);

        $reqB = MembershipRequest::create([
            'sacco_id' => $this->saccoB->id,
            'full_name' => 'Applicant B',
            'email' => 'appB@example.com',
            'phone_number' => '+251922222222',
            'status' => 'pending',
        ]);

        // Admin A lists requests -> receives reqA only
        $response = $this->actingAs($this->adminA)->getJson('/api/v1/membership-requests');

        $response->assertStatus(200)
            ->assertJsonCount(1, 'data')
            ->assertJsonPath('data.0.id', $reqA->id);

        // Admin A tries to view reqB -> 404
        $viewResponse = $this->actingAs($this->adminA)->getJson("/api/v1/membership-requests/{$reqB->id}");
        $viewResponse->assertStatus(404);
    }

    public function test_admin_can_approve_request_and_send_activation_invitation(): void
    {
        $reqA = MembershipRequest::create([
            'sacco_id' => $this->saccoA->id,
            'full_name' => 'Approve Me',
            'email' => 'approveme@example.com',
            'phone_number' => '+251911111111',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->adminA)
            ->postJson("/api/v1/membership-requests/{$reqA->id}/approve");

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'approved');

        $reqA->refresh();
        $this->assertEquals('approved', $reqA->status);
        $this->assertNotNull($reqA->activation_token_hash);
        $this->assertNotNull($reqA->activation_expires_at);

        Notification::assertSentOnDemand(
            MembershipRequestApprovedNotification::class,
            function ($notification, $channels, $notifiable) {
                return $notifiable->routes['mail'] === 'approveme@example.com' &&
                       str_contains($notification->activationUrl, '/activate-membership/');
            }
        );
    }

    public function test_admin_can_reject_request_with_reason(): void
    {
        $reqA = MembershipRequest::create([
            'sacco_id' => $this->saccoA->id,
            'full_name' => 'Reject Me',
            'email' => 'rejectme@example.com',
            'phone_number' => '+251911111111',
            'status' => 'pending',
        ]);

        $response = $this->actingAs($this->adminA)
            ->postJson("/api/v1/membership-requests/{$reqA->id}/reject", [
                'rejection_reason' => 'Ineligible according to bylaws.',
            ]);

        $response->assertStatus(200)
            ->assertJsonPath('data.status', 'rejected')
            ->assertJsonPath('data.rejection_reason', 'Ineligible according to bylaws.');

        $this->assertDatabaseHas('membership_requests', [
            'id' => $reqA->id,
            'status' => 'rejected',
            'rejection_reason' => 'Ineligible according to bylaws.',
        ]);

        Notification::assertSentOnDemand(
            MembershipRequestRejectedNotification::class,
            function ($notification, $channels, $notifiable) {
                return $notifiable->routes['mail'] === 'rejectme@example.com';
            }
        );
    }

    public function test_cannot_approve_or_reject_already_processed_request(): void
    {
        $reqA = MembershipRequest::create([
            'sacco_id' => $this->saccoA->id,
            'full_name' => 'Processed',
            'email' => 'processed@example.com',
            'phone_number' => '+251911111111',
            'status' => 'approved',
            'reviewed_by' => $this->adminA->id,
        ]);

        // Attempting to approve again
        $res1 = $this->actingAs($this->adminA)->postJson("/api/v1/membership-requests/{$reqA->id}/approve");
        $res1->assertStatus(422);

        // Attempting to reject approved request
        $res2 = $this->actingAs($this->adminA)->postJson("/api/v1/membership-requests/{$reqA->id}/reject", [
            'rejection_reason' => 'New decision',
        ]);
        $res2->assertStatus(422);
    }

    public function test_complete_activation_flow_and_login(): void
    {
        $rawToken = Str::random(64);
        $tokenHash = hash('sha256', $rawToken);

        $req = MembershipRequest::create([
            'sacco_id' => $this->saccoA->id,
            'full_name' => 'Active Candidate',
            'email' => 'candidate@example.com',
            'phone_number' => '+251900112233',
            'national_id' => 'NID998877',
            'status' => 'approved',
            'activation_token_hash' => $tokenHash,
            'activation_expires_at' => now()->addDays(7),
        ]);

        // 1. Inspect token endpoint
        $showRes = $this->getJson("/api/v1/public/membership-activation/{$rawToken}");
        $showRes->assertStatus(200)
            ->assertJsonPath('status', 'valid')
            ->assertJsonPath('data.full_name', 'Active Candidate')
            ->assertJsonPath('data.sacco_name', 'SACCO Alpha');

        // 2. Password mismatch validation
        $mismatchRes = $this->postJson("/api/v1/public/membership-activation/{$rawToken}", [
            'password' => 'Password123!',
            'password_confirmation' => 'Different123!',
        ]);
        $mismatchRes->assertStatus(422);

        // 3. Complete activation
        $actRes = $this->postJson("/api/v1/public/membership-activation/{$rawToken}", [
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $actRes->assertStatus(200)
            ->assertJsonPath('data.user.role', 'member')
            ->assertJsonPath('data.user.sacco_id', $this->saccoA->id);

        // Verify User in database
        $user = User::where('email', 'candidate@example.com')->first();
        $this->assertNotNull($user);
        $this->assertEquals($this->saccoA->id, $user->sacco_id);
        $this->assertEquals('member', $user->role);
        $this->assertTrue(Hash::check('Password123!', $user->password));

        // Verify request activation status
        $req->refresh();
        $this->assertNotNull($req->activated_at);
        $this->assertNull($req->activation_token_hash);

        // 4. Activated member can log in via POST /api/v1/login
        $loginRes = $this->postJson('/api/v1/login', [
            'login' => 'candidate@example.com',
            'password' => 'Password123!',
        ]);

        $loginRes->assertStatus(200)
            ->assertJsonPath('user.email', 'candidate@example.com')
            ->assertJsonPath('user.role', 'member');
    }

    public function test_activation_fails_for_invalid_expired_or_reused_token(): void
    {
        $rawToken = Str::random(64);
        $tokenHash = hash('sha256', $rawToken);

        $expiredReq = MembershipRequest::create([
            'sacco_id' => $this->saccoA->id,
            'full_name' => 'Expired User',
            'email' => 'expired@example.com',
            'phone_number' => '+251900112244',
            'status' => 'approved',
            'activation_token_hash' => $tokenHash,
            'activation_expires_at' => now()->subDay(),
        ]);

        // 1. Expired token check
        $resExpired = $this->getJson("/api/v1/public/membership-activation/{$rawToken}");
        $resExpired->assertStatus(400)
            ->assertJsonPath('status', 'expired');

        // 2. Invalid token check
        $resInvalid = $this->getJson('/api/v1/public/membership-activation/nonexistenttoken');
        $resInvalid->assertStatus(404)
            ->assertJsonPath('status', 'invalid');

        // 3. Pending request token check
        $pendingToken = Str::random(64);
        MembershipRequest::create([
            'sacco_id' => $this->saccoA->id,
            'full_name' => 'Pending User',
            'email' => 'pending@example.com',
            'phone_number' => '+251900112255',
            'status' => 'pending',
            'activation_token_hash' => hash('sha256', $pendingToken),
            'activation_expires_at' => now()->addDays(7),
        ]);

        $resPending = $this->getJson("/api/v1/public/membership-activation/{$pendingToken}");
        $resPending->assertStatus(400)
            ->assertJsonPath('status', 'not_approved');
    }

    public function test_duplicate_user_account_creation_is_prevented_during_activation(): void
    {
        User::factory()->create([
            'sacco_id' => $this->saccoA->id,
            'email' => 'existing@example.com',
            'role' => 'member',
        ]);

        $rawToken = Str::random(64);
        MembershipRequest::create([
            'sacco_id' => $this->saccoA->id,
            'full_name' => 'Existing User',
            'email' => 'existing@example.com',
            'phone_number' => '+251900112266',
            'status' => 'approved',
            'activation_token_hash' => hash('sha256', $rawToken),
            'activation_expires_at' => now()->addDays(7),
        ]);

        $res = $this->postJson("/api/v1/public/membership-activation/{$rawToken}", [
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ]);

        $res->assertStatus(400)
            ->assertJsonPath('status', 'user_exists');
    }
}
