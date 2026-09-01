<?php

namespace App\Http\Controllers\Api\V1;

use App\Http\Controllers\Controller;
use App\Http\Traits\ApiResponse;
use App\Models\LoanGuarantor;
use App\Notifications\GuarantorResponseNotification;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Notification;

class GuarantorRequestController extends Controller
{
    use ApiResponse;

    /**
     * List all guarantee requests sent to the authenticated member.
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();

        $guaranteeRequests = LoanGuarantor::where('member_id', $user->id)
            ->with(['loan.user', 'loan.sacco'])
            ->latest()
            ->get()
            ->map(function ($g) {
                return [
                    'id' => $g->id,
                    'loan_id' => $g->loan_id,
                    'loan_number' => $g->loan->loan_number ?? null,
                    'applicant_name' => $g->loan->user->name ?? 'Applicant',
                    'applicant_email' => $g->loan->user->email ?? null,
                    'loan_amount' => (float) ($g->loan->principal_amount ?? 0),
                    'loan_purpose' => $g->loan->purpose ?? null,
                    'amount_guaranteed' => (float) $g->amount_guaranteed,
                    'status' => $g->status,
                    'created_at' => $g->created_at?->toDateTimeString(),
                    'updated_at' => $g->updated_at?->toDateTimeString(),
                ];
            });

        return $this->success($guaranteeRequests, 'Guarantee requests retrieved successfully.');
    }

    /**
     * Accept a guarantee request.
     */
    public function accept(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $guaranteeRequest = LoanGuarantor::with('loan.user')->find($id);

        if (!$guaranteeRequest) {
            return $this->notFound('Guarantee request not found.');
        }

        // Authorization check: Only the designated guarantor can accept
        if ((int) $guaranteeRequest->member_id !== (int) $user->id) {
            return $this->forbidden('You do not have permission to respond to this guarantee request.');
        }

        $guaranteeRequest->update(['status' => 'accepted']);

        // Notify loan applicant
        $loan = $guaranteeRequest->loan;
        $applicant = $loan?->user;
        if ($loan && $applicant) {
            Notification::send($applicant, new GuarantorResponseNotification(
                $loan,
                $user,
                'accepted'
            ));
        }

        return $this->success([
            'id' => $guaranteeRequest->id,
            'status' => 'accepted',
        ], 'Guarantee request accepted successfully.');
    }

    /**
     * Reject a guarantee request.
     */
    public function reject(Request $request, int $id): JsonResponse
    {
        $user = $request->user();

        $guaranteeRequest = LoanGuarantor::with('loan.user')->find($id);

        if (!$guaranteeRequest) {
            return $this->notFound('Guarantee request not found.');
        }

        // Authorization check: Only the designated guarantor can reject
        if ((int) $guaranteeRequest->member_id !== (int) $user->id) {
            return $this->forbidden('You do not have permission to respond to this guarantee request.');
        }

        $guaranteeRequest->update(['status' => 'rejected']);

        // Notify loan applicant
        $loan = $guaranteeRequest->loan;
        $applicant = $loan?->user;
        if ($loan && $applicant) {
            Notification::send($applicant, new GuarantorResponseNotification(
                $loan,
                $user,
                'rejected'
            ));
        }

        return $this->success([
            'id' => $guaranteeRequest->id,
            'status' => 'rejected',
        ], 'Guarantee request rejected.');
    }
}
