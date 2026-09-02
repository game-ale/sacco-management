<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\Auth\ForgotPasswordRequest;
use App\Http\Requests\V1\Auth\LoginRequest;
use App\Http\Requests\V1\Auth\RegisterRequest;
use App\Http\Requests\V1\Auth\ResetPasswordRequest;
use App\Http\Resources\V1\AuthResource;
use App\Http\Resources\V1\UserResource;
use App\Http\Traits\ApiResponse;
use App\Models\User;
use App\Services\ActivityLogger;
use App\Http\Controllers\Api\V1\TwoFactorController;
use Exception;
use Illuminate\Auth\Events\PasswordReset;
use Illuminate\Auth\Events\Verified;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Password;
use Illuminate\Validation\ValidationException;

class AuthController extends Controller
{
    use ApiResponse;

    /**
     * Register User
     *
     * @unauthenticated
     *
     * @param  RegisterRequest  $request
     * @return JsonResponse
     */
    public function register(RegisterRequest $request): AuthResource|JsonResponse
    {
        try {
            return DB::transaction(function () use ($request) {
                $user = User::create([
                    'name' => $request->name,
                    'email' => $request->email,
                    'username' => $request->username,
                    'password' => Hash::make($request->password),
                ]);

                $user->sendEmailVerificationNotification();

                ActivityLogger::register($request);

                return AuthResource::make($user);
            });
        } catch (Exception $e) {
            return $this->error(
                __('auth.register_error'),
                500,
                config('app.debug') ? $e->getMessage() : null
            );
        }
    }

    /**
     * Login User
     *
     * @unauthenticated
     *
     * @param  LoginRequest  $request
     * @return JsonResponse
     */
    public function login(LoginRequest $request): AuthResource|JsonResponse
    {

        $request->authenticate();

        $user = $request->user();

        // Block login if the user's SACCO is rejected
        if ($user->sacco && $user->sacco->status === 'rejected') {
            // Revoke the token that was just created by authenticate() or prevent it
            // Actually $request->authenticate() might not create a token, it just authenticates the session/user
            throw ValidationException::withMessages([
                'login' => 'Your SACCO registration has been rejected. Please contact support.',
            ]);
        }

        // Check if Two-Factor Authentication is enabled
        if ($user->hasTwoFactorEnabled()) {
            // Check if device is remembered
            $rememberToken = $request->cookie('two_factor_remember_token') ?? $request->header('X-2FA-Remember');
            
            if (! $rememberToken || hash('sha256', $rememberToken) !== $user->two_factor_remember_token) {
                // Device not remembered, issue a challenge
                $twoFactorToken = TwoFactorController::createToken($user->id);
                
                ActivityLogger::log('2fa_challenge_issued', 'Two-factor challenge issued during login', $request, ['user_id' => $user->id]);

                return response()->json([
                    'two_factor_required' => true,
                    'two_factor_token' => $twoFactorToken,
                    'message' => 'Two-factor authentication required.',
                ]);
            }
        }

        // Append savings_balance from latest savings transaction
        $latestBalance = \App\Models\SavingsTransaction::where('member_id', $user->id)
            ->latest('transaction_date')
            ->latest('id')
            ->value('balance_after');

        $user->savings_balance = (float) ($latestBalance ?? 0);

        ActivityLogger::login($request);

        return AuthResource::make($user);
    }

    /**
     * Logout User
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function logout(Request $request): JsonResponse
    {
        // Revoke token
        $request->user()->currentAccessToken()->delete();

        ActivityLogger::logout($request);

        return $this->success(null, __('auth.logout'));
    }

    /**
     * Change Password
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function changePassword(Request $request): JsonResponse
    {
        // Validate request
        $request->validate([
            'current_password' => ['required'],
            'password' => ['required', 'confirmed', 'min:8'],
        ]);

        // check if current password is correct
        if (! Hash::check($request->current_password, $request->user()->password)) {

            throw ValidationException::withMessages([
                'current_password' => __('auth.failed')
            ]);
        }

        // Update password
        $user = User::find($request->user()->id);
        $user->password = Hash::make($request->password);
        $user->save();

        ActivityLogger::passwordChanged($request);

        return $this->success(null, __('passwords.changed'));
    }

    /**
     * Get User
     *
     * @param  Request  $request
     * @return UserResource
     */
    public function profile(Request $request): UserResource
    {
        $user = $request->user();

        // Append savings_balance from latest savings transaction
        $latestBalance = \App\Models\SavingsTransaction::where('member_id', $user->id)
            ->latest('transaction_date')
            ->latest('id')
            ->value('balance_after');

        $user->savings_balance = (float) ($latestBalance ?? 0);

        return UserResource::make($user);
    }

