import type { Plugin } from "vite";
import matter from "gray-matter";
import { marked } from "marked";
import sanitizeHtml from "sanitize-html";

/** .md ファイルをメタ情報付きオブジェクトとして import できる Vite プラグイン */
export function markdownPlugin(): Plugin {
  return {
    name: "markdown-loader",
    transform(src, id) {
      if (!id.endsWith(".md")) return;

      const { data, content } = matter(src);
      const html = marked.parse(content, { async: false }) as string;

      const sanitized = sanitizeHtml(html, {
        allowedTags: ["h1", "h2", "h3", "h4", "h5", "h6", "p", "br", "hr", "ul", "ol", "li", "strong", "em", "code", "pre", "blockquote", "a", "img"],
        allowedAttributes: {
          a: ["href", "title", "target", "rel"],
          img: ["src", "alt", "title", "width", "height"],
        },
        allowedSchemes: ["http", "https", "mailto"],
        allowedSchemesAppliedToAttributes: ["href", "src"],
        allowProtocolRelative: false,
        transformTags: {
          a: (tagName, attribs) => ({
            tagName,
            attribs: { ...attribs, target: "_blank", rel: "noopener noreferrer" },
          }),
        },
      });

      const doc = {
        metadata: {
          id: data.id || "",
          title: data.title || "Untitled",
          order: data.order || 0,
          visible: data.visible !== false,
          expanded: data.expanded !== false,
          date: data.date || "",
          lang: data.lang || "",
        },
        content: sanitized,
      };
      return { code: `export default ${JSON.stringify(doc, null, 2)};`, map: null };
    },
  };
}
