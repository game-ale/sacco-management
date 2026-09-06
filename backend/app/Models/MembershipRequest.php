<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * @property int $id
 * @property int $sacco_id
 * @property string $full_name
 * @property string $email
 * @property string $phone_number
 * @property string|null $national_id
 * @property string|null $message
 * @property string $status
 * @property string|null $rejection_reason
 * @property int|null $reviewed_by
 * @property \Carbon\Carbon|null $reviewed_at
 * @property \Carbon\Carbon $created_at
 * @property \Carbon\Carbon $updated_at
 */
class MembershipRequest extends Model
{
    protected $fillable = [
        'sacco_id',
        'full_name',
        'email',
        'phone_number',
        'national_id',
        'message',
        'status',
        'rejection_reason',
        'reviewed_by',
        'reviewed_at',
        'activation_token_hash',
        'activation_expires_at',
        'activated_at',
    ];

    protected $casts = [
        'reviewed_at' => 'datetime',
        'activation_expires_at' => 'datetime',
        'activated_at' => 'datetime',
    ];

    /**
     * @return BelongsTo<Sacco, $this>
     */
    public function sacco(): BelongsTo
    {
        return $this->belongsTo(Sacco::class);
    }

    /**
     * @return BelongsTo<User, $this>
     */
    public function reviewer(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }

    /**
     * Alias for reviewer
     *
     * @return BelongsTo<User, $this>
     */
    public function reviewedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'reviewed_by');
    }
}
