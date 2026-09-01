<?php

namespace App\Models;

use App\Notifications\V1\ResetPasswordNotification;
use Database\Factories\UserFactory;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

/**
 * @property float|null $savings_balance
 */
class User extends Authenticatable implements MustVerifyEmail
{
    /** @use HasFactory<UserFactory> */
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * The attributes that are mass assignable.
     *
     * @var list<string>
     */
    protected $fillable = [
        'role',
        'sacco_id',
        'name',
        'email',
        'phone',
        'username',
        'password',
        'num_shares',
        'is_active',
        'national_id',
        'region',
        'zone',
        'town',
    ];

    /**
     * The attributes that should be hidden for serialization.
     *
     * @var list<string>
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Get the attributes that should be cast.
     *
     * @return array<string, string>
     */
    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password' => 'hashed',
            'num_shares' => 'integer',
        ];
    }

    /**
     * Send the password reset notification.
     *
     * @param string $token
     * @return void
     */
    public function sendPasswordResetNotification($token)
    {
        $this->notify(new ResetPasswordNotification($token));
    }

    /**
     * Get the SACCO the user belongs to.
     *
     * @return BelongsTo<Sacco, $this>
     */
    public function sacco(): BelongsTo
    {
        return $this->belongsTo(Sacco::class);
    }

    /**
     * Get the loans for the user.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<\App\Models\Loan, $this>
     */
    public function loans(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Loan::class);
    }

    /**
     * Get the repayments for the user.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<\App\Models\Repayment, $this>
     */
    public function repayments(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Repayment::class);
    }

    /**
     * Get the dividends for the user.
     *
     * @return \Illuminate\Database\Eloquent\Relations\HasMany<\App\Models\Dividend, $this>
     */
    public function dividends(): \Illuminate\Database\Eloquent\Relations\HasMany
    {
        return $this->hasMany(Dividend::class);
    }

    /**
     * Check if user is a superadmin.
     */
    public function isSuperAdmin(): bool
    {
        return $this->role === 'superadmin';
    }

    /**
     * Check if user is a SACCO admin.
     */
    public function isAdmin(): bool
    {
        return $this->role === 'admin';
    }

    /**
     * Check if user is a regular member.
     */
    public function isMember(): bool
    {
        return $this->role === 'member';
    }
}