    /**
     * Update User Profile
     *
     * @param  Request  $request
     * @return UserResource
     */
    public function updateProfile(Request $request): UserResource
    {
        $user = $request->user();

        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:255'],
            'phone' => ['nullable', 'string', 'max:20'],
            'national_id' => ['nullable', 'string', 'max:50'],
            'region' => ['nullable', 'string', 'max:100'],
            'zone' => ['nullable', 'string', 'max:100'],
            'town' => ['nullable', 'string', 'max:100'],
        ]);

        $user->update($validated);

        ActivityLogger::log('profile_updated', 'User updated their profile', $request, ['user_id' => $user->id]);

        return UserResource::make($user->fresh());
    }

    /**
     * Verify Email
     *
     * @return JsonResponse
     */
    public function verifyEmail(int $id, string $hash): JsonResponse
    {
        $user = User::findOrFail($id);

        // Validate email hash
        if (! hash_equals(
            (string) $hash,
            sha1($user->getEmailForVerification())
        )) {
            return $this->forbidden(__('auth.invalid_verification_link'));
        }

        if ($user->hasVerifiedEmail()) {
            return $this->success(null, __('auth.email_already_verified'));
        }

        $user->markEmailAsVerified();
        event(new Verified($user));

        ActivityLogger::emailVerified();

        return $this->success(null, __('auth.email_verified'));
    }

    /**
     * Resend Verification Email
     *
     * @return JsonResponse
     */
    public function resendVerificationEmail(Request $request): JsonResponse
    {
        $user = $request->user();

        if ($user->hasVerifiedEmail()) {
            return $this->success(null, __('auth.email_already_verified'));
        }

        $user->sendEmailVerificationNotification();

        return $this->success(null, __('auth.email_sent'));
    }

    /**
     * Forgot Password
     *
     * @param  ForgotPasswordRequest  $request
     * @return JsonResponse
     */
    public function forgotPassword(ForgotPasswordRequest $request): JsonResponse
    {
        try {
            $status = Password::sendResetLink(
                $request->only('email')
            );

            return $this->passwordResponse($status);
        } catch (Exception $e) {
            return $this->error(
                __('passwords.unable_to_send_reset'),
                500,
                config('app.debug') ? $e->getMessage() : null
            );
        }
    }

    /**
     * Reset Password
     *
     * @param  ResetPasswordRequest  $request
     * @return JsonResponse
     */
    public function resetPassword(ResetPasswordRequest $request): JsonResponse
    {
        try {
            $status = Password::reset(
                $request->only('email', 'password', 'password_confirmation', 'token'),
                function (User $user, string $password) {
                    // Update password
                    $user->forceFill([
                        'password' => Hash::make($password),
                    ])->save();

                    $user->tokens()->delete();

                    event(new PasswordReset($user));

                    ActivityLogger::passwordReset();
                }
            );

            return $this->passwordResponse($status);
        } catch (Exception $e) {
            return $this->error(
                __('passwords.unable_to_reset_password'),
                500,
                config('app.debug') ? $e->getMessage() : null
            );
        }
    }

    /**
     * @param  array<string, string>  $messages
     */
    protected function passwordResponse(string $status, array $messages = []): JsonResponse
    {
        $map = [
            Password::RESET_LINK_SENT => ['message' => $messages['sent'] ?? __('passwords.sent'), 'code' => 200],
            Password::PASSWORD_RESET => ['message' => $messages['reset'] ?? __('passwords.reset'), 'code' => 200],
            Password::INVALID_USER => ['message' => $messages['user'] ?? __('passwords.user'), 'code' => 404],
            Password::INVALID_TOKEN => ['message' => $messages['token'] ?? __('passwords.token'), 'code' => 400],
            Password::RESET_THROTTLED => ['message' => $messages['throttled'] ?? __('passwords.throttled'), 'code' => 429],
        ];

        $response = $map[$status] ?? ['message' => $messages['default'] ?? __('passwords.unable_to_reset_password'), 'code' => 500];

        if ($response['code'] >= 400) {
            return $this->error($response['message'], $response['code']);
        }

        return $this->success(null, $response['message'], $response['code']);
    }
}
