<?php

namespace Tests\Feature;

use App\Models\Sacco;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SaccoRegistrationTest extends TestCase
{
    use RefreshDatabase;

    public function test_sacco_registration_succeeds_with_valid_data(): void
    {
        $payload = [
            'sacco_name' => 'New Test SACCO',
            'registration_number' => 'REG-123456',
            'admin_name' => 'John Admin',
            'admin_email' => 'john.admin@example.com',
            'admin_username' => 'johnadmin123',
            'national_id' => '12345678',
            'region' => 'Oromia',
            'zone' => 'East Shewa',
            'town' => 'Adama',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ];

        $response = $this->postJson('/api/v1/saccos/register', $payload);

        $response->assertStatus(201);

        $this->assertDatabaseHas('saccos', [
            'name' => 'New Test SACCO',
            'registration_number' => 'REG-123456',
            'status' => 'pending',
        ]);

        $this->assertDatabaseHas('users', [
            'email' => 'john.admin@example.com',
            'username' => 'johnadmin123',
            'role' => 'admin',
        ]);
    }

    public function test_sacco_registration_fails_validation_for_duplicate_data(): void
    {
        $existingSacco = Sacco::create([
            'name' => 'Existing SACCO',
            'registration_number' => 'REG-123456',
            'status' => 'approved',
        ]);

        User::create([
            'name' => 'Existing Admin',
            'email' => 'john.admin@example.com',
            'username' => 'johnadmin123',
            'password' => bcrypt('password'),
            'role' => 'admin',
            'sacco_id' => $existingSacco->id,
        ]);

        $payload = [
            'sacco_name' => 'New SACCO',
            'registration_number' => 'REG-123456', // Duplicate
            'admin_name' => 'John Admin',
            'admin_email' => 'john.admin@example.com', // Duplicate
            'admin_username' => 'johnadmin123', // Duplicate
            'national_id' => '12345678',
            'region' => 'Oromia',
            'zone' => 'East Shewa',
            'town' => 'Adama',
            'password' => 'Password123!',
            'password_confirmation' => 'Password123!',
        ];

        $response = $this->postJson('/api/v1/saccos/register', $payload);

        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['registration_number', 'admin_email', 'admin_username']);
    }
}
