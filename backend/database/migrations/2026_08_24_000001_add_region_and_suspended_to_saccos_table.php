<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * Note: The 'status' column was originally an enum in MySQL but SQLite stores it as TEXT.
     * The 'suspended' status is now supported by application-level validation.
     * No column modification is needed — we only add the new 'region' column.
     */
    public function up(): void
    {
        if (!Schema::hasColumn('saccos', 'region')) {
            Schema::table('saccos', function (Blueprint $table) {
                $table->string('region')->nullable()->after('address');
            });
        }
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('saccos', function (Blueprint $table) {
            $table->dropColumn('region');
        });
    }
};
