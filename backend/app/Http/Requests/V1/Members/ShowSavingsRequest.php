<?php

namespace App\Http\Requests\V1\Members;

use Illuminate\Foundation\Http\FormRequest;

class ShowSavingsRequest extends FormRequest
{
    public function authorize(): bool
    {
        // Allow if current user is an admin or requesting their own savings
        $user = $this->user();
        $member = $this->route('member');
        $memberId = $member?->id;

        if (! $user) {
            return false;
        }

        return in_array($user->role, ['admin', 'sacco_admin'], true)
            || ($memberId !== null && $user->id === (int) $memberId);
    }

    /**
     * Validation rules for showing member savings.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [];
    }
}
