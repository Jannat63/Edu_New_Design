<?php

namespace App\Support;

/**
 * Allowlist-based HTML sanitizer for user-authored rich text (course lesson
 * content, etc.) that is later rendered with dangerouslySetInnerHTML on the
 * frontend.
 *
 * Deliberately dependency-free (no HTMLPurifier/composer package) — this
 * environment has no registry access to add one, and DOMDocument ships with
 * PHP itself, so this has zero new attack surface from a supply chain.
 *
 * Strategy: parse as HTML, walk every node, and only keep elements/attributes
 * on the allowlist. Anything else (script, style, iframe, object, embed,
 * forms, event handlers, javascript:/data: URLs, etc.) is dropped rather
 * than escaped, so the remaining markup stays valid and displayable.
 *
 * This is a defense-in-depth *server-side* pass. The frontend additionally
 * runs DOMPurify immediately before rendering (see resources/js/lib/sanitizeHtml.js)
 * so content is cleaned on the way in AND on the way out.
 */
class HtmlSanitizer
{
    /** @var array<string, array<int, string>> tag => allowed attributes */
    private const ALLOWED = [
        'p' => [], 'br' => [], 'hr' => [],
        'strong' => [], 'b' => [], 'em' => [], 'i' => [], 'u' => [], 's' => [],
        'ul' => [], 'ol' => [], 'li' => [],
        'h1' => [], 'h2' => [], 'h3' => [], 'h4' => [], 'h5' => [], 'h6' => [],
        'blockquote' => [], 'pre' => [], 'code' => [],
        'a' => ['href', 'title', 'target', 'rel'],
        'img' => ['src', 'alt', 'title', 'width', 'height'],
        'span' => [], 'div' => [],
        'table' => [], 'thead' => [], 'tbody' => [], 'tr' => [], 'th' => [], 'td' => [],
    ];

    private const ALLOWED_URL_SCHEMES = ['http', 'https', 'mailto'];

    public static function clean(?string $html): ?string
    {
        if ($html === null || trim($html) === '') {
            return $html;
        }

        $doc = new \DOMDocument();
        // Wrap in a container + force UTF-8 so DOMDocument doesn't mangle
        // multibyte (e.g. Bengali) text, and suppress warnings from
        // malformed fragments (libxml is noisy about "unknown tags" etc.).
        $wrapped = '<?xml encoding="utf-8" ?><div id="__root__">' . $html . '</div>';

        libxml_use_internal_errors(true);
        $doc->loadHTML($wrapped, LIBXML_HTML_NODEFDTD | LIBXML_HTML_NOIMPLIED);
        libxml_clear_errors();

        $root = $doc->getElementById('__root__');
        if (!$root) {
            return '';
        }

        self::sanitizeNode($doc, $root);

        $innerHtml = '';
        foreach ($root->childNodes as $child) {
            $innerHtml .= $doc->saveHTML($child);
        }

        return trim($innerHtml);
    }

    private static function sanitizeNode(\DOMDocument $doc, \DOMNode $node): void
    {
        // Snapshot children first — we may remove nodes while iterating.
        $children = iterator_to_array($node->childNodes);

        foreach ($children as $child) {
            if ($child instanceof \DOMComment) {
                $node->removeChild($child);
                continue;
            }

            if ($child instanceof \DOMText) {
                continue; // text nodes are always safe
            }

            if (!$child instanceof \DOMElement) {
                $node->removeChild($child);
                continue;
            }

            $tag = strtolower($child->tagName);

            if (!array_key_exists($tag, self::ALLOWED)) {
                // Disallowed tag (script, style, iframe, object, embed,
                // form, input, on-page-load svg vectors, etc.) — drop the
                // element AND its contents entirely rather than unwrapping,
                // since e.g. <script>alert(1)</script> unwrapped would just
                // leave "alert(1)" as harmless text, but for consistency
                // and simplicity we remove the whole subtree.
                $node->removeChild($child);
                continue;
            }

            // Strip every attribute except the allowlisted ones for this tag.
            $allowedAttrs = self::ALLOWED[$tag];
            $attrsToRemove = [];
            foreach ($child->attributes as $attr) {
                $name = strtolower($attr->name);
                if (!in_array($name, $allowedAttrs, true)) {
                    $attrsToRemove[] = $attr->name;
                    continue;
                }
                if (in_array($name, ['href', 'src'], true) && !self::isSafeUrl($attr->value)) {
                    $attrsToRemove[] = $attr->name;
                }
            }
            foreach ($attrsToRemove as $name) {
                $child->removeAttribute($name);
            }

            // Force safe defaults on links that survived.
            if ($tag === 'a' && $child->hasAttribute('href')) {
                $child->setAttribute('rel', 'noopener noreferrer nofollow');
                if (!$child->hasAttribute('target')) {
                    $child->setAttribute('target', '_blank');
                }
            }

            self::sanitizeNode($doc, $child);
        }
    }

    private static function isSafeUrl(string $url): bool
    {
        $url = trim($url);

        // Relative URLs (no scheme) are fine — same-origin assets/links.
        if (!str_contains($url, ':')) {
            return true;
        }

        $scheme = strtolower(strtok($url, ':'));

        return in_array($scheme, self::ALLOWED_URL_SCHEMES, true);
    }
}
