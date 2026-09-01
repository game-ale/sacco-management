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
            $table->string('email')->nullable()->after('currency');
            $table->string('phone')->nullable()->after('email');
            $table->text('address')->nullable()->after('phone');
            $table->decimal('default_interest_rate', 5, 2)->default(12.00)->after('address');
            $table->decimal('max_loan_amount', 15, 2)->default(500000.00)->after('default_interest_rate');
            $table->unsignedInteger('max_loan_term')->default(60)->after('max_loan_amount');
            $table->decimal('loan_to_savings_ratio', 5, 2)->default(3.00)->after('max_loan_term');
            $table->unsignedInteger('min_shares_per_member')->default(1)->after('loan_to_savings_ratio');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('saccos', function (Blueprint $table) {
            $table->dropColumn([
                'email',
                'phone',
                'address',
                'default_interest_rate',
                'max_loan_amount',
                'max_loan_term',
                'loan_to_savings_ratio',
                'min_shares_per_member',
            ]);
        });
    }
};
