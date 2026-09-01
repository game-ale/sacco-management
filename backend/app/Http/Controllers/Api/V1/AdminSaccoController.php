<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\RejectSaccoRequest;
use App\Http\Resources\V1\SaccoResource;
use App\Http\Traits\ApiResponse;
use App\Models\Loan;
use App\Models\Sacco;
use App\Models\SavingsTransaction;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;
use Symfony\Component\HttpFoundation\StreamedResponse;

class AdminSaccoController extends Controller
{
    use ApiResponse;

    /**
     * Get Super Admin dashboard platform statistics.
     *
     * @return JsonResponse
     */
    public function stats(): JsonResponse
    {
        $totalSaccos = Sacco::count();
        $approvedSaccos = Sacco::where('status', 'approved')->count();
        $pendingSaccos = Sacco::where('status', 'pending')->count();
        $rejectedSaccos = Sacco::where('status', 'rejected')->count();

        $totalMembers = User::where('role', 'member')->count();

        $deposits = (float) SavingsTransaction::where('type', 'deposit')->sum('amount');
        $withdrawals = (float) SavingsTransaction::where('type', 'withdraw')->sum('amount');
        $totalSavings = round(max(0, $deposits - $withdrawals), 2);

        $totalActiveLoans = Loan::where('status', 'active')->count();

        return $this->success([
            'total_saccos' => $totalSaccos,
            'approved_saccos' => $approvedSaccos,
            'pending_saccos' => $pendingSaccos,
            'rejected_saccos' => $rejectedSaccos,
            'total_members' => $totalMembers,
            'total_savings' => $totalSavings,
            'total_active_loans' => $totalActiveLoans,
        ], 'Dashboard statistics retrieved successfully.');
    }

    /**
     * List all SACCOs.
     *
     * Returns a paginated list of all SACCOs on the platform.
     * Optionally filter by status (pending, approved, rejected) and search by name or registration number.
     *
     * @param  Request  $request
     * @return AnonymousResourceCollection
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Sacco::withCount('users');

        // Filter by status if provided
        if ($request->has('status') && in_array($request->query('status'), ['pending', 'approved', 'rejected', 'suspended'], true)) {
            $query->where('status', $request->query('status'));
        }

        // Filter by region if provided
        if ($request->filled('region')) {
            $query->where('region', $request->query('region'));
        }

        // Search by name or registration number if provided
        if ($request->filled('search')) {
            $search = (string) $request->query('search');
            $query->where(function ($q) use ($search): void {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('registration_number', 'like', "%{$search}%");
            });
        }

        // Sort support
        $sort = $request->query('sort', 'newest');
        $query = match ($sort) {
            'oldest' => $query->oldest(),
            'members_desc' => $query->orderByDesc('users_count'),
            'name_asc' => $query->orderBy('name', 'asc'),
            default => $query->latest(),
        };

        $saccos = $query->paginate(15);

        return SaccoResource::collection($saccos);
    }

    /**
     * Export SACCO information as CSV.
     *
     * @param  Request  $request
     * @return StreamedResponse
     */
    public function export(Request $request): StreamedResponse
    {
        $query = Sacco::withCount('users');

        if ($request->has('status') && in_array($request->query('status'), ['pending', 'approved', 'rejected'], true)) {
            $query->where('status', $request->query('status'));
        }

        if ($request->filled('search')) {
            $search = (string) $request->query('search');
            $query->where(function ($q) use ($search): void {
                $q->where('name', 'like', "%{$search}%")
                    ->orWhere('registration_number', 'like', "%{$search}%");
            });
        }

        $saccos = $query->latest()->get();

        $filename = 'saccos-export-' . now()->format('Y-m-d-His') . '.csv';

        $headers = [
            'Content-Type' => 'text/csv',
            'Content-Disposition' => "attachment; filename=\"{$filename}\"",
        ];

        $callback = function () use ($saccos): void {
            $file = fopen('php://output', 'w');
            if ($file !== false) {
                fputcsv($file, ['ID', 'Name', 'Registration Number', 'Status', 'Rejection Reason', 'Members Count', 'Date Created']);

                foreach ($saccos as $sacco) {
                    fputcsv($file, [
                        $sacco->id,
                        $sacco->name,
                        $sacco->registration_number,
                        $sacco->status,
                        $sacco->rejection_reason ?? '',
                        $sacco->users_count ?? 0,
                        $sacco->created_at?->toDateTimeString() ?? '',
                    ]);
                }

                fclose($file);
            }
        };

        return response()->stream($callback, 200, $headers);
    }

    /**
     * Show a single SACCO.
     *
     * Returns detailed information about a specific SACCO including its members count.
     *
     * @param  Sacco  $sacco
     * @return SaccoResource
     */
    public function show(Sacco $sacco): SaccoResource
    {
        $sacco->loadCount('users');

        return SaccoResource::make($sacco);
    }

