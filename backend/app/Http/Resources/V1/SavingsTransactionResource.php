<?php

namespace App\Http\Resources\V1;

use App\Models\SavingsTransaction;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin SavingsTransaction
 */
class SavingsTransactionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  Request  $request
     * @return array<string, mixed>
     */
    public function toArray($request): array
    {
        return [
            'id' => $this->id,
            'type' => $this->type,
            'amount' => (float) $this->amount,
            'balance_after' => $this->balance_after !== null ? (float) $this->balance_after : null,
            'description' => $this->description,
            'date' => $this->created_at?->toIso8601String(),
        ];
    }
}
