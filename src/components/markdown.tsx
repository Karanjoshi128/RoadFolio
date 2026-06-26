import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

/**
 * Renders roadmap markdown (node detail content, intro) with light prose styling.
 * Server component — keeps react-markdown out of the client bundle.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-roadfolio space-y-3 text-sm leading-relaxed">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>{children}</ReactMarkdown>
    </div>
  );
}
