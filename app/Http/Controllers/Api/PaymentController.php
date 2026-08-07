<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Course;
use App\Models\Payment;
use App\Models\Enrollment;
use App\Services\PaymentGatewayService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Redirect;

class PaymentController extends Controller
{
    public function __construct(private PaymentGatewayService $gateway) {}

    // ── INITIATE ──────────────────────────────────────────────────────────────
    /**
     * POST /api/v1/payments/initiate
     * Body: { course_id | bundle_id, gateway: bkash|nagad|sslcommerz, coupon_code? }
     * Exactly one of course_id / bundle_id must be present. Coupons only
     * apply to single-course purchases — bundles already carry their own
     * discounted price, so stacking a coupon on top isn't supported.
     */
    public function initiate(Request $request)
    {
        $data = $request->validate([
            'course_id'   => 'required_without:bundle_id|nullable|exists:courses,id',
            'bundle_id'   => 'required_without:course_id|nullable|exists:bundles,id',
            'gateway'     => 'required|in:bkash,nagad,sslcommerz',
            'coupon_code' => 'nullable|string|max:50',
        ]);

        if (!empty($data['course_id']) && !empty($data['bundle_id'])) {
            return response()->json(['message' => 'Provide either course_id or bundle_id, not both.'], 422);
        }

        $user = $request->user();

        return !empty($data['bundle_id'])
            ? $this->initiateBundle($request, $user, (int) $data['bundle_id'], $data['gateway'])
            : $this->initiateCourse($request, $user, (int) $data['course_id'], $data['gateway'], $data['coupon_code'] ?? null);
    }

    private function initiateCourse(Request $request, $user, int $courseId, string $gateway, ?string $couponCode)
    {
        $course = Course::findOrFail($courseId);

        // Already enrolled?
        if (Enrollment::where('user_id', $user->id)->where('course_id', $course->id)->exists()) {
            return response()->json(['message' => 'You are already enrolled in this course.'], 409);
        }

        $amount = $course->effective_price;
        $discount = 0;
        $coupon = null;

        if (!empty($couponCode)) {
            $coupon = \App\Models\Coupon::where('code', strtoupper($couponCode))->first();

            if (!$coupon || !$coupon->isValid($amount)) {
                return response()->json(['message' => 'This coupon is invalid or has expired.'], 422);
            }
            if ($coupon->course_id && $coupon->course_id != $course->id) {
                return response()->json(['message' => 'This coupon is not valid for this course.'], 422);
            }
            if ($coupon->user_id && $coupon->user_id != $user->id) {
                // Generic message, not "this code belongs to someone else" —
                // no need to confirm to a guesser that a code they found
                // is valid-but-not-theirs.
                return response()->json(['message' => 'This coupon is invalid or has expired.'], 422);
            }

            $discount = $amount - $coupon->apply($amount);
        }

        $finalAmount = max(0, $amount - $discount);

        if ($finalAmount <= 0) {
            // Free after discount — enroll directly without payment
            Enrollment::create([
                'user_id'     => $user->id,
                'course_id'   => $course->id,
                'amount_paid' => 0,
                'enrolled_at' => now(),
            ]);
            $course->increment('total_students');
            $coupon?->increment('used_count');

            return response()->json(['message' => 'Enrolled for free!', 'free' => true]);
        }

        $payment = Payment::create([
            'user_id'         => $user->id,
            'course_id'       => $course->id,
            'amount'          => $finalAmount,
            'currency'        => 'BDT',
            'gateway'         => $gateway,
            'transaction_id'  => PaymentGatewayService::generateInvoiceNumber(),
            'status'          => 'pending',
            'coupon_code'     => $couponCode,
            'discount_amount' => $discount,
        ]);

        return $this->dispatchToGateway($payment, $user, $gateway, $finalAmount, $course->title);
    }

