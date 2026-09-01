<?php

namespace Database\Seeders;

use App\Models\Sacco;
use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {

        // 1. Superadmin
        User::factory()->create([
            'name' => 'Platform Superadmin',
            'username' => 'superadmin',
            'email' => 'superadmin@example.com',
            'role' => 'superadmin',
            'sacco_id' => null,
        ]);

        // 2. A Test SACCO
        $sacco = Sacco::create([
            'name' => 'Demo SACCO Ltd',
            'registration_number' => 'REG-123456',
            'status' => 'approved',
        ]);

        // 3. SACCO Admin
        User::factory()->create([
            'name' => 'SACCO Admin',
            'username' => 'saccoadmin',
            'email' => 'admin@sacco.com',
            'role' => 'admin',
            'sacco_id' => $sacco->id,
        ]);

        // 4. SACCO Member
        User::factory()->create([
            'name' => 'Regular Member',
            'username' => 'member',
            'email' => 'member@example.com',
            'role' => 'member',
            'sacco_id' => $sacco->id,
        ]);

        // 5. A Pending SACCO (waiting for superadmin approval)
        $pendingSacco = Sacco::create([
            'name' => 'New Pending SACCO',
            'registration_number' => 'REG-PENDING-001',
            'status' => 'pending',
        ]);

        User::factory()->create([
            'name' => 'Pending Admin',
            'username' => 'pendingadmin',
            'email' => 'pending@sacco.com',
            'role' => 'admin',
            'sacco_id' => $pendingSacco->id,
        ]);
        $this->call([
            SavingsTransactionSeeder::class,
            ComprehensiveSeeder::class,
        ]);
    }
}
