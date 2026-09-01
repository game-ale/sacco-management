<?php

namespace App\Models;

use Database\Factories\SavingsTransactionFactory;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SavingsTransaction extends Model
{
    /** @use HasFactory<SavingsTransactionFactory> */
    use HasFactory;

    protected $table = 'savings_transactions';

    protected $fillable = [
        'member_id',
        'type',
        'amount',
        'balance_after',
        'description',
        'transaction_date',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'balance_after' => 'decimal:2',
        'created_at' => 'datetime',
    ];

    /**
     * @return BelongsTo<User, $this>
     */
    public function user(): BelongsTo
    {
        return $this->belongsTo(User::class, 'member_id');
    }
}
