<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\UserResource;
use App\Http\Traits\ApiResponse;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class SuperadminUserController extends Controller
{
    use ApiResponse;

    /**
     * List all users across the platform.
     *
     * Supports filtering by role, SACCO, status, and search by name/email.
     *
     * @param  Request  $request
     * @return AnonymousResourceCollection
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = User::with('sacco:id,name');

        // Filter by role
        if ($request->filled('role') && in_array($request->query('role'), ['superadmin', 'admin', 'member'], true)) {
            $query->where('role', $request->query('role'));
        }

        // Filter by SACCO
        if ($request->filled('sacco_id')) {
            $query->where('sacco_id', $request->query('sacco_id'));
        }

        // Filter by active status
        if ($request->filled('status')) {
            $status = $request->query('status');
            if ($status === 'active') {
                $query->where('is_active', true);
            } elseif ($status === 'suspended') {
                $query->where('is_active', false);
            }
        }

        // Search by name, email, or username
        if ($request->filled('search')) {
            $search = (string) $request->query('search');
            $query->where(function ($q) use ($search): void {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('email', 'like', "%{$search}%")
                    ->orWhere('username', 'like', "%{$search}%");
            });
        }

        // Sort
        $sort = $request->query('sort', 'newest');
        $query = match ($sort) {
            'oldest' => $query->oldest(),
            'name_asc' => $query->orderBy('name', 'asc'),
            'name_desc' => $query->orderBy('name', 'desc'),
            default => $query->latest(),
        };

        $users = $query->paginate(15);

        return UserResource::collection($users);
    }

    /**
     * Show a single user's details.
     *
     * @param  User  $user
     * @return JsonResponse
     */
    public function show(User $user): JsonResponse
    {
        $user->load('sacco:id,name');

        return $this->success(
            UserResource::make($user),
            'User details retrieved successfully.'
        );
    }

    /**
     * Suspend a user.
     *
     * @param  User  $user
     * @return JsonResponse
     */
    public function suspend(User $user): JsonResponse
    {
        if ($user->role === 'superadmin') {
            return $this->error('Cannot suspend a superadmin user.', 422);
        }

        if (! $user->is_active) {
            return $this->error('User is already suspended.', 422);
        }

        $user->update(['is_active' => false]);

        return $this->success(
            UserResource::make($user),
            'User has been suspended.'
        );
    }

    /**
     * Activate a suspended user.
     *
     * @param  User  $user
     * @return JsonResponse
     */
    public function activate(User $user): JsonResponse
    {
        if ($user->is_active) {
            return $this->error('User is already active.', 422);
        }

        $user->update(['is_active' => true]);

        return $this->success(
            UserResource::make($user),
            'User has been activated.'
        );
    }

    /**
     * Export all users as CSV.
     *
     * @param  Request  $request
     * @return StreamedResponse
     */
    public function export(Request $request): StreamedResponse
    {
        $query = User::with('sacco:id,name');

        if ($request->filled('role')) {
            $query->where('role', $request->query('role'));
        }

        if ($request->filled('sacco_id')) {
            $query->where('sacco_id', $request->query('sacco_id'));
        }

        if ($request->filled('status')) {
            $status = $request->query('status');
            if ($status === 'active') {
                $query->where('is_active', true);
            } elseif ($status === 'suspended') {
                $query->where('is_active', false);
            }
        }

        $users = $query->latest()->get();

        $filename = 'users-export-' . now()->format('Y-m-d-His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($users): void {
            $file = fopen('php://output', 'w');
            if ($file !== false) {
                fputcsv($file, ['ID', 'Name', 'Username', 'Email', 'Role', 'SACCO', 'Status', 'Joined']);

                foreach ($users as $user) {
                    fputcsv($file, [
                        $user->id,
                        $user->name,
                        $user->username,
                        $user->email,
                        $user->role,
                        $user->sacco->name ?? 'N/A',
                        $user->is_active ? 'Active' : 'Suspended',
                        $user->created_at?->toDateTimeString() ?? '',
                    ]);
                }

                fclose($file);
            }
        };

        return response()->stream($callback, 200, $headers);
    }
}
