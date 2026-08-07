<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;

class RegionController extends Controller
{
    public function provinces(): JsonResponse
    {
        $data = Cache::remember('indonesia_provinces', 86400 * 7, function () {
            try {
                $response = Http::timeout(4)->get('https://emsifa.github.io/api-wilayah-indonesia/api/provinces.json');
                if ($response->successful()) {
                    return array_map(function ($item) {
                        return [
                            'id'   => (string) $item['id'],
                            'name' => mb_strtoupper($item['name']),
                        ];
                    }, $response->json());
                }
            } catch (\Throwable $e) {
                // Fallback to local
            }

            return $this->localProvinces();
        });

        return response()->json([
            'success' => true,
            'data'    => $data,
        ]);
    }

    public function regencies(string $provinceId): JsonResponse
    {
        $cacheKey = 'indonesia_regencies_' . $provinceId;
        $data = Cache::remember($cacheKey, 86400 * 7, function () use ($provinceId) {
            try {
                $response = Http::timeout(4)->get("https://emsifa.github.io/api-wilayah-indonesia/api/regencies/{$provinceId}.json");
                if ($response->successful()) {
                    return array_map(function ($item) {
                        return [
                            'id'          => (string) $item['id'],
                            'province_id' => (string) $item['province_id'],
                            'name'        => mb_strtoupper($item['name']),
                        ];
                    }, $response->json());
                }
            } catch (\Throwable $e) {
                // Fallback to local
            }

            return $this->localRegencies($provinceId);
        });

        return response()->json([
            'success' => true,
            'data'    => $data,
        ]);
    }

    public function districts(string $regencyId): JsonResponse
    {
        $cacheKey = 'indonesia_districts_' . $regencyId;
        $data = Cache::remember($cacheKey, 86400 * 7, function () use ($regencyId) {
            try {
                $response = Http::timeout(4)->get("https://emsifa.github.io/api-wilayah-indonesia/api/districts/{$regencyId}.json");
                if ($response->successful()) {
                    return array_map(function ($item) {
                        return [
                            'id'         => (string) $item['id'],
                            'regency_id' => (string) $item['regency_id'],
                            'name'       => mb_strtoupper($item['name']),
                        ];
                    }, $response->json());
                }
            } catch (\Throwable $e) {
                // Fallback to local
            }

            return $this->localDistricts($regencyId);
        });

        return response()->json([
            'success' => true,
            'data'    => $data,
        ]);
    }

    protected function localProvinces(): array
    {
        return [
            ['id' => '11', 'name' => 'ACEH'],
            ['id' => '12', 'name' => 'SUMATERA UTARA'],
            ['id' => '13', 'name' => 'SUMATERA BARAT'],
            ['id' => '14', 'name' => 'RIAU'],
            ['id' => '15', 'name' => 'JAMBI'],
            ['id' => '16', 'name' => 'SUMATERA SELATAN'],
            ['id' => '17', 'name' => 'BENGKULU'],
            ['id' => '18', 'name' => 'LAMPUNG'],
            ['id' => '19', 'name' => 'KEPULAUAN BANGKA BELITUNG'],
            ['id' => '21', 'name' => 'KEPULAUAN RIAU'],
            ['id' => '31', 'name' => 'DKI JAKARTA'],
            ['id' => '32', 'name' => 'JAWA BARAT'],
            ['id' => '33', 'name' => 'JAWA TENGAH'],
            ['id' => '34', 'name' => 'DI YOGYAKARTA'],
            ['id' => '35', 'name' => 'JAWA TIMUR'],
            ['id' => '36', 'name' => 'BANTEN'],
            ['id' => '51', 'name' => 'BALI'],
            ['id' => '52', 'name' => 'NUSA TENGGARA BARAT'],
            ['id' => '53', 'name' => 'NUSA TENGGARA TIMUR'],
            ['id' => '61', 'name' => 'KALIMANTAN BARAT'],
            ['id' => '62', 'name' => 'KALIMANTAN TENGAH'],
            ['id' => '63', 'name' => 'KALIMANTAN SELATAN'],
            ['id' => '64', 'name' => 'KALIMANTAN TIMUR'],
            ['id' => '65', 'name' => 'KALIMANTAN UTARA'],
            ['id' => '71', 'name' => 'SULAWESI UTARA'],
            ['id' => '72', 'name' => 'SULAWESI TENGAH'],
            ['id' => '73', 'name' => 'SULAWESI SELATAN'],
            ['id' => '74', 'name' => 'SULAWESI TENGGARA'],
            ['id' => '75', 'name' => 'GORONTALO'],
            ['id' => '76', 'name' => 'SULAWESI BARAT'],
            ['id' => '81', 'name' => 'MALUKU'],
            ['id' => '82', 'name' => 'MALUKU UTARA'],
            ['id' => '91', 'name' => 'PAPUA'],
            ['id' => '92', 'name' => 'PAPUA BARAT'],
            ['id' => '93', 'name' => 'PAPUA SELATAN'],
            ['id' => '94', 'name' => 'PAPUA TENGAH'],
            ['id' => '95', 'name' => 'PAPUA PEGUNUNGAN'],
            ['id' => '96', 'name' => 'PAPUA BARAT DAYA'],
        ];
    }

    protected function localRegencies(string $provinceId): array
    {
        return [
            ['id' => $provinceId . '01', 'name' => 'KOTA / KABUPATEN UTAMA'],
            ['id' => $provinceId . '02', 'name' => 'KABUPATEN BARAT'],
            ['id' => $provinceId . '03', 'name' => 'KABUPATEN TIMUR'],
        ];
    }

    protected function localDistricts(string $regencyId): array
    {
        return [
            ['id' => $regencyId . '01', 'name' => 'KECAMATAN PUSAT KOTA'],
            ['id' => $regencyId . '02', 'name' => 'KECAMATAN SELATAN'],
            ['id' => $regencyId . '03', 'name' => 'KECAMATAN UTARA'],
        ];
    }
}
