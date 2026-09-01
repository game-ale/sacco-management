<?php

namespace App\Notifications;

use App\Models\Loan;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class GuarantorResponseNotification extends Notification
{
    use Queueable;

    public Loan $loan;
    public User $guarantor;
    public string $action; // 'accepted' or 'rejected'

    /**
     * Create a new notification instance.
     */
    public function __construct(Loan $loan, User $guarantor, string $action)
    {
        $this->loan = $loan;
        $this->guarantor = $guarantor;
        $this->action = $action;
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
        $statusText = $this->action === 'accepted' ? 'accepted' : 'rejected';

        return [
            'title' => "Guarantee Request {$statusText}",
            'message' => "{$this->guarantor->name} has {$statusText} your guarantee request for loan {$this->loan->loan_number}.",
            'loan_id' => $this->loan->id,
            'type' => 'guarantor_response',
            'icon' => $this->action === 'accepted' ? 'check-circle' : 'x-circle'
        ];
    }
}
