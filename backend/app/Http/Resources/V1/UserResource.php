<?php

namespace App\Http\Resources\V1;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read int $id
 * @property-read string $name
 * @property-read string $email
 * @property-read string $username
 * @property-read string|null $role
 * @property-read int|null $sacco_id
 * @property-read \App\Models\Sacco|null $sacco
 * @property-read Carbon|null $email_verified_at
 * @property-read string|null $phone
 * @property-read string $role
 * @property-read int $sacco_id
 * @property-read int|null $num_shares
 * @property-read float|null $savings_balance
 * @property-read bool $is_active
 * @property-read string|null $national_id
 * @property-read string|null $region
 * @property-read string|null $zone
 * @property-read string|null $town
 * @property-read bool $must_change_password
 * @property-read Carbon|null $email_verified_at
 * @property-read Carbon|null $created_at
 * @property-read Carbon|null $updated_at
 */
class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'name' => $this->name,
            'email' => $this->email,
            'phone' => $this->phone,
            'username' => $this->username,
            'role' => $this->role,
            'sacco_id' => $this->sacco_id,
            'sacco_name' => $this->sacco ? $this->sacco->name : null,
            'sacco_status' => $this->sacco ? $this->sacco->status : null,
            'sacco' => $this->sacco ? [
                'id' => $this->sacco->id,
                'name' => $this->sacco->name,
                'registration_number' => $this->sacco->registration_number,
                'status' => $this->sacco->status,
                'share_value' => (float) ($this->sacco->share_value ?? 100),
            ] : null,
            'national_id' => $this->national_id,
            'region' => $this->region,
            'zone' => $this->zone,
            'town' => $this->town,
            'num_shares' => (int) ($this->num_shares ?? 0),
            'savings_balance' => (float) ($this->savings_balance ?? 0),
            'is_active' => (bool) ($this->is_active ?? true),
            'must_change_password' => (bool) $this->must_change_password,
            'email_verified_at' => $this->email_verified_at?->toDateTimeString(),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
