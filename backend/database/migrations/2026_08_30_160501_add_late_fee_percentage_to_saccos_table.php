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
        Schema::table('saccos', function (Blueprint $table) {
            $table->decimal('late_fee_percentage', 5, 2)->default(0.00);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('saccos', function (Blueprint $table) {
            $table->dropColumn('late_fee_percentage');
        });
    }
};
