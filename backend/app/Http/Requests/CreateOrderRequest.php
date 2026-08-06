<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class CreateOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        $role = $this->user()?->role;
        $roleValue = $role instanceof \BackedEnum ? $role->value : $role;
        return in_array($roleValue, ['sales', 'admin', 'owner']);
    }

    protected function prepareForValidation(): void
    {
        if ($this->has('items') && is_string($this->input('items'))) {
            $decoded = json_decode($this->input('items'), true);
            if (is_array($decoded)) {
                $this->merge([
                    'items' => $decoded,
                ]);
            }
        }
    }

    public function rules(): array
    {
        return [
            'order_date'          => ['nullable', 'date'],
            'customer_name'       => ['required', 'string', 'max:255'],
            'phone'               => ['required', 'string', 'max:50'],
            'delivery_method'     => ['required', 'string'],
            'province_id'         => ['nullable', 'string'],
            'province_name'       => ['nullable', 'string'],
            'regency_id'          => ['nullable', 'string'],
            'regency_name'        => ['nullable', 'string'],
            'district_id'         => ['nullable', 'string'],
            'district_name'       => ['nullable', 'string'],
            'full_address'        => ['required', 'string'],
            'notes'               => ['nullable', 'string', 'max:1000'],
            'payment_method'      => ['required', 'string', 'in:Transfer Bank,QRIS,Tunai'],
            'bank_name'           => ['nullable', 'string', 'in:BCA,BRI'],
            'buyer_shipping_cost' => ['nullable', 'numeric', 'min:0'],
            'payment_proof'       => ['nullable', 'file', 'image', 'mimes:jpeg,jpg,png,webp', 'max:5120'],
            'items'               => ['required', 'array', 'min:1'],
            'items.*.product_name' => ['nullable', 'string', 'max:255'],
            'items.*.tree_code'    => ['nullable', 'string', 'max:20'],
            'items.*.tree_name'    => ['nullable', 'string', 'max:255'],
            'items.*.grade'        => ['nullable', 'string', 'max:10'],
            'items.*.quantity'     => ['nullable', 'integer', 'min:1'],
            'items.*.price'        => ['nullable', 'numeric', 'min:0'],
            'items.*.standard_price' => ['nullable', 'numeric', 'min:0'],
            'items.*.discount'     => ['nullable', 'numeric', 'min:0'],
            'items.*.notes'        => ['nullable', 'string', 'max:500'],
        ];
    }
}
