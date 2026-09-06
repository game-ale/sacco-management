<?php

namespace App\Http\Resources\V1;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

/**
 * @mixin \App\Models\Sacco
 */
class PublicSaccoResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        $shareValue = (float) ($this->share_value ?? 0);
        $minShares = (int) ($this->min_shares ?? 1);
        $minSharePurchaseAmount = round($shareValue * $minShares, 2);

        return [
            'id' => $this->id,
            'name' => $this->name,
            'logo_path' => $this->logo_path,
            'description' => $this->description,
            'location' => $this->location,
            'category' => $this->category,
            'eligibility_criteria' => $this->eligibility_criteria,
            'is_accepting_members' => (bool) $this->is_accepting_members,
            'contact_email' => $this->contact_email,
            'contact_phone' => $this->contact_phone,
            'members_count' => $this->whenCounted('users', fn () => $this->users_count, fn () => $this->members()->count()),
            'show_share_info' => (bool) $this->show_share_info,
            'share_value' => $this->show_share_info ? $shareValue : null,
            'min_shares' => $this->show_share_info ? $minShares : null,
            'min_share_purchase_amount' => $this->show_share_info ? $minSharePurchaseAmount : null,
        ];
    }
}
