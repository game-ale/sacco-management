<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Resources\V1\PublicSaccoResource;
use App\Http\Traits\ApiResponse;
use App\Models\Sacco;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\AnonymousResourceCollection;

class PublicSaccoController extends Controller
{
    use ApiResponse;

    /**
     * List all publicly visible SACCOs for directory browsing.
     */
    public function index(Request $request): AnonymousResourceCollection
    {
        $query = Sacco::query()
            ->where('status', 'approved')
            ->where('is_directory_allowed', true)
            ->where('is_public', true)
            ->withCount('users');

        if ($request->filled('search')) {
            $search = (string) $request->query('search');
            $query->where('name', 'like', "%{$search}%");
        }

        if ($request->filled('location')) {
            $location = (string) $request->query('location');
            $query->where('location', 'like', "%{$location}%");
        }

        if ($request->filled('category')) {
            $category = (string) $request->query('category');
            $query->where('category', $category);
        }

        $saccos = $query->latest()->paginate(12);

        return PublicSaccoResource::collection($saccos);
    }

    /**
     * Display a single public SACCO profile.
     */
    public function show(int $id): JsonResponse|PublicSaccoResource
    {
        $sacco = Sacco::query()
            ->where('id', $id)
            ->where('status', 'approved')
            ->where('is_directory_allowed', true)
            ->where('is_public', true)
            ->withCount('users')
            ->first();

        if (! $sacco) {
            return $this->notFound('SACCO not found or not publicly visible.');
        }

        return PublicSaccoResource::make($sacco);
    }
}
