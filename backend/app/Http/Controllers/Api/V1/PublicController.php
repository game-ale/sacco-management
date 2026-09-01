<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Sacco;
use App\Models\User;
use App\Models\SavingsTransaction;
use App\Models\ContactInquiry;
use App\Http\Traits\ApiResponse;
use Illuminate\Http\JsonResponse;

class PublicController extends Controller
{
    use ApiResponse;

    /**
     * Get platform statistics for the public landing page.
     */
    public function getStats(): JsonResponse
    {
        $totalSaccos = Sacco::count();
        $totalMembers = User::where('role', 'member')->count();
        // Since SavingsTransaction tracks balance per member, we can sum the latest balance of each member
        // For simplicity in a public stats endpoint, we'll just sum all deposits (transaction_type = deposit)
        // or just return a dummy value if the DB gets too large. Let's do a simple sum for now.
        $totalSavings = SavingsTransaction::where('transaction_type', 'deposit')->sum('amount');

        // Dummy monthly growth data for the chart
        $monthlyGrowth = [40, 60, 45, 80, 65, 100];

        return $this->success([
            'saccos_registered' => $totalSaccos,
            'active_members' => $totalMembers,
            'birr_managed' => $totalSavings,
            'monthly_growth' => $monthlyGrowth,
        ], 'Public stats retrieved successfully.');
    }

    /**
     * Handle public contact form submissions.
     */
    public function submitContactForm(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|email|max:255',
            'subject' => 'required|string|max:255',
            'message' => 'required|string',
        ]);

        ContactInquiry::create($validated);

        return $this->success(null, 'Contact inquiry submitted successfully.', 201);
    }
}
