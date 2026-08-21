<?php

namespace App\Console\Commands;

use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Hash;

class ResetPasswordsCommand extends Command
{
    protected $signature = 'auth:reset-passwords';
    protected $description = 'Reset official production passwords for Antagloma accounts';

    public function handle(): int
    {
        $users = [
            [
                'email'    => 'owner@antaglomaflorist.id',
                'name'     => 'Owner Antagloma',
                'password' => 'hOyhxKx4wfNdf_0e',
                'role'     => 'owner',
            ],
            [
                'email'    => 'admin@antaglomaflorist.id',
                'name'     => 'Admin Operasional',
                'password' => 'dY!YWQmd2E+UeeM~',
                'role'     => 'admin',
            ],
            [
                'email'    => 'sales@antaglomaflorist.id',
                'name'     => 'Sales Staff',
                'password' => '7XyY)..GrfzkEx7O',
                'role'     => 'sales',
            ],
            [
                'email'    => 'packing@antaglomaflorist.id',
                'name'     => 'Packing Specialist',
                'password' => 'dY!YWQmd2E+UeeM~',
                'role'     => 'packing',
            ],
            [
                'email'    => 'owner@antagloma.com',
                'name'     => 'Owner Antagloma',
                'password' => 'hOyhxKx4wfNdf_0e',
                'role'     => 'owner',
            ],
            [
                'email'    => 'admin@antagloma.com',
                'name'     => 'Admin Operasional',
                'password' => 'dY!YWQmd2E+UeeM~',
                'role'     => 'admin',
            ],
            [
                'email'    => 'sales@antagloma.com',
                'name'     => 'Sales Staff',
                'password' => '7XyY)..GrfzkEx7O',
                'role'     => 'sales',
            ],
            [
                'email'    => 'packing@antagloma.com',
                'name'     => 'Packing Specialist',
                'password' => 'dY!YWQmd2E+UeeM~',
                'role'     => 'packing',
            ],
        ];

        foreach ($users as $userData) {
            $user = User::updateOrCreate(
                ['email' => $userData['email']],
                [
                    'name'     => $userData['name'],
                    'password' => Hash::make($userData['password']),
                    'role'     => $userData['role'],
                ]
            );
            $roleName = $user->role instanceof \BackedEnum ? $user->role->value : (string) $user->role;
            $this->info("✓ User [{$user->email}] role [{$roleName}] updated successfully.");
        }

        $this->info('All accounts synchronized successfully!');
        return 0;
    }
}
