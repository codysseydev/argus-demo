<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    use WithoutModelEvents;

    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // The single demo operator. Log in with these to reach the dashboard.
        User::query()->updateOrCreate(
            ['email' => 'demo@argus.test'],
            [
                'name' => 'Argus Demo',
                'password' => Hash::make('password'),
            ],
        );

        $this->call(ArgusDemoSeeder::class);
    }
}
