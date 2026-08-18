<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PageSeo extends Model
{
    protected $fillable = ['path', 'label', 'meta_title', 'meta_description', 'og_image', 'faqs'];

    protected $casts = [
        'faqs' => 'array',
    ];

    public function getOgImageUrlAttribute(): ?string
    {
        return $this->og_image ? asset('storage/' . $this->og_image) : null;
    }

    /** Same shape as BlogPost::buildFaqSchema — kept here too since this
     *  model has no reason to depend on BlogPost for something this small. */
    public function getFaqSchemaAttribute(): ?array
    {
        if (empty($this->faqs)) return null;

        return [
            '@context'   => 'https://schema.org',
            '@type'      => 'FAQPage',
            'mainEntity' => array_map(fn($faq) => [
                '@type'          => 'Question',
                'name'           => $faq['question'],
                'acceptedAnswer' => ['@type' => 'Answer', 'text' => $faq['answer']],
            ], $this->faqs),
        ];
    }
}
