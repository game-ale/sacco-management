<?php

namespace App\Models;

use Carbon\Carbon;
use Database\Factories\LoanFactory;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

/**
 * @property int $id
 * @property int $sacco_id
 * @property int $member_id
 * @property string $loan_number
 * @property string $loan_type
 * @property float $principal_amount
 * @property string $purpose
 * @property string $status
 * @property float|null $interest_rate
 * @property int|null $term_months
 * @property float|null $total_repayable
 * @property float|null $monthly_installment
 * @property string|null $rejection_reason
 * @property Carbon|null $approved_at
 * @property Carbon|null $disbursed_at
 * @property int|null $approved_by
 * @property Carbon|null $created_at
 * @property Carbon|null $updated_at
 * @property-read Sacco|null $sacco
 * @property-read User|null $user
 * @property-read Collection<int, LoanSchedule> $schedules
 * @property-read Collection<int, Repayment> $repayments
 * @property-read Collection<int, LoanGuarantor> $guarantors
 */
class Loan extends Model
{
    /** @use HasFactory<LoanFactory> */
    use HasFactory;

    /**
     * @var list<string>
     */
    protected $fillable = [
        'sacco_id',
        'member_id',
        'loan_number',
        'loan_type',
        'principal_amount',
        'purpose',
        'status',
        'interest_rate',
        'term_months',
        'total_repayable',
        'monthly_installment',
        'rejection_reason',
        'approved_at',
        'disbursed_at',
        'approved_by',
    ];

    /**
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'principal_amount' => 'decimal:2',
            'interest_rate' => 'decimal:2',
            'total_repayable' => 'decimal:2',
            'monthly_installment' => 'decimal:2',
            'approved_at' => 'datetime',
            'disbursed_at' => 'datetime',
        ];
    }

    /**
     * @return BelongsTo<Sacco, $this>
     */
    public function sacco(): BelongsTo
    {
        return $this->belongsTo(Sacco::class);
    }

    /**
     * The member (user) that owns this loan. Kept as `user()` for backward
     * compatibility with existing call sites; maps to the `member_id` column.
     *
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'member_id');
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function approvedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'approved_by');
    }

    /**
     * @return HasMany<LoanSchedule, $this>
     */
    public function schedules(): HasMany
    {
        return $this->hasMany(LoanSchedule::class);
    }

    /**
     * @return HasMany<Repayment, $this>
     */
    public function repayments(): HasMany
    {
        return $this->hasMany(Repayment::class);
    }

    /**
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<\App\Models\LoanGuarantor, $this>
     */
    public function guarantors(): HasMany
    {
        return $this->hasMany(LoanGuarantor::class);
    }
}
