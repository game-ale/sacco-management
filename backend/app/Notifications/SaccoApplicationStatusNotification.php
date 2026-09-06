<?php

namespace App\Notifications;

use App\Models\Sacco;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class SaccoApplicationStatusNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Sacco $sacco,
        public string $status
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
        if ($this->status === 'approved') {
            return [
                'title' => 'SACCO Application Approved',
                'message' => 'Your SACCO application for ' . $this->sacco->name . ' has been approved.',
                'sacco_id' => $this->sacco->id,
                'type' => 'sacco_application_approved',
                'icon' => 'check-circle',
            ];
        }

        return [
            'title' => 'SACCO Application Rejected',
            'message' => 'Your SACCO application for ' . $this->sacco->name . ' was not approved. Please review the feedback and resubmit if needed.',
            'sacco_id' => $this->sacco->id,
            'type' => 'sacco_application_rejected',
            'icon' => 'x-circle',
        ];
    }
}
