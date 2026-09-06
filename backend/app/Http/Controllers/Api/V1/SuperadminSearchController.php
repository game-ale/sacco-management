<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\MembershipRequest;
use App\Models\Sacco;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SuperadminSearchController extends Controller
{
    use ApiResponse;

    /**
     * Search the platform for SACCOs, users, and membership requests.
     */
    public function index(Request $request): JsonResponse
    {
        $query = trim((string) $request->query('q', ''));

        if ($query === '') {
            return $this->success([
                'saccos' => [],
                'users' => [],
                'membership_requests' => [],
            ], 'Empty search query');
        }

        $saccos = Sacco::query()
            ->where(function ($q) use ($query): void {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhere('registration_number', 'like', "%{$query}%")
                    ->orWhere('email', 'like', "%{$query}%")
                    ->orWhere('region', 'like', "%{$query}%")
                    ->orWhere('contact_email', 'like', "%{$query}%");
            })
            ->withCount('users')
            ->limit(5)
            ->get()
            ->map(fn (Sacco $sacco) => [
                'id' => $sacco->id,
                'name' => $sacco->name,
                'registration_number' => $sacco->registration_number,
                'status' => $sacco->status,
                'region' => $sacco->region,
                'email' => $sacco->email,
                'contact_email' => $sacco->contact_email,
            ]);

        $users = User::query()
            ->where(function ($q) use ($query): void {
                $q->where('name', 'like', "%{$query}%")
                    ->orWhere('email', 'like', "%{$query}%")
                    ->orWhere('username', 'like', "%{$query}%")
                    ->orWhere('phone', 'like', "%{$query}%")
                    ->orWhere('role', 'like', "%{$query}%");
            })
            ->with('sacco:id,name')
            ->limit(5)
            ->get()
            ->map(fn (User $user) => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'username' => $user->username,
                'role' => $user->role,
                'sacco' => $user->sacco ? [
                    'id' => $user->sacco->id,
                    'name' => $user->sacco->name,
                ] : null,
            ]);

        $membershipRequests = MembershipRequest::query()
            ->with('sacco:id,name')
            ->where(function ($q) use ($query): void {
                $q->where('full_name', 'like', "%{$query}%")
                    ->orWhere('email', 'like', "%{$query}%")
                    ->orWhere('phone_number', 'like', "%{$query}%")
                    ->orWhere('national_id', 'like', "%{$query}%")
                    ->orWhere('status', 'like', "%{$query}%")
                    ->orWhere('message', 'like', "%{$query}%");
            })
            ->limit(5)
            ->get()
            ->map(fn (MembershipRequest $request) => [
                'id' => $request->id,
                'full_name' => $request->full_name,
                'email' => $request->email,
                'phone_number' => $request->phone_number,
                'status' => $request->status,
                'sacco' => $request->sacco ? [
                    'id' => $request->sacco->id,
                    'name' => $request->sacco->name,
                ] : null,
            ]);

        return $this->success([
            'saccos' => $saccos,
            'users' => $users,
            'membership_requests' => $membershipRequests,
        ], 'Platform search results retrieved');
    }
}
