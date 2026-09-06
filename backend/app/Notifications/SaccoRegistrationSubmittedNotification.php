<?php

namespace App\Notifications;

use App\Models\Sacco;
use App\Models\User;
use Illuminate\Bus\Queueable;
use Illuminate\Notifications\Notification;

class SaccoRegistrationSubmittedNotification extends Notification
{
    use Queueable;

    public function __construct(
        public Sacco $sacco,
        public User $admin
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
        return [
            'title' => 'New SACCO Registration',
            'message' => $this->admin->name . ' submitted a new SACCO application for ' . $this->sacco->name . '.',
            'sacco_id' => $this->sacco->id,
            'type' => 'sacco_registration_submitted',
            'icon' => 'building-2',
        ];
    }
}
