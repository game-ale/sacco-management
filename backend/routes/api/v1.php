<?php

declare(strict_types=1);

use App\Http\Controllers\Api\V1\AdminSaccoController;
use App\Http\Controllers\Api\V1\AuthController;
use App\Http\Controllers\Api\V1\DashboardController;
use App\Http\Controllers\Api\V1\DividendController;
use App\Http\Controllers\Api\V1\GuarantorRequestController;
use App\Http\Controllers\Api\V1\LoanController;
use App\Http\Controllers\Api\V1\MemberController;
use App\Http\Controllers\Api\V1\MemberSavingsController;
use App\Http\Controllers\Api\V1\MemberShareController;
use App\Http\Controllers\Api\V1\SearchController;
use App\Http\Controllers\Api\V1\NotificationController;
use App\Http\Controllers\Api\V1\PlatformSettingsController;
use App\Http\Controllers\Api\V1\RepaymentController;
use App\Http\Controllers\Api\V1\SaccoRegistrationController;
use App\Http\Controllers\Api\V1\SaccoSettingsController;
use App\Http\Controllers\Api\V1\SuperadminReportsController;
use App\Http\Controllers\Api\V1\SuperadminUserController;
use App\Http\Controllers\Api\V1\TwoFactorController;
use App\Http\Controllers\Api\V1\PublicController;
use App\Http\Controllers\Api\V1\SavingsRequestController;
use App\Http\Controllers\Api\V1\PaymentRequestController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API V1 Routes
|--------------------------------------------------------------------------
|
| Routes for API version 1.
|
*/

Route::prefix('public')->group(function () {
    Route::get('/stats', [PublicController::class, 'getStats']);
    Route::post('/contact', [PublicController::class, 'submitContactForm']);
});

// Health check
Route::get('health', fn () => response()->json([
    'status' => 'healthy',
    'timestamp' => now()->toDateTimeString(),
]))->name('api.v1.health');

// Public routes with auth rate limiter (5/min - brute force protection)
Route::middleware('throttle:auth')->group(function (): void {
    Route::post('register', [AuthController::class, 'register'])->name('api.v1.register');
    Route::post('login', [AuthController::class, 'login'])->name('api.v1.login');
    Route::post('saccos/register', [SaccoRegistrationController::class, 'register'])->name('api.v1.saccos.register');
    
    // 2FA Challenge
    Route::post('two-factor/challenge', [TwoFactorController::class, 'challenge'])->name('api.v1.two-factor.challenge');
    
    // Member registration via invite token
    Route::post('members/register', [\App\Http\Controllers\Api\V1\InvitationController::class, 'register'])->name('api.v1.members.register');
});

// Email verification
Route::get('email/verify/{id}/{hash}', [AuthController::class, 'verifyEmail'])
    ->middleware('signed')
    ->name('verification.verify');

