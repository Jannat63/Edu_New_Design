<?php
namespace App\Http\Controllers\Api;
use App\Http\Controllers\Controller;
use App\Models\Enrollment;
use App\Models\Payout;
use Illuminate\Http\Request;
class PayoutController extends Controller {
    /** GET /api/v1/instructor/payouts — instructor's own payouts */
    public function myPayouts(Request $request) {
        $payouts = Payout::where('instructor_id',$request->user()->id)->orderByDesc('id')->get()->map(fn($p)=>$this->payload($p));
        return response()->json($payouts);
    }

    /** GET /api/v1/instructor/payouts/balance — earnings available to request as a payout */
    public function balance(Request $request) {
        return response()->json(['balance' => $this->availableBalance($request->user()->id)]);
    }

    /**
     * Total paid revenue for this instructor's courses, minus anything
     * already requested (pending/processing) or paid out. Without this,
     * an instructor could request — and a distracted admin could approve —
     * a payout for more than they've actually earned.
     */
    private function availableBalance(int $instructorId): float {
        // Sum Enrollment.amount_paid rather than Payment.amount: bundle
        // payments store bundle_id with course_id = null, so filtering
        // Payment by course_id silently excludes all bundle-driven revenue.
        // amount_paid on the enrollment record is already correctly prorated
        // per course for bundles (see PaymentController::enrollBundleCourses)
        // and set to the full amount for direct course purchases, so it's a
        // single source of truth that works for both. Refunded purchases are
        // excluded automatically since refundPayment() deletes the row.
        $earned = (float) Enrollment::whereHas('course', fn($q) => $q->where('instructor_id', $instructorId))
            ->sum('amount_paid');

        $claimed = (float) Payout::where('instructor_id', $instructorId)
            ->whereIn('status', ['pending', 'processing', 'paid'])
            ->sum('amount');

        return max(0, round($earned - $claimed, 2));
    }

    /** POST /api/v1/instructor/payouts — request a payout */
    public function request(Request $request) {
        $data = $request->validate([
            'amount'=>'required|numeric|min:100',
            'method'=>'required|in:bkash,nagad,rocket,bank',
            'account_number'=>'required|string|max:50',
        ]);

        $available = $this->availableBalance($request->user()->id);
        if ($data['amount'] > $available) {
            return response()->json([
                'message' => "Requested amount exceeds your available balance of ৳" . number_format($available, 2) . ".",
            ], 422);
        }

        $payout = Payout::create([...$data,'instructor_id'=>$request->user()->id,'status'=>'pending']);
        return response()->json(['message'=>'Payout request submitted. We will process it within 3 business days.','payout'=>$this->payload($payout)],201);
    }
    /** GET /api/v1/admin/payouts */
    public function adminIndex() {
        return response()->json(Payout::with('instructor:id,name,email')->orderByDesc('id')->get()->map(fn($p)=>$this->payload($p)));
    }
    /** PUT /api/v1/admin/payouts/{id} */
    public function adminUpdate(int $id, Request $request) {
        $payout = Payout::findOrFail($id);
        $data = $request->validate(['status'=>'required|in:pending,processing,paid,rejected','note'=>'nullable|string']);
        if ($data['status']==='paid') $data['paid_at']=now();
        $data['processed_by']=$request->user()->id;
        $payout->update($data);
        return response()->json(['message'=>'Payout updated.','payout'=>$this->payload($payout->fresh())]);
    }
    private function payload(Payout $p): array {
        return [
            'id'=>$p->id,'amount'=>$p->amount,'method'=>$p->method,
            'account_number'=>$p->account_number,'status'=>$p->status,
            'note'=>$p->note,'paid_at'=>$p->paid_at?->format('Y-m-d'),
            'created_at'=>$p->created_at->diffForHumans(),
            'instructor'=>$p->instructor?->only('id','name','email'),
        ];
    }
}
