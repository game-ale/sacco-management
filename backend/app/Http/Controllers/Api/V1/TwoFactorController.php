<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\User;
use App\Services\ActivityLogger;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\ValidationException;
use PragmaRX\Google2FA\Google2FA;

class TwoFactorController extends Controller
{
    use ApiResponse;

    protected Google2FA $google2fa;

    public function __construct()
    {
        $this->google2fa = new Google2FA();
    }

    /**
     * Enable 2FA – generate a new TOTP secret and return the QR code provisioning URI.
     */
    public function enable(Request $request): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'string'],
        ]);

        /** @var User $user */
        $user = $request->user();

        if (! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'password' => __('auth.failed'),
            ]);
        }

        if ($user->hasTwoFactorEnabled()) {
            return $this->error('Two-factor authentication is already enabled.', 422);
        }

        $secret = $this->google2fa->generateSecretKey();

        $user->forceFill([
            'two_factor_secret' => $secret,
            'two_factor_confirmed_at' => null,
            'two_factor_recovery_codes' => null,
        ])->save();

        $qrCodeUrl = $this->google2fa->getQRCodeUrl(
            config('app.name', 'SACCO Platform'),
            $user->email,
            $secret
        );

        ActivityLogger::log('2fa_setup_started', 'User initiated 2FA setup', $request, ['user_id' => $user->id]);

        return $this->success([
            'secret' => $secret,
            'qr_code_url' => $qrCodeUrl,
        ], 'Scan the QR code with your authenticator app, then confirm with a 6-digit code.');
    }

    /**
     * Confirm 2FA setup – verify the user's first TOTP code and generate backup recovery codes.
     */
    public function confirm(Request $request): JsonResponse
    {
        $request->validate([
            'code' => ['required', 'string', 'size:6'],
        ]);

        /** @var User $user */
        $user = $request->user();

        if (! $user->two_factor_secret || $user->hasTwoFactorEnabled()) {
            return $this->error('Two-factor authentication setup is not pending.', 422);
        }

        $valid = $this->google2fa->verifyKey($user->two_factor_secret, $request->code);

        if (! $valid) {
            throw ValidationException::withMessages([
                'code' => 'The provided two-factor code is invalid.',
            ]);
        }

        // Generate 8 recovery codes
        $recoveryCodes = collect(range(1, 8))->map(fn () => Str::random(10) . '-' . Str::random(10))->all();

        $user->forceFill([
            'two_factor_confirmed_at' => now(),
            'two_factor_recovery_codes' => json_encode(
                array_map(fn (string $code) => Hash::make($code), $recoveryCodes)
            ),
        ])->save();

        ActivityLogger::log('2fa_enabled', 'User enabled two-factor authentication', $request, ['user_id' => $user->id]);

        return $this->success([
            'recovery_codes' => $recoveryCodes,
        ], 'Two-factor authentication has been enabled. Save these recovery codes securely.');
    }

    /**
     * Disable 2FA.
     */
    public function disable(Request $request): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'string'],
        ]);

        /** @var User $user */
        $user = $request->user();

        if (! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'password' => __('auth.failed'),
            ]);
        }

        $user->forceFill([
            'two_factor_secret' => null,
            'two_factor_recovery_codes' => null,
            'two_factor_confirmed_at' => null,
            'two_factor_remember_token' => null,
        ])->save();

        ActivityLogger::log('2fa_disabled', 'User disabled two-factor authentication', $request, ['user_id' => $user->id]);

        return $this->success(null, 'Two-factor authentication has been disabled.');
    }

    /**
     * Regenerate recovery codes.
     */
    public function regenerateRecoveryCodes(Request $request): JsonResponse
    {
        $request->validate([
            'password' => ['required', 'string'],
        ]);

        /** @var User $user */
        $user = $request->user();

        if (! Hash::check($request->password, $user->password)) {
            throw ValidationException::withMessages([
                'password' => __('auth.failed'),
            ]);
        }

        if (! $user->hasTwoFactorEnabled()) {
            return $this->error('Two-factor authentication is not enabled.', 422);
        }

        $recoveryCodes = collect(range(1, 8))->map(fn () => Str::random(10) . '-' . Str::random(10))->all();

        $user->forceFill([
            'two_factor_recovery_codes' => json_encode(
                array_map(fn (string $code) => Hash::make($code), $recoveryCodes)
            ),
        ])->save();

        ActivityLogger::log('2fa_recovery_codes_regenerated', 'User regenerated 2FA recovery codes', $request, ['user_id' => $user->id]);

        return $this->success([
            'recovery_codes' => $recoveryCodes,
        ], 'New recovery codes have been generated. Save them securely.');
    }

    /**
     * Challenge – verify a TOTP code or recovery code during login.
     * This is called from the frontend after step 1 of the login flow.
     */
    public function challenge(Request $request): JsonResponse
    {
        $request->validate([
            'two_factor_token' => ['required', 'string'],
            'code' => ['nullable', 'string', 'size:6'],
            'recovery_code' => ['nullable', 'string'],
        ]);

        if (! $request->code && ! $request->recovery_code) {
            return $this->error('A two-factor code or recovery code is required.', 422);
        }

        // Decode the signed two_factor_token
        $userId = $this->decodeToken($request->two_factor_token);

        if (! $userId) {
            return $this->error('The two-factor token is invalid or expired.', 401);
        }

        /** @var User|null $user */
        $user = User::find($userId);

        if (! $user || ! $user->hasTwoFactorEnabled()) {
            return $this->error('Invalid two-factor authentication state.', 401);
        }

        // Try TOTP code first
        if ($request->code) {
            $valid = $this->google2fa->verifyKey($user->two_factor_secret, $request->code);

            if (! $valid) {
                throw ValidationException::withMessages([
                    'code' => 'The provided two-factor code is invalid.',
                ]);
            }
        }

        // Try recovery code
        if ($request->recovery_code && ! $request->code) {
            $storedCodes = json_decode($user->two_factor_recovery_codes, true);

            if (! is_array($storedCodes)) {
                return $this->error('No recovery codes available.', 422);
            }

            $matchedIndex = null;
            foreach ($storedCodes as $index => $hashedCode) {
                if (Hash::check($request->recovery_code, $hashedCode)) {
                    $matchedIndex = $index;
                    break;
                }
            }

            if ($matchedIndex === null) {
                throw ValidationException::withMessages([
                    'recovery_code' => 'The provided recovery code is invalid.',
                ]);
            }

            // Consume the recovery code
            unset($storedCodes[$matchedIndex]);
            $user->forceFill([
                'two_factor_recovery_codes' => json_encode(array_values($storedCodes)),
            ])->save();
        }

        // Handle "remember this device"
        $rememberToken = null;
        if ($request->boolean('remember_device')) {
            $rememberToken = Str::random(64);
            $user->forceFill([
                'two_factor_remember_token' => hash('sha256', $rememberToken),
            ])->save();
        }

        // Issue the real Sanctum token
        $remember = $request->boolean('remember_me');
        $newToken = $user->createToken('Personal Access Token');

        $expires = $remember
            ? now()->addMonths(6)
            : now()->addDay();
        $newToken->accessToken->expires_at = $expires;
        $newToken->accessToken->save();

        // Append savings_balance
        $latestBalance = \App\Models\SavingsTransaction::where('member_id', $user->id)
            ->latest('transaction_date')
            ->latest('id')
            ->value('balance_after');
        $user->savings_balance = (float) ($latestBalance ?? 0);

        ActivityLogger::log('2fa_challenge_passed', 'User passed 2FA challenge', $request, ['user_id' => $user->id]);

        $response = [
            'user' => new \App\Http\Resources\V1\UserResource($user),
            'access_token' => $newToken->plainTextToken,
            'token_type' => 'Bearer',
            'expires_at' => $newToken->accessToken->expires_at->toDateTimeString(),
        ];

        if ($rememberToken) {
            $response['two_factor_remember_token'] = $rememberToken;
        }

        return $this->success($response, 'Two-factor authentication verified.');
    }

    /**
     * Create a short-lived signed token encoding the user's ID.
     */
    public static function createToken(int $userId): string
    {
        $payload = json_encode([
            'user_id' => $userId,
            'expires_at' => now()->addMinutes(5)->timestamp,
        ]);

        $signature = hash_hmac('sha256', $payload, config('app.key'));

        return base64_encode($payload . '|' . $signature);
    }

    /**
     * Decode and validate a signed two-factor token.
     */
    protected function decodeToken(string $token): ?int
    {
        $decoded = base64_decode($token, true);

        if (! $decoded || ! str_contains($decoded, '|')) {
            return null;
        }

        [$payload, $signature] = explode('|', $decoded, 2);
        $expectedSignature = hash_hmac('sha256', $payload, config('app.key'));

        if (! hash_equals($expectedSignature, $signature)) {
            return null;
        }

        $data = json_decode($payload, true);

        if (! $data || ! isset($data['user_id'], $data['expires_at'])) {
            return null;
        }

        if ($data['expires_at'] < now()->timestamp) {
            return null;
        }

        return (int) $data['user_id'];
    }
}
