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
        Schema::table('dividends', function (Blueprint $table) {
            $table->decimal('savings_balance', 15, 2)->default(0);
            $table->decimal('savings_pct', 8, 4)->default(0);
            $table->decimal('share_dividend_amount', 15, 2)->default(0);
            $table->decimal('savings_interest_amount', 15, 2)->default(0);
            $table->decimal('reserve_percentage', 5, 2)->default(0);
            $table->decimal('reserve_amount', 15, 2)->default(0);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('dividends', function (Blueprint $table) {
            $table->dropColumn([
                'savings_balance',
                'savings_pct',
                'share_dividend_amount',
                'savings_interest_amount',
                'reserve_percentage',
                'reserve_amount',
            ]);
        });
    }
};
