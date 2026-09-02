<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\SavingsRequest
 */
class SavingsRequestResource extends JsonResource
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
            'sacco_id' => $this->sacco_id,
            'member_id' => $this->member_id,
            'type' => $this->type,
            'amount' => (float) $this->amount,
            'description' => $this->description,
            'status' => $this->status,
            'reviewed_by' => $this->reviewed_by,
            'reviewed_at' => $this->reviewed_at?->toIso8601String(),
            'rejection_reason' => $this->rejection_reason,
            'created_at' => $this->created_at?->toIso8601String(),
            'member' => new UserResource($this->whenLoaded('member')),
            'reviewer' => new UserResource($this->whenLoaded('reviewer')),
        ];
    }
}
