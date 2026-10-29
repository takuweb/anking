import React, { useMemo } from 'react';
import { marked } from 'marked';

interface MarkdownViewProps {
  content: string;
  className?: string;
}

// marked options
marked.setOptions({
  gfm: true,
  breaks: true,
});

export const MarkdownView: React.FC<MarkdownViewProps> = ({ content, className = '' }) => {
  const htmlContent = useMemo(() => {
    try {
      return marked.parse(content || '') as string;
    } catch (e) {
      console.error('Markdown parse error:', e);
      return content || '';
    }
  }, [content]);

  return (
    <div
      className={`markdown-body prose dark:prose-invert max-w-none text-slate-800 dark:text-slate-200 ${className}`}
      dangerouslySetInnerHTML={{ __html: htmlContent }}
    />
  );
};
