<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $loan_id
 * @property int $installment_number
 * @property Carbon $due_date
 * @property float $principal_due
 * @property float $interest_due
 * @property float $total_due
 * @property float $amount_paid
 * @property float $penalty_amount
 * @property string $status
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Loan $loan
 */
class LoanSchedule extends Model
{
    /**
     * @var list<string>
     */
    protected $fillable = [
        'loan_id',
        'installment_number',
        'due_date',
        'principal_due',
        'interest_due',
        'total_due',
        'amount_paid',
        'penalty_amount',
        'status',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'due_date' => 'date',
            'principal_due' => 'decimal:2',
            'interest_due' => 'decimal:2',
            'total_due' => 'decimal:2',
            'amount_paid' => 'decimal:2',
            'penalty_amount' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<Loan, $this>
     */
    public function loan(): BelongsTo
    {
        return $this->belongsTo(Loan::class);
    }

    /**
     * @return HasMany<Repayment, $this>
     */
    public function repayments(): HasMany
    {
        return $this->hasMany(Repayment::class);
    }
}
