<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('membership_requests', function (Blueprint $table) {
            $table->string('activation_token_hash', 64)->nullable()->index()->after('rejection_reason');
            $table->timestamp('activation_expires_at')->nullable()->after('activation_token_hash');
            $table->timestamp('activated_at')->nullable()->after('activation_expires_at');
        });
    }

    public function down(): void
    {
        Schema::table('membership_requests', function (Blueprint $table) {
            $table->dropColumn(['activation_token_hash', 'activation_expires_at', 'activated_at']);
        });
    }
};
