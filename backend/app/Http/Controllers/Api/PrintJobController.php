<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrderPackage;
use App\Models\PrintJob;
use App\Models\PrintLayoutProfile;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class PrintJobController extends Controller
{
    /** Android App Link host. API hosting intentionally uses a different domain. */
    private const APP_LINK_BASE_URL = 'https://antaglomaflorist.id';

    public function create(Request $request): JsonResponse
    {
        $data = $request->validate([
            'document_type' => ['required', 'in:NOTA,SHIPPING_LABEL'],
            'package_id'    => ['required', 'integer', 'exists:order_packages,id'],
            'notes'         => ['nullable', 'string', 'max:4000'],
        ]);

        $package = OrderPackage::with(['order', 'items.item'])->findOrFail($data['package_id']);
        Gate::authorize('print', $package->order);

        $plainToken = Str::random(64);
        $job = PrintJob::create([
            'public_id'         => 'pj_' . Str::lower(Str::random(27)),
            'order_package_id'  => $package->id,
            'document_type'     => $data['document_type'],
            'notes_override'    => $data['document_type'] === 'NOTA' ? ($data['notes'] ?? '') : null,
            'token_hash'        => hash('sha256', $plainToken),
            'expires_at'        => now()->addMinutes(5),
        ]);

        $base = self::APP_LINK_BASE_URL;
        $appLink = "$base/print-jobs/{$job->public_id}?token=$plainToken";
        $windowsLink = "antaglomaprint://print-jobs/{$job->public_id}?token=$plainToken";

        return response()->json([
            'success' => true,
            'data' => [
                'job_id'           => $job->public_id,
                'token'            => $plainToken,
                'expires_at'       => $job->expires_at->toIso8601String(),
                'app_link'         => $appLink,
                'android_app_link' => $appLink,
                'windows_app_link' => $windowsLink,
            ],
        ], 201);
    }

    public function show(Request $request, string $jobId): JsonResponse
    {
        // Allow preview multiple times within 5-minute lifespan without prematurely consuming token
        $job = $this->authorizeToken($request, $jobId, false);
        $package = $job->package()->with(['order.creator', 'order.verifier', 'items.item'])->firstOrFail();
        $order = $package->order;

        $weight = $package->weight ?? $this->estimatePackageWeight($package);
        $canonicalData = [
            'id'             => $job->public_id,
            'job_id'         => $job->public_id,
            'document_type'  => $job->document_type,
            'order_number'   => $order->order_number . ($package->letter ? '-' . $package->letter : ''),
            'package_letter' => $package->letter,
            'package_type'   => $package->package_type ?? 'Fullset',
            'weight'         => $job->document_type === 'NOTA' ? $weight : null,
            'customer'       => $order->customer_name,
            'phone'          => $order->phone,
            'address'        => collect([$order->district_name, $order->regency_name, $order->province_name, $order->full_address])->filter()->implode(', '),
            'package_items'  => $package->items->map(fn ($item) => [
                'name'     => $this->itemNameWithGrade($item->item?->product_name ?? 'Tanaman', $item->item?->grade),
                'quantity' => $item->quantity,
            ])->values(),
            'notes'          => $job->notes_override ?? $order->notes ?? '',
            'sales'          => $order->creator?->name ?? 'Sales Staff',
            'admin'          => $order->verifier?->name ?? 'Admin',
            'layout_profile' => $job->layout_override ?? PrintLayoutProfile::where('document_type', $job->document_type)->value('layout') ?? [],
        ];

        return response()->json([
            'success' => true,
            'data'    => $canonicalData,
            ...$canonicalData,
        ]);
    }

    private function itemNameWithGrade(string $name, mixed $grade): string
    {
        $name = trim($name) ?: 'Tanaman';
        $name = preg_replace(
            '/\s*\(\s*Grade\s+([A-Z](?:\+)?|\d+)\s*\)\s*\(\s*Grade\s+\1\s*\)/i',
            ' (Grade $1)',
            $name
        ) ?? $name;
        $grade = trim((string) $grade);
        if ($grade === '') return $name;

        // Product names may already contain “(Grade C+)”; do not append it twice.
        return preg_match('/\(\s*grade\s+' . preg_quote($grade, '/') . '\s*\)/i', $name)
            ? $name
            : $name . ' (Grade ' . $grade . ')';
    }

    private function estimatePackageWeight(OrderPackage $package): ?float
    {
        $packageType = strtolower(trim((string) $package->package_type));
        $isFullset = $packageType === 'fullset';
        $total = 0.0;

        foreach ($package->items as $allocation) {
            $grade = strtoupper(trim((string) ($allocation->item?->grade ?? 'A')));
            $unit = $isFullset
                ? match ($grade) {
                    'D', 'D+' => 6.0,
                    'J' => 8.0,
                    'J+' => 10.0,
                    default => 1.0,
                }
                : match ($grade) {
                    'A' => 0.2,
                    'B' => 0.4,
                    'B+' => 0.5,
                    'C' => 0.6,
                    'C+' => 1.0,
                    'D', 'D+' => 2.0,
                    'J' => 4.0,
                    'J+' => 5.0,
                    default => 2.0,
                };
            $total += $unit * max(1, (int) $allocation->quantity);
        }

        return $total > 0 ? round($total, 2) : null;
    }

    public function result(Request $request, string $jobId): JsonResponse
    {
        $data = $request->validate([
            'status'          => ['required', 'in:PRINTED,FAILED'],
            'printer'         => ['nullable', 'string', 'max:255'],
            'items_succeeded' => ['array'],
            'items_failed'    => ['array'],
        ]);

        $job = $this->authorizeToken($request, $jobId, false);

        DB::transaction(function () use ($job, $data) {
            $isPrinted = $data['status'] === 'PRINTED';
            $job->update([
                'printed_at' => $isPrinted ? ($job->printed_at ?? now()) : null,
                'printer'    => $data['printer'] ?? $job->printer,
                'result'     => $data,
            ]);

            if ($isPrinted && $job->package) {
                $field = $job->document_type === 'NOTA' ? 'nota_printed' : 'label_printed';
                $at = $field . '_at';
                $job->package->update([
                    $field => true,
                    $at    => $job->package->{$at} ?? now(),
                ]);
            }
        });

        return response()->json(['success' => true]);
    }

    /** Scoped to the short-lived print-job token: updates layout for this job specifically. */
    public function layout(Request $request, string $jobId): JsonResponse
    {
        $data = $request->validate([
            'layout'         => ['required', 'array'],
            'layout.*.x'     => ['nullable', 'integer', 'between:-120,120'],
            'layout.*.y'     => ['nullable', 'integer', 'between:-120,120'],
            'layout.*.scale' => ['nullable', 'numeric', 'between:0.75,1.35'],
        ]);

        $job = $this->authorizeToken($request, $jobId, false);
        $job->update(['layout_override' => $data['layout']]);

        return response()->json(['success' => true, 'layout' => $job->layout_override]);
    }

    private function authorizeToken(Request $request, string $jobId, bool $consume): PrintJob
    {
        $token = $request->bearerToken();
        abort_unless($token, 401, 'Print-job token diperlukan.');

        $job = PrintJob::where('public_id', $jobId)
            ->where('token_hash', hash('sha256', $token))
            ->first();

        abort_unless($job && $job->expires_at->isFuture(), 401, 'Token print job tidak valid atau kedaluwarsa.');
        abort_if($consume && $job->consumed_at, 409, 'Token print job sudah digunakan.');

        if ($consume) {
            $job->update(['consumed_at' => now()]);
        }

        return $job;
    }
}
