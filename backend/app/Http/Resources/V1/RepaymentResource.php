<?php

namespace App\Http\Resources\V1;

use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @property-read int $id
 * @property-read int $sacco_id
 * @property-read int $loan_id
 * @property-read int $loan_schedule_id
 * @property-read float $amount
 * @property-read Carbon $paid_at
 * @property-read string $method
 * @property-read int $recorded_by
 * @property-read Carbon|null $created_at
 * @property-read Carbon|null $updated_at
 */
class RepaymentResource extends JsonResource
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
            'loan_id' => $this->loan_id,
            'loan_schedule_id' => $this->loan_schedule_id,
            'amount' => (float) $this->amount,
            'paid_at' => $this->paid_at->toDateString(),
            'method' => $this->method,
            'recorded_by' => $this->recorded_by,
            'created_at' => $this->created_at?->toDateTimeString(),
            'updated_at' => $this->updated_at?->toDateTimeString(),
        ];
    }
}
