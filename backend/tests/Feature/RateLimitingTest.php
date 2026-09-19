<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RateLimitingTest extends TestCase
{
    use RefreshDatabase;

    public function test_login_rate_limiting(): void
    {
        User::factory()->create([
            'email' => 'test@example.com',
            'password' => bcrypt('password'),
        ]);

        // Make 5 failed login attempts (the limit)
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/login', [
                'login' => 'test@example.com',
                'password' => 'wrong-password',
            ]);
        }

        // 6th attempt should be rate limited
        $response = $this->postJson('/api/v1/login', [
            'login' => 'test@example.com',
            'password' => 'wrong-password',
        ]);

        $response->assertStatus(429);
    }

    public function test_register_rate_limiting(): void
    {
        // Make 5 registration attempts
        for ($i = 0; $i < 5; $i++) {
            $this->postJson('/api/v1/register', [
                'name' => 'Test',
                'email' => "test{$i}@example.com",
                'username' => "test{$i}",
                'password' => 'StrongPass123!',
                'password_confirmation' => 'StrongPass123!',
            ]);
        }

        // 6th attempt should be rate limited
        $response = $this->postJson('/api/v1/register', [
            'name' => 'Test',
            'email' => 'test6@example.com',
            'username' => 'test6',
            'password' => 'StrongPass123!',
            'password_confirmation' => 'StrongPass123!',
        ]);

        $response->assertStatus(429);
    }

    public function test_authenticated_route_returns_401_without_token(): void
    {
        $response = $this->getJson('/api/v1/profile');

        $response->assertUnauthorized();
    }

    public function test_authenticated_route_works_with_valid_token(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->getJson('/api/v1/profile');

        $response->assertOk();
    }

    public function test_health_endpoint_is_public(): void
    {
        $response = $this->getJson('/api/v1/health');

        $response->assertOk();
    }
}
