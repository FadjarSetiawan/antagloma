<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RegionController extends Controller
{
    protected array $provinces = [
        ['id' => '31', 'name' => 'DKI JAKARTA'],
        ['id' => '32', 'name' => 'JAWA BARAT'],
        ['id' => '33', 'name' => 'JAWA TENGAH'],
        ['id' => '34', 'name' => 'DI YOGYAKARTA'],
        ['id' => '35', 'name' => 'JAWA TIMUR'],
        ['id' => '36', 'name' => 'BANTEN'],
        ['id' => '51', 'name' => 'BALI'],
        ['id' => '12', 'name' => 'SUMATERA UTARA'],
    ];

    protected array $regencies = [
        '31' => [
            ['id' => '3171', 'name' => 'KOTA ADM JAKARTA SELATAN'],
            ['id' => '3172', 'name' => 'KOTA ADM JAKARTA TIMUR'],
            ['id' => '3173', 'name' => 'KOTA ADM JAKARTA PUSAT'],
            ['id' => '3174', 'name' => 'KOTA ADM JAKARTA BARAT'],
            ['id' => '3175', 'name' => 'KOTA ADM JAKARTA UTARA'],
        ],
        '32' => [
            ['id' => '3273', 'name' => 'KOTA BANDUNG'],
            ['id' => '3275', 'name' => 'KOTA BEKASI'],
            ['id' => '3276', 'name' => 'KOTA DEPOK'],
            ['id' => '3204', 'name' => 'KABUPATEN BANDUNG'],
            ['id' => '3201', 'name' => 'KABUPATEN BOGOR'],
        ],
        '33' => [
            ['id' => '3374', 'name' => 'KOTA SEMARANG'],
            ['id' => '3372', 'name' => 'KOTA SURAKARTA (SOLO)'],
        ],
        '34' => [
            ['id' => '3471', 'name' => 'KOTA YOGYAKARTA'],
            ['id' => '3404', 'name' => 'KABUPATEN SLEMAN'],
            ['id' => '3402', 'name' => 'KABUPATEN BANTUL'],
        ],
        '35' => [
            ['id' => '3578', 'name' => 'KOTA SURABAYA'],
            ['id' => '3573', 'name' => 'KOTA MALANG'],
            ['id' => '3515', 'name' => 'KABUPATEN SIDOARJO'],
        ],
        '36' => [
            ['id' => '3671', 'name' => 'KOTA TANGERANG'],
            ['id' => '3674', 'name' => 'KOTA TANGERANG SELATAN'],
        ],
        '51' => [
            ['id' => '5171', 'name' => 'KOTA DENPASAR'],
            ['id' => '5103', 'name' => 'KABUPATEN BADUNG'],
        ],
        '12' => [
            ['id' => '1275', 'name' => 'KOTA MEDAN'],
        ],
    ];

    protected array $districts = [
        '3171' => [
            ['id' => '317101', 'name' => 'KEBAYORAN BARU'],
            ['id' => '317102', 'name' => 'KEBAYORAN LAMA'],
            ['id' => '317103', 'name' => 'CILANDAK'],
            ['id' => '317104', 'name' => 'PANCORAN'],
            ['id' => '317105', 'name' => 'TEBET'],
        ],
        '3173' => [
            ['id' => '317301', 'name' => 'TANAH ABANG'],
            ['id' => '317302', 'name' => 'MENTENG'],
            ['id' => '317303', 'name' => 'GAMBIR'],
        ],
        '3273' => [
            ['id' => '327301', 'name' => 'COBLONG'],
            ['id' => '327302', 'name' => 'SUMUR BANDUNG'],
            ['id' => '327303', 'name' => 'CICENDO'],
        ],
        '3276' => [
            ['id' => '327601', 'name' => 'MARGINDA'],
            ['id' => '327602', 'name' => 'CINERE'],
            ['id' => '327603', 'name' => 'BEJI'],
        ],
    ];

    public function provinces(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data'    => $this->provinces,
        ]);
    }

    public function regencies(string $provinceId): JsonResponse
    {
        $data = $this->regencies[$provinceId] ?? [
            ['id' => $provinceId . '01', 'name' => 'KOTA / KABUPATEN UTAMA'],
        ];

        return response()->json([
            'success' => true,
            'data'    => $data,
        ]);
    }

    public function districts(string $regencyId): JsonResponse
    {
        $data = $this->districts[$regencyId] ?? [
            ['id' => $regencyId . '01', 'name' => 'KECAMATAN UTAMA'],
        ];

        return response()->json([
            'success' => true,
            'data'    => $data,
        ]);
    }
}
