<?php

namespace App\Notifications;

use App\Models\MembershipRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class MembershipApplicationSubmittedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public MembershipRequest $membershipRequest
    ) {}

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
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
        $saccoName = $this->membershipRequest->sacco->name;

        return [
            'title' => 'New Membership Application',
            'message' => $this->membershipRequest->full_name . ' submitted a new membership application for ' . $saccoName . '.',
            'membership_request_id' => $this->membershipRequest->id,
            'sacco_id' => $this->membershipRequest->sacco_id,
            'type' => 'membership_application_submitted',
            'icon' => 'user-round-plus',
        ];
    }
}
