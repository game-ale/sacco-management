<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PlatformSetting extends Model
{
    protected $fillable = [
        // Registration Settings
        'auto_approve_saccos',
        'require_registration_verification',
        'max_saccos_allowed',

        // Default SACCO Settings
        'default_interest_rate',
        'default_share_value',
        'default_loan_to_savings_ratio',

        // Email Notification Preferences
        'notify_new_sacco_registration',
        'notify_sacco_milestone',
        'weekly_platform_summary',

        // Platform Branding
        'platform_name',
        'support_email',
        'terms_of_service_url',
        'privacy_policy_url',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'auto_approve_saccos' => 'boolean',
            'require_registration_verification' => 'boolean',
            'max_saccos_allowed' => 'integer',
            'default_interest_rate' => 'decimal:2',
            'default_share_value' => 'decimal:2',
            'default_loan_to_savings_ratio' => 'decimal:2',
            'notify_new_sacco_registration' => 'boolean',
            'notify_sacco_milestone' => 'boolean',
            'weekly_platform_summary' => 'boolean',
        ];
    }

    /**
     * Get the singleton platform settings instance.
     */
    public static function instance(): self
    {
        return self::firstOrCreate([], ['platform_name' => 'SACCO Manager']);
    }
}
