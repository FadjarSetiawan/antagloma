<?php

use App\Models\User;
use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\Hash;

return new class extends Migration {
    public function up(): void
    {
        $users = [
            [
                'email'    => 'owner@antaglomaflorist.id',
                'name'     => 'Owner Antagloma',
                'password' => Hash::make('hOyhxKx4wfNdf_0e'),
                'role'     => 'owner',
            ],
            [
                'email'    => 'admin@antaglomaflorist.id',
                'name'     => 'Admin Operasional',
                'password' => Hash::make('dY!YWQmd2E+UeeM~'),
                'role'     => 'admin',
            ],
            [
                'email'    => 'sales@antaglomaflorist.id',
                'name'     => 'Sales Staff',
                'password' => Hash::make('7XyY)..GrfzkEx7O'),
                'role'     => 'sales',
            ],
            [
                'email'    => 'packing@antaglomaflorist.id',
                'name'     => 'Packing Specialist',
                'password' => Hash::make('dY!YWQmd2E+UeeM~'),
                'role'     => 'packing',
            ],
            [
                'email'    => 'owner@antagloma.com',
                'name'     => 'Owner Antagloma',
                'password' => Hash::make('hOyhxKx4wfNdf_0e'),
                'role'     => 'owner',
            ],
            [
                'email'    => 'admin@antagloma.com',
                'name'     => 'Admin Operasional',
                'password' => Hash::make('dY!YWQmd2E+UeeM~'),
                'role'     => 'admin',
            ],
            [
                'email'    => 'sales@antagloma.com',
                'name'     => 'Sales Staff',
                'password' => Hash::make('7XyY)..GrfzkEx7O'),
                'role'     => 'sales',
            ],
            [
                'email'    => 'packing@antagloma.com',
                'name'     => 'Packing Specialist',
                'password' => Hash::make('dY!YWQmd2E+UeeM~'),
                'role'     => 'packing',
            ],
        ];

        foreach ($users as $userData) {
            User::updateOrCreate(
                ['email' => $userData['email']],
                $userData
            );
        }
    }

    public function down(): void
    {
    }
};
