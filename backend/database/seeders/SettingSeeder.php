<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Setting;

class SettingSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            ['key' => 'site_name', 'value' => 'HRMS System'],
            ['key' => 'primary_color', 'value' => '#1E40AF'],
            ['key' => 'secondary_color', 'value' => '#F59E0B'],
            ['key' => 'logo_url', 'value' => null],
        ];

        foreach ($defaults as $item) {
            Setting::firstOrCreate(['key' => $item['key']], ['value' => $item['value']]);
        }
    }
}