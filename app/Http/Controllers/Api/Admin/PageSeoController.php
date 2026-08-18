<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use App\Models\PageSeo;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

/**
 * Lives in Api\Admin (like MenuItemController) even though lookupByPath()
 * below is a public, unauthenticated endpoint — every other method here is
 * admin-only, and this keeps the whole feature in one file rather than
 * splitting a public read from admin CRUD across two controllers for what
 * is otherwise a single small piece of functionality.
 */
class PageSeoController extends Controller
{
    /**
     * GET /api/v1/page-seo?path=/about — public, unauthenticated.
     * Returns null fields (not a 404) when nothing's been set for a path —
     * most pages won't have an override, and that's a normal, expected
     * state the frontend hook falls back from, not an error.
     */
    public function lookupByPath(Request $request)
    {
        $request->validate(['path' => 'required|string|max:500']);

        $seo = PageSeo::where('path', $this->normalizePath($request->path))->first();

        if (!$seo) {
            return response()->json(['meta_title' => null, 'meta_description' => null, 'og_image' => null, 'faqs' => []]);
        }

        return response()->json([
            'meta_title'       => $seo->meta_title,
            'meta_description' => $seo->meta_description,
            'og_image'         => $seo->og_image_url,
            'faqs'             => $seo->faqs ?? [],
        ]);
    }

    /** GET /api/v1/admin/page-seo — list every configured page, searchable by path/label */
    public function index(Request $request)
    {
        $pages = PageSeo::when($request->search, fn($q, $s) => $q->where(function ($q2) use ($s) {
                $q2->where('path', 'like', "%{$s}%")->orWhere('label', 'like', "%{$s}%");
            }))
            ->orderBy('path')
            ->get()
            ->map(fn($p) => $this->payload($p));

        return response()->json($pages);
    }

    /** POST /api/v1/admin/page-seo */
    public function store(Request $request)
    {
        $data = $this->validated($request);
        $data['path'] = $this->normalizePath($data['path']);

        if ($request->hasFile('og_image')) {
            $data['og_image'] = $request->file('og_image')->store('page-seo', 'public');
        }

        $page = PageSeo::create($data);

        return response()->json(['message' => 'Page SEO created.', 'page' => $this->payload($page)], 201);
    }

    /** PUT /api/v1/admin/page-seo/{id} */
    public function update(int $id, Request $request)
    {
        $page = PageSeo::findOrFail($id);
        $data = $this->validated($request, $page->id);

        if (isset($data['path'])) {
            $data['path'] = $this->normalizePath($data['path']);
        }

        if ($request->hasFile('og_image')) {
            if ($page->og_image) Storage::disk('public')->delete($page->og_image);
            $data['og_image'] = $request->file('og_image')->store('page-seo', 'public');
        }

        $page->update($data);

        return response()->json(['message' => 'Page SEO updated.', 'page' => $this->payload($page->fresh())]);
    }

    /** DELETE /api/v1/admin/page-seo/{id} */
    public function destroy(int $id)
    {
        $page = PageSeo::findOrFail($id);
        if ($page->og_image) Storage::disk('public')->delete($page->og_image);
        $page->delete();

        return response()->json(['message' => 'Page SEO deleted.']);
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────

    /** Trims trailing slashes (except root) and guarantees a leading slash,
     *  so '/about', '/about/', and 'about' all resolve to the same record. */
    private function normalizePath(string $path): string
    {
        $path = '/' . ltrim(trim($path), '/');
        return $path !== '/' ? rtrim($path, '/') : $path;
    }

    private function validated(Request $request, ?int $ignoreId = null): array
    {
        return $request->validate([
            'path'             => 'required|string|max:500|unique:page_seos,path' . ($ignoreId ? ",{$ignoreId}" : ''),
            'label'            => 'nullable|string|max:255',
            'meta_title'       => 'nullable|string|max:255',
            'meta_description' => 'nullable|string|max:500',
            'og_image'         => 'nullable|image|mimes:jpeg,png,jpg,gif,webp|max:2048',
            'faqs'             => 'nullable|array',
            'faqs.*.question'  => 'required_with:faqs|string|max:255',
            'faqs.*.answer'    => 'required_with:faqs|string|max:2000',
        ]);
    }

    private function payload(PageSeo $p): array
    {
        return [
            'id'                => $p->id,
            'path'              => $p->path,
            'label'             => $p->label,
            'meta_title'        => $p->meta_title,
            'meta_description'  => $p->meta_description,
            'og_image'          => $p->og_image_url,
            'faqs'              => $p->faqs ?? [],
            'updated_at'        => $p->updated_at?->toDateString(),
        ];
    }
}
