<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Mail\MemberInvitationMail;
use App\Models\Invitation;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Str;

class InvitationController extends Controller
{
    use ApiResponse;

    /**
     * Send an invitation to a prospective member.
     * Accessible only by SACCO admins.
     */
    public function invite(Request $request): JsonResponse
    {
        $request->validate([
            'email' => ['required', 'email', 'unique:users,email'],
        ]);

        $saccoId = $request->user()->sacco_id;

        // Ensure no pending invitation exists for this email and sacco
        if (Invitation::where('email', $request->email)->where('sacco_id', $saccoId)->whereNull('accepted_at')->exists()) {
            return $this->error('An invitation has already been sent to this email.', 400);
        }

        $token = Str::random(60);

        $invitation = Invitation::create([
            'sacco_id' => $saccoId,
            'email' => $request->email,
            'token' => $token,
            'expires_at' => now()->addDays(7),
        ]);

        Mail::to($request->email)->send(new MemberInvitationMail($invitation));

        return $this->success(
            ['token' => $token],
            'Invitation sent successfully.',
            201
        );
    }

    /**
     * Register a new member using an invitation token.
     * Public route.
     */
    public function register(Request $request): JsonResponse
    {
        $request->validate([
            'token' => ['required', 'string'],
            'name' => ['required', 'string', 'max:255'],
            'phone' => ['required', 'string', 'max:255'],
            'username' => ['required', 'string', 'max:255', 'unique:users,username'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'national_id' => ['required', 'string', 'max:255'],
            'region' => ['required', 'string', 'max:255'],
            'zone' => ['required', 'string', 'max:255'],
            'town' => ['required', 'string', 'max:255'],
        ]);

        $invitation = Invitation::where('token', $request->token)->first();

        if (!$invitation) {
            return $this->error('Invalid invitation token.', 400);
        }

        if ($invitation->expires_at->isPast()) {
            return $this->error('Invitation token has expired.', 400);
        }

        if ($invitation->accepted_at) {
            return $this->error('Invitation has already been accepted.', 400);
        }

        if (User::where('email', $invitation->email)->exists()) {
            return $this->error('A user with this email already exists.', 400);
        }

        try {
            DB::transaction(function () use ($request, $invitation) {
                // Create the user
                $user = User::create([
                    'name' => $request->name,
                    'email' => $invitation->email,
                    'phone' => $request->phone,
                    'username' => $request->username,
                    'password' => Hash::make($request->password),
                    'role' => 'member',
                    'sacco_id' => $invitation->sacco_id,
                    'national_id' => $request->national_id,
                    'region' => $request->region,
                    'zone' => $request->zone,
                    'town' => $request->town,
                    'is_active' => true,
                ]);

                // Mark invitation as accepted
                $invitation->update(['accepted_at' => now()]);

                $user->markEmailAsVerified(); // Since they accepted an email invite
            });

            return $this->success(null, 'Member registered successfully. You can now login.', 201);
        } catch (\Exception $e) {
            return $this->error('Failed to register member.', 500, config('app.debug') ? $e->getMessage() : null);
        }
    }
}
