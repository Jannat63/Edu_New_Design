<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\PaymentMethod;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class PaymentMethodController extends Controller
{
    /** GET /api/v1/admin/payment-methods */
    public function index()
    {
        $methods = PaymentMethod::orderBy('sort_order')->get()->map(fn($m) => $this->payload($m));
        return response()->json($methods);
    }

    /** POST /api/v1/admin/payment-methods */
    public function store(Request $request)
    {
        $data = $this->validated($request);

        if ($request->hasFile('logo')) {
            $data['logo'] = $request->file('logo')->store('payment-methods', 'public');
        }

        $method = PaymentMethod::create($data);

        return response()->json(['message' => 'Payment method created.', 'method' => $this->payload($method)], 201);
    }

    /** PUT /api/v1/admin/payment-methods/{id} */
    public function update(int $id, Request $request)
    {
        $method = PaymentMethod::findOrFail($id);
        $data   = $this->validated($request);

        if ($request->hasFile('logo')) {
            if ($method->logo) Storage::disk('public')->delete($method->logo);
            $data['logo'] = $request->file('logo')->store('payment-methods', 'public');
        }

        // Allow removing existing logo
        if ($request->input('remove_logo') === '1' && $method->logo) {
            Storage::disk('public')->delete($method->logo);
            $data['logo'] = null;
        }

        $method->update($data);

        return response()->json(['message' => 'Payment method updated.', 'method' => $this->payload($method->fresh())]);
    }

    /** DELETE /api/v1/admin/payment-methods/{id} */
    public function destroy(int $id)
    {
        $method = PaymentMethod::findOrFail($id);
        if ($method->logo) Storage::disk('public')->delete($method->logo);
        $method->delete();

        return response()->json(['message' => 'Payment method deleted.']);
    }

    /** POST /api/v1/admin/payment-methods/reorder — body: { ids: [3,1,2] } */
    public function reorder(Request $request)
    {
        $request->validate(['ids' => 'required|array']);

        foreach ($request->ids as $order => $id) {
            PaymentMethod::where('id', $id)->update(['sort_order' => $order]);
        }

        return response()->json(['message' => 'Order saved.']);
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────
    private function validated(Request $request): array
    {
        return $request->validate([
            'type'           => 'required|in:bank,mobile,card,other',
            'name'           => 'required|string|max:100',
            'account_name'   => 'nullable|string|max:255',
            'account_number' => 'nullable|string|max:100',
            'routing_number' => 'nullable|string|max:50',
            'instructions'   => 'nullable|string|max:2000',
            'is_active'      => 'nullable|boolean',
            'sort_order'     => 'integer|min:0',
            'logo'           => 'nullable|image|max:1024|mimes:jpg,jpeg,png,webp,svg',
        ]);
    }

    private function payload(PaymentMethod $m): array
    {
        return [
            'id'             => $m->id,
            'type'           => $m->type,
            'name'           => $m->name,
            'account_name'   => $m->account_name,
            'account_number' => $m->account_number,
            'routing_number' => $m->routing_number,
            'logo_url'       => $m->logo_url,
            'instructions'   => $m->instructions,
            'is_active'      => $m->is_active,
            'sort_order'     => $m->sort_order,
        ];
    }
}
