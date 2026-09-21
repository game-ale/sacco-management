<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('repayments', function (Blueprint $table) {
            $table->string('reference_number')->nullable()->after('method');
            $table->unique('reference_number');
        });

        Schema::table('savings_transactions', function (Blueprint $table) {
            $table->string('reference_number')->nullable()->after('description');
            $table->unique('reference_number');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('repayments', function (Blueprint $table) {
            $table->dropUnique(['reference_number']);
            $table->dropColumn('reference_number');
        });

        Schema::table('savings_transactions', function (Blueprint $table) {
            $table->dropUnique(['reference_number']);
            $table->dropColumn('reference_number');
        });
    }
};
