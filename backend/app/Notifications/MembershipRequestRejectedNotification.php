<?php

namespace App\Notifications;

use App\Models\MembershipRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MembershipRequestRejectedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public MembershipRequest $membershipRequest;

    public function __construct(MembershipRequest $membershipRequest)
    {
        $this->membershipRequest = $membershipRequest;
    }

    /**
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail'];
    }

    public function toMail(object $notifiable): MailMessage
    {
        $saccoName = $this->membershipRequest->sacco->name ?? 'SACCO';

        $mail = (new MailMessage)
            ->subject("Membership Request Update - {$saccoName}")
            ->greeting("Hello {$this->membershipRequest->full_name},")
            ->line("Thank you for your interest in joining {$saccoName}.")
            ->line("We regret to inform you that your membership application could not be approved at this time.");

        if ($this->membershipRequest->rejection_reason) {
            $mail->line("Reason: {$this->membershipRequest->rejection_reason}");
        }

        $mail->line('If you have any questions or require further details, please contact the SACCO administration.');

        return $mail;
    }
}
