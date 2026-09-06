<?php

namespace App\Notifications;

use App\Models\MembershipRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

class MembershipRequestApprovedNotification extends Notification implements ShouldQueue
{
    use Queueable;

    public MembershipRequest $membershipRequest;
    public string $activationUrl;

    public function __construct(MembershipRequest $membershipRequest, string $activationUrl)
    {
        $this->membershipRequest = $membershipRequest;
        $this->activationUrl = $activationUrl;
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

        return (new MailMessage)
            ->subject("Membership Request Approved - {$saccoName}")
            ->greeting("Hello {$this->membershipRequest->full_name},")
            ->line("Great news! Your membership request to join {$saccoName} has been approved.")
            ->line('To complete your registration and activate your account, please click the button below to set up your account details and password.')
            ->action('Activate Account', $this->activationUrl)
            ->line('This activation link is secure and will expire in 7 days.')
            ->line('If you did not submit a membership request, please ignore this email.');
    }
}
