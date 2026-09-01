<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\UpdateMemberSharesRequest;
use App\Http\Resources\V1\UserResource;
use App\Http\Traits\ApiResponse;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class MemberShareController extends Controller
{
    use ApiResponse;

    /**
     * Update a member's share count.
     *
     * @param  UpdateMemberSharesRequest  $request
     * @param  User  $member
     * @return JsonResponse
     */
    public function update(UpdateMemberSharesRequest $request, User $member): JsonResponse
    {
        // Tenant isolation and role check
        if ($member->sacco_id !== $request->user()->sacco_id || $member->role !== 'member') {
            return $this->forbidden('You do not have permission to update shares for this member.');
        }

        $member->update([
            'num_shares' => $request->validated('num_shares'),
        ]);

        return $this->success(
            UserResource::make($member->fresh()),
            'Member shares updated successfully.'
        );
    }

    /**
     * Get share capital summary for the SACCO.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function summary(Request $request): JsonResponse
    {
        $admin = $request->user();
        $sacco = $admin->sacco;

        $totalShares = User::where('sacco_id', $admin->sacco_id)->where('role', 'member')->sum('num_shares');
        $shareValue = $sacco->share_value ?? 0;
        $totalShareCapital = $totalShares * $shareValue;

        $query = User::where('sacco_id', $admin->sacco_id)
            ->where('role', 'member');

        if ($request->sort === 'lowest') {
            $query->orderBy('num_shares', 'asc');
        } elseif ($request->sort === 'name') {
            $query->orderBy('name', 'asc');
        } else {
            // default highest
            $query->orderByDesc('num_shares');
        }

        $members = $query->paginate(15)
            ->through(function ($member) use ($totalShares, $shareValue) {
                $shares = (int) ($member->num_shares ?? 0);
                $pct = $totalShares > 0 ? round(($shares / $totalShares) * 100, 2) : 0;

                return [
                    'id' => $member->id,
                    'name' => $member->name,
                    'member_id' => 'MEM-'.str_pad((string) $member->id, 3, '0', STR_PAD_LEFT),
                    'shares' => $shares,
                    'share_value' => round((float) $shareValue, 2),
                    'total_capital' => round((float) ($shares * $shareValue), 2),
                    'ownership_pct' => $pct,
                ];
            });

        return $this->success([
            'summary' => [
                'share_value' => round((float) $shareValue, 2),
                'total_shares' => $totalShares,
                'total_capital' => round((float) $totalShareCapital, 2),
            ],
            'members' => $members
        ], 'Share capital summary retrieved successfully.');
    }
}
