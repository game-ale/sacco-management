<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Resources\Json\JsonResource;

class MemberSavingsResource extends JsonResource
{
    /**
     * @param  mixed  $request
     * @return array<string, mixed>
     */
    public function toArray($request): array
    {
        $transactions = $this->transactions ?? [];

        return [
            'balance' => (float) ($this->balance ?? 0),
            'transactions' => SavingsTransactionResource::collection($transactions)->response()->getData(true),
        ];
    }
}
