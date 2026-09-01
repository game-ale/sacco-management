<?php

namespace App\Notifications;

use App\Models\Loan;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;
use Illuminate\Notifications\Messages\DatabaseMessage;

class LoanApplicationSubmitted extends Notification
{
    use Queueable;

    public Loan $loan;

    /**
     * Create a new notification instance.
     */
    public function __construct(Loan $loan)
    {
        $this->loan = $loan;
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
        $memberName = $this->loan->user->name ?? 'A member';
        
        return [
            'title' => 'New Loan Application',
            'message' => "{$memberName} has applied for a loan of ETB " . number_format($this->loan->principal_amount, 2),
            'loan_id' => $this->loan->id,
            'type' => 'loan_application',
            'icon' => 'file-text'
        ];
    }
}
