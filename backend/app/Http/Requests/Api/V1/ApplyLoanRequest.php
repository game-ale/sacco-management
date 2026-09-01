<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class ApplyLoanRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
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
            'purpose' => ['required', 'string'],
            'loan_type' => ['required', 'string'],
            'term_months' => ['required', 'integer', 'min:1'],
            'guarantor_id' => ['nullable', 'integer', 'exists:users,id'],
            'guarantor_ids' => ['nullable', 'array'],
            'guarantor_ids.*' => ['integer', 'exists:users,id'],
        ];
    }
}
