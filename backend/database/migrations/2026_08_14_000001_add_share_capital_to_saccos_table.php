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
            $table->decimal('share_value', 15, 2)->default(0.00)->after('status');
            $table->string('currency', 10)->default('KES')->after('share_value');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('saccos', function (Blueprint $table) {
            $table->dropColumn(['share_value', 'currency']);
        });
    }
};
