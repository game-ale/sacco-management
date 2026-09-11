<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class SaasInvoice extends Model
{
    protected $fillable = [
        'sacco_id',
        'period',
        'profit_amount',
        'rent_percentage',
        'rent_amount',
        'status',
    ];

    protected function casts(): array
    {
        return [
            'profit_amount' => 'decimal:2',
            'rent_percentage' => 'decimal:2',
            'rent_amount' => 'decimal:2',
        ];
    }

    /**
     * @return BelongsTo<Sacco, covariant self>
     */
    public function sacco(): BelongsTo
    {
        return $this->belongsTo(Sacco::class);
    }
}
