<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasManyThrough;

/**
 * @property int $id
 * @property string $name
 * @property string|null $registration_number
 * @property string $status
 * @property string|null $rejection_reason
 * @property float|string $share_value
 * @property string|null $currency
 * @property string|null $email
 * @property string|null $phone
 * @property string|null $address
 * @property string|null $region
 * @property float|string $default_interest_rate
 * @property float|string $max_loan_amount
 * @property int $max_loan_term
 * @property float|string $loan_to_savings_ratio
 * @property int $min_shares_per_member
 * @property float|string $late_fee_percentage
 * @property bool $is_public
 * @property bool $is_accepting_members
 * @property bool $show_share_info
 * @property bool $is_directory_allowed
 * @property string|null $logo_path
 * @property string|null $description
 * @property string|null $location
 * @property string|null $category
 * @property string|null $eligibility_criteria
 * @property string|null $contact_email
 * @property string|null $contact_phone
 * @property int $min_shares
 * @property \Carbon\Carbon|null $created_at
 * @property \Carbon\Carbon|null $updated_at
 * @property-read int|null $members_count
 * @property-read int|null $active_loans_count
 * @property-read int|null $users_count
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
        // Public profile fields
        'is_public',
        'is_accepting_members',
        'show_share_info',
        'is_directory_allowed',
        'logo_path',
        'description',
        'location',
        'category',
        'eligibility_criteria',
        'contact_email',
        'contact_phone',
        'min_shares',
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
            'is_public' => 'boolean',
            'is_accepting_members' => 'boolean',
            'show_share_info' => 'boolean',
            'is_directory_allowed' => 'boolean',
            'min_shares' => 'integer',
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

    /**
     * @return HasMany<MembershipRequest, $this>
     */
    public function membershipRequests(): HasMany
    {
        return $this->hasMany(MembershipRequest::class);
    }
}
