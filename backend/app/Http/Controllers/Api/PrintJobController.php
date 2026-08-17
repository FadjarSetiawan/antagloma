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
    private const APP_LINK_BASE_URL = 'https://floristyan.web.id';

    public function create(Request $request): JsonResponse
    {
        $data = $request->validate(['document_type' => ['required', 'in:NOTA,SHIPPING_LABEL'], 'package_id' => ['required', 'integer', 'exists:order_packages,id'], 'notes' => ['nullable', 'string', 'max:4000']]);
        $package = OrderPackage::with(['order', 'items.item'])->findOrFail($data['package_id']);
        Gate::authorize('approve', $package->order);
        $plainToken = Str::random(64);
        // Column is UUID-sized (36 chars). Keep the public `pj_` prefix while staying below that limit.
        $job = PrintJob::create(['public_id' => 'pj_'.Str::lower(Str::random(27)), 'order_package_id' => $package->id, 'document_type' => $data['document_type'], 'notes_override' => $data['document_type'] === 'NOTA' ? ($data['notes'] ?? '') : null, 'token_hash' => hash('sha256', $plainToken), 'expires_at' => now()->addMinutes(5)]);
        // Do not use APP_URL here: this Laravel backend is hosted at florist.kaizoratech.com,
        // while Android App Links are verified by the customer-facing floristyan.web.id domain.
        $base = self::APP_LINK_BASE_URL;
        return response()->json(['success' => true, 'data' => ['job_id' => $job->public_id, 'token' => $plainToken, 'expires_at' => $job->expires_at->toIso8601String(), 'app_link' => "$base/print-jobs/{$job->public_id}?token=$plainToken"]], 201);
    }

    public function show(Request $request, string $jobId): JsonResponse
    {
        $job = $this->authorizeToken($request, $jobId, true);
        $package = $job->package()->with(['order.creator', 'order.verifier', 'items.item'])->firstOrFail(); $order = $package->order;
        return response()->json(['job_id' => $job->public_id, 'document_type' => $job->document_type, 'order_number' => $order->order_number.'-'.$package->letter, 'package_letter' => $package->letter, 'package_type' => $package->package_type, 'customer' => $order->customer_name, 'phone' => $order->phone, 'address' => collect([$order->district_name, $order->regency_name, $order->province_name, $order->full_address])->filter()->implode(', '), 'package_items' => $package->items->map(fn ($item) => ['name' => $item->item?->product_name ?? 'Tanaman', 'quantity' => $item->quantity])->values(), 'notes' => $job->notes_override ?? $order->notes ?? '', 'sales' => $order->creator?->name, 'admin' => $order->verifier?->name, 'layout_profile' => PrintLayoutProfile::where('document_type', $job->document_type)->value('layout') ?? []]);
    }

    public function result(Request $request, string $jobId): JsonResponse
    {
        $data = $request->validate(['status' => ['required', 'in:PRINTED,FAILED'], 'printer' => ['nullable', 'string', 'max:255'], 'items_succeeded' => ['array'], 'items_failed' => ['array']]);
        $job = $this->authorizeToken($request, $jobId, false);
        DB::transaction(function () use ($job, $data) { $job->update(['printed_at' => $data['status'] === 'PRINTED' ? now() : null, 'printer' => $data['printer'] ?? null, 'result' => $data]); if ($data['status'] === 'PRINTED') { $field = $job->document_type === 'NOTA' ? 'nota_printed' : 'label_printed'; $at = $field.'_at'; $job->package->update([$field => true, $at => now()]); } });
        return response()->json(['success' => true]);
    }

    /** Scoped to the short-lived print-job token; no general public layout write exists. */
    public function layout(Request $request, string $jobId): JsonResponse
    {
        $data = $request->validate(['layout' => ['required', 'array'], 'layout.*.x' => ['nullable', 'integer', 'between:-120,120'], 'layout.*.y' => ['nullable', 'integer', 'between:-120,120'], 'layout.*.scale' => ['nullable', 'numeric', 'between:0.75,1.35']]);
        $job = $this->authorizeToken($request, $jobId, false);
        $profile = PrintLayoutProfile::updateOrCreate(['document_type' => $job->document_type], ['layout' => $data['layout']]);
        return response()->json(['success' => true, 'layout' => $profile->layout]);
    }

    private function authorizeToken(Request $request, string $jobId, bool $consume): PrintJob
    {
        $token = $request->bearerToken(); abort_unless($token, 401, 'Print-job token diperlukan.');
        $job = PrintJob::where('public_id', $jobId)->where('token_hash', hash('sha256', $token))->first();
        abort_unless($job && $job->expires_at->isFuture(), 401, 'Token print job tidak valid atau kedaluwarsa.');
        abort_if($consume && $job->consumed_at, 409, 'Token print job sudah digunakan.');
        if ($consume) $job->update(['consumed_at' => now()]);
        return $job;
    }
}
