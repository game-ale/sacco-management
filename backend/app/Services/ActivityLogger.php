<?php

namespace App\Services;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;

class ActivityLogger
{
    protected static string $channel = 'activity';

    /**
     * @param  array<string, mixed>  $extra
     */
    public static function log(
        string $action,
        ?string $description = null,
        ?Request $request = null,
        ?array $extra = []
    ): void {
        $data = array_merge([
            'action' => $action,
            'description' => $description,
            'member_id' => Auth::id(),
            'ip_address' => $request?->ip(),
            'user_agent' => $request?->userAgent(),
            'timestamp' => now()->toIso8601String(),
        ], $extra);

        Log::channel(self::$channel)->info($description ?? $action, $data);
    }

    public static function auth(string $action, ?Request $request = null): void
    {
        self::log($action, "User {$action}", $request);
    }

    public static function login(?Request $request = null): void
    {
        self::auth('login', $request);
    }

    public static function logout(?Request $request = null): void
    {
        self::auth('logout', $request);
    }

    public static function register(?Request $request = null): void
    {
        self::auth('register', $request);
    }

    public static function passwordChanged(?Request $request = null): void
    {
        self::auth('password_changed', $request);
    }

    public static function passwordReset(?Request $request = null): void
    {
        self::auth('password_reset', $request);
    }

    public static function emailVerified(?Request $request = null): void
    {
        self::auth('email_verified', $request);
    }
}
