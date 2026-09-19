<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Foundation\Testing\WithFaker;
use Tests\TestCase;

class AuthTest extends TestCase
{
    use RefreshDatabase, WithFaker;

    // ─── Registration ──────────────────────────────────────

    public function test_user_can_register(): void
    {
        $payload = [
            'name' => 'John Doe',
            'email' => 'john@example.com',
            'username' => 'johndoe',
            'password' => 'StrongPass123!',
            'password_confirmation' => 'StrongPass123!',
        ];

        $response = $this->postJson('/api/v1/register', $payload);

        $response->assertCreated()
            ->assertJsonStructure([
                'user' => ['id', 'name', 'email', 'username'],
                'access_token',
                'token_type',
                'expires_at',
            ]);

        $this->assertDatabaseHas('users', [
            'email' => 'john@example.com',
            'username' => 'johndoe',
        ]);
    }

    public function test_register_requires_name(): void
    {
        $response = $this->postJson('/api/v1/register', [
            'email' => 'john@example.com',
            'username' => 'johndoe',
            'password' => 'StrongPass123!',
            'password_confirmation' => 'StrongPass123!',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['name']);
    }

    public function test_register_requires_valid_email(): void
    {
        $response = $this->postJson('/api/v1/register', [
            'name' => 'John',
            'email' => 'not-an-email',
            'username' => 'johndoe',
            'password' => 'StrongPass123!',
            'password_confirmation' => 'StrongPass123!',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_register_requires_unique_email(): void
    {
        User::factory()->create(['email' => 'existing@example.com']);

        $response = $this->postJson('/api/v1/register', [
            'name' => 'John',
            'email' => 'existing@example.com',
            'username' => 'johndoe',
            'password' => 'StrongPass123!',
            'password_confirmation' => 'StrongPass123!',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['email']);
    }

    public function test_register_requires_unique_username(): void
    {
        User::factory()->create(['username' => 'johndoe']);

        $response = $this->postJson('/api/v1/register', [
            'name' => 'John',
            'email' => 'new@example.com',
            'username' => 'johndoe',
            'password' => 'StrongPass123!',
            'password_confirmation' => 'StrongPass123!',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['username']);
    }

    public function test_register_requires_password_confirmation(): void
    {
        $response = $this->postJson('/api/v1/register', [
            'name' => 'John',
            'email' => 'john@example.com',
            'username' => 'johndoe',
            'password' => 'StrongPass123!',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['password']);
    }

    // ─── Login ─────────────────────────────────────────────

    public function test_user_can_login_with_email(): void
    {
        User::factory()->create([
            'email' => 'john@example.com',
            'password' => bcrypt('StrongPass123!'),
        ]);

        $response = $this->postJson('/api/v1/login', [
            'login' => 'john@example.com',
            'password' => 'StrongPass123!',
        ]);

        $response->assertOk()
            ->assertJsonStructure([
                'user' => ['id', 'name', 'email'],
                'access_token',
                'token_type',
            ]);
    }

    public function test_user_can_login_with_username(): void
    {
        User::factory()->create([
            'username' => 'johndoe',
            'password' => bcrypt('StrongPass123!'),
        ]);

        $response = $this->postJson('/api/v1/login', [
            'login' => 'johndoe',
            'password' => 'StrongPass123!',
        ]);

        $response->assertOk()
            ->assertJsonStructure(['access_token']);
    }

    public function test_login_fails_with_wrong_password(): void
    {
        User::factory()->create([
            'email' => 'john@example.com',
            'password' => bcrypt('StrongPass123!'),
        ]);

        $response = $this->postJson('/api/v1/login', [
            'login' => 'john@example.com',
            'password' => 'wrongpassword',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['login']);
    }

    public function test_login_fails_with_nonexistent_user(): void
    {
        $response = $this->postJson('/api/v1/login', [
            'login' => 'nobody@example.com',
            'password' => 'StrongPass123!',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['login']);
    }

    public function test_login_requires_login_field(): void
    {
        $response = $this->postJson('/api/v1/login', [
            'password' => 'StrongPass123!',
        ]);

        $response->assertUnprocessable()
            ->assertJsonValidationErrors(['login']);
    }

    // ─── Profile ───────────────────────────────────────────

    public function test_authenticated_user_can_get_profile(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->getJson('/api/v1/profile');

        $response->assertOk()
            ->assertJsonFragment(['email' => $user->email]);
    }

    public function test_unauthenticated_user_cannot_get_profile(): void
    {
        $response = $this->getJson('/api/v1/profile');

        $response->assertUnauthorized();
    }

    // ─── Logout ────────────────────────────────────────────

    public function test_authenticated_user_can_logout(): void
    {
        $user = User::factory()->create();
        $token = $user->createToken('test-token')->plainTextToken;

        $response = $this->withHeader('Authorization', "Bearer $token")
            ->postJson('/api/v1/logout');

        $response->assertOk()
            ->assertJsonFragment(['message' => __('auth.logout')]);

        $this->assertDatabaseCount('personal_access_tokens', 0);
    }

    // ─── Health Check ──────────────────────────────────────

    public function test_health_check_returns_healthy(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertOk()
            ->assertJsonFragment(['status' => 'healthy']);
    }
}
