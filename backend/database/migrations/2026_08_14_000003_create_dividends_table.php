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
        Schema::create('dividends', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sacco_id')->constrained('saccos')->cascadeOnDelete();
            $table->foreignId('user_id')->constrained('users')->cascadeOnDelete();
            $table->string('period');
            $table->unsignedInteger('num_shares')->default(0);
            $table->decimal('share_pct', 8, 4)->default(0);
            $table->decimal('amount', 15, 2)->default(0);
            $table->decimal('total_pool', 15, 2);
            $table->timestamps();

            $table->unique(['sacco_id', 'user_id', 'period']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('dividends');
    }
};
