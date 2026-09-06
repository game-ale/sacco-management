<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('saccos', function (Blueprint $table) {
            $table->boolean('is_public')->default(false)->after('status');
            $table->boolean('is_accepting_members')->default(false)->after('is_public');
            $table->boolean('show_share_info')->default(false)->after('is_accepting_members');
            $table->boolean('is_directory_allowed')->default(true)->after('show_share_info');
            $table->string('logo_path')->nullable()->after('is_directory_allowed');
            $table->text('description')->nullable()->after('logo_path');
            $table->string('location')->nullable()->after('description');
            $table->string('category')->nullable()->after('location');
            $table->text('eligibility_criteria')->nullable()->after('category');
            $table->string('contact_email')->nullable()->after('eligibility_criteria');
            $table->string('contact_phone')->nullable()->after('contact_email');
            $table->unsignedInteger('min_shares')->default(1)->after('contact_phone');
        });
    }

    public function down(): void
    {
        Schema::table('saccos', function (Blueprint $table) {
            $table->dropColumn([
                'is_public',
                'is_accepting_members',
                'show_share_info',
                'is_directory_allowed',
                'logo_path',
                'description',
                'location',
                'category',
                'eligibility_criteria',
                'contact_email',
                'contact_phone',
                'min_shares',
            ]);
        });
    }
};
