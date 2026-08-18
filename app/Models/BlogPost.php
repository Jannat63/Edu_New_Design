<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Support\Str;
use App\Models\BlogCategory;

class BlogPost extends Model
{
    use SoftDeletes;

    protected $fillable = [
        'author_id', 'blog_category_id',
        'title', 'slug', 'excerpt', 'content', 'thumbnail',
        'view_count', 'read_time_minutes',
        'tags', 'status', 'published_at',
        // SEO fields
        'meta_title', 'meta_description', 'focus_keyword', 'secondary_keywords',
        'canonical_url', 'og_title', 'og_description', 'og_image', 'og_type',
        'twitter_title', 'twitter_description', 'twitter_image', 'twitter_card_type',
        'schema_markup', 'is_noindex', 'is_nofollow',
        'breadcrumb_title', 'related_post_ids', 'faqs',
        'word_count', 'seo_score', 'readability_score',
    ];

    protected $casts = [
        'tags'               => 'array',
        'secondary_keywords' => 'array',
        'related_post_ids'   => 'array',
        'schema_markup'      => 'array',
        'faqs'               => 'array',
        'published_at'       => 'datetime',
        'is_noindex'         => 'boolean',
        'is_nofollow'        => 'boolean',
    ];

    // ── RELATIONSHIPS ─────────────────────────────────────────────────────────
    public function author()   { return $this->belongsTo(User::class, 'author_id'); }
    public function category() { return $this->belongsTo(BlogCategory::class, 'blog_category_id'); }
    public function relatedPosts()
    {
        $ids = $this->related_post_ids ?? [];
        return static::whereIn('id', $ids)->where('status', 'published')->get();
    }

    // ── SCOPES ────────────────────────────────────────────────────────────────
    public function scopePublished($q) { return $q->where('status', 'published'); }
    public function scopeIndexable($q) { return $q->where('is_noindex', false); }

    // ── SEO GETTERS (resolved from fallback chain) ────────────────────────────

    /** Final <title> tag */
    public function getSeoTitleAttribute(): string
    {
        return $this->meta_title
            ?? ($this->title . ' | EduBD Blog');
    }

    /** Final <meta name="description"> */
    public function getSeoDescriptionAttribute(): string
    {
        return $this->meta_description
            ?? $this->excerpt
            ?? Str::limit(strip_tags($this->content), 155);
    }

    /** Final canonical URL */
    public function getCanonicalAttribute(): string
    {
        return $this->canonical_url
            ?? url('/blog/' . $this->slug);
    }

    /** Open Graph title with fallback */
    public function getOgTitleResolvedAttribute(): string
    {
        return $this->og_title ?? $this->seo_title;
    }

    /** Open Graph description with fallback */
    public function getOgDescriptionResolvedAttribute(): string
    {
        return $this->og_description ?? $this->seo_description;
    }

    /** Open Graph image URL */
    public function getOgImageUrlAttribute(): string
    {
        if ($this->og_image) return asset('storage/' . $this->og_image);
        if ($this->thumbnail) return asset('storage/' . $this->thumbnail);
        return asset('images/og-default.png');
    }

    /** Twitter title with fallback */
    public function getTwitterTitleResolvedAttribute(): string
    {
        return $this->twitter_title ?? $this->og_title_resolved;
    }

    /** Twitter description with fallback */
    public function getTwitterDescriptionResolvedAttribute(): string
    {
        return $this->twitter_description ?? $this->og_description_resolved;
    }

    /** Twitter image URL */
    public function getTwitterImageUrlAttribute(): string
    {
        if ($this->twitter_image) return asset('storage/' . $this->twitter_image);
        return $this->og_image_url;
    }

    /** Auto-generated Article schema JSON-LD */
    public function getArticleSchemaAttribute(): array
    {
        if ($this->schema_markup) return $this->schema_markup;

        return [
            '@context'       => 'https://schema.org',
            '@type'          => 'Article',
            'headline'       => $this->title,
            'description'    => $this->seo_description,
            'image'          => [$this->og_image_url],
            'datePublished'  => optional($this->published_at)->toIso8601String(),
            'dateModified'   => $this->updated_at->toIso8601String(),
            'author'         => [
                '@type' => 'Person',
                'name'  => $this->author?->name,
                'url'   => config('app.url') . '/instructors/' . $this->author_id,
            ],
            'publisher' => [
                '@type' => 'Organization',
                'name'  => config('app.name', 'EduBD'),
                'logo'  => [
                    '@type' => 'ImageObject',
                    'url'   => asset('images/logo.png'),
                ],
            ],
            'mainEntityOfPage' => [
                '@type' => 'WebPage',
                '@id'   => $this->canonical,
            ],
            'wordCount'     => $this->word_count,
            'inLanguage'    => 'bn-BD',
        ];
    }

