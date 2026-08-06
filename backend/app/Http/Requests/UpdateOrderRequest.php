<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UpdateOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        return true; // Authorize in Policy
    }

    public function rules(): array
    {
        return [
            'customer_name' => ['sometimes', 'required', 'string', 'max:255'],
            'phone'         => ['sometimes', 'required', 'string', 'regex:/^[0-9+\-\s]{9,20}$/'],
            'address'       => ['sometimes', 'required', 'string'],
            'product'       => ['sometimes', 'required', 'string'],
            'notes'         => ['nullable', 'string', 'max:1000'],
            'status'        => ['sometimes', 'string'],
        ];
    }
}
