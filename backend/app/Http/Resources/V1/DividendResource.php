<?php

namespace App\Http\Resources\V1;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read int $id
 * @property-read int $sacco_id
 * @property-read int $user_id
 * @property-read string $period
 * @property-read int $num_shares
 * @property-read float $share_pct
 * @property-read float $amount
 * @property-read float $total_pool
 * @property-read Carbon|null $created_at
 * @property-read Carbon|null $updated_at
 */
class DividendResource extends JsonResource
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
            'member_id' => $this->user_id,
            'period' => $this->period,
            'num_shares' => (int) $this->num_shares,
            'share_pct' => (float) $this->share_pct,
            'amount' => (float) $this->amount,
            'total_pool' => (float) $this->total_pool,
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
