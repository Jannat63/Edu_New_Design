<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Bundle;
use App\Models\CartItem;
use App\Models\Course;
use App\Models\Enrollment;
use Illuminate\Http\Request;

/**
 * Phase 6 item 20, UPGRADE_PLAN.md. Every purchase used to be its own
 * PaymentController::initiate() round trip — this lets a student collect
 * several courses/bundles and pay for all of them in one gateway
 * authorization instead of N separate ones, which matters more here than in
 * most markets: every checkout means leaving the app to authorize a
 * bKash/Nagad payment and coming back.
 */
class CartController extends Controller
{
    /** GET /api/v1/cart */
    public function index(Request $request)
    {
        $items = CartItem::where('user_id', $request->user()->id)
            ->with(['course:id,title,slug,thumbnail,price,discount_price', 'bundle:id,title,thumbnail,price'])
            ->get();

        $lines = $items->map(fn($i) => $this->line($i))->filter(); // filter drops orphaned rows (course/bundle deleted since being added)

        return response()->json([
            'items' => $lines->values(),
            'total' => $lines->sum('price'),
            'count' => $lines->count(),
        ]);
    }

    /** POST /api/v1/cart — body: { course_id } or { bundle_id } */
    public function store(Request $request)
    {
        $data = $request->validate([
            'course_id' => 'required_without:bundle_id|nullable|exists:courses,id',
            'bundle_id' => 'required_without:course_id|nullable|exists:bundles,id',
        ]);
        $userId = $request->user()->id;

        if (!empty($data['course_id'])) {
            if (Enrollment::where('user_id', $userId)->where('course_id', $data['course_id'])->exists()) {
                return response()->json(['message' => 'You already own this course.'], 409);
            }
            $existing = CartItem::where('user_id', $userId)->where('course_id', $data['course_id'])->first();
            if ($existing) {
                return response()->json(['message' => 'Already in your cart.', 'in_cart' => true]);
            }
            CartItem::create(['user_id' => $userId, 'course_id' => $data['course_id']]);
        } else {
            $existing = CartItem::where('user_id', $userId)->where('bundle_id', $data['bundle_id'])->first();
            if ($existing) {
                return response()->json(['message' => 'Already in your cart.', 'in_cart' => true]);
            }
            CartItem::create(['user_id' => $userId, 'bundle_id' => $data['bundle_id']]);
        }

        return response()->json(['message' => 'Added to cart.', 'in_cart' => true]);
    }

    /** DELETE /api/v1/cart/{id} — {id} is the cart_item id */
    public function destroy(int $id, Request $request)
    {
        $item = CartItem::where('id', $id)->where('user_id', $request->user()->id)->first();
        if (!$item) {
            return response()->json(['message' => 'Not found.'], 404);
        }
        $item->delete();

        return response()->json(['message' => 'Removed from cart.']);
    }

    /** DELETE /api/v1/cart — empty the whole cart (used after a successful checkout) */
    public function clear(Request $request)
    {
        CartItem::where('user_id', $request->user()->id)->delete();

        return response()->json(['message' => 'Cart cleared.']);
    }

    private function line(CartItem $item): ?array
    {
        if ($item->course_id) {
            if (!$item->course) return null; // course was deleted after being added to cart
            return [
                'cart_item_id' => $item->id,
                'type'         => 'course',
                'id'           => $item->course->id,
                'title'        => $item->course->title,
                'slug'         => $item->course->slug,
                'thumbnail'    => $item->course->thumbnail_url,
                'price'        => (float) $item->course->effective_price,
            ];
        }

        if (!$item->bundle) return null; // bundle was deleted after being added to cart
        return [
            'cart_item_id' => $item->id,
            'type'         => 'bundle',
            'id'           => $item->bundle->id,
            'title'        => $item->bundle->title,
            'thumbnail'    => $item->bundle->thumbnail_url,
            'price'        => (float) $item->bundle->price,
        ];
    }
}
