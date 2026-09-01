<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read string|null $name
 * @property-read string|null $registration_number
 * @property-read string|null $email
 * @property-read string|null $phone
 * @property-read string|null $address
 * @property-read float|int|string $share_value
 * @property-read string|null $currency
 * @property-read float|int|string $default_interest_rate
 * @property-read float|int|string $max_loan_amount
 * @property-read int $max_loan_term
 * @property-read float|int|string $loan_to_savings_ratio
 * @property-read int $min_shares_per_member
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
        ];
    }
}