    private function initiateBundle(Request $request, $user, int $bundleId, string $gateway)
    {
        $bundle = \App\Models\Bundle::active()->with('courses:id,price')->findOrFail($bundleId);

        if ($bundle->courses->isEmpty()) {
            return response()->json(['message' => 'This bundle has no courses in it yet.'], 422);
        }

        $courseIds = $bundle->courses->pluck('id');
        $alreadyOwned = Enrollment::where('user_id', $user->id)->whereIn('course_id', $courseIds)->pluck('course_id');

        if ($alreadyOwned->count() === $courseIds->count()) {
            return response()->json(['message' => 'You already own every course in this bundle.'], 409);
        }

        // Prorate the charge if the student already owns some (not all) of
        // the bundle's courses — they only pay for the fraction of the
        // bundle's list-price value they don't already have, applied to
        // the bundle's (discounted) price. E.g. owning 1 of 3 equally-priced
        // courses in a bundle means paying 2/3 of the bundle price.
        $unownedListPrice = $bundle->courses->whereNotIn('id', $alreadyOwned)->sum('price');
        $totalListPrice   = $bundle->courses->sum('price');
        $proration = $totalListPrice > 0 ? $unownedListPrice / $totalListPrice : 1;

        $amount = round((float) $bundle->price * $proration, 2);

        if ($amount <= 0) {
            // Free bundle (or a zero-priced remainder) — enroll into every
            // not-yet-owned course directly, no payment needed.
            $this->enrollBundleCourses($user->id, $bundle, $amount);
            return response()->json(['message' => 'Enrolled for free!', 'free' => true]);
        }

        $payment = Payment::create([
            'user_id'  => $user->id,
            'bundle_id'=> $bundle->id,
            'amount'   => $amount,
            'currency' => 'BDT',
            'gateway'  => $gateway,
            'transaction_id' => PaymentGatewayService::generateInvoiceNumber(),
            'status'   => 'pending',
        ]);

        return $this->dispatchToGateway($payment, $user, $gateway, $amount, $bundle->title);
    }

    /** Shared gateway-initiation logic for both course and bundle payments. */
    private function dispatchToGateway(Payment $payment, $user, string $gateway, float $amount, string $productName)
    {
        $invoice = $payment->transaction_id;
        $callbackBase = config('app.url') . '/api/v1/payments';

        try {
            switch ($gateway) {

                case 'bkash':
                    $token = $this->gateway->bkashGrantToken();
                    if (!$token) throw new \Exception('Could not authenticate with bKash.');

                    $result = $this->gateway->bkashCreatePayment(
                        $token, $amount, $invoice, "{$callbackBase}/bkash/callback"
                    );

                    $payment->update(['gateway_ref' => $result['paymentID'] ?? null, 'gateway_response' => $result]);

                    return response()->json([
                        'redirect_url' => $result['bkashURL'] ?? null,
                        'payment_id'   => $payment->id,
                    ]);

                case 'nagad':
                    $result = $this->gateway->nagadInitialize($invoice, $amount, "{$callbackBase}/nagad/callback");
                    $payment->update(['gateway_response' => $result]);

                    return response()->json([
                        'redirect_url' => $result['callBackUrl'] ?? null,
                        'payment_id'   => $payment->id,
                    ]);

                case 'sslcommerz':
                    $result = $this->gateway->sslcommerzInitiate([
                        'total_amount' => $amount,
                        'tran_id'      => $invoice,
                        'success_url'  => "{$callbackBase}/ssl/success",
                        'fail_url'     => "{$callbackBase}/ssl/fail",
                        'cancel_url'   => "{$callbackBase}/ssl/cancel",
                        'cus_name'     => $user->name,
                        'cus_email'    => $user->email,
                        'cus_phone'    => $user->phone ?? '01700000000',
                        'cus_add1'     => $user->city ?? 'Dhaka',
                        'cus_city'     => $user->city ?? 'Dhaka',
                        'cus_country'  => 'Bangladesh',
                        'shipping_method' => 'NO',
                        'product_name' => $productName,
                        'product_category' => 'Education',
                        'product_profile'  => 'general',
                    ]);

                    $payment->update(['gateway_response' => $result]);

                    return response()->json([
                        'redirect_url' => $result['GatewayPageURL'] ?? null,
                        'payment_id'   => $payment->id,
                    ]);
            }
        } catch (\Throwable $e) {
            Log::error('Payment initiate error: ' . $e->getMessage());
            $payment->update(['status' => 'failed']);

            return response()->json([
                'message' => 'Payment gateway error. Please try again or use a different method.',
                'error'   => config('app.debug') ? $e->getMessage() : null,
            ], 502);
        }

        return response()->json(['message' => 'Unsupported gateway.'], 400);
    }

    // ── BKASH CALLBACK ────────────────────────────────────────────────────────
    /** POST /api/v1/payments/bkash/callback — bKash redirects here with paymentID & status */
    public function bkashCallback(Request $request)
    {
        $paymentId = $request->input('paymentID');
        $status    = $request->input('status'); // success | failure | cancel

        $payment = Payment::where('gateway_ref', $paymentId)->where('gateway', 'bkash')->first();

        if (!$payment) {
            return $this->redirectToFrontend('payment-result', ['status' => 'error', 'message' => 'Payment record not found.']);
        }

        if ($status !== 'success') {
            $payment->update(['status' => 'failed']);
            return $this->redirectToFrontend('payment-result', $this->redirectQuery($payment, 'failed'));
        }

        try {
            $token  = $this->gateway->bkashGrantToken();
            $result = $this->gateway->bkashExecutePayment($token, $paymentId);

            if (($result['transactionStatus'] ?? null) === 'Completed') {
                $this->markPaid($payment, $result);
                return $this->redirectToFrontend('payment-result', $this->redirectQuery($payment, 'success'));
            }
        } catch (\Throwable $e) {
            Log::error('bKash callback error: ' . $e->getMessage());
        }

        $payment->update(['status' => 'failed']);
        return $this->redirectToFrontend('payment-result', $this->redirectQuery($payment, 'failed'));
    }

