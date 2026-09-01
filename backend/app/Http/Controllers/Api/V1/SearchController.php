<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Models\Loan;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use App\Http\Traits\ApiResponse;

class SearchController extends Controller
{
    use ApiResponse;

    /**
     * Handle global search across members and loans.
     */
    public function index(Request $request): JsonResponse
    {
        $query = $request->input('q');
        $saccoId = $request->user()->sacco_id;

        if (!$query) {
            return $this->success(['members' => [], 'loans' => []], 'Empty search query');
        }

        // Search Members
        $members = User::where('sacco_id', $saccoId)
            ->where('role', 'member')
            ->where(function ($q) use ($query) {
                $q->where('name', 'like', "%{$query}%")
                  ->orWhere('email', 'like', "%{$query}%")
                  ->orWhere('username', 'like', "%{$query}%");
            })
            ->select('id', 'name', 'email', 'username')
            ->take(5)
            ->get();

        // Search Loans
        $loans = Loan::where('sacco_id', $saccoId)
            ->where(function ($q) use ($query) {
                $q->where('loan_number', 'like', "%{$query}%")
                  ->orWhereHas('user', function ($u) use ($query) {
                      $u->where('name', 'like', "%{$query}%");
                  });
            })
            ->with(['user:id,name'])
            ->select('id', 'user_id', 'loan_number', 'principal_amount', 'status')
            ->take(5)
            ->get();

        return $this->success([
            'members' => $members,
            'loans' => $loans
        ], 'Search results retrieved');
    }
}
