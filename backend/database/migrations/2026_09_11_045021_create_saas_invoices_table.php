<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('saas_invoices', function (Blueprint $table) {
            $table->id();
            $table->foreignId('sacco_id')->constrained()->cascadeOnDelete();
            $table->string('period');
            $table->decimal('profit_amount', 15, 2);
            $table->decimal('rent_percentage', 5, 2);
            $table->decimal('rent_amount', 15, 2);
            $table->string('status')->default('unpaid'); // unpaid, paid
            $table->timestamps();
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('saas_invoices');
    }
};
