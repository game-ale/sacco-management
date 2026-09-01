<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('platform_settings', function (Blueprint $table) {
            $table->id();

            // Registration Settings
            $table->boolean('auto_approve_saccos')->default(false);
            $table->boolean('require_registration_verification')->default(true);
            $table->unsignedInteger('max_saccos_allowed')->nullable(); // null = unlimited

            // Default SACCO Settings
            $table->decimal('default_interest_rate', 5, 2)->default(12.00);
            $table->decimal('default_share_value', 15, 2)->default(1000.00);
            $table->decimal('default_loan_to_savings_ratio', 5, 2)->default(3.00);

            // Email Notification Preferences
            $table->boolean('notify_new_sacco_registration')->default(true);
            $table->boolean('notify_sacco_milestone')->default(true);
            $table->boolean('weekly_platform_summary')->default(false);

            // Platform Branding
            $table->string('platform_name')->default('SACCO Manager');
            $table->string('support_email')->nullable();
            $table->string('terms_of_service_url')->nullable();
            $table->string('privacy_policy_url')->nullable();

            $table->timestamps();
        });

        // Seed a single default row
        DB::table('platform_settings')->insert([
            'platform_name' => 'SACCO Manager',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('platform_settings');
    }
};
