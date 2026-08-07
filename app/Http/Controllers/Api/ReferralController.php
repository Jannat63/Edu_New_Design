<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\ReferralCommission;
use App\Models\ReferralPayout;
use App\Models\SiteSetting;
use Illuminate\Http\Request;

/**
 * Referral/affiliate program (Phase 2 item 4). Open to any registered user,
 * not just instructors — deliberately kept as its own set of tables rather
 * than extending the existing instructor `payouts` table; see the migration
 * for why. Mirrors PayoutController's request/approve/paid flow throughout.
 */
class ReferralController extends Controller
{
    private const MIN_PAYOUT = 100.0;

    public static function commissionRatePercent(): float
    {
        return (float) SiteSetting::get('referral_commission_percent', 15);
    }

    /** GET /api/v1/referrals/summary */
    public function summary(Request $request)
    {
        $user = $request->user();
        $code = $user->ensureReferralCode();

        return response()->json([
            'referral_code'    => $code,
            'referral_link'    => rtrim(config('app.frontend_url', 'http://localhost:8000'), '/') . '/register?ref=' . $code,
            'commission_rate'  => self::commissionRatePercent(),
            'total_referred'   => $user->referredUsers()->count(),
            'total_earned'     => (float) ReferralCommission::where('referrer_id', $user->id)->sum('amount'),
            'available_balance'=> $this->availableBalance($user->id),
        ]);
    }

    /** GET /api/v1/referrals/commissions */
    public function commissions(Request $request)
    {
        $commissions = ReferralCommission::where('referrer_id', $request->user()->id)
            ->with('referredUser:id,name,email')
            ->orderByDesc('id')
            ->paginate(20);

        return response()->json($commissions);
    }

    /** GET /api/v1/referrals/payouts */
    public function myPayouts(Request $request)
    {
        $payouts = ReferralPayout::where('user_id', $request->user()->id)
            ->orderByDesc('id')->get()->map(fn ($p) => $this->payload($p));

        return response()->json($payouts);
    }

    /** POST /api/v1/referrals/payouts */
    public function requestPayout(Request $request)
    {
        $data = $request->validate([
            'amount'         => 'required|numeric|min:' . self::MIN_PAYOUT,
            'method'         => 'required|in:bkash,nagad,rocket,bank',
            'account_number' => 'required|string|max:50',
        ]);

        $available = $this->availableBalance($request->user()->id);
        if ($data['amount'] > $available) {
            return response()->json([
                'message' => "Requested amount exceeds your available referral balance of ৳" . number_format($available, 2) . ".",
            ], 422);
        }

        $payout = ReferralPayout::create([...$data, 'user_id' => $request->user()->id, 'status' => 'pending']);

        return response()->json([
            'message' => 'Payout request submitted. We will process it within 3 business days.',
            'payout'  => $this->payload($payout),
        ], 201);
    }

    /** GET /api/v1/admin/referral-payouts */
    public function adminIndex()
    {
        return response()->json(
            ReferralPayout::with('user:id,name,email')->orderByDesc('id')->get()->map(fn ($p) => $this->payload($p))
        );
    }

    /** PUT /api/v1/admin/referral-payouts/{id} */
    public function adminUpdate(int $id, Request $request)
    {
        $payout = ReferralPayout::findOrFail($id);
        $data = $request->validate([
            'status' => 'required|in:pending,processing,paid,rejected',
            'note'   => 'nullable|string',
        ]);

        if ($data['status'] === 'paid') {
            $data['paid_at'] = now();
        }
        $data['processed_by'] = $request->user()->id;

        $payout->update($data);

        return response()->json(['message' => 'Payout updated.', 'payout' => $this->payload($payout->fresh())]);
    }

    /** Same accounting approach as PayoutController::availableBalance — recomputed from source rows, not a cached counter. */
    private function availableBalance(int $userId): float
    {
        $earned = (float) ReferralCommission::where('referrer_id', $userId)->sum('amount');

        $claimed = (float) ReferralPayout::where('user_id', $userId)
            ->whereIn('status', ['pending', 'processing', 'paid'])
            ->sum('amount');

        return max(0, round($earned - $claimed, 2));
    }

    private function payload(ReferralPayout $p): array
    {
        return [
            'id'             => $p->id,
            'amount'         => $p->amount,
            'method'         => $p->method,
            'account_number' => $p->account_number,
            'status'         => $p->status,
            'note'           => $p->note,
            'paid_at'        => $p->paid_at?->format('Y-m-d'),
            'created_at'     => $p->created_at->diffForHumans(),
            'user'           => $p->user?->only('id', 'name', 'email'),
        ];
    }
}