    // ── NAGAD CALLBACK ────────────────────────────────────────────────────────
    /** POST /api/v1/payments/nagad/callback */
    public function nagadCallback(Request $request)
    {
        $orderId       = $request->input('order_id') ?? $request->input('merchantOrderId');
        $paymentRefId  = $request->input('payment_ref_id');

        $payment = Payment::where('transaction_id', $orderId)->where('gateway', 'nagad')->first();

        if (!$payment) {
            return $this->redirectToFrontend('payment-result', ['status' => 'error', 'message' => 'Payment record not found.']);
        }

        // Never trust the client-supplied status alone — verify server-to-server,
        // exactly like the bKash and SSLCommerz callbacks already do.
        try {
            $verification = $this->gateway->nagadVerifyPayment($paymentRefId ?? $orderId);

            if (strtolower($verification['status'] ?? '') === 'success') {
                $this->markPaid($payment, $verification);
                return $this->redirectToFrontend('payment-result', $this->redirectQuery($payment, 'success'));
            }
        } catch (\Throwable $e) {
            Log::error('Nagad verification error: ' . $e->getMessage());
        }

        $payment->update(['status' => 'failed', 'gateway_response' => $request->all()]);
        return $this->redirectToFrontend('payment-result', $this->redirectQuery($payment, 'failed'));
    }

    // ── SSLCOMMERZ CALLBACKS ──────────────────────────────────────────────────
    /** POST /api/v1/payments/ssl/success */
    public function sslSuccess(Request $request)
    {
        $tranId = $request->input('tran_id');
        $valId  = $request->input('val_id');

        $payment = Payment::where('transaction_id', $tranId)->where('gateway', 'sslcommerz')->first();

        if (!$payment) {
            return $this->redirectToFrontend('payment-result', ['status' => 'error', 'message' => 'Payment record not found.']);
        }

        try {
            $validation = $this->gateway->sslcommerzValidate($valId);

            if (in_array($validation['status'] ?? '', ['VALID', 'VALIDATED'])) {
                $this->markPaid($payment, $validation);
                return $this->redirectToFrontend('payment-result', $this->redirectQuery($payment, 'success'));
            }
        } catch (\Throwable $e) {
            Log::error('SSLCommerz validation error: ' . $e->getMessage());
        }

        $payment->update(['status' => 'failed']);
        return $this->redirectToFrontend('payment-result', $this->redirectQuery($payment, 'failed'));
    }

    /** POST /api/v1/payments/ssl/fail */
    public function sslFail(Request $request)
    {
        $payment = Payment::where('transaction_id', $request->input('tran_id'))->first();
        $payment?->update(['status' => 'failed', 'gateway_response' => $request->all()]);

        return $this->redirectToFrontend('payment-result', $payment ? $this->redirectQuery($payment, 'failed') : ['status' => 'failed']);
    }

    /** POST /api/v1/payments/ssl/cancel */
    public function sslCancel(Request $request)
    {
        $payment = Payment::where('transaction_id', $request->input('tran_id'))->first();
        $payment?->update(['status' => 'cancelled', 'gateway_response' => $request->all()]);

        return $this->redirectToFrontend('payment-result', $payment ? $this->redirectQuery($payment, 'cancelled') : ['status' => 'cancelled']);
    }

    // ── HISTORY / SHOW ────────────────────────────────────────────────────────
    /** GET /api/v1/payments/history */
    public function history(Request $request)
    {
        $payments = Payment::where('user_id', $request->user()->id)
            ->with(['course:id,title,slug,thumbnail', 'bundle:id,title'])
            ->orderByDesc('created_at')
            ->paginate($request->per_page ?? 20)
            ->through(fn($p) => [
                'id'             => $p->id,
                'course'         => $p->course ? ['title' => $p->course->title, 'slug' => $p->course->slug] : null,
                'bundle'         => $p->bundle ? ['title' => $p->bundle->title, 'id' => $p->bundle->id] : null,
                'amount'         => (float) $p->amount,
                'currency'       => $p->currency,
                'gateway'        => $p->gateway,
                'transaction_id' => $p->transaction_id,
                'status'         => $p->status,
                'paid_at'        => $p->paid_at?->toDateString(),
                'created_at'     => $p->created_at->toDateString(),
            ]);

        return response()->json($payments);
    }

