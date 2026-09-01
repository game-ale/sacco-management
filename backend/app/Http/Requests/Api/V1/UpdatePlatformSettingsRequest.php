<?php

namespace App\Http\Requests\Api\V1;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class UpdatePlatformSettingsRequest extends FormRequest
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
            // Registration Settings
            'auto_approve_saccos' => ['sometimes', 'boolean'],
            'require_registration_verification' => ['sometimes', 'boolean'],
            'max_saccos_allowed' => ['sometimes', 'nullable', 'integer', 'min:1'],

            // Default SACCO Settings
            'default_interest_rate' => ['sometimes', 'numeric', 'min:0', 'max:100'],
            'default_share_value' => ['sometimes', 'numeric', 'min:0'],
            'default_loan_to_savings_ratio' => ['sometimes', 'numeric', 'min:0'],

            // Email Notification Preferences
            'notify_new_sacco_registration' => ['sometimes', 'boolean'],
            'notify_sacco_milestone' => ['sometimes', 'boolean'],
            'weekly_platform_summary' => ['sometimes', 'boolean'],

            // Platform Branding
            'platform_name' => ['sometimes', 'string', 'max:255'],
            'support_email' => ['sometimes', 'nullable', 'email', 'max:255'],
            'terms_of_service_url' => ['sometimes', 'nullable', 'url', 'max:500'],
            'privacy_policy_url' => ['sometimes', 'nullable', 'url', 'max:500'],
        ];
    }
}
