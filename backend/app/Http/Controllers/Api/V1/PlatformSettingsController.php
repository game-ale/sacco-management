<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Requests\Api\V1\UpdatePlatformSettingsRequest;
use App\Http\Traits\ApiResponse;
use App\Models\PlatformSetting;
use Illuminate\Http\JsonResponse;

class PlatformSettingsController extends Controller
{
    use ApiResponse;

    /**
     * Get all platform settings.
     *
     * @return JsonResponse
     */
    public function show(): JsonResponse
    {
        $settings = PlatformSetting::instance();

        return $this->success($settings, 'Platform settings retrieved successfully.');
    }

    /**
     * Update platform settings.
     *
     * @param  UpdatePlatformSettingsRequest  $request
     * @return JsonResponse
     */
    public function update(UpdatePlatformSettingsRequest $request): JsonResponse
    {
        $settings = PlatformSetting::instance();
        $settings->update($request->validated());

        return $this->success(
            $settings->fresh(),
            'Platform settings updated successfully.'
        );
    }
}