    /** Breadcrumb schema JSON-LD */
    public function getBreadcrumbSchemaAttribute(): array
    {
        return [
            '@context'        => 'https://schema.org',
            '@type'           => 'BreadcrumbList',
            'itemListElement' => [
                ['@type'=>'ListItem','position'=>1,'name'=>'Home',  'item'=>config('app.url')],
                ['@type'=>'ListItem','position'=>2,'name'=>'Blog',  'item'=>config('app.url').'/blog'],
                ['@type'=>'ListItem','position'=>3,'name'=>$this->breadcrumb_title ?? $this->title, 'item'=>$this->canonical],
            ],
        ];
    }

    /** FAQPage schema — built from this post's own `faqs` field */
    public function getFaqSchemaAttribute(): ?array
    {
        if (empty($this->faqs)) return null;

        return static::buildFaqSchema($this->faqs);
    }

    /** FAQPage schema — pass array of ['question'=>'...','answer'=>'...'] pairs */
    public static function buildFaqSchema(array $faqs): array
    {
        return [
            '@context'   => 'https://schema.org',
            '@type'      => 'FAQPage',
            'mainEntity' => array_map(fn($faq) => [
                '@type'          => 'Question',
                'name'           => $faq['question'],
                'acceptedAnswer' => ['@type'=>'Answer','text'=>$faq['answer']],
            ], $faqs),
        ];
    }

    // ── SEO SCORE CALCULATION ─────────────────────────────────────────────────
    /**
     * Calculate a 0–100 SEO score and update the record.
     * Call this whenever the post is saved.
     */
    public function calculateAndSaveSeoScore(): void
    {
        $score = 0;
        $kw    = strtolower($this->focus_keyword ?? '');
        $title = strtolower($this->title);
        $body  = strtolower(strip_tags($this->content ?? ''));
        $meta  = strtolower($this->meta_description ?? '');
        $words = str_word_count($body);

        // Meta title (20pts)
        if ($this->meta_title) {
            $len = strlen($this->meta_title);
            if ($len >= 30 && $len <= 60)   $score += 20;
            elseif ($len >= 20 && $len < 30) $score += 10;
        }

        // Meta description (15pts)
        if ($this->meta_description) {
            $len = strlen($this->meta_description);
            if ($len >= 120 && $len <= 160)  $score += 15;
            elseif ($len >= 80 && $len < 120) $score += 8;
        }

        // Focus keyword exists (5pts)
        if ($kw) $score += 5;

        // Keyword in title (10pts)
        if ($kw && str_contains($title, $kw)) $score += 10;

        // Keyword in meta description (10pts)
        if ($kw && str_contains($meta, $kw)) $score += 10;

        // Keyword in first 100 words (10pts)
        $firstHundred = implode(' ', array_slice(explode(' ', $body), 0, 100));
        if ($kw && str_contains($firstHundred, $kw)) $score += 10;

        // Keyword density 1–3% (5pts)
        if ($kw && $words > 0) {
            $kwCount  = substr_count($body, $kw);
            $density  = ($kwCount / $words) * 100;
            if ($density >= 1 && $density <= 3) $score += 5;
        }

        // Word count (10pts)
        if ($words >= 1500)      $score += 10;
        elseif ($words >= 800)   $score += 7;
        elseif ($words >= 300)   $score += 4;

        // OG image set (5pts)
        if ($this->og_image || $this->thumbnail) $score += 5;

        // Canonical set (5pts)
        if ($this->canonical_url) $score += 5;

        // Tags set (5pts)
        if (!empty($this->tags)) $score += 5;

        $this->updateQuietly([
            'seo_score'  => min($score, 100),
            'word_count' => $words,
        ]);
    }

    // ── HELPERS ───────────────────────────────────────────────────────────────
    public function incrementViews(): void { $this->increment('view_count'); }

    protected static function booted(): void
    {
        static::saved(fn($post) => $post->calculateAndSaveSeoScore());
    }
}
