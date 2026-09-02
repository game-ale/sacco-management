<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\PaymentRequest
 */
class PaymentRequestResource extends JsonResource
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
            'loan_id' => $this->loan_id,
            'loan_schedule_id' => $this->loan_schedule_id,
            'amount' => (float) $this->amount,
            'method' => $this->method,
            'payment_date' => $this->payment_date->toDateString(),
            'notes' => $this->notes,
            'status' => $this->status,
            'reviewed_by' => $this->reviewed_by,
            'reviewed_at' => $this->reviewed_at?->toIso8601String(),
            'rejection_reason' => $this->rejection_reason,
            'created_at' => $this->created_at?->toIso8601String(),
            'member' => new UserResource($this->whenLoaded('member')),
            'loan' => new LoanResource($this->whenLoaded('loan')),
            'loan_schedule' => new LoanScheduleResource($this->whenLoaded('loanSchedule')),
            'reviewer' => new UserResource($this->whenLoaded('reviewer')),
        ];
    }
}
