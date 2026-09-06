<?php

namespace App\Http\Resources\V1;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Sacco
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
            'is_public' => (bool) $this->is_public,
            'is_accepting_members' => (bool) $this->is_accepting_members,
            'is_directory_allowed' => (bool) $this->is_directory_allowed,
            'members_count' => $this->whenCounted('users'),
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
