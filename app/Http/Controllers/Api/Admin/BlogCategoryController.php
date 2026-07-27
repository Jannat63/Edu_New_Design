<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\BlogCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class BlogCategoryController extends Controller
{
    /** GET /api/v1/admin/blog-categories */
    public function index()
    {
        return response()->json(
            BlogCategory::withCount('posts')->orderBy('name')->get()
        );
    }

    /** GET /api/v1/admin/blog-categories/{id} */
    public function show(int $id)
    {
        return response()->json(BlogCategory::withCount('posts')->findOrFail($id));
    }

    /** POST /api/v1/admin/blog-categories — body: { name } */
    public function store(Request $request)
    {
        $data = $request->validate(['name' => 'required|string|max:255|unique:blog_categories,name']);

        $category = BlogCategory::create([
            'name' => $data['name'],
            'slug' => $this->uniqueSlug($data['name']),
        ]);

        return response()->json(['message' => 'Category created.', 'category' => $category], 201);
    }

    /** PUT /api/v1/admin/blog-categories/{id} */
    public function update(int $id, Request $request)
    {
        $category = BlogCategory::findOrFail($id);

        $data = $request->validate([
            'name' => 'required|string|max:255|unique:blog_categories,name,' . $category->id,
        ]);

        $category->update([
            'name' => $data['name'],
            'slug' => $this->uniqueSlug($data['name'], $category->id),
        ]);

        return response()->json(['message' => 'Category updated.', 'category' => $category->fresh()]);
    }

    /** DELETE /api/v1/admin/blog-categories/{id} */
    public function destroy(int $id)
    {
        $category = BlogCategory::findOrFail($id);

        if ($category->posts()->exists()) {
            return response()->json([
                'message' => 'Cannot delete — this category still has blog posts. Reassign or delete them first.',
            ], 422);
        }

        $category->delete();

        return response()->json(['message' => 'Category deleted.']);
    }

    // ── HELPER ────────────────────────────────────────────────────────────────
    private function uniqueSlug(string $name, ?int $ignoreId = null): string
    {
        $base = Str::slug($name);
        $slug = $base;
        $i = 1;

        while (BlogCategory::where('slug', $slug)->when($ignoreId, fn($q) => $q->where('id', '!=', $ignoreId))->exists()) {
            $slug = "{$base}-" . ++$i;
        }

        return $slug;
    }
}
