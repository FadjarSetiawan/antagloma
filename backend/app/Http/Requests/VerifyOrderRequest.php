<?php

namespace App\Http\Requests;

use Illuminate\Foundation\Http\FormRequest;

class VerifyOrderRequest extends FormRequest
{
    public function authorize(): bool
    {
        $role = $this->user()?->role;
        $roleValue = $role instanceof \BackedEnum ? $role->value : $role;
        return in_array($roleValue, ['admin', 'owner']);
    }

    public function rules(): array
    {
        return [
            'approve' => ['required', 'boolean'],
        ];
    }
}
