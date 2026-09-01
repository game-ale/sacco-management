<?php

namespace App\Http\Requests\V1\Members;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class DepositSavingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        $role = $this->user()?->role;

        return in_array($role, ['sacco_admin', 'admin'], true);
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, ValidationRule|array<mixed>|string>
     */
    public function rules(): array
    {
        return [
            'amount' => ['required', 'numeric', 'gt:0'],
            'description' => ['nullable', 'string', 'max:255'],
            'transaction_date' => ['required', 'date'],
        ];
    }
}
