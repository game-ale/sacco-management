<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

/**
 * @property string $status
 * @property int $id
 * @property string $name
 * @property string|null $region
 * @property-read int|null $members_count
 * @property-read int|null $active_loans_count
 */
class Sacco extends Model
{
    protected $fillable = [
        'name',
        'registration_number',
        'status',
        'rejection_reason',
        'share_value',
        'currency',
        'email',
        'phone',
        'address',
        'region',
        'default_interest_rate',
        'max_loan_amount',
        'max_loan_term',
        'loan_to_savings_ratio',
        'min_shares_per_member',
        'loan_savings_multiplier',
        'late_fee_percentage',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'share_value' => 'decimal:2',
            'default_interest_rate' => 'decimal:2',
            'max_loan_amount' => 'decimal:2',
            'max_loan_term' => 'integer',
            'loan_to_savings_ratio' => 'decimal:2',
            'min_shares_per_member' => 'integer',
            'late_fee_percentage' => 'decimal:2',
        ];
    }

    /**
     * @return HasMany<User, $this>
     */
    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /**
     * @return HasMany<User, $this>
     */
    public function members(): HasMany
    {
        return $this->hasMany(User::class)->where('role', 'member');
    }

    /**
     * @return HasManyThrough<SavingsTransaction, User, $this>
     */
    public function savingsTransactions(): HasManyThrough
    {
        return $this->hasManyThrough(SavingsTransaction::class, User::class, 'sacco_id', 'member_id');
    }

    /**
     * @return HasMany<Loan, $this>
     */
    public function loans(): HasMany
    {
        return $this->hasMany(Loan::class);
    }

    /**
     * @return HasMany<Dividend, $this>
     */
    public function dividends(): HasMany
    {
        return $this->hasMany(Dividend::class);
    }
}
