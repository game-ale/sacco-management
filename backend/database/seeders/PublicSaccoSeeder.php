<?php

namespace Database\Seeders;

use App\Models\Sacco;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class PublicSaccoSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $saccos = [
            // 1. PUBLIC + ACCEPTING MEMBERS
            [
                'name' => 'Addis Teachers Credit & Savings SACCO',
                'registration_number' => 'REG-PUB-TEACH-001',
                'status' => 'approved',
                'is_public' => true,
                'is_directory_allowed' => true,
                'is_accepting_members' => true,
                'show_share_info' => true,
                'category' => 'Teachers',
                'location' => 'Addis Ababa',
                'description' => 'Premier financial cooperative serving educators across Addis Ababa with low-interest loans and high-yield savings programs.',
                'eligibility_criteria' => "1. Must be a certified teacher, administrator, or educational staff in Addis Ababa.\n2. Must provide official school ID or employment contract.\n3. Minimum initial deposit of 500 ETB required.",
                'contact_email' => 'info@addisteachers-sacco.et',
                'contact_phone' => '+251111223344',
                'share_value' => 100.00,
                'min_shares' => 10,
                'email' => 'admin@addisteachers-sacco.et',
                'username' => 'teachers_admin',
                'phone' => '+251111223344',
                'address' => 'Churchill Road, Addis Ababa',
            ],

            // 2. PUBLIC + NOT ACCEPTING MEMBERS
            [
                'name' => 'Oromia Farmers Union SACCO',
                'registration_number' => 'REG-PUB-FARM-002',
                'status' => 'approved',
                'is_public' => true,
                'is_directory_allowed' => true,
                'is_accepting_members' => false,
                'show_share_info' => true,
                'category' => 'Farmers',
                'location' => 'Adama',
                'description' => 'Agricultural cooperative supporting local grain and livestock farmers with seasonal fertilizer and equipment loans.',
                'eligibility_criteria' => 'Membership is currently closed to new applicants pending annual general assembly quota review.',
                'contact_email' => 'contact@oromiafarmers-sacco.et',
                'contact_phone' => '+251221112233',
                'share_value' => 50.00,
                'min_shares' => 20,
                'email' => 'admin@oromiafarmers-sacco.et',
                'username' => 'farmers_admin',
                'phone' => '+251221112233',
                'address' => 'Main Highway, Adama',
            ],

            // 3. PUBLIC + SHARE INFORMATION HIDDEN
            [
                'name' => 'Bishoftu Transport Operators SACCO',
                'registration_number' => 'REG-PUB-TRANS-003',
                'status' => 'approved',
                'is_public' => true,
                'is_directory_allowed' => true,
                'is_accepting_members' => true,
                'show_share_info' => false,
                'category' => 'Transport',
                'location' => 'Bishoftu',
                'description' => 'Empowering commercial taxi, bus, and freight operators with vehicle financing and asset maintenance solutions.',
                'eligibility_criteria' => "1. Valid commercial driver's license.\n2. Proof of route operator authorization in Bishoftu zone.\n3. Endorsement from 2 active SACCO members.",
                'contact_email' => 'support@bishoftutransport-sacco.et',
                'contact_phone' => '+251224445566',
                'share_value' => 200.00,
                'min_shares' => 5,
                'email' => 'admin@bishoftutransport-sacco.et',
                'username' => 'transport_admin',
                'phone' => '+251224445566',
                'address' => 'Bus Terminal Area, Bishoftu',
            ],

            // 4. DIRECTORY DISABLED (is_directory_allowed = false)
            [
                'name' => 'Federal Civil Servants SACCO',
                'registration_number' => 'REG-RESTRICT-004',
                'status' => 'approved',
                'is_public' => true,
                'is_directory_allowed' => false,
                'is_accepting_members' => true,
                'show_share_info' => true,
                'category' => 'Employees',
                'location' => 'Addis Ababa',
                'description' => 'Closed financial cooperative restricted strictly to federal ministry personnel.',
                'eligibility_criteria' => 'Permanent appointment letter from a federal government agency.',
                'contact_email' => 'internal@fedemployees-sacco.et',
                'username' => 'fedemployees_admin',
                'contact_phone' => '+251115556677',
                'share_value' => 150.00,
                'min_shares' => 10,
                'email' => 'admin@fedemployees-sacco.et',
                'phone' => '+251115556677',
                'address' => 'Ministry Complex, Addis Ababa',
            ],

            // 5. NOT APPROVED (status = pending)
            [
                'name' => 'Hawassa Lakeside Micro SACCO',
                'registration_number' => 'REG-PEND-COMM-005',
                'status' => 'pending',
                'is_public' => true,
                'is_directory_allowed' => true,
                'is_accepting_members' => true,
                'show_share_info' => true,
                'category' => 'Community',
                'location' => 'Hawassa',
                'description' => 'Grassroots micro-finance cooperative aiming to boost local artisans and fish traders around Hawassa Lake.',
                'eligibility_criteria' => 'Resident of Hawassa city for at least 12 consecutive months.',
                'contact_email' => 'info@hawassalakeside-sacco.et',
                'contact_phone' => '+251462223344',
                'share_value' => 50.00,
                'min_shares' => 5,
                'email' => 'admin@hawassalakeside-sacco.et',
                'username' => 'hawassa_admin',
                'phone' => '+251462223344',
                'address' => 'Lake View Road, Hawassa',
            ],

            // 6. PUBLIC SACCO IN ANOTHER CATEGORY/LOCATION (Jimma)
            [
                'name' => 'Jimma Kaffa Coffee Producers SACCO',
                'registration_number' => 'REG-PUB-COFFEE-006',
                'status' => 'approved',
                'is_public' => true,
                'is_directory_allowed' => true,
                'is_accepting_members' => true,
                'show_share_info' => true,
                'category' => 'Farmers',
                'location' => 'Jimma',
                'description' => 'Specialized cooperative funding sustainable coffee cultivation, washing stations, and organic certification.',
                'eligibility_criteria' => 'Registered coffee grower or land lease holder in Jimma or Kaffa zones.',
                'contact_email' => 'hello@jimmacoffee-sacco.et',
                'contact_phone' => '+251471112233',
                'share_value' => 120.00,
                'min_shares' => 15,
                'email' => 'admin@jimmacoffee-sacco.et',
                'username' => 'jimma_admin',
                'phone' => '+251471112233',
                'address' => 'Coffee Plaza, Jimma',
            ],
        ];

        foreach ($saccos as $data) {
            $adminEmail = $data['email'];
            $adminUsername = $data['username'];

            $saccoData = $data;
            unset($saccoData['username']);

            $sacco = Sacco::updateOrCreate(
                ['registration_number' => $data['registration_number']],
                $saccoData
            );

            User::updateOrCreate(
                ['email' => $adminEmail],
                [
                    'name' => $sacco->name . ' Admin',
                    'username' => $adminUsername,
                    'password' => Hash::make('password'),
                    'role' => 'admin',
                    'sacco_id' => $sacco->id,
                    'email_verified_at' => now(),
                ]
            );
        }
    }
}
