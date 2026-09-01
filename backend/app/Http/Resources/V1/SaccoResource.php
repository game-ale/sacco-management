<?php

namespace App\Http\Resources\V1;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read int $id
 * @property-read string $name
 * @property-read string $registration_number
 * @property-read string $status
 * @property-read string|null $rejection_reason
 * @property-read Carbon|null $created_at
 * @property-read Carbon|null $updated_at
 */
class SaccoResource extends JsonResource
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
            'registration_number' => $this->registration_number,
            'status' => $this->status,
            'rejection_reason' => $this->rejection_reason,
            'members_count' => $this->whenCounted('users'),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