    /** GET /api/v1/payments/{id} */
    public function show(int $id, Request $request)
    {
        $payment = Payment::where('id', $id)->where('user_id', $request->user()->id)->with(['course:id,title,slug', 'bundle:id,title'])->firstOrFail();
        return response()->json($payment);
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────
    private function markPaid(Payment $payment, array $gatewayResponse): void
    {
        if ($payment->status === 'paid') return; // idempotent

        $payment->update([
            'status'           => 'paid',
            'paid_at'          => now(),
            'gateway_response' => $gatewayResponse,
        ]);

        $this->creditReferralCommission($payment);

        if ($payment->bundle_id) {
            $this->enrollBundleCourses($payment->user_id, $payment->bundle, (float) $payment->amount, $payment->id);
            return;
        }

        $exists = Enrollment::where('user_id', $payment->user_id)->where('course_id', $payment->course_id)->exists();

        if (!$exists) {
            Enrollment::create([
                'user_id'     => $payment->user_id,
                'course_id'   => $payment->course_id,
                'payment_id'  => $payment->id,
                'amount_paid' => $payment->amount,
                'enrolled_at' => now(),
            ]);

            $payment->course->increment('total_students');

            if ($payment->coupon_code) {
                \App\Models\Coupon::where('code', $payment->coupon_code)->increment('used_count');
            }
        }
    }

    /**
     * Credits the paying user's referrer, if they have one, for this
     * payment (Phase 2 item 4). Fires on every completed payment covered by
     * markPaid() — course or bundle, any gateway — since that's the single
     * point all three success callbacks converge on. The unique index on
     * referral_commissions.payment_id makes this idempotent on its own, but
     * markPaid()'s own `status === 'paid'` guard already prevents this from
     * running twice for the same payment, so this is a defensive backstop
     * rather than the primary safeguard.
     */
    private function creditReferralCommission(Payment $payment): void
    {
        $payer = $payment->user;
        if (!$payer || !$payer->referred_by_user_id) {
            return;
        }

        if (\App\Models\ReferralCommission::where('payment_id', $payment->id)->exists()) {
            return;
        }

        $rate = \App\Http\Controllers\Api\ReferralController::commissionRatePercent();
        $amount = round(((float) $payment->amount) * $rate / 100, 2);

        if ($amount <= 0) {
            return;
        }

        \App\Models\ReferralCommission::create([
            'referrer_id'           => $payer->referred_by_user_id,
            'referred_user_id'      => $payer->id,
            'payment_id'            => $payment->id,
            'amount'                => $amount,
            'rate_percent_at_time'  => $rate,
        ]);
    }

    /**
     * Enroll a user into every course in a bundle they don't already own.
     * $amountPaid (the bundle's total price) is split across the newly
     * enrolled courses proportionally to each course's own list price, so
     * per-course revenue reporting (instructor payout balances, "amount_paid"
     * on the enrollment record) stays meaningful rather than crediting the
     * whole bundle price to a single arbitrary course.
     */
    private function enrollBundleCourses(int $userId, \App\Models\Bundle $bundle, float $amountPaid, ?int $paymentId = null): void
    {
        $courses = $bundle->courses()->get(['courses.id', 'courses.price']);
        $alreadyOwned = Enrollment::where('user_id', $userId)
            ->whereIn('course_id', $courses->pluck('id'))
            ->pluck('course_id');

        $newCourses = $courses->reject(fn($c) => $alreadyOwned->contains($c->id));
        if ($newCourses->isEmpty()) return;

        $priceSum = $newCourses->sum('price');

        foreach ($newCourses as $course) {
            $share = $priceSum > 0 ? round($amountPaid * ($course->price / $priceSum), 2) : 0;

            // payment_id links this enrollment back to the bundle payment that
            // created it — needed so a refund can find exactly these rows
            // without touching enrollments the student owns from elsewhere.
            Enrollment::create([
                'user_id'     => $userId,
                'course_id'   => $course->id,
                'payment_id'  => $paymentId,
                'amount_paid' => $share,
                'enrolled_at' => now(),
            ]);

            $course->increment('total_students');
        }
    }

    /** Build the {status, course?, bundle?} query params for a payment-result redirect. */
    private function redirectQuery(Payment $payment, string $status): array
    {
        return array_filter([
            'status' => $status,
            'course' => $payment->course?->slug,
            'bundle' => $payment->bundle_id,
        ], fn($v) => $v !== null);
    }

    /** Redirect the gateway callback (server-to-browser) back to the React frontend */
    private function redirectToFrontend(string $path, array $query = [])
    {
        $frontend = config('app.frontend_url', 'http://localhost:8000');
        $queryString = http_build_query($query);

        return Redirect::away("{$frontend}/{$path}?{$queryString}");
    }
}
