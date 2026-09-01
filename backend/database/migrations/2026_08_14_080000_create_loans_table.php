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
        Schema::create('loans', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sacco_id')->constrained()->cascadeOnDelete();
            $table->foreignId('member_id')->constrained('users')->cascadeOnDelete();
            $table->string('loan_number')->unique();
            $table->decimal('principal_amount', 12, 2);
            $table->text('purpose');
            $table->string('status')->default('pending');
            $table->decimal('interest_rate', 5, 2)->nullable();
            $table->integer('term_months')->nullable();
            $table->decimal('total_repayable', 12, 2)->nullable();
            $table->decimal('monthly_installment', 12, 2)->nullable();
            $table->text('rejection_reason')->nullable();
            $table->timestamp('approved_at')->nullable();
            $table->timestamp('disbursed_at')->nullable();
            $table->foreignId('approved_by')->nullable()->constrained('users')->nullOnDelete();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('loans');
    }
};
