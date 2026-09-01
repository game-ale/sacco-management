<?php

namespace App\Notifications;

use App\Models\Loan;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class GuarantorRequestNotification extends Notification
{
    use Queueable;

    public Loan $loan;
    public float $amountGuaranteed;

    /**
     * Create a new notification instance.
     */
    public function __construct(Loan $loan, float $amountGuaranteed)
    {
        $this->loan = $loan;
        $this->amountGuaranteed = $amountGuaranteed;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<string>
     */
    public function via(object $notifiable): array
    {
        return ['database'];
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toDatabase(object $notifiable): array
    {
        $applicantName = $this->loan->user->name ?? 'A SACCO member';

        return [
            'title' => 'Guarantee Request',
            'message' => "{$applicantName} requested you as a guarantor for a loan of ETB " . number_format((float) $this->loan->principal_amount, 2),
            'loan_id' => $this->loan->id,
            'type' => 'guarantor_request',
            'icon' => 'shield-alert'
        ];
    }
}
