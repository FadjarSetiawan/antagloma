<?php

namespace Database\Seeders;

use App\Enums\DeliveryMethod;
use App\Enums\OrderStatus;
use App\Models\MasterGrade;
use App\Models\MasterTree;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Users
        $owner = User::updateOrCreate(
            ['email' => 'owner@antagloma.com'],
            ['name' => 'Owner Antagloma', 'password' => Hash::make('password123'), 'role' => 'owner']
        );

        $sales = User::updateOrCreate(
            ['email' => 'sales@antagloma.com'],
            ['name' => 'Sales Staff', 'password' => Hash::make('password123'), 'role' => 'sales']
        );

        $admin = User::updateOrCreate(
            ['email' => 'admin@antagloma.com'],
            ['name' => 'Admin Operasional', 'password' => Hash::make('password123'), 'role' => 'admin']
        );

        $packing = User::updateOrCreate(
            ['email' => 'packing@antagloma.com'],
            ['name' => 'Packing Specialist', 'password' => Hash::make('password123'), 'role' => 'packing']
        );

        // 2. Seed Master Grades
        $grades = [
            ['grade' => 'A',  'standard_price' => 50000],
            ['grade' => 'B',  'standard_price' => 75000],
            ['grade' => 'B+', 'standard_price' => 100000],
            ['grade' => 'C',  'standard_price' => 150000],
            ['grade' => 'C+', 'standard_price' => 250000],
            ['grade' => 'D',  'standard_price' => 300000],
            ['grade' => 'D+', 'standard_price' => 350000],
            ['grade' => 'J',  'standard_price' => 500000],
            ['grade' => 'J+', 'standard_price' => 0],
        ];

        foreach ($grades as $g) {
            MasterGrade::updateOrCreate(['grade' => $g['grade']], $g);
        }

        // 3. Seed Master Trees (~55 Adenium Varieties)
        $trees = [
            ['code' => 'GA', 'name' => 'Golden Age'],
            ['code' => 'BA', 'name' => 'Black Amarylis'],
            ['code' => 'TW', 'name' => 'Triple Wish'],
            ['code' => 'RP', 'name' => 'Red Petunia'],
            ['code' => 'AF', 'name' => 'Arabicum Formous'],
            ['code' => 'SL', 'name' => 'Super Lemon'],
            ['code' => 'OB', 'name' => 'Obesum White Fragrant'],
            ['code' => 'PM', 'name' => 'Purple Mystery'],
            ['code' => 'RB', 'name' => 'Red Ruby Triple'],
            ['code' => 'SK', 'name' => 'Sokotra Giant'],
            ['code' => 'SW', 'name' => 'Snow White Double'],
            ['code' => 'BT', 'name' => 'Black Titan'],
            ['code' => 'DR', 'name' => 'Desert Rose Hybrid'],
            ['code' => 'FG', 'name' => 'Fire Glow'],
            ['code' => 'MC', 'name' => 'Multicolor Grafted'],
            ['code' => 'KP', 'name' => 'King Purple'],
            ['code' => 'RS', 'name' => 'Red Starburst'],
            ['code' => 'VL', 'name' => 'Violet Velvet'],
            ['code' => 'YF', 'name' => 'Yellow Fantasy'],
            ['code' => 'CR', 'name' => 'Crimson Beauty'],
            ['code' => 'BL', 'name' => 'Black Lotus'],
            ['code' => 'SS', 'name' => 'Sunset Splash'],
            ['code' => 'OR', 'name' => 'Ocean Ripple'],
            ['code' => 'PK', 'name' => 'Pink Diamond'],
            ['code' => 'SP', 'name' => 'Super Platinum'],
            ['code' => 'MB', 'name' => 'Midnight Beauty'],
            ['code' => 'AM', 'name' => 'Amber Mist'],
            ['code' => 'CH', 'name' => 'Cherry Blossom'],
            ['code' => 'DB', 'name' => 'Double Blush'],
            ['code' => 'EV', 'name' => 'Evergreen Dwarf'],
            ['code' => 'FC', 'name' => 'Flame Crown'],
            ['code' => 'GD', 'name' => 'Golden Dragon'],
            ['code' => 'HB', 'name' => 'Honey Bee'],
            ['code' => 'IP', 'name' => 'Imperial Purple'],
            ['code' => 'JK', 'name' => 'Joker Stripe'],
            ['code' => 'KS', 'name' => 'King Sokotra'],
            ['code' => 'LV', 'name' => 'Lavender Queen'],
            ['code' => 'MA', 'name' => 'Magical Aura'],
            ['code' => 'NL', 'name' => 'Night Lily'],
            ['code' => 'OP', 'name' => 'Opal Elegance'],
            ['code' => 'PE', 'name' => 'Peachy Glow'],
            ['code' => 'RD', 'name' => 'Royal Duchess'],
            ['code' => 'SA', 'name' => 'Scarlet Angel'],
            ['code' => 'TC', 'name' => 'Tiger Crest'],
            ['code' => 'UT', 'name' => 'Ultramarine'],
            ['code' => 'VG', 'name' => 'Variegated Gold'],
            ['code' => 'WP', 'name' => 'White Princess'],
            ['code' => 'XP', 'name' => 'Xtra Pink Double'],
            ['code' => 'YV', 'name' => 'Yellow Velvet'],
            ['code' => 'ZE', 'name' => 'Zebra Stripe'],
            ['code' => 'AR', 'name' => 'Arabicum Ra-Chi-Nee'],
            ['code' => 'TH', 'name' => 'Thai Socotranum'],
            ['code' => 'SB', 'name' => 'Super Baobab Adenium'],
            ['code' => 'KD', 'name' => 'Karakter Dwarfy Giant'],
            ['code' => 'CP', 'name' => 'Crown of Persia'],
        ];

        foreach ($trees as $t) {
            MasterTree::updateOrCreate(['code' => $t['code']], $t);
        }

        // 4. Seed Orders
        $order1 = Order::create([
            'order_number'    => 'ORD-' . date('dmY') . '-0001',
            'order_date'      => now()->toDateString(),
            'customer_name'   => 'Doni Setiawan',
            'phone'           => '081234567890',
            'delivery_method' => DeliveryMethod::PACKING_KAYU->value,
            'province_id'     => '32',
            'province_name'   => 'Jawa Barat',
            'regency_id'      => '3273',
            'regency_name'    => 'Kota Bandung',
            'district_id'     => '3273010',
            'district_name'   => 'Coblong',
            'full_address'    => 'Jl. Ir. H. Juanda No. 123, Dago',
            'notes'           => 'Pilihkan karakter bonggol meliuk, packing kayu ekstra tebal.',
            'status'          => OrderStatus::WAITING_PROCESS,
            'payment_method'  => 'Transfer Bank',
            'created_by'      => $sales->id,
        ]);

        OrderItem::create([
            'order_id'       => $order1->id,
            'tree_code'      => 'GA',
            'tree_name'      => 'Golden Age',
            'grade'          => 'D+',
            'product_name'   => 'Golden Age',
            'variant'        => 'Grade D+',
            'quantity'       => 1,
            'price'          => 320000,
            'standard_price' => 350000,
            'discount'       => 30000,
            'notes'          => 'Bonggol meliuk indah',
        ]);
    }
}
