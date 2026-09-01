<?php

namespace App\Console\Commands;

use App\Models\LoanSchedule;
use App\Models\User;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Notification;
use App\Notifications\LoanOverdueAlert;

class ApplyLatePenalties extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'loans:apply-penalties';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Apply one-time late fee penalties to overdue loan installments';

    /**
     * Execute the console command.
     */
    public function handle(): int
    {
        $overdueSchedules = LoanSchedule::query()
            ->where('due_date', '<', now()->toDateString())
            ->where('status', '!=', 'paid')
            ->where('penalty_amount', 0)
            ->whereColumn('amount_paid', '<', 'total_due')
            ->with('loan.sacco')
            ->get();

        $applied = 0;

        foreach ($overdueSchedules as $schedule) {
            $sacco = $schedule->loan->sacco ?? null;

            if (! $sacco) {
                continue;
            }

            $feePercent = (float) ($sacco->late_fee_percentage ?? 0);

            if ($feePercent <= 0) {
                continue;
            }

            $overdueAmount = (float) $schedule->total_due - (float) $schedule->amount_paid;
            $penalty = round($overdueAmount * ($feePercent / 100), 2);

            if ($penalty <= 0) {
                continue;
            }

            DB::transaction(function () use ($schedule, $penalty, $sacco): void {
                $locked = LoanSchedule::where('id', $schedule->id)
                    ->lockForUpdate()
                    ->first();

                // Only apply if penalty hasn't been set by another process
                if ((float) $locked->penalty_amount === 0.0) {
                    $locked->penalty_amount = $penalty;
                    $locked->status = 'overdue';
                    $locked->save();

                    // Notify SACCO Admins
                    $admins = User::where('sacco_id', $sacco->id)
                                  ->where('role', 'admin')
                                  ->get();
                    if ($admins->isNotEmpty()) {
                        Notification::send($admins, new LoanOverdueAlert($locked));
                    }
                }
            });

            $applied++;
        }

        $this->info("Applied late penalties to {$applied} overdue installment(s).");

        return self::SUCCESS;
    }
}
