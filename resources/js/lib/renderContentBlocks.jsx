/**
 * Renders simple CMS text fields (About/Terms/Privacy content) as React
 * elements. These fields are edited through a plain textarea in the admin
 * panel, not a rich HTML editor, so this deliberately does NOT parse or
 * render HTML — every block stays plain text run through normal JSX
 * interpolation, which React auto-escapes. There is no dangerouslySetInnerHTML
 * involved anywhere in this file.
 *
 * Blank lines separate paragraphs. A line starting with "#", "##", or "###"
 * (a leading-hash convention already used in the seeded Terms/Privacy
 * content) renders as a heading instead of a paragraph. Single line breaks
 * within a paragraph are preserved via CSS rather than turned into <br>
 * tags, keeping this free of any HTML construction.
 */
export function renderContentBlocks(text, opts = {}) {
  if (!text || !text.trim()) return null;

  const {
    headingColor = "#211D1A",
    textColor = "#5B564E",
    firstHeadingMarginTop = "0",
  } = opts;

  const headingSizes = { h2: 22, h3: 18, h4: 15 };

  return text.trim().split(/\n\s*\n/).map((block, i) => {
    const headingMatch = block.trim().match(/^(#{1,3})\s+(.+)$/);

    if (headingMatch) {
      const Tag = `h${headingMatch[1].length + 1}`; // "#" -> h2, "##" -> h3, "###" -> h4
      return (
        <Tag
          key={i}
          style={{
            fontSize: headingSizes[Tag],
            fontWeight: 800,
            color: headingColor,
            letterSpacing: "-0.3px",
            lineHeight: 1.35,
            margin: i === 0 ? `${firstHeadingMarginTop} 0 14px` : "30px 0 14px",
          }}
        >
          {headingMatch[2]}
        </Tag>
      );
    }

    return (
      <p
        key={i}
        style={{
          fontSize: 15.5,
          color: textColor,
          lineHeight: 1.8,
          margin: "0 0 18px",
          whiteSpace: "pre-wrap",
        }}
      >
        {block.trim()}
      </p>
    );
  });
}
