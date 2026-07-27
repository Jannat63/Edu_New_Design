import DOMPurify from "dompurify";

/**
 * Sanitize HTML immediately before it's handed to dangerouslySetInnerHTML.
 *
 * This is intentionally redundant with the server-side sanitizer
 * (app/Support/HtmlSanitizer.php) that runs when lesson content is saved.
 * Two independent layers means a bug or bypass in one doesn't automatically
 * mean a stored-XSS payload reaches a rendered page — the content has to get
 * past BOTH the write-time allowlist and the render-time allowlist.
 *
 * Usage:
 *   <div dangerouslySetInnerHTML={{ __html: sanitizeHtml(lesson.content) }} />
 */
export function sanitizeHtml(html) {
  if (!html) return "";

  return DOMPurify.sanitize(html, {
    ALLOWED_TAGS: [
      "p", "br", "hr",
      "strong", "b", "em", "i", "u", "s",
      "ul", "ol", "li",
      "h1", "h2", "h3", "h4", "h5", "h6",
      "blockquote", "pre", "code",
      "a", "img",
      "span", "div",
      "table", "thead", "tbody", "tr", "th", "td",
    ],
    ALLOWED_ATTR: ["href", "src", "alt", "title", "target", "rel", "width", "height"],
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|[^a-z]|[a-z+.-]+(?:[^a-z+.:-]|$))/i,
  });
}
