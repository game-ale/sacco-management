<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('saccos', function (Blueprint $table) {
            $table->text('chapa_public_key')->nullable()->after('status');
            $table->text('chapa_secret_key')->nullable()->after('chapa_public_key');
        });
    }

    public function down(): void
    {
        Schema::table('saccos', function (Blueprint $table) {
            $table->dropColumn(['chapa_public_key', 'chapa_secret_key']);
        });
    }
};
