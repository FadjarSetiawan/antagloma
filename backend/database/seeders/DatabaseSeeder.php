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

        // 3. Seed Master Trees (Official 59 Adenium Varieties No. 1 - 59)
        $trees = [
            ['code' => 'BA', 'name' => 'BLACK AMARILYS'],
            ['code' => 'BBR', 'name' => 'BANBURI'],
            ['code' => 'BD', 'name' => 'BUTTERFLY DREAM'],
            ['code' => 'B.EV', 'name' => 'BLACK EVIL'],
            ['code' => 'BF', 'name' => 'BINH FENH'],
            ['code' => 'BH', 'name' => 'BLACK HOLE'],
            ['code' => 'BLY', 'name' => 'BLUE LILY'],
            ['code' => 'BM', 'name' => 'BINH MINH'],
            ['code' => 'BNY', 'name' => 'BANYEN'],
            ['code' => 'BT9', 'name' => 'BAOTRAN 9'],
            ['code' => 'BL2', 'name' => 'BLACK LOVER 2'],
            ['code' => 'CAN', 'name' => 'CHOK AM NUAY'],
            ['code' => 'CHR', 'name' => 'CHERRY'],
            ['code' => 'CJ', 'name' => 'CRYSTAL JADE'],
            ['code' => 'CML', 'name' => 'CAMELIA'],
            ['code' => 'COY', 'name' => 'CHAMELION OF YELLOW'],
            ['code' => 'CV', 'name' => 'CHILLY VERMILION'],
            ['code' => 'DH2', 'name' => 'DUN HUANG 2'],
            ['code' => 'ETC', 'name' => 'ENTRANCING'],
            ['code' => 'FL2', 'name' => 'FIRST LOVE 2'],
            ['code' => 'GA', 'name' => 'GOLDEN AGE'],
            ['code' => 'GD', 'name' => 'GOLDEN DRAGON'],
            ['code' => 'GY', 'name' => 'GOLDEN YEARS'],
            ['code' => 'HG', 'name' => 'HOT GIRL'],
            ['code' => 'HK', 'name' => 'HOA KAHN'],
            ['code' => 'HL', 'name' => 'HONEY LEMON'],
            ['code' => 'HS', 'name' => 'HANGSOON'],
            ['code' => 'JC', 'name' => 'JULIUS CAESAR'],
            ['code' => 'JNT', 'name' => 'JANTA'],
            ['code' => 'KALEI', 'name' => 'KALEIDOSCOPE'],
            ['code' => 'LBT', 'name' => 'LIBERTY'],
            ['code' => 'LF', 'name' => 'LILAC FROST'],
            ['code' => 'LMT', 'name' => 'LUMINTANG'],
            ['code' => 'LR', 'name' => 'LOVE RAIN'],
            ['code' => 'LT', 'name' => 'LONG TANH'],
            ['code' => 'LYLA', 'name' => 'LYLA'],
            ['code' => 'MC', 'name' => 'MONGCAM'],
            ['code' => 'M.PCS', 'name' => 'MAGIC PRINCES'],
            ['code' => 'MQ', 'name' => 'MENG QIAN'],
            ['code' => 'MS', 'name' => 'MAGIC STAR'],
            ['code' => 'MSL', 'name' => 'MUSSELA'],
            ['code' => 'PC2', 'name' => 'PORCELINE 2'],
            ['code' => 'PL', 'name' => 'PRETTY LADY'],
            ['code' => 'PLK', 'name' => 'PURPLE LAKE'],
            ['code' => 'PMK', 'name' => 'PHET MON KON'],
            ['code' => 'PP', 'name' => 'PURPLE PUPIL'],
            ['code' => 'PRD', 'name' => 'PARADISE'],
            ['code' => 'QY', 'name' => 'QIAN YING'],
            ['code' => 'RNB', 'name' => 'RAINBOW'],
            ['code' => 'SL', 'name' => 'SWAN LAKE'],
            ['code' => 'SN', 'name' => 'STARLESS NIGHT'],
            ['code' => 'SRW', 'name' => 'SRIWIJAYA'],
            ['code' => 'SWL', 'name' => 'SWALLOW'],
            ['code' => 'T.BELL', 'name' => 'THE BELL'],
            ['code' => 'TRS', 'name' => 'TAURUS'],
            ['code' => 'TT', 'name' => 'TRUNG TINH'],
            ['code' => 'TW', 'name' => 'TRIPLE WISH'],
            ['code' => 'WINE', 'name' => 'WINE'],
            ['code' => 'YST', 'name' => 'YELLOW STUN'],
        ];

        foreach ($trees as $t) {
            MasterTree::updateOrCreate(['code' => $t['code']], $t);
        }
    }
}
