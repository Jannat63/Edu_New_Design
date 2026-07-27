<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\BlogPost;
use App\Models\BlogCategory;
use Illuminate\Http\Request;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Storage;

class BlogController extends Controller
{
    // ── PUBLIC ROUTES (no auth) ───────────────────────────────────────────────

    /** GET /api/v1/blog — published posts list with pagination */
    public function index(Request $request)
    {
        $posts = BlogPost::published()
            ->with(['author:id,name,avatar', 'category:id,name,slug'])
            ->when($request->category, fn($q, $cat) => $q->whereHas('category', fn($q) => $q->where('slug', $cat)))
            ->when($request->tag,      fn($q, $tag) => $q->whereJsonContains('tags', $tag))
            ->when($request->search,   fn($q, $s)   => $q->where('title', 'like', "%{$s}%"))
            ->orderByDesc('published_at')
            ->paginate($request->per_page ?? 12)
            ->through(fn($p) => [
                'id'           => $p->id,
                'title'        => $p->title,
                'slug'         => $p->slug,
                'excerpt'      => $p->excerpt,
                'thumbnail'    => $p->thumbnail ? asset('storage/'.$p->thumbnail) : null,
                'author'       => ['name' => $p->author?->name, 'avatar' => $p->author?->avatar_url],
                'category'     => ['name' => $p->category?->name, 'slug' => $p->category?->slug],
                'tags'         => $p->tags,
                'read_time'    => $p->read_time_minutes,
                'views'        => $p->view_count,
                'published_at' => $p->published_at?->toDateString(),
            ]);

        return response()->json($posts);
    }

    /** GET /api/v1/blog/{slug} — single post detail with SEO meta */
    public function show(string $slug)
    {
        $post = BlogPost::published()
            ->where('slug', $slug)
            ->with(['author:id,name,avatar,bio', 'category:id,name,slug'])
            ->firstOrFail();

        $post->incrementViews();

        return response()->json([
            'id'            => $post->id,
            'title'         => $post->title,
            'slug'          => $post->slug,
            'content'       => $post->content,
            'excerpt'       => $post->excerpt,
            'thumbnail'     => $post->thumbnail ? asset('storage/'.$post->thumbnail) : null,
            'author'        => [
                'name'      => $post->author?->name,
                'bio'       => $post->author?->bio,
                'avatar'    => $post->author?->avatar_url,
            ],
            'category'      => ['name' => $post->category?->name, 'slug' => $post->category?->slug],
            'tags'          => $post->tags,
            'read_time'     => $post->read_time_minutes,
            'views'         => $post->view_count,
            'published_at'  => $post->published_at?->toDateString(),
            'updated_at'    => $post->updated_at->toDateString(),
            'related_posts' => $post->relatedPosts()->map(fn($r) => [
                'id'       => $r->id,
                'title'    => $r->title,
                'slug'     => $r->slug,
                'excerpt'  => $r->excerpt,
                'thumbnail'=> $r->thumbnail ? asset('storage/'.$r->thumbnail) : null,
                'read_time'=> $r->read_time_minutes,
            ]),
            // ── SEO payload (used by Next.js Head/metadata) ──────────────────
            'seo' => [
                'title'                  => $post->seo_title,
                'description'            => $post->seo_description,
                'canonical'              => $post->canonical,
                'noindex'                => $post->is_noindex,
                'nofollow'               => $post->is_nofollow,
                'og' => [
                    'title'              => $post->og_title_resolved,
                    'description'        => $post->og_description_resolved,
                    'image'              => $post->og_image_url,
                    'type'               => $post->og_type,
                ],
                'twitter' => [
                    'card'               => $post->twitter_card_type,
                    'title'              => $post->twitter_title_resolved,
                    'description'        => $post->twitter_description_resolved,
                    'image'              => $post->twitter_image_url,
                ],
                'schema' => [
                    'article'            => $post->article_schema,
                    'breadcrumb'         => $post->breadcrumb_schema,
                ],
            ],
        ]);
    }

    // ── ADMIN ROUTES (auth:sanctum + admin role) ──────────────────────────────

    /** GET /api/v1/admin/blog — all posts for admin table */
    public function adminIndex(Request $request)
    {
        $posts = BlogPost::with(['author:id,name', 'category:id,name'])
            ->when($request->status,   fn($q, $s)   => $q->where('status', $s))
            ->when($request->search,   fn($q, $s)   => $q->where('title', 'like', "%{$s}%"))
            ->when($request->category, fn($q, $cat) => $q->where('blog_category_id', $cat))
            ->orderByDesc('created_at')
            ->paginate(20)
            ->through(fn($p) => [
                'id'          => $p->id,
                'title'       => $p->title,
                'slug'        => $p->slug,
                'status'      => $p->status,
                'author'      => $p->author?->name,
                'category'    => $p->category?->name,
                'views'       => $p->view_count,
                'seo_score'   => $p->seo_score,
                'word_count'  => $p->word_count,
                'published_at'=> $p->published_at?->toDateString(),
                'updated_at'  => $p->updated_at->toDateString(),
            ]);

        return response()->json($posts);
    }

