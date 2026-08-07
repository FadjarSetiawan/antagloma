<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class RegionController extends Controller
{
    protected array $provinces = [
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

    protected array $regencies = [
        '11' => [
            ['id' => '1171', 'name' => 'KOTA BANDA ACEH'],
            ['id' => '1172', 'name' => 'KOTA SABANG'],
            ['id' => '1173', 'name' => 'KOTA LHOKSEUMAWE'],
            ['id' => '1174', 'name' => 'KOTA LANGSA'],
            ['id' => '1175', 'name' => 'KOTA SUBULUSSALAM'],
            ['id' => '1101', 'name' => 'KABUPATEN ACEH SELATAN'],
            ['id' => '1106', 'name' => 'KABUPATEN ACEH BESAR'],
            ['id' => '1107', 'name' => 'KABUPATEN PIDIE'],
        ],
        '12' => [
            ['id' => '1271', 'name' => 'KOTA MEDAN'],
            ['id' => '1272', 'name' => 'KOTA PEMATANG SIANTAR'],
            ['id' => '1273', 'name' => 'KOTA SIBOLGA'],
            ['id' => '1274', 'name' => 'KOTA TANJUNG BALAI'],
            ['id' => '1275', 'name' => 'KOTA BINJAI'],
            ['id' => '1276', 'name' => 'KOTA TEBING TINGGI'],
            ['id' => '1277', 'name' => 'KOTA PADANG SIDEMPUAN'],
            ['id' => '1278', 'name' => 'KOTA GUNUNGSITOLI'],
            ['id' => '1207', 'name' => 'KABUPATEN DELI SERDANG'],
            ['id' => '1212', 'name' => 'KABUPATEN TOBA'],
            ['id' => '1218', 'name' => 'KABUPATEN SERDANG BEDAGAI'],
        ],
        '13' => [
            ['id' => '1371', 'name' => 'KOTA PADANG'],
            ['id' => '1372', 'name' => 'KOTA SOLOK'],
            ['id' => '1373', 'name' => 'KOTA SAWAKLUNTO'],
            ['id' => '1374', 'name' => 'KOTA PADANG PANJANG'],
            ['id' => '1375', 'name' => 'KOTA BUKITTINGGI'],
            ['id' => '1376', 'name' => 'KOTA PAYAKUMBUH'],
            ['id' => '1377', 'name' => 'KOTA PARIAMAN'],
            ['id' => '1306', 'name' => 'KABUPATEN AGAM'],
        ],
        '14' => [
            ['id' => '1471', 'name' => 'KOTA PEKANBARU'],
            ['id' => '1473', 'name' => 'KOTA DUMAI'],
            ['id' => '1401', 'name' => 'KABUPATEN KAMPAR'],
            ['id' => '1403', 'name' => 'KABUPATEN BENGKALIS'],
            ['id' => '1408', 'name' => 'KABUPATEN SIAK'],
        ],
        '15' => [
            ['id' => '1571', 'name' => 'KOTA JAMBI'],
            ['id' => '1572', 'name' => 'KOTA SUNGAI PENUH'],
            ['id' => '1501', 'name' => 'KABUPATEN KERINCI'],
            ['id' => '1502', 'name' => 'KABUPATEN MERANGIN'],
        ],
        '16' => [
            ['id' => '1671', 'name' => 'KOTA PALEMBANG'],
            ['id' => '1672', 'name' => 'KOTA PRABUMULIH'],
            ['id' => '1673', 'name' => 'KOTA PAGAR ALAM'],
            ['id' => '1674', 'name' => 'KOTA LUBUK LINGGAU'],
            ['id' => '1602', 'name' => 'KABUPATEN OGAN KOMERING ILIR'],
            ['id' => '1606', 'name' => 'KABUPATEN MUSI BANYUASIN'],
        ],
        '17' => [
            ['id' => '1771', 'name' => 'KOTA BENGKULU'],
            ['id' => '1701', 'name' => 'KABUPATEN BENGKULU SELATAN'],
            ['id' => '1702', 'name' => 'KABUPATEN REJANG LEBONG'],
        ],
        '18' => [
            ['id' => '1871', 'name' => 'KOTA BANDAR LAMPUNG'],
            ['id' => '1872', 'name' => 'KOTA METRO'],
            ['id' => '1801', 'name' => 'KABUPATEN LAMPUNG SELATAN'],
            ['id' => '1802', 'name' => 'KABUPATEN LAMPUNG TENGAH'],
        ],
        '19' => [
            ['id' => '1971', 'name' => 'KOTA PANGKAL PINANG'],
            ['id' => '1901', 'name' => 'KABUPATEN BANGKA'],
            ['id' => '1902', 'name' => 'KABUPATEN BELITUNG'],
        ],
        '21' => [
            ['id' => '2171', 'name' => 'KOTA BATAM'],
            ['id' => '2172', 'name' => 'KOTA TANJUNG PINANG'],
            ['id' => '2101', 'name' => 'KABUPATEN BINTAN'],
            ['id' => '2102', 'name' => 'KABUPATEN KARIMUN'],
        ],
        '31' => [
            ['id' => '3171', 'name' => 'KOTA ADM JAKARTA SELATAN'],
            ['id' => '3172', 'name' => 'KOTA ADM JAKARTA TIMUR'],
            ['id' => '3173', 'name' => 'KOTA ADM JAKARTA PUSAT'],
            ['id' => '3174', 'name' => 'KOTA ADM JAKARTA BARAT'],
            ['id' => '3175', 'name' => 'KOTA ADM JAKARTA UTARA'],
            ['id' => '3101', 'name' => 'KABUPATEN ADM KEPULAUAN SERIBU'],
        ],
        '32' => [
            ['id' => '3273', 'name' => 'KOTA BANDUNG'],
            ['id' => '3275', 'name' => 'KOTA BEKASI'],
            ['id' => '3276', 'name' => 'KOTA DEPOK'],
            ['id' => '3271', 'name' => 'KOTA BOGOR'],
            ['id' => '3272', 'name' => 'KOTA SUKABUMI'],
            ['id' => '3274', 'name' => 'KOTA CIREBON'],
            ['id' => '3277', 'name' => 'KOTA CIMAHI'],
            ['id' => '3278', 'name' => 'KOTA TASIKMALAYA'],
            ['id' => '3279', 'name' => 'KOTA BANJAR'],
            ['id' => '3201', 'name' => 'KABUPATEN BOGOR'],
            ['id' => '3204', 'name' => 'KABUPATEN BANDUNG'],
            ['id' => '3216', 'name' => 'KABUPATEN BEKASI'],
            ['id' => '3217', 'name' => 'KABUPATEN BANDUNG BARAT'],
        ],
        '33' => [
            ['id' => '3374', 'name' => 'KOTA SEMARANG'],
            ['id' => '3372', 'name' => 'KOTA SURAKARTA (SOLO)'],
            ['id' => '3371', 'name' => 'KOTA MAGELANG'],
            ['id' => '3373', 'name' => 'KOTA SALATIGA'],
            ['id' => '3375', 'name' => 'KOTA PEKALONGAN'],
            ['id' => '3376', 'name' => 'KOTA TEGAL'],
            ['id' => '3302', 'name' => 'KABUPATEN BANYUMAS'],
            ['id' => '3310', 'name' => 'KABUPATEN KLATEN'],
            ['id' => '3313', 'name' => 'KABUPATEN KARANGANYAR'],
            ['id' => '3322', 'name' => 'KABUPATEN SEMARANG'],
        ],
        '34' => [
            ['id' => '3471', 'name' => 'KOTA YOGYAKARTA'],
            ['id' => '3404', 'name' => 'KABUPATEN SLEMAN'],
            ['id' => '3402', 'name' => 'KABUPATEN BANTUL'],
            ['id' => '3401', 'name' => 'KABUPATEN KULON PROGO'],
            ['id' => '3403', 'name' => 'KABUPATEN GUNUNGKIDUL'],
        ],
        '35' => [
            ['id' => '3578', 'name' => 'KOTA SURABAYA'],
            ['id' => '3573', 'name' => 'KOTA MALANG'],
            ['id' => '3571', 'name' => 'KOTA KEDIRI'],
            ['id' => '3572', 'name' => 'KOTA BLITAR'],
            ['id' => '3574', 'name' => 'KOTA PROBOLINGGO'],
            ['id' => '3575', 'name' => 'KOTA PASURUAN'],
            ['id' => '3576', 'name' => 'KOTA MOJOKERTO'],
            ['id' => '3577', 'name' => 'KOTA MADIUN'],
            ['id' => '3579', 'name' => 'KOTA BATU'],
            ['id' => '3515', 'name' => 'KABUPATEN SIDOARJO'],
            ['id' => '3525', 'name' => 'KABUPATEN GRESIK'],
            ['id' => '3507', 'name' => 'KABUPATEN MALANG'],
            ['id' => '3506', 'name' => 'KABUPATEN KEDIRI'],
            ['id' => '3509', 'name' => 'KABUPATEN JEMBER'],
            ['id' => '3510', 'name' => 'KABUPATEN BANYUWANGI'],
        ],
        '36' => [
            ['id' => '3671', 'name' => 'KOTA TANGERANG'],
            ['id' => '3674', 'name' => 'KOTA TANGERANG SELATAN'],
            ['id' => '3672', 'name' => 'KOTA CILEGON'],
            ['id' => '3673', 'name' => 'KOTA SERANG'],
            ['id' => '3603', 'name' => 'KABUPATEN TANGERANG'],
            ['id' => '3604', 'name' => 'KABUPATEN SERANG'],
            ['id' => '3602', 'name' => 'KABUPATEN LEBAK'],
            ['id' => '3601', 'name' => 'KABUPATEN PANDEGLANG'],
        ],
        '51' => [
            ['id' => '5171', 'name' => 'KOTA DENPASAR'],
            ['id' => '5103', 'name' => 'KABUPATEN BADUNG'],
            ['id' => '5104', 'name' => 'KABUPATEN GIANYAR'],
            ['id' => '5106', 'name' => 'KABUPATEN BANGLI'],
            ['id' => '5108', 'name' => 'KABUPATEN BULELENG'],
            ['id' => '5102', 'name' => 'KABUPATEN TABANAN'],
        ],
        '52' => [
            ['id' => '5271', 'name' => 'KOTA MATARAM'],
            ['id' => '5272', 'name' => 'KOTA BIMA'],
            ['id' => '5201', 'name' => 'KABUPATEN LOMBOK BARAT'],
            ['id' => '5202', 'name' => 'KABUPATEN LOMBOK TENGAH'],
            ['id' => '5203', 'name' => 'KABUPATEN LOMBOK TIMUR'],
        ],
        '53' => [
            ['id' => '5371', 'name' => 'KOTA KUPANG'],
            ['id' => '5301', 'name' => 'KABUPATEN KUPANG'],
            ['id' => '5302', 'name' => 'KABUPATEN TIMOR TENGAH SELATAN'],
            ['id' => '5315', 'name' => 'KABUPATEN MANGGARAI BARAT'],
        ],
        '61' => [
            ['id' => '6171', 'name' => 'KOTA PONTIANAK'],
            ['id' => '6172', 'name' => 'KOTA SINGKAWANG'],
            ['id' => '6102', 'name' => 'KABUPATEN MEMPAWAH'],
            ['id' => '6112', 'name' => 'KABUPATEN KUBU RAYA'],
        ],
        '62' => [
            ['id' => '6271', 'name' => 'KOTA PALANGKA RAYA'],
            ['id' => '6201', 'name' => 'KABUPATEN KOTAWARINGIN BARAT'],
            ['id' => '6202', 'name' => 'KABUPATEN KOTAWARINGIN TIMUR'],
        ],
        '63' => [
            ['id' => '6371', 'name' => 'KOTA BANJARMASIN'],
            ['id' => '6372', 'name' => 'KOTA BANJARBARU'],
            ['id' => '6303', 'name' => 'KABUPATEN BANJAR'],
        ],
        '64' => [
            ['id' => '6471', 'name' => 'KOTA BALIKPAPAN'],
            ['id' => '6472', 'name' => 'KOTA SAMARINDA'],
            ['id' => '6474', 'name' => 'KOTA BONTANG'],
            ['id' => '6402', 'name' => 'KABUPATEN KUTAI KARTANEGARA'],
        ],
        '65' => [
            ['id' => '6571', 'name' => 'KOTA TARAKAN'],
            ['id' => '6501', 'name' => 'KABUPATEN BULUNGAN'],
            ['id' => '6503', 'name' => 'KABUPATEN NUNUKAN'],
        ],
        '71' => [
            ['id' => '7171', 'name' => 'KOTA MANADO'],
            ['id' => '7172', 'name' => 'KOTA BITUNG'],
            ['id' => '7173', 'name' => 'KOTA TOMOHON'],
            ['id' => '7174', 'name' => 'KOTA KOTAMOBAGU'],
            ['id' => '7102', 'name' => 'KABUPATEN MINAHASA'],
        ],
        '72' => [
            ['id' => '7271', 'name' => 'KOTA PALU'],
            ['id' => '7201', 'name' => 'KABUPATEN BANGGAI'],
            ['id' => '7202', 'name' => 'KABUPATEN POSO'],
        ],
        '73' => [
            ['id' => '7371', 'name' => 'KOTA MAKASSAR'],
            ['id' => '7372', 'name' => 'KOTA PAREPARE'],
            ['id' => '7373', 'name' => 'KOTA PALOPO'],
            ['id' => '7306', 'name' => 'KABUPATEN GOWA'],
            ['id' => '7309', 'name' => 'KABUPATEN MAROS'],
            ['id' => '7310', 'name' => 'KABUPATEN PANGKAJENE DAN KEPULAUAN'],
        ],
        '74' => [
            ['id' => '7471', 'name' => 'KOTA KENDARI'],
            ['id' => '7472', 'name' => 'KOTA BAUBAU'],
            ['id' => '7403', 'name' => 'KABUPATEN KONAWE'],
        ],
        '75' => [
            ['id' => '7571', 'name' => 'KOTA GORONTALO'],
            ['id' => '7501', 'name' => 'KABUPATEN GORONTALO'],
            ['id' => '7502', 'name' => 'KABUPATEN BOALEMO'],
        ],
        '76' => [
            ['id' => '7602', 'name' => 'KABUPATEN MAMUJU'],
            ['id' => '7601', 'name' => 'KABUPATEN PASANGKAYU'],
            ['id' => '7604', 'name' => 'KABUPATEN POLEWALI MANDAR'],
        ],
        '81' => [
            ['id' => '8171', 'name' => 'KOTA AMBON'],
            ['id' => '8172', 'name' => 'KOTA TUAL'],
            ['id' => '8101', 'name' => 'KABUPATEN MALUKU TENGAH'],
        ],
        '82' => [
            ['id' => '8271', 'name' => 'KOTA TERNATE'],
            ['id' => '8272', 'name' => 'KOTA TIDORE KEPULAUAN'],
            ['id' => '8201', 'name' => 'KABUPATEN HALMAHERA BARAT'],
        ],
        '91' => [
            ['id' => '9171', 'name' => 'KOTA JAYAPURA'],
            ['id' => '9103', 'name' => 'KABUPATEN JAYAPURA'],
            ['id' => '9106', 'name' => 'KABUPATEN BIAK NUMFOR'],
        ],
        '92' => [
            ['id' => '9201', 'name' => 'KABUPATEN MANOKWARI'],
            ['id' => '9202', 'name' => 'KABUPATEN FAKFAK'],
        ],
        '93' => [
            ['id' => '9301', 'name' => 'KABUPATEN MERAUKE'],
            ['id' => '9302', 'name' => 'KABUPATEN BOVEN DIGOEL'],
        ],
        '94' => [
            ['id' => '9401', 'name' => 'KABUPATEN NABIRE'],
            ['id' => '9402', 'name' => 'KABUPATEN MIMIKA'],
        ],
        '95' => [
            ['id' => '9501', 'name' => 'KABUPATEN JAYAWIJAYA'],
            ['id' => '9502', 'name' => 'KABUPATEN LANNY JAYA'],
        ],
        '96' => [
            ['id' => '9671', 'name' => 'KOTA SORONG'],
            ['id' => '9601', 'name' => 'KABUPATEN SORONG'],
            ['id' => '9602', 'name' => 'KABUPATEN RAJA AMPAT'],
        ],
    ];

    protected array $districts = [
        '3171' => [
            ['id' => '317101', 'name' => 'KEBAYORAN BARU'],
            ['id' => '317102', 'name' => 'KEBAYORAN LAMA'],
            ['id' => '317103', 'name' => 'CILANDAK'],
            ['id' => '317104', 'name' => 'PANCORAN'],
            ['id' => '317105', 'name' => 'TEBET'],
            ['id' => '317106', 'name' => 'PASAR MINGGU'],
            ['id' => '317107', 'name' => 'JAGAKARSA'],
            ['id' => '317108', 'name' => 'PESANGGRAHAN'],
        ],
        '3172' => [
            ['id' => '317201', 'name' => 'MATRAMAN'],
            ['id' => '317202', 'name' => 'JATINEGARA'],
            ['id' => '317203', 'name' => 'DUREN SAWIT'],
            ['id' => '317204', 'name' => 'KRAMAT JATI'],
            ['id' => '317205', 'name' => 'PASAR REBO'],
            ['id' => '317206', 'name' => 'CAKUNG'],
        ],
        '3173' => [
            ['id' => '317301', 'name' => 'TANAH ABANG'],
            ['id' => '317302', 'name' => 'MENTENG'],
            ['id' => '317303', 'name' => 'GAMBIR'],
            ['id' => '317304', 'name' => 'SENEN'],
            ['id' => '317305', 'name' => 'CEMPAKA PUTIH'],
            ['id' => '317306', 'name' => 'JOHAR BARU'],
        ],
        '3273' => [
            ['id' => '327301', 'name' => 'COBLONG'],
            ['id' => '327302', 'name' => 'SUMUR BANDUNG'],
            ['id' => '327303', 'name' => 'CICENDO'],
            ['id' => '327304', 'name' => 'BANDUNG WETAN'],
            ['id' => '327305', 'name' => 'LENGKONG'],
        ],
        '3276' => [
            ['id' => '327601', 'name' => 'MARGONDA'],
            ['id' => '327602', 'name' => 'CINERE'],
            ['id' => '327603', 'name' => 'BEJI'],
            ['id' => '327604', 'name' => 'PANCORAN MAS'],
            ['id' => '327605', 'name' => 'CIMANGGIS'],
            ['id' => '327606', 'name' => 'SAWANGAN'],
        ],
        '3578' => [
            ['id' => '357801', 'name' => 'WONOKROMO'],
            ['id' => '357802', 'name' => 'TEBALSARI'],
            ['id' => '357803', 'name' => 'GUBENG'],
            ['id' => '357804', 'name' => 'SUKOLILO'],
            ['id' => '357805', 'name' => 'RUNGKUT'],
            ['id' => '357806', 'name' => 'JAMBANGAN'],
        ],
        '5171' => [
            ['id' => '517101', 'name' => 'DENPASAR SELATAN'],
            ['id' => '517102', 'name' => 'DENPASAR TIMUR'],
            ['id' => '517103', 'name' => 'DENPASAR BARAT'],
            ['id' => '517104', 'name' => 'DENPASAR UTARA'],
        ],
        '1271' => [
            ['id' => '127101', 'name' => 'MEDAN KOTA'],
            ['id' => '127102', 'name' => 'MEDAN BARAT'],
            ['id' => '127103', 'name' => 'MEDAN TIMUR'],
            ['id' => '127104', 'name' => 'MEDAN HELVETIA'],
        ],
        '7371' => [
            ['id' => '737101', 'name' => 'PANAKKUKANG'],
            ['id' => '737102', 'name' => 'UJUNG PANDANG'],
            ['id' => '737103', 'name' => 'TAMALANREA'],
            ['id' => '737104', 'name' => 'RAPPOCINI'],
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
        $province = collect($this->provinces)->firstWhere('id', $provinceId);
        $provinceName = $province ? $province['name'] : 'WILAYAH';

        $data = $this->regencies[$provinceId] ?? [
            ['id' => $provinceId . '01', 'name' => 'KOTA / KABUPATEN UTAMA (' . $provinceName . ')'],
            ['id' => $provinceId . '02', 'name' => 'KABUPATEN SELATAN (' . $provinceName . ')'],
            ['id' => $provinceId . '03', 'name' => 'KABUPATEN UTARA (' . $provinceName . ')'],
        ];

        return response()->json([
            'success' => true,
            'data'    => $data,
        ]);
    }

    public function districts(string $regencyId): JsonResponse
    {
        $data = $this->districts[$regencyId] ?? [
            ['id' => $regencyId . '01', 'name' => 'KECAMATAN PUSAT KOTA'],
            ['id' => $regencyId . '02', 'name' => 'KECAMATAN SELATAN'],
            ['id' => $regencyId . '03', 'name' => 'KECAMATAN UTARA'],
            ['id' => $regencyId . '04', 'name' => 'KECAMATAN BARAT'],
            ['id' => $regencyId . '05', 'name' => 'KECAMATAN TIMUR'],
        ];

        return response()->json([
            'success' => true,
            'data'    => $data,
        ]);
    }
}
