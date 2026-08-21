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
use Illuminate\Support\Facades\DB;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // 1. Seed Users (Official @antaglomaflorist.id)
        $users = [
            ['email' => 'owner@antaglomaflorist.id', 'name' => 'Owner Antagloma', 'password' => Hash::make('hOyhxKx4wfNdf_0e'), 'role' => 'owner'],
            ['email' => 'admin@antaglomaflorist.id', 'name' => 'Admin Operasional', 'password' => Hash::make('dY!YWQmd2E+UeeM~'), 'role' => 'admin'],
            ['email' => 'sales@antaglomaflorist.id', 'name' => 'Sales Staff', 'password' => Hash::make('7XyY)..GrfzkEx7O'), 'role' => 'sales'],
            ['email' => 'packing@antaglomaflorist.id', 'name' => 'Packing Specialist', 'password' => Hash::make('dY!YWQmd2E+UeeM~'), 'role' => 'packing'],
        ];

        foreach ($users as $u) {
            User::updateOrCreate(['email' => $u['email']], $u);
        }

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

        // 3. Force clean old master_trees data to exactly 59 official rows
        DB::table('master_trees')->delete();

        // 4. Seed Official 59 Adenium Varieties No. 1 - 59
        $trees = [
            ['id' => 1,  'code' => 'BA',     'name' => 'BLACK AMARILYS'],
            ['id' => 2,  'code' => 'BBR',    'name' => 'BANBURI'],
            ['id' => 3,  'code' => 'BD',     'name' => 'BUTTERFLY DREAM'],
            ['id' => 4,  'code' => 'B.EV',   'name' => 'BLACK EVIL'],
            ['id' => 5,  'code' => 'BF',     'name' => 'BINH FENH'],
            ['id' => 6,  'code' => 'BH',     'name' => 'BLACK HOLE'],
            ['id' => 7,  'code' => 'BLY',    'name' => 'BLUE LILY'],
            ['id' => 8,  'code' => 'BM',     'name' => 'BINH MINH'],
            ['id' => 9,  'code' => 'BNY',    'name' => 'BANYEN'],
            ['id' => 10, 'code' => 'BT9',    'name' => 'BAOTRAN 9'],
            ['id' => 11, 'code' => 'BL2',    'name' => 'BLACK LOVER 2'],
            ['id' => 12, 'code' => 'CAN',    'name' => 'CHOK AM NUAY'],
            ['id' => 13, 'code' => 'CHR',    'name' => 'CHERRY'],
            ['id' => 14, 'code' => 'CJ',     'name' => 'CRYSTAL JADE'],
            ['id' => 15, 'code' => 'CML',    'name' => 'CAMELIA'],
            ['id' => 16, 'code' => 'COY',    'name' => 'CHAMELION OF YELLOW'],
            ['id' => 17, 'code' => 'CV',     'name' => 'CHILLY VERMILION'],
            ['id' => 18, 'code' => 'DH2',    'name' => 'DUN HUANG 2'],
            ['id' => 19, 'code' => 'ETC',    'name' => 'ENTRANCING'],
            ['id' => 20, 'code' => 'FL2',    'name' => 'FIRST LOVE 2'],
            ['id' => 21, 'code' => 'GA',     'name' => 'GOLDEN AGE'],
            ['id' => 22, 'code' => 'GD',     'name' => 'GOLDEN DRAGON'],
            ['id' => 23, 'code' => 'GY',     'name' => 'GOLDEN YEARS'],
            ['id' => 24, 'code' => 'HG',     'name' => 'HOT GIRL'],
            ['id' => 25, 'code' => 'HK',     'name' => 'HOA KAHN'],
            ['id' => 26, 'code' => 'HL',     'name' => 'HONEY LEMON'],
            ['id' => 27, 'code' => 'HS',     'name' => 'HANGSOON'],
            ['id' => 28, 'code' => 'JC',     'name' => 'JULIUS CAESAR'],
            ['id' => 29, 'code' => 'JNT',    'name' => 'JANTA'],
            ['id' => 30, 'code' => 'KALEI',  'name' => 'KALEIDOSCOPE'],
            ['id' => 31, 'code' => 'LBT',    'name' => 'LIBERTY'],
            ['id' => 32, 'code' => 'LF',     'name' => 'LILAC FROST'],
            ['id' => 33, 'code' => 'LMT',    'name' => 'LUMINTANG'],
            ['id' => 34, 'code' => 'LR',     'name' => 'LOVE RAIN'],
            ['id' => 35, 'code' => 'LT',     'name' => 'LONG TANH'],
            ['id' => 36, 'code' => 'LYLA',   'name' => 'LYLA'],
            ['id' => 37, 'code' => 'MC',     'name' => 'MONGCAM'],
            ['id' => 38, 'code' => 'M.PCS',  'name' => 'MAGIC PRINCES'],
            ['id' => 39, 'code' => 'MQ',     'name' => 'MENG QIAN'],
            ['id' => 40, 'code' => 'MS',     'name' => 'MAGIC STAR'],
            ['id' => 41, 'code' => 'MSL',    'name' => 'MUSSELA'],
            ['id' => 42, 'code' => 'PC2',    'name' => 'PORCELINE 2'],
            ['id' => 43, 'code' => 'PL',     'name' => 'PRETTY LADY'],
            ['id' => 44, 'code' => 'PLK',    'name' => 'PURPLE LAKE'],
            ['id' => 45, 'code' => 'PMK',    'name' => 'PHET MON KON'],
            ['id' => 46, 'code' => 'PP',     'name' => 'PURPLE PUPIL'],
            ['id' => 47, 'code' => 'PRD',    'name' => 'PARADISE'],
            ['id' => 48, 'code' => 'QY',     'name' => 'QIAN YING'],
            ['id' => 49, 'code' => 'RNB',    'name' => 'RAINBOW'],
            ['id' => 50, 'code' => 'SL',     'name' => 'SWAN LAKE'],
            ['id' => 51, 'code' => 'SN',     'name' => 'STARLESS NIGHT'],
            ['id' => 52, 'code' => 'SRW',    'name' => 'SRIWIJAYA'],
            ['id' => 53, 'code' => 'SWL',    'name' => 'SWALLOW'],
            ['id' => 54, 'code' => 'T.BELL', 'name' => 'THE BELL'],
            ['id' => 55, 'code' => 'TRS',    'name' => 'TAURUS'],
            ['id' => 56, 'code' => 'TT',     'name' => 'TRUNG TINH'],
            ['id' => 57, 'code' => 'TW',     'name' => 'TRIPLE WISH'],
            ['id' => 58, 'code' => 'WINE',   'name' => 'WINE'],
            ['id' => 59, 'code' => 'YST',    'name' => 'YELLOW STUN'],
        ];

        foreach ($trees as $t) {
            $t['created_at'] = now();
            $t['updated_at'] = now();
            DB::table('master_trees')->insert($t);
        }
    }
}