    /** POST /api/v1/admin/blog — create new post */
    public function store(Request $request)
    {
        $data = $request->validate([
            'title'               => 'required|string|max:255',
            'content'             => 'required|string',
            'excerpt'             => 'nullable|string|max:500',
            'blog_category_id'    => 'nullable|exists:blog_categories,id',
            'tags'                => 'nullable|array',
            'status'              => 'in:draft,published,archived',
            'thumbnail'           => 'nullable|image|max:2048',
            'published_at'        => 'nullable|date',
            // SEO
            'meta_title'          => 'nullable|string|max:70',
            'meta_description'    => 'nullable|string|max:320',
            'focus_keyword'       => 'nullable|string|max:100',
            'secondary_keywords'  => 'nullable|array',
            'canonical_url'       => 'nullable|url',
            'og_title'            => 'nullable|string|max:255',
            'og_description'      => 'nullable|string|max:500',
            'og_image'            => 'nullable|image|max:2048',
            'og_type'             => 'in:article,website,product',
            'twitter_title'       => 'nullable|string|max:255',
            'twitter_description' => 'nullable|string|max:500',
            'twitter_image'       => 'nullable|image|max:2048',
            'twitter_card_type'   => 'in:summary,summary_large_image',
            'is_noindex'          => 'boolean',
            'is_nofollow'         => 'boolean',
            'breadcrumb_title'    => 'nullable|string|max:255',
            'related_post_ids'    => 'nullable|array',
            'schema_markup'       => 'nullable|json',
        ]);

        // Handle file uploads
        if ($request->hasFile('thumbnail')) {
            $data['thumbnail'] = $request->file('thumbnail')->store('blog/thumbnails', 'public');
        }
        if ($request->hasFile('og_image')) {
            $data['og_image'] = $request->file('og_image')->store('blog/og', 'public');
        }
        if ($request->hasFile('twitter_image')) {
            $data['twitter_image'] = $request->file('twitter_image')->store('blog/twitter', 'public');
        }

        // Sanitize before storing — content renders as real HTML on the
        // public blog page, so it goes through the same allowlist-based
        // sanitizer as lesson content to strip anything script-capable.
        $data['content'] = \App\Support\HtmlSanitizer::clean($data['content']);

        // Auto-generate a UNIQUE slug — plain Str::slug() can collide when two
        // posts share a title (or even just the same first few words), which
        // throws a duplicate-key DB error and silently fails the whole save.
        $data['slug']       = $this->uniqueSlug($data['title']);
        $data['author_id']  = $request->user()->id;
        $data['published_at'] = $data['status'] === 'published'
            ? ($data['published_at'] ?? now())
            : null;
        $data['read_time_minutes'] = $this->estimateReadTime($data['content']);

        $post = BlogPost::create($data);

        return response()->json(['message' => 'Post created successfully.', 'post' => $post], 201);
    }

    /** PUT /api/v1/admin/blog/{id} — update post */
    public function update(Request $request, int $id)
    {
        $post = BlogPost::findOrFail($id);

        $data = $request->validate([
            'title'               => 'sometimes|string|max:255',
            'content'             => 'sometimes|string',
            'excerpt'             => 'nullable|string|max:500',
            'blog_category_id'    => 'nullable|exists:blog_categories,id',
            'tags'                => 'nullable|array',
            'status'              => 'in:draft,published,archived',
            'thumbnail'           => 'nullable|image|max:2048',
            'published_at'        => 'nullable|date',
            'meta_title'          => 'nullable|string|max:70',
            'meta_description'    => 'nullable|string|max:320',
            'focus_keyword'       => 'nullable|string|max:100',
            'secondary_keywords'  => 'nullable|array',
            'canonical_url'       => 'nullable|url',
            'og_title'            => 'nullable|string|max:255',
            'og_description'      => 'nullable|string|max:500',
            'og_image'            => 'nullable|image|max:2048',
            'og_type'             => 'in:article,website,product',
            'twitter_title'       => 'nullable|string|max:255',
            'twitter_description' => 'nullable|string|max:500',
            'twitter_image'       => 'nullable|image|max:2048',
            'twitter_card_type'   => 'in:summary,summary_large_image',
            'is_noindex'          => 'boolean',
            'is_nofollow'         => 'boolean',
            'breadcrumb_title'    => 'nullable|string|max:255',
            'related_post_ids'    => 'nullable|array',
            'schema_markup'       => 'nullable|json',
        ]);

        // Handle file uploads — delete old file if replaced
        foreach (['thumbnail','og_image','twitter_image'] as $field) {
            $folder = ['thumbnail'=>'blog/thumbnails','og_image'=>'blog/og','twitter_image'=>'blog/twitter'][$field];
            if ($request->hasFile($field)) {
                if ($post->$field) Storage::disk('public')->delete($post->$field);
                $data[$field] = $request->file($field)->store($folder, 'public');
            }
        }

        if (isset($data['content'])) {
            $data['content'] = \App\Support\HtmlSanitizer::clean($data['content']);
        }

        if (isset($data['title'])) $data['slug'] = $this->uniqueSlug($data['title'], $post->id);
        if (isset($data['content'])) $data['read_time_minutes'] = $this->estimateReadTime($data['content']);

        if (isset($data['status']) && $data['status'] === 'published' && !$post->published_at) {
            $data['published_at'] = now();
        }

        $post->update($data);

        return response()->json(['message' => 'Post updated successfully.', 'seo_score' => $post->fresh()->seo_score]);
    }

