<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\V1\SaccoRegistrationRequest;
use App\Http\Resources\V1\AuthResource;
use App\Http\Traits\ApiResponse;
use App\Models\Sacco;
use App\Models\User;
use App\Notifications\SaccoRegistrationSubmittedNotification;
use Exception;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Notification;

class SaccoRegistrationController extends Controller
{
    use ApiResponse;

    /**
     * Register a new SACCO and its Admin User
     *
     * @unauthenticated
     *
     * @param  SaccoRegistrationRequest  $request
     * @return JsonResponse
     */
    public function register(SaccoRegistrationRequest $request): AuthResource|JsonResponse
    {
        try {
            return DB::transaction(function () use ($request) {
                // 1. Create the pending SACCO
                $sacco = Sacco::create([
                    'name' => $request->sacco_name,
                    'registration_number' => $request->registration_number,
                    'status' => 'pending',
                ]);

                // 2. Create the Admin User linked to the SACCO
                $user = User::create([
                    'name' => $request->admin_name,
                    'email' => $request->admin_email,
                    'username' => $request->admin_username,
                    'password' => Hash::make($request->password),
                    'role' => 'admin',
                    'sacco_id' => $sacco->id,
                    'national_id' => $request->national_id,
                    'region' => $request->region,
                    'zone' => $request->zone,
                    'town' => $request->town,
                ]);

                try {
                    $user->sendEmailVerificationNotification();
                } catch (\Throwable $e) {
                    \Illuminate\Support\Facades\Log::warning('Verification email sending failed: ' . $e->getMessage());
                }

                $superAdmins = User::where('role', 'superadmin')->get();
                if ($superAdmins->isNotEmpty()) {
                    Notification::send($superAdmins, new SaccoRegistrationSubmittedNotification($sacco, $user));
                }

                // 3. Return auth token for the new admin
                return AuthResource::make($user);
            });
        } catch (Exception $e) {
            return $this->error(
                'Unable to register SACCO',
                500,
                config('app.debug') ? $e->getMessage() : null
            );
        }
    }
}
