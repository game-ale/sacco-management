<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Sacco
 */
class SaccoSettingsResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'name' => $this->name,
            'registration_number' => $this->registration_number,
            'email' => $this->email,
            'phone' => $this->phone,
            'address' => $this->address,
            'share_value' => (float) $this->share_value,
            'currency' => $this->currency ?? 'KES',
            'default_interest_rate' => (float) $this->default_interest_rate,
            'max_loan_amount' => (float) $this->max_loan_amount,
            'max_loan_term' => (int) $this->max_loan_term,
            'loan_to_savings_ratio' => (float) $this->loan_to_savings_ratio,
            'min_shares_per_member' => (int) $this->min_shares_per_member,
            'late_fee_percentage' => (float) ($this->late_fee_percentage ?? 0),
            'is_public' => (bool) $this->is_public,
            'is_accepting_members' => (bool) $this->is_accepting_members,
            'show_share_info' => (bool) $this->show_share_info,
            'is_directory_allowed' => (bool) $this->is_directory_allowed,
            'logo_path' => $this->logo_path,
            'description' => $this->description,
            'location' => $this->location,
            'category' => $this->category,
            'eligibility_criteria' => $this->eligibility_criteria,
            'contact_email' => $this->contact_email,
            'contact_phone' => $this->contact_phone,
            'min_shares' => (int) ($this->min_shares ?? 1),
        ];
    }
}