    /** DELETE /api/v1/admin/blog/{id} */
    public function destroy(int $id)
    {
        $post = BlogPost::findOrFail($id);
        foreach (['thumbnail','og_image','twitter_image'] as $f) {
            if ($post->$f) Storage::disk('public')->delete($post->$f);
        }
        $post->delete();
        return response()->json(['message' => 'Post deleted.']);
    }

    /** GET /api/v1/admin/blog/{id}/seo — get SEO analysis for a post */
    public function seoAnalysis(int $id)
    {
        $post = BlogPost::findOrFail($id);
        $post->calculateAndSaveSeoScore();
        $post->refresh();

        $kw    = $post->focus_keyword ?? '';
        $body  = strtolower(strip_tags($post->content ?? ''));
        $title = strtolower($post->title);
        $meta  = strtolower($post->meta_description ?? '');
        $words = $post->word_count;

        $checks = [
            ['label'=>'Meta title length (30–60 chars)', 'pass'=> $post->meta_title && strlen($post->meta_title)>=30 && strlen($post->meta_title)<=60, 'value'=> $post->meta_title ? strlen($post->meta_title).' chars' : 'Not set'],
            ['label'=>'Meta description length (120–160 chars)', 'pass'=> $post->meta_description && strlen($post->meta_description)>=120 && strlen($post->meta_description)<=160, 'value'=> $post->meta_description ? strlen($post->meta_description).' chars' : 'Not set'],
            ['label'=>'Focus keyword set',           'pass'=> (bool)$kw,                              'value'=> $kw ?: 'Not set'],
            ['label'=>'Keyword in title',             'pass'=> $kw && str_contains($title, strtolower($kw)), 'value'=> $kw ? 'Check' : 'N/A'],
            ['label'=>'Keyword in meta description',  'pass'=> $kw && str_contains($meta, strtolower($kw)),  'value'=> $kw ? 'Check' : 'N/A'],
            ['label'=>'OG image set',                 'pass'=> (bool)($post->og_image ?? $post->thumbnail),  'value'=> 'Required for social sharing'],
            ['label'=>'Canonical URL set',            'pass'=> (bool)$post->canonical_url,             'value'=> $post->canonical],
            ['label'=>'Word count 800+',              'pass'=> $words >= 800,                           'value'=> $words.' words'],
            ['label'=>'Tags added',                   'pass'=> !empty($post->tags),                     'value'=> implode(', ', $post->tags ?? [])],
        ];

        return response()->json([
            'seo_score'      => $post->seo_score,
            'word_count'     => $post->word_count,
            'checks'         => $checks,
            'passed'         => collect($checks)->where('pass', true)->count(),
            'total'          => count($checks),
            'schema_preview' => $post->article_schema,
        ]);
    }

    /** POST /api/v1/admin/blog/{id}/publish — quick publish */
    public function publish(int $id)
    {
        $post = BlogPost::findOrFail($id);
        $post->update(['status'=>'published', 'published_at'=> $post->published_at ?? now()]);
        return response()->json(['message'=>'Post published.', 'published_at'=>$post->published_at]);
    }

    /** POST /api/v1/admin/blog/{id}/unpublish */
    public function unpublish(int $id)
    {
        BlogPost::findOrFail($id)->update(['status'=>'draft']);
        return response()->json(['message'=>'Post moved back to draft.']);
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────
    /**
     * Generate a slug guaranteed not to collide with any other post's slug
     * (blog_posts.slug has a UNIQUE constraint — a bare Str::slug() will
     * throw a DB error the moment two posts share a title).
     */
    private function uniqueSlug(string $title, ?int $excludeId = null): string
    {
        $base = Str::slug($title) ?: 'post';
        $slug = $base;
        $i    = 2;

        while (
            BlogPost::where('slug', $slug)
                ->when($excludeId, fn($q) => $q->where('id', '!=', $excludeId))
                ->exists()
        ) {
            $slug = "{$base}-{$i}";
            $i++;
        }

        return $slug;
    }

    private function estimateReadTime(string $content): int
    {
        $words = str_word_count(strip_tags($content));
        return (int) max(1, round($words / 200)); // 200 words/min average
    }
}