    /**
     * Extended SACCO details.
     *
     * Returns additional information including administrator details, member savings, and active loans.
     *
     * @param  Sacco  $sacco
     * @return JsonResponse
     */
    public function details(Sacco $sacco): JsonResponse
    {
        $sacco->loadCount('users');
        /** @var User|null $admin */
        $admin = $sacco->users()->where('role', 'admin')->first();
        $memberIds = $sacco->users()->pluck('id');

        $deposits = (float) SavingsTransaction::whereIn('member_id', $memberIds)->where('type', 'deposit')->sum('amount');
        $withdrawals = (float) SavingsTransaction::whereIn('member_id', $memberIds)->where('type', 'withdraw')->sum('amount');
        $totalSavings = round(max(0, $deposits - $withdrawals), 2);

        $activeLoansCount = $sacco->loans()->where('status', 'active')->count();

        return $this->success([
            'sacco' => SaccoResource::make($sacco),
            'administrator' => $admin ? [
                'id' => $admin->id,
                'name' => $admin->name,
                'email' => $admin->email,
                'username' => $admin->username,
            ] : null,
            'total_savings' => $totalSavings,
            'active_loans_count' => $activeLoansCount,
        ], 'SACCO details retrieved successfully.');
    }

    /**
     * Approve a pending SACCO.
     *
     * Changes the SACCO status from "pending" to "approved",
     * allowing its admin and members to fully operate on the platform.
     *
     * @param  Sacco  $sacco
     * @return JsonResponse
     */
    public function approve(Sacco $sacco): JsonResponse
    {
        if ($sacco->status !== 'pending') {
            return $this->error(
                "Cannot approve a SACCO that is currently '{$sacco->status}'. Only pending SACCOs can be approved.",
                422
            );
        }

        $sacco->update(['status' => 'approved']);

        return $this->success(
            SaccoResource::make($sacco->loadCount('users')),
            'SACCO has been approved successfully.'
        );
    }

    /**
     * Reject a pending SACCO.
     *
     * Changes the SACCO status from "pending" to "rejected" and stores the rejection reason.
     *
     * @param  RejectSaccoRequest  $request
     * @param  Sacco  $sacco
     * @return JsonResponse
     */
    public function reject(RejectSaccoRequest $request, Sacco $sacco): JsonResponse
    {
        if ($sacco->status !== 'pending') {
            return $this->error(
                "Cannot reject a SACCO that is currently '{$sacco->status}'. Only pending SACCOs can be rejected.",
                422
            );
        }

        $rejectionReason = $request->validated('rejection_reason');

        $sacco->update([
            'status' => 'rejected',
            'rejection_reason' => is_string($rejectionReason) ? $rejectionReason : null,
        ]);

        return $this->success(
            SaccoResource::make($sacco->loadCount('users')),
            'SACCO has been rejected.'
        );
    }

    /**
     * Get monthly SACCO registration data for the growth chart.
     *
     * Returns the number of SACCOs registered per month for the last 12 months.
     *
     * @return JsonResponse
     */
    public function saccoGrowth(): JsonResponse
    {
        $months = 12;
        $data = collect();

        for ($i = $months - 1; $i >= 0; $i--) {
            $date = Carbon::now()->subMonths($i);
            $count = Sacco::whereYear('created_at', $date->year)
                ->whereMonth('created_at', $date->month)
                ->count();

            $cumulative = Sacco::where('created_at', '<=', $date->copy()->endOfMonth())->count();

            $data->push([
                'month' => $date->format('M Y'),
                'month_short' => $date->format('M'),
                'new_saccos' => $count,
                'cumulative' => $cumulative,
            ]);
        }

        return $this->success($data, 'SACCO growth data retrieved successfully.');
    }

    /**
     * Suspend an approved SACCO.
     *
     * Changes the SACCO status from "approved" to "suspended".
     *
     * @param  Sacco  $sacco
     * @return JsonResponse
     */
    public function suspend(Sacco $sacco): JsonResponse
    {
        if ($sacco->status !== 'approved') {
            return $this->error(
                "Cannot suspend a SACCO that is currently '{$sacco->status}'. Only approved SACCOs can be suspended.",
                422
            );
        }

        $sacco->update(['status' => 'suspended']);

        return $this->success(
            SaccoResource::make($sacco->loadCount('users')),
            'SACCO has been suspended.'
        );
    }

    /**
     * Reactivate a suspended SACCO.
     *
     * Changes the SACCO status from "suspended" back to "approved".
     *
     * @param  Sacco  $sacco
     * @return JsonResponse
     */
    public function reactivate(Sacco $sacco): JsonResponse
    {
        if ($sacco->status !== 'suspended') {
            return $this->error(
                "Cannot reactivate a SACCO that is currently '{$sacco->status}'. Only suspended SACCOs can be reactivated.",
                422
            );
        }

        $sacco->update(['status' => 'approved']);

        return $this->success(
            SaccoResource::make($sacco->loadCount('users')),
            'SACCO has been reactivated.'
        );
    }
}
