<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\OrderPackage;
use App\Models\PrintJob;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Str;

class PrintJobController extends Controller
{
    public function create(Request $request): JsonResponse
    {
        $data = $request->validate(['document_type' => ['required', 'in:NOTA,SHIPPING_LABEL'], 'package_id' => ['required', 'integer', 'exists:order_packages,id']]);
        $package = OrderPackage::with(['order', 'items.item'])->findOrFail($data['package_id']);
        Gate::authorize('approve', $package->order);
        $plainToken = Str::random(64);
        $job = PrintJob::create(['public_id' => 'pj_'.Str::lower((string) Str::uuid()), 'order_package_id' => $package->id, 'document_type' => $data['document_type'], 'token_hash' => hash('sha256', $plainToken), 'expires_at' => now()->addMinutes(5)]);
        $base = rtrim(config('app.url'), '/');
        return response()->json(['success' => true, 'data' => ['job_id' => $job->public_id, 'token' => $plainToken, 'expires_at' => $job->expires_at->toIso8601String(), 'app_link' => "$base/print-jobs/{$job->public_id}?token=$plainToken"]], 201);
    }

    public function show(Request $request, string $jobId): JsonResponse
    {
        $job = $this->authorizeToken($request, $jobId, true);
        $package = $job->package()->with(['order.creator', 'order.verifier', 'items.item'])->firstOrFail(); $order = $package->order;
        return response()->json(['job_id' => $job->public_id, 'document_type' => $job->document_type, 'order_number' => $order->order_number.'-'.$package->letter, 'package_letter' => $package->letter, 'package_type' => $package->package_type, 'customer' => $order->customer_name, 'phone' => $order->phone, 'address' => collect([$order->district_name, $order->regency_name, $order->province_name, $order->full_address])->filter()->implode(', '), 'package_items' => $package->items->map(fn ($item) => ['name' => $item->item?->product_name ?? 'Tanaman', 'quantity' => $item->quantity])->values(), 'notes' => $order->notes ?? '', 'sales' => $order->creator?->name, 'admin' => $order->verifier?->name]);
    }

    public function result(Request $request, string $jobId): JsonResponse
    {
        $data = $request->validate(['status' => ['required', 'in:PRINTED,FAILED'], 'printer' => ['nullable', 'string', 'max:255'], 'items_succeeded' => ['array'], 'items_failed' => ['array']]);
        $job = $this->authorizeToken($request, $jobId, false);
        DB::transaction(function () use ($job, $data) { $job->update(['printed_at' => $data['status'] === 'PRINTED' ? now() : null, 'printer' => $data['printer'] ?? null, 'result' => $data]); if ($data['status'] === 'PRINTED') { $field = $job->document_type === 'NOTA' ? 'nota_printed' : 'label_printed'; $at = $field.'_at'; $job->package->update([$field => true, $at => now()]); } });
        return response()->json(['success' => true]);
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
