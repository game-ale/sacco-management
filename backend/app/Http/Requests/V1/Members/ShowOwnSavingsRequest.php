<?php

namespace App\Http\Requests\V1\Members;

use Illuminate\Foundation\Http\FormRequest;

class ShowOwnSavingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        return $this->user()?->role === 'member';
    }

    /**
     * Validation rules for showing own savings.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [];
    }
}
