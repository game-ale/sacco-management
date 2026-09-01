<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read mixed $transaction
 * @property-read float|null $new_balance
 */
class MemberSavingsActionResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @param  mixed  $request
     * @return array<string, mixed>
     */
    public function toArray($request): array
    {
        return [
            'transaction' => SavingsTransactionResource::make($this->transaction),
            'new_balance' => (float) ($this->new_balance ?? 0),
        ];
    }
}
