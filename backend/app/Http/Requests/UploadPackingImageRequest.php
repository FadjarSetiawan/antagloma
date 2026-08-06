<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class UploadPackingImageRequest extends FormRequest
{
    public function authorize(): bool
    {
        $role = $this->user()?->role;
        $roleValue = $role instanceof \BackedEnum ? $role->value : $role;
        return in_array($roleValue, ['packing', 'admin', 'owner']);
    }

    public function rules(): array
    {
        return [
            'image' => [
                'required',
                'file',
                'image',
                'mimes:jpg,jpeg,png,webp',
                'max:5120', // 5MB limit
            ],
            'notes' => ['nullable', 'string', 'max:500'],
        ];
    }
}
