<?php

namespace App\Notifications;

use App\Models\SavingsRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class SavingsRequestStatusNotification extends Notification
{
    use Queueable;

    public SavingsRequest $savingsRequest;
    public string $event; // 'submitted', 'approved', 'rejected'

    public function __construct(SavingsRequest $savingsRequest, string $event)
    {
        $this->savingsRequest = $savingsRequest;
        $this->event = $event;
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        $typeLabel = ucfirst($this->savingsRequest->type);
        $formattedAmount = number_format((float) $this->savingsRequest->amount, 2);

        if ($this->event === 'submitted') {
            $title = "New Savings {$typeLabel} Request";
            $message = "A member has requested a {$this->savingsRequest->type} of ETB {$formattedAmount}.";
        } elseif ($this->event === 'approved') {
            $title = "Savings {$typeLabel} Approved";
            $message = "Your {$this->savingsRequest->type} request of ETB {$formattedAmount} has been approved.";
        } else {
            $title = "Savings {$typeLabel} Rejected";
            $message = "Your {$this->savingsRequest->type} request of ETB {$formattedAmount} was rejected.";
            if ($this->savingsRequest->rejection_reason) {
                $message .= " Reason: {$this->savingsRequest->rejection_reason}";
            }
        }

        return [
            'title' => $title,
            'message' => $message,
            'savings_request_id' => $this->savingsRequest->id,
            'type' => 'savings_request',
            'status' => $this->savingsRequest->status,
            'icon' => $this->event === 'approved' ? 'check-circle' : ($this->event === 'rejected' ? 'x-circle' : 'piggy-bank')
        ];
    }
}
