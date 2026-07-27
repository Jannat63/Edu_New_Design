<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\MenuItem;
use Illuminate\Http\Request;

class MenuItemController extends Controller
{
    /** GET /api/v1/admin/menu — flat list of all items with parent info */
    public function index()
    {
        $items = MenuItem::with('parent:id,title')
            ->orderBy('sort_order')
            ->get()
            ->map(fn($m) => $this->payload($m));

        return response()->json($items);
    }

    /** POST /api/v1/admin/menu */
    public function store(Request $request)
    {
        $data = $this->validated($request);
        $item = MenuItem::create($data);

        return response()->json(['message' => 'Menu item created.', 'item' => $this->payload($item->load('parent'))], 201);
    }

    /** PUT /api/v1/admin/menu/{id} */
    public function update(int $id, Request $request)
    {
        $item = MenuItem::findOrFail($id);
        $data = $this->validated($request);

        // Prevent item from becoming its own parent
        if (!empty($data['parent_id']) && $data['parent_id'] == $id) {
            return response()->json(['message' => 'An item cannot be its own parent.'], 422);
        }

        $item->update($data);

        return response()->json(['message' => 'Menu item updated.', 'item' => $this->payload($item->fresh()->load('parent'))]);
    }

    /** DELETE /api/v1/admin/menu/{id} — cascades to children */
    public function destroy(int $id)
    {
        MenuItem::findOrFail($id)->delete();
        return response()->json(['message' => 'Menu item deleted.']);
    }

    /** POST /api/v1/admin/menu/reorder — body: { ids: [3,1,2] } */
    public function reorder(Request $request)
    {
        $request->validate(['ids' => 'required|array']);

        foreach ($request->ids as $order => $id) {
            MenuItem::where('id', $id)->update(['sort_order' => $order]);
        }

        return response()->json(['message' => 'Menu order saved.']);
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────
    private function validated(Request $request): array
    {
        return $request->validate([
            'title'          => 'required|string|max:100',
            'url'            => 'nullable|string|max:500',
            'icon'           => 'nullable|string|max:50',
            'parent_id'      => 'nullable|exists:menu_items,id',
            'category_group' => 'nullable|string|max:100',
            'is_featured'    => 'nullable|boolean',
            'is_active'      => 'nullable|boolean',
            'open_new_tab'   => 'nullable|boolean',
            'sort_order'     => 'integer|min:0',
        ]);
    }

    private function payload(MenuItem $m): array
    {
        return [
            'id'             => $m->id,
            'title'          => $m->title,
            'url'            => $m->url,
            'icon'           => $m->icon,
            'parent_id'      => $m->parent_id,
            'parent_title'   => $m->parent?->title,
            'category_group' => $m->category_group,
            'is_featured'    => $m->is_featured,
            'is_active'      => $m->is_active,
            'open_new_tab'   => $m->open_new_tab,
            'sort_order'     => $m->sort_order,
        ];
    }
}
