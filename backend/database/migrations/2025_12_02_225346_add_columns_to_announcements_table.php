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
        Schema::table('announcements', function (Blueprint $table) {
            $table->string('category')->default('General')->after('message');
            $table->json('target_audience')->nullable()->after('category');
            $table->string('status')->default('Active')->after('target_audience');
            $table->string('attachment_url')->nullable()->after('status');
            $table->integer('views_count')->default(0)->after('attachment_url');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('announcements', function (Blueprint $table) {
            $table->dropColumn(['category', 'target_audience', 'status', 'attachment_url', 'views_count']);
        });
    }
};
