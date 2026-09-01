<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\UpdateSaccoSettingsRequest;
use App\Http\Resources\V1\SaccoSettingsResource;
use App\Http\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class SaccoSettingsController extends Controller
{
    use ApiResponse;

    /**
     * Get the authenticated user's SACCO settings.
     *
     * @param  Request  $request
     * @return JsonResponse
     */
    public function show(Request $request): JsonResponse
    {
        $user = $request->user();
        $sacco = $user->sacco;

        if (! $sacco) {
            return $this->notFound('SACCO not found.');
        }

        return $this->success(
            SaccoSettingsResource::make($sacco),
            'SACCO settings retrieved successfully.'
        );
    }

    /**
     * Update the authenticated user's SACCO settings.
     *
     * @param  UpdateSaccoSettingsRequest  $request
     * @return JsonResponse
     */
    public function update(UpdateSaccoSettingsRequest $request): JsonResponse
    {
        $user = $request->user();
        $sacco = $user->sacco;

        if (! $sacco) {
            return $this->notFound('SACCO not found.');
        }

        $sacco->update($request->validated());

        return $this->success(
            SaccoSettingsResource::make($sacco->fresh()),
            'SACCO settings updated successfully.'
        );
    }
}
