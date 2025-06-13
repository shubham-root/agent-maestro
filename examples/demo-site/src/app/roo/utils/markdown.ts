import MarkdownIt from "markdown-it";

// Initialize markdown-it with configuration for safe HTML rendering
export const createMarkdownRenderer = (): MarkdownIt => {
  return new MarkdownIt({
    html: true,
    linkify: true,
    typographer: true,
    breaks: true,
  });
};

// Default markdown renderer instance
export const md = createMarkdownRenderer();

// Utility function to render markdown to HTML
export const renderMarkdown = (content: string): string => {
  return md.render(content);
};
