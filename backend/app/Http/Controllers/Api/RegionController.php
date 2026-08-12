<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Cache;

class RegionController extends Controller
{
    public function provinces(): JsonResponse
    {
        $data = Cache::remember('indonesia_provinces_v2', 86400 * 7, fn () => $this->localProvinces());

        return response()->json([
            'success' => true,
            'data'    => $data,
        ]);
    }

    public function regencies(string $provinceId): JsonResponse
    {
        $cacheKey = 'indonesia_regencies_' . $provinceId;
        $data = Cache::remember($cacheKey . '_v2', 86400 * 7, fn () => $this->localRegencies($provinceId));

        return response()->json([
            'success' => true,
            'data'    => $data,
        ]);
    }

    public function districts(string $regencyId): JsonResponse
    {
        $cacheKey = 'indonesia_districts_' . $regencyId;
        $data = Cache::remember($cacheKey . '_v2', 86400 * 7, fn () => $this->localDistricts($regencyId));

        return response()->json([
            'success' => true,
            'data'    => $data,
        ]);
    }

    protected function localProvinces(): array
    {
        return $this->readRegionCsv('provinces.csv', fn (string $id, string $name): array => [
            'id' => $id,
            'name' => mb_strtoupper($name),
        ]);
    }

    protected function localRegencies(string $provinceId): array
    {
        return array_values(array_filter($this->readRegionCsv('regencies.csv', function (string $id, string $name): array {
            return [
                'id' => $id,
                'province_id' => substr($id, 0, 2),
                'name' => mb_strtoupper($name),
            ];
        }), fn (array $item): bool => $item['province_id'] === (string) $provinceId));
    }

    protected function localDistricts(string $regencyId): array
    {
        return array_values(array_filter($this->readRegionCsv('districts.csv', function (string $id, string $name): array {
            return [
                'id' => $id,
                'regency_id' => substr($id, 0, 5),
                'name' => mb_strtoupper($name),
            ];
        }), fn (array $item): bool => $item['regency_id'] === (string) $regencyId));
    }

    private function readRegionCsv(string $filename, callable $map): array
    {
        $path = resource_path('data/regions/' . $filename);
        $handle = fopen($path, 'rb');
        if ($handle === false) {
            return [];
        }

        fgetcsv($handle);
        $result = [];
        while (($row = fgetcsv($handle)) !== false) {
            if (count($row) >= 2 && $row[0] !== '') {
                $result[] = $map((string) $row[0], (string) $row[1]);
            }
        }
        fclose($handle);

        return $result;
    }
}
