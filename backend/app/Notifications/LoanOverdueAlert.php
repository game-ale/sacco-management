<?php

namespace App\Notifications;

use App\Models\LoanSchedule;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class LoanOverdueAlert extends Notification
{
    use Queueable;

    public LoanSchedule $schedule;

    /**
     * Create a new notification instance.
     */
    public function __construct(LoanSchedule $schedule)
    {
        $this->schedule = $schedule;
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
        $memberName = $this->schedule->loan->user->name ?? 'A member';
        $loanNumber = $this->schedule->loan->loan_number ?? 'Unknown';
        
        return [
            'title' => 'Loan Installment Overdue',
            'message' => "{$memberName} has an overdue installment for loan {$loanNumber}.",
            'schedule_id' => $this->schedule->id,
            'loan_id' => $this->schedule->loan_id,
            'type' => 'loan_overdue',
            'icon' => 'alert-circle'
        ];
    }
}
