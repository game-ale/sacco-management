<?php

namespace App\Http\Requests\V1;

use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Foundation\Http\FormRequest;

class SaccoRegistrationRequest extends FormRequest
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
            // SACCO Fields
            'sacco_name' => ['required', 'string', 'max:255'],
            'registration_number' => ['required', 'string', 'max:255', 'unique:saccos,registration_number'],

            // Admin User Fields
            'admin_name' => ['required', 'string', 'max:255'],
            'admin_email' => ['required', 'string', 'email', 'max:255', 'unique:users,email'],
            'admin_username' => ['required', 'string', 'max:255', 'unique:users,username'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'national_id' => ['required', 'string', 'max:255'],
            'region' => ['required', 'string', 'max:255'],
            'zone' => ['required', 'string', 'max:255'],
            'town' => ['required', 'string', 'max:255'],
        ];
    }
}
