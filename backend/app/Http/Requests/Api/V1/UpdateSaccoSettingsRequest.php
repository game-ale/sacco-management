<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdateSaccoSettingsRequest extends FormRequest
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
            'name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'address' => ['sometimes', 'nullable', 'string'],
            'share_value' => ['sometimes', 'numeric', 'gt:0'],
            'currency' => ['sometimes', 'string', 'max:10'],
            'default_interest_rate' => ['sometimes', 'numeric', 'min:0'],
            'max_loan_amount' => ['sometimes', 'numeric', 'min:0'],
            'max_loan_term' => ['sometimes', 'integer', 'min:1'],
            'loan_to_savings_ratio' => ['sometimes', 'numeric', 'min:0'],
            'min_shares_per_member' => ['sometimes', 'integer', 'min:0'],
            'late_fee_percentage' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'is_public' => ['sometimes', 'boolean'],
            'is_accepting_members' => ['sometimes', 'boolean'],
            'show_share_info' => ['sometimes', 'boolean'],
            'logo_path' => ['sometimes', 'nullable', 'string', 'max:255'],
            'description' => ['sometimes', 'nullable', 'string'],
            'location' => ['sometimes', 'nullable', 'string', 'max:255'],
            'category' => ['sometimes', 'nullable', 'string', 'max:255'],
            'eligibility_criteria' => ['sometimes', 'nullable', 'string'],
            'contact_email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'contact_phone' => ['sometimes', 'nullable', 'string', 'max:50'],
            'min_shares' => ['sometimes', 'integer', 'min:1'],
        ];
    }
}
