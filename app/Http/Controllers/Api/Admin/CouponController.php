<?php
namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\Coupon;
use Illuminate\Http\Request;

class CouponController extends Controller
{
    /** GET /api/v1/admin/coupons */
    public function index() {
        return response()->json(Coupon::with('course:id,title')->orderByDesc('id')->get()->map(fn($c) => $this->payload($c)));
    }

    /** POST /api/v1/admin/coupons */
    public function store(Request $request) {
        $data = $this->validated($request);
        $data['code'] = strtoupper($data['code']);
        $coupon = Coupon::create($data);
        return response()->json(['message'=>'Coupon created.','coupon'=>$this->payload($coupon)], 201);
    }

    /** PUT /api/v1/admin/coupons/{id} */
    public function update(int $id, Request $request) {
        $coupon = Coupon::findOrFail($id);
        $data = $this->validated($request);
        $data['code'] = strtoupper($data['code']);
        $coupon->update($data);
        return response()->json(['message'=>'Coupon updated.','coupon'=>$this->payload($coupon->fresh())]);
    }

    /** DELETE /api/v1/admin/coupons/{id} */
    public function destroy(int $id) {
        Coupon::findOrFail($id)->delete();
        return response()->json(['message'=>'Coupon deleted.']);
    }

    /** POST /api/v1/coupons/apply — public: check coupon before payment */
    public function apply(Request $request) {
        $request->validate(['code'=>'required|string','course_id'=>'required|exists:courses,id','price'=>'required|numeric']);
        $coupon = Coupon::where('code', strtoupper($request->code))->first();

        if (!$coupon || !$coupon->isValid($request->price)) {
            return response()->json(['message'=>'Invalid or expired coupon code.'], 422);
        }
        if ($coupon->course_id && $coupon->course_id != $request->course_id) {
            return response()->json(['message'=>'This coupon is not valid for this course.'], 422);
        }
        if ($coupon->user_id && (!$request->user() || $coupon->user_id != $request->user()->id)) {
            // Same generic message as the "invalid" case above, and the same
            // check PaymentController::initiateCourse() enforces at actual
            // checkout — previously this preview endpoint skipped this check
            // entirely, so a personal coupon would preview as valid for
            // anyone and then get rejected only once they tried to pay.
            // Generic wording is deliberate: no need to confirm to a
            // guesser that a code they found is valid-but-not-theirs.
            return response()->json(['message'=>'Invalid or expired coupon code.'], 422);
        }

        $discounted = $coupon->apply($request->price);
        $discount   = $request->price - $discounted;

        return response()->json([
            'valid'           => true,
            'code'            => $coupon->code,
            'discount_type'   => $coupon->type,
            'discount_value'  => $coupon->value,
            'discount_amount' => round($discount, 2),
            'final_price'     => round($discounted, 2),
            'message'         => "Coupon applied! You save ৳" . round($discount, 2) . ".",
        ]);
    }

    private function validated(Request $request): array {
        return $request->validate([
            'code'       => 'required|string|max:50',
            'type'       => 'required|in:percent,fixed',
            'value'      => 'required|numeric|min:0',
            'min_order'  => 'nullable|numeric|min:0',
            'max_uses'   => 'nullable|integer|min:1',
            'course_id'  => 'nullable|exists:courses,id',
            'is_active'  => 'nullable|boolean',
            'expires_at' => 'nullable|date|after:today',
        ]);
    }

    private function payload(Coupon $c): array {
        return [
            'id'         => $c->id,
            'code'       => $c->code,
            'type'       => $c->type,
            'value'      => $c->value,
            'min_order'  => $c->min_order,
            'max_uses'   => $c->max_uses,
            'used_count' => $c->used_count,
            'course'     => $c->course ? ['id'=>$c->course->id,'title'=>$c->course->title] : null,
            'is_active'  => $c->is_active,
            'expires_at' => $c->expires_at?->format('Y-m-d'),
            'is_valid'   => $c->isValid(),
        ];
    }
}