// Protected routes with authenticated rate limiter (120/min)
Route::middleware(['auth:sanctum', 'throttle:authenticated'])->group(function (): void {
    Route::post('logout', [AuthController::class, 'logout'])->name('api.v1.logout');
    Route::get('profile', [AuthController::class, 'profile'])->name('api.v1.profile');
    Route::put('profile', [AuthController::class, 'updateProfile'])->name('api.v1.profile.update');
    // Member savings
    Route::get('members/{member}/savings', [MemberSavingsController::class, 'show'])
        ->name('api.v1.members.savings.show');
    // Member viewing their own savings
    Route::get('me/savings', [MemberSavingsController::class, 'showOwn'])
        ->name('api.v1.me.savings.show');
    // Member savings diposit
    Route::post('members/{id}/savings/deposit', [MemberSavingsController::class, 'deposit'])
        ->name('api.v1.members.savings.deposit');
    // Member savings withdrawal
    Route::post('members/{id}/savings/withdraw', [MemberSavingsController::class, 'withdraw'])
        ->name('api.v1.members.savings.withdraw');

    // Change password
    Route::put('change-password', [AuthController::class, 'changePassword'])->name('api.v1.change-password');
    
    // Two-Factor Authentication (Personal)
    Route::post('two-factor/enable', [TwoFactorController::class, 'enable'])->name('api.v1.two-factor.enable');
    Route::post('two-factor/confirm', [TwoFactorController::class, 'confirm'])->name('api.v1.two-factor.confirm');
    Route::delete('two-factor/disable', [TwoFactorController::class, 'disable'])->name('api.v1.two-factor.disable');
    Route::get('two-factor/recovery-codes', [TwoFactorController::class, 'regenerateRecoveryCodes'])->name('api.v1.two-factor.recovery-codes');
    
    // Guarantor Search & Requests (accessible to members)
    Route::get('guarantors/search', [MemberController::class, 'searchGuarantors'])->name('api.v1.guarantors.search');
    Route::get('guarantor-requests', [GuarantorRequestController::class, 'index'])->name('api.v1.guarantor-requests.index');
    Route::patch('guarantor-requests/{id}/accept', [GuarantorRequestController::class, 'accept'])->name('api.v1.guarantor-requests.accept');
    Route::patch('guarantor-requests/{id}/reject', [GuarantorRequestController::class, 'reject'])->name('api.v1.guarantor-requests.reject');

    Route::post('email/resend', [AuthController::class, 'resendVerificationEmail'])
        ->middleware('throttle:6,1')
        ->name('verification.send');

    // Member dividends history
    Route::get('me/dividends', [DividendController::class, 'memberHistory'])->name('api.v1.me.dividends');

    /*
     * Global Search
     */
    Route::get('search', [SearchController::class, 'index']);

    /*
     * Notifications
     */
    Route::get('notifications', [NotificationController::class, 'index']);
    Route::patch('notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::post('notifications/read-all', [NotificationController::class, 'markAllAsRead']);
});

// Password reset routes (public with rate limiting)
Route::middleware('throttle:6,1')->group(function (): void {
    Route::post('forgot-password', [AuthController::class, 'forgotPassword'])
        ->name('password.email');
    Route::post('reset-password', [AuthController::class, 'resetPassword'])
        ->name('password.reset');
});

// ─── Superadmin Routes ───────────────────────────────────────────────
// Protected by auth + role:superadmin middleware
Route::middleware(['auth:sanctum', 'throttle:authenticated', 'role:superadmin'])
    ->prefix('admin')
    ->group(function (): void {
        // Dashboard
        Route::get('dashboard/stats', [AdminSaccoController::class, 'stats'])->name('api.v1.admin.dashboard.stats');
        Route::get('dashboard/sacco-growth', [AdminSaccoController::class, 'saccoGrowth'])->name('api.v1.admin.dashboard.sacco-growth');


        /*
         * SACCO Management Endpoints
         */
        Route::get('saccos/export', [AdminSaccoController::class, 'export'])->name('api.v1.admin.saccos.export');
        Route::get('saccos', [AdminSaccoController::class, 'index'])->name('api.v1.admin.saccos.index');
        Route::get('saccos/{sacco}', [AdminSaccoController::class, 'show'])->name('api.v1.admin.saccos.show');
        Route::get('saccos/{sacco}/details', [AdminSaccoController::class, 'details'])->name('api.v1.admin.saccos.details');
        Route::patch('saccos/{sacco}/approve', [AdminSaccoController::class, 'approve'])->name('api.v1.admin.saccos.approve');
        Route::patch('saccos/{sacco}/reject', [AdminSaccoController::class, 'reject'])->name('api.v1.admin.saccos.reject');
        Route::patch('saccos/{sacco}/suspend', [AdminSaccoController::class, 'suspend'])->name('api.v1.admin.saccos.suspend');
        Route::patch('saccos/{sacco}/reactivate', [AdminSaccoController::class, 'reactivate'])->name('api.v1.admin.saccos.reactivate');

        // All Users (platform-wide)
        Route::get('users/export', [SuperadminUserController::class, 'export'])->name('api.v1.admin.users.export');
        Route::get('users', [SuperadminUserController::class, 'index'])->name('api.v1.admin.users.index');
        Route::get('users/{user}', [SuperadminUserController::class, 'show'])->name('api.v1.admin.users.show');
        Route::patch('users/{user}/suspend', [SuperadminUserController::class, 'suspend'])->name('api.v1.admin.users.suspend');
        Route::patch('users/{user}/activate', [SuperadminUserController::class, 'activate'])->name('api.v1.admin.users.activate');
        Route::post('users/{user}/reset-password', [SuperadminUserController::class, 'resetPassword'])->name('api.v1.admin.users.reset-password');
        Route::delete('users/{user}/two-factor', [SuperadminUserController::class, 'disableTwoFactor'])->name('api.v1.admin.users.disable-two-factor');

        // Platform Reports
        Route::get('reports/overview', [SuperadminReportsController::class, 'overview'])->name('api.v1.admin.reports.overview');
        Route::get('reports/sacco-comparison', [SuperadminReportsController::class, 'saccoComparison'])->name('api.v1.admin.reports.sacco-comparison');
        Route::get('reports/growth-trends', [SuperadminReportsController::class, 'growthTrends'])->name('api.v1.admin.reports.growth-trends');
        Route::get('reports/geographic-distribution', [SuperadminReportsController::class, 'geographicDistribution'])->name('api.v1.admin.reports.geographic-distribution');

        // Platform Settings
        Route::get('platform-settings', [PlatformSettingsController::class, 'show'])->name('api.v1.admin.platform-settings.show');
        Route::put('platform-settings', [PlatformSettingsController::class, 'update'])->name('api.v1.admin.platform-settings.update');
    });

// ─── SACCO Admin Routes ──────────────────────────────────────────────
// Protected by auth + role:admin middleware
Route::middleware(['auth:sanctum', 'throttle:authenticated', 'role:admin,sacco_admin'])
    ->group(function (): void {
        Route::get('dashboard', [DashboardController::class, 'index'])->name('api.v1.dashboard');
        Route::get('dashboard/metrics', [DashboardController::class, 'metrics'])->name('api.v1.dashboard.metrics');
        Route::get('dashboard/charts', [DashboardController::class, 'charts'])->name('api.v1.dashboard.charts');
        Route::get('dashboard/activity', [DashboardController::class, 'activity'])->name('api.v1.dashboard.activity');

        Route::apiResource('members', MemberController::class)->names('api.v1.members');
        Route::post('members/invite', [\App\Http\Controllers\Api\V1\InvitationController::class, 'invite'])->name('api.v1.members.invite');
        Route::post('members/{member}/reset-password', [MemberController::class, 'resetPassword'])->name('api.v1.members.reset-password');

        Route::post('dividends/calculate', [DividendController::class, 'calculate'])->name('api.v1.dividends.calculate');
        Route::post('dividends/distribute', [DividendController::class, 'distribute'])->name('api.v1.dividends.distribute');
        Route::get('dividends', [DividendController::class, 'adminHistory'])->name('api.v1.dividends.index');

        Route::get('settings', [SaccoSettingsController::class, 'show'])->name('api.v1.settings.show');
        Route::put('settings', [SaccoSettingsController::class, 'update'])->name('api.v1.settings.update');

        Route::get('shares/summary', [MemberShareController::class, 'summary'])->name('api.v1.shares.summary');
        Route::patch('members/{member}/shares', [MemberShareController::class, 'update'])->name('api.v1.members.shares.update');

        Route::post('repayments', [RepaymentController::class, 'store'])->name('api.v1.repayments.store');
        Route::get('repayments/overdue', [RepaymentController::class, 'overdue'])->name('api.v1.repayments.overdue');

        // Savings Requests (Admin)
        Route::get('savings-requests', [SavingsRequestController::class, 'indexAdmin'])->name('api.v1.savings-requests.index');
        Route::get('savings-requests/{savingsRequest}', [SavingsRequestController::class, 'showAdmin'])->name('api.v1.savings-requests.show');
        Route::patch('savings-requests/{id}/approve', [SavingsRequestController::class, 'approve'])->name('api.v1.savings-requests.approve');
        Route::patch('savings-requests/{id}/reject', [SavingsRequestController::class, 'reject'])->name('api.v1.savings-requests.reject');

        // Payment Requests (Admin)
        Route::get('payment-requests', [PaymentRequestController::class, 'indexAdmin'])->name('api.v1.payment-requests.index');
        Route::get('payment-requests/{paymentRequest}', [PaymentRequestController::class, 'showAdmin'])->name('api.v1.payment-requests.show');
        Route::patch('payment-requests/{id}/approve', [PaymentRequestController::class, 'approve'])->name('api.v1.payment-requests.approve');
        Route::patch('payment-requests/{id}/reject', [PaymentRequestController::class, 'reject'])->name('api.v1.payment-requests.reject');
    });

// ─── Loan Endpoints ──────────────────────────────────────────────────
Route::middleware(['auth:sanctum', 'throttle:authenticated', 'role:admin,sacco_admin'])->group(function (): void {
    Route::get('loans', [LoanController::class, 'index'])->name('api.v1.loans.index');
    Route::patch('loans/{loan}/approve', [LoanController::class, 'approve'])->name('api.v1.loans.approve');
    Route::patch('loans/{loan}/reject', [LoanController::class, 'reject'])->name('api.v1.loans.reject');
    Route::patch('loans/{loan}/disburse', [LoanController::class, 'disburse'])->name('api.v1.loans.disburse');
    Route::get('repayments/overdue', [RepaymentController::class, 'overdue'])->name('api.v1.repayments.overdue');
});

// Both SACCO administrators and the loan owner may record a manual repayment.
// The controller performs the ownership/SACCO checks for the bound loan.
Route::post('loans/{loan}/repayments', [RepaymentController::class, 'store'])
    ->middleware(['auth:sanctum', 'throttle:authenticated', 'role:admin,sacco_admin,member'])
    ->name('api.v1.loans.repayments.store');

Route::middleware(['auth:sanctum', 'throttle:authenticated', 'role:member'])->group(function (): void {
    Route::post('loans', [LoanController::class, 'store'])->name('api.v1.loans.store');
    Route::get('me/loans', [LoanController::class, 'myLoans'])->name('api.v1.me.loans');

    // Savings Requests (Member)
    Route::post('me/savings-requests', [SavingsRequestController::class, 'store'])->name('api.v1.me.savings-requests.store');
    Route::get('me/savings-requests', [SavingsRequestController::class, 'indexOwn'])->name('api.v1.me.savings-requests.index');
    Route::get('me/savings-requests/{savingsRequest}', [SavingsRequestController::class, 'showOwn'])->name('api.v1.me.savings-requests.show');

    // Payment Requests (Member)
    Route::post('loans/{loan}/payment-requests', [PaymentRequestController::class, 'store'])->name('api.v1.loans.payment-requests.store');
    Route::get('me/payment-requests', [PaymentRequestController::class, 'indexOwn'])->name('api.v1.me.payment-requests.index');
    Route::get('me/payment-requests/{paymentRequest}', [PaymentRequestController::class, 'showOwn'])->name('api.v1.me.payment-requests.show');
});

Route::middleware(['auth:sanctum', 'throttle:authenticated'])->group(function (): void {
    Route::get('loans/{loan}', [LoanController::class, 'show'])->name('api.v1.loans.show');
    Route::get('loans/{loan}/repayments', [RepaymentController::class, 'index'])->name('api.v1.loans.repayments.index');
});

