<?php

namespace App\Notifications;

use App\Models\PaymentRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class PaymentRequestStatusNotification extends Notification
{
    use Queueable;

    public PaymentRequest $paymentRequest;
    public string $event; // 'submitted', 'approved', 'rejected'

    public function __construct(PaymentRequest $paymentRequest, string $event)
    {
        $this->paymentRequest = $paymentRequest;
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
        $formattedAmount = number_format((float) $this->paymentRequest->amount, 2);

        if ($this->event === 'submitted') {
            $title = "New Payment Request";
            $message = "A member has submitted a payment request of ETB {$formattedAmount}.";
        } elseif ($this->event === 'approved') {
            $title = "Payment Request Approved";
            $message = "Your loan payment request of ETB {$formattedAmount} has been approved.";
        } else {
            $title = "Payment Request Rejected";
            $message = "Your loan payment request of ETB {$formattedAmount} was rejected.";
            if ($this->paymentRequest->rejection_reason) {
                $message .= " Reason: {$this->paymentRequest->rejection_reason}";
            }
        }

        return [
            'title' => $title,
            'message' => $message,
            'payment_request_id' => $this->paymentRequest->id,
            'loan_id' => $this->paymentRequest->loan_id,
            'type' => 'payment_request',
            'status' => $this->paymentRequest->status,
            'icon' => $this->event === 'approved' ? 'check-circle' : ($this->event === 'rejected' ? 'x-circle' : 'credit-card')
        ];
    }
}